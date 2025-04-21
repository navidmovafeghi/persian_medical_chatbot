'use client';

import { useState } from 'react';
import styles from '../appointments/appointments.module.css';

// Define the PillReminder interface
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

interface PillReminderListProps {
  pillReminders: PillReminder[];
  isLoading: boolean;
  onEdit: (pillReminder: PillReminder) => void;
  onDelete: (id: string) => void;
}

export default function PillReminderList({
  pillReminders,
  isLoading,
  onEdit,
  onDelete
}: PillReminderListProps) {
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Map frequency to Persian
  const frequencyMap: { [key: string]: string } = {
    daily: 'روزانه',
    twice_daily: 'دو بار در روز',
    three_times_daily: 'سه بار در روز',
    weekly: 'هفتگی',
    monthly: 'ماهانه',
    as_needed: 'در صورت نیاز'
  };
  
  // Map status to Persian
  const statusMap: { [key: string]: string } = {
    active: 'فعال',
    completed: 'تمام شده',
    paused: 'موقتاً متوقف',
    cancelled: 'لغو شده'
  };
  
  // Status class for styling
  const getStatusClass = (status: string) => {
    switch (status) {
      case 'active':
        return styles.statusActive;
      case 'completed':
        return styles.statusCompleted;
      case 'paused':
        return styles.statusPaused;
      case 'cancelled':
        return styles.statusCancelled;
      default:
        return '';
    }
  };
  
  // Format date to Persian-friendly format
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('fa-IR');
  };
  
  // Format times from JSON string
  const formatTimes = (timesString: string) => {
    try {
      const times = JSON.parse(timesString);
      if (Array.isArray(times)) {
        return times.join(' | ');
      }
      return timesString;
    } catch (e) {
      return timesString;
    }
  };
  
  // Filter pill reminders
  const filteredPillReminders = pillReminders.filter(pill => {
    // Apply status filter
    if (filter !== 'all' && pill.status !== filter) {
      return false;
    }
    
    // Apply search term
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        pill.name.toLowerCase().includes(searchLower) ||
        pill.dosage.toLowerCase().includes(searchLower) ||
        (pill.notes && pill.notes.toLowerCase().includes(searchLower))
      );
    }
    
    return true;
  });
  
  if (isLoading) {
    return (
      <div className={styles.loading}>
        در حال بارگیری...
      </div>
    );
  }
  
  if (pillReminders.length === 0) {
    return (
      <div className={styles.emptyState}>
        <p>هیچ یادآور دارویی ثبت نشده است.</p>
        <p>برای شروع، روی دکمه «+ یادآور داروی جدید» کلیک کنید.</p>
      </div>
    );
  }
  
  return (
    <div className={styles.listContainer}>
      <div className={styles.filters}>
        <div className={styles.searchBox}>
          <input
            type="text"
            placeholder="جستجو در داروها..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
            dir="rtl"
          />
        </div>
        
        <div className={styles.filterButtons}>
          <button
            className={`${styles.filterButton} ${filter === 'all' ? styles.activeFilter : ''}`}
            onClick={() => setFilter('all')}
          >
            همه
          </button>
          <button
            className={`${styles.filterButton} ${filter === 'active' ? styles.activeFilter : ''}`}
            onClick={() => setFilter('active')}
          >
            فعال
          </button>
          <button
            className={`${styles.filterButton} ${filter === 'completed' ? styles.activeFilter : ''}`}
            onClick={() => setFilter('completed')}
          >
            تمام شده
          </button>
          <button
            className={`${styles.filterButton} ${filter === 'paused' ? styles.activeFilter : ''}`}
            onClick={() => setFilter('paused')}
          >
            متوقف
          </button>
        </div>
      </div>
      
      {filteredPillReminders.length === 0 ? (
        <div className={styles.emptyState}>
          <p>هیچ یادآوری با معیارهای جستجوی شما پیدا نشد.</p>
        </div>
      ) : (
        <div className={styles.pillList}>
          {filteredPillReminders.map(pill => (
            <div key={pill.id} className={styles.pillCard}>
              <div className={styles.pillHeader}>
                <h3 className={styles.pillName}>{pill.name}</h3>
                <span className={`${styles.pillStatus} ${getStatusClass(pill.status)}`}>
                  {statusMap[pill.status] || pill.status}
                </span>
              </div>
              
              <div className={styles.pillInfo}>
                <p className={styles.pillDosage}>
                  <strong>دوز: </strong>{pill.dosage}
                  {pill.withFood && <span className={styles.withFood}> (همراه با غذا)</span>}
                </p>
                <p className={styles.pillFrequency}>
                  <strong>تناوب: </strong>{frequencyMap[pill.frequency] || pill.frequency}
                </p>
                <p className={styles.pillTimes}>
                  <strong>زمان‌های مصرف: </strong>{formatTimes(pill.times)}
                </p>
                <p className={styles.pillDates}>
                  <strong>تاریخ شروع: </strong>{formatDate(pill.startDate)}
                  {pill.endDate && (
                    <span>
                      <strong> تاریخ پایان: </strong>{formatDate(pill.endDate)}
                    </span>
                  )}
                </p>
                {pill.notes && (
                  <p className={styles.pillNotes}>
                    <strong>توضیحات: </strong>{pill.notes}
                  </p>
                )}
              </div>
              
              <div className={styles.pillActions}>
                <button
                  className={styles.editButton}
                  onClick={() => onEdit(pill)}
                >
                  ویرایش
                </button>
                <button
                  className={styles.deleteButton}
                  onClick={() => onDelete(pill.id)}
                >
                  حذف
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 