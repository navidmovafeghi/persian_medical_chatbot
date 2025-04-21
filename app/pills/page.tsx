'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import PillReminderList from '../components/PillReminderList';
import PillReminderForm from '../components/PillReminderForm';
import styles from './pills.module.css';

// PillReminder interface
interface PillReminder {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  times: string; // JSON string of times
  startDate: Date;
  endDate?: Date;
  withFood: boolean;
  notes?: string;
  remindBefore: number;
  status: string;
  reminderSent: boolean;
  reminded?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export default function PillsPage() {
  const { data: session, status } = useSession();
  const [pillReminders, setPillReminders] = useState<PillReminder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingPillReminder, setEditingPillReminder] = useState<PillReminder | null>(null);
  
  const isAuthenticated = status === 'authenticated';
  
  useEffect(() => {
    if (isAuthenticated) {
      fetchPillReminders();
    } else if (status === 'unauthenticated') {
      setIsLoading(false);
      setError('برای مشاهده یادآورهای دارو باید وارد حساب کاربری خود شوید');
    }
  }, [isAuthenticated, status]);
  
  const fetchPillReminders = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/pills');
      
      if (!response.ok) {
        throw new Error('دریافت یادآورهای دارو با خطا مواجه شد');
      }
      
      const data = await response.json();
      
      // Convert string dates to Date objects
      const formattedPillReminders = data.map((pill: any) => ({
        ...pill,
        startDate: new Date(pill.startDate),
        endDate: pill.endDate ? new Date(pill.endDate) : undefined,
        reminded: pill.reminded ? new Date(pill.reminded) : undefined,
        createdAt: new Date(pill.createdAt),
        updatedAt: new Date(pill.updatedAt)
      }));
      
      setPillReminders(formattedPillReminders);
    } catch (err) {
      console.error('Error fetching pill reminders:', err);
      setError('دریافت یادآورهای دارو با خطا مواجه شد. لطفاً دوباره تلاش کنید.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleCreatePillReminder = () => {
    setEditingPillReminder(null);
    setShowForm(true);
  };
  
  const handleEditPillReminder = (pillReminder: PillReminder) => {
    setEditingPillReminder(pillReminder);
    setShowForm(true);
  };
  
  const handleSubmit = async (pillReminderData: Partial<PillReminder>) => {
    setIsLoading(true);
    
    try {
      let response;
      
      if (editingPillReminder) {
        // Update existing pill reminder
        response = await fetch(`/api/pills/${editingPillReminder.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(pillReminderData)
        });
      } else {
        // Create new pill reminder
        response = await fetch('/api/pills', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(pillReminderData)
        });
      }
      
      if (!response.ok) {
        throw new Error('ذخیره یادآور دارو با خطا مواجه شد');
      }
      
      // Refresh pill reminders
      await fetchPillReminders();
      
      // Close form
      setShowForm(false);
      setEditingPillReminder(null);
    } catch (err) {
      console.error('Error saving pill reminder:', err);
      setError('ذخیره یادآور دارو با خطا مواجه شد. لطفاً دوباره تلاش کنید.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleDelete = async (id: string) => {
    if (!confirm('آیا مطمئن هستید که می‌خواهید این یادآور دارو را حذف کنید؟')) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      const response = await fetch(`/api/pills/${id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error('حذف یادآور دارو با خطا مواجه شد');
      }
      
      // Refresh pill reminders
      await fetchPillReminders();
    } catch (err) {
      console.error('Error deleting pill reminder:', err);
      setError('حذف یادآور دارو با خطا مواجه شد. لطفاً دوباره تلاش کنید.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleCancel = () => {
    setShowForm(false);
    setEditingPillReminder(null);
  };
  
  if (!isAuthenticated && status !== 'loading') {
    return (
      <div className={styles.container}>
        <div className={styles.authMessage}>
          <h1>یادآور مصرف دارو</h1>
          <p>برای مشاهده و مدیریت یادآورهای دارو، لطفا وارد حساب کاربری خود شوید.</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>یادآور مصرف دارو</h1>
        {!showForm && (
          <button 
            className={styles.createButton}
            onClick={handleCreatePillReminder}
            disabled={isLoading}
          >
            + یادآور داروی جدید
          </button>
        )}
      </div>
      
      {error && <div className={styles.error}>{error}</div>}
      
      {showForm ? (
        <PillReminderForm 
          pillReminder={editingPillReminder}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isLoading={isLoading}
        />
      ) : (
        <PillReminderList 
          pillReminders={pillReminders}
          isLoading={isLoading}
          onEdit={handleEditPillReminder}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
} 