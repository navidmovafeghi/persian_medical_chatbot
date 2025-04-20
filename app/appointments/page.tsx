'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import AppointmentList from '../components/AppointmentList';
import AppointmentForm from '../components/AppointmentForm';
import styles from './appointments.module.css';

// Appointment interface
interface Appointment {
  id: string;
  title: string;
  doctorName: string;
  speciality?: string;
  location?: string;
  notes?: string;
  dateTime: Date;
  duration: number;
  remindBefore: number;
  status: string;
  reminderSent: boolean;
  reminded?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export default function AppointmentsPage() {
  const { data: session, status } = useSession();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  
  const isAuthenticated = status === 'authenticated';
  
  useEffect(() => {
    if (isAuthenticated) {
      fetchAppointments();
    } else if (status === 'unauthenticated') {
      setIsLoading(false);
      setError('You must be logged in to view appointments');
    }
  }, [isAuthenticated, status]);
  
  const fetchAppointments = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/appointments');
      
      if (!response.ok) {
        throw new Error('Failed to fetch appointments');
      }
      
      const data = await response.json();
      
      // Convert string dates to Date objects
      const formattedAppointments = data.map((apt: any) => ({
        ...apt,
        dateTime: new Date(apt.dateTime),
        reminded: apt.reminded ? new Date(apt.reminded) : undefined,
        createdAt: new Date(apt.createdAt),
        updatedAt: new Date(apt.updatedAt)
      }));
      
      setAppointments(formattedAppointments);
    } catch (err) {
      console.error('Error fetching appointments:', err);
      setError('Failed to load appointments. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleCreateAppointment = () => {
    setEditingAppointment(null);
    setShowForm(true);
  };
  
  const handleEditAppointment = (appointment: Appointment) => {
    setEditingAppointment(appointment);
    setShowForm(true);
  };
  
  const handleSubmit = async (appointmentData: Partial<Appointment>) => {
    setIsLoading(true);
    
    try {
      let response;
      
      if (editingAppointment) {
        // Update existing appointment
        response = await fetch(`/api/appointments/${editingAppointment.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(appointmentData)
        });
      } else {
        // Create new appointment
        response = await fetch('/api/appointments', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(appointmentData)
        });
      }
      
      if (!response.ok) {
        throw new Error('Failed to save appointment');
      }
      
      // Refresh appointments
      await fetchAppointments();
      
      // Close form
      setShowForm(false);
      setEditingAppointment(null);
    } catch (err) {
      console.error('Error saving appointment:', err);
      setError('Failed to save appointment. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleDelete = async (id: string) => {
    if (!confirm('آیا مطمئن هستید که می‌خواهید این قرار ملاقات را حذف کنید؟')) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      const response = await fetch(`/api/appointments/${id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete appointment');
      }
      
      // Refresh appointments
      await fetchAppointments();
    } catch (err) {
      console.error('Error deleting appointment:', err);
      setError('Failed to delete appointment. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleCancel = () => {
    setShowForm(false);
    setEditingAppointment(null);
  };
  
  if (!isAuthenticated && status !== 'loading') {
    return (
      <div className={styles.container}>
        <div className={styles.authMessage}>
          <h1>قرار ملاقات با پزشک</h1>
          <p>برای مشاهده و مدیریت قرارهای ملاقات، لطفا وارد حساب کاربری خود شوید.</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>قرار ملاقات با پزشک</h1>
        {!showForm && (
          <button 
            className={styles.createButton}
            onClick={handleCreateAppointment}
            disabled={isLoading}
          >
            + قرار ملاقات جدید
          </button>
        )}
      </div>
      
      {error && <div className={styles.error}>{error}</div>}
      
      {showForm ? (
        <AppointmentForm 
          appointment={editingAppointment}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isLoading={isLoading}
        />
      ) : (
        <AppointmentList 
          appointments={appointments}
          isLoading={isLoading}
          onEdit={handleEditAppointment}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
} 