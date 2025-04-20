'use client';

import React from 'react';
import styles from '../appointments/appointments.module.css';

// Define the Appointment interface
interface Appointment {
  id: string;
  title: string;
  doctorName: string;
  speciality?: string;
  location?: string;
  notes?: string;
  dateTime: Date;
  duration: number;
  status: string;
  reminderSent: boolean;
}

interface AppointmentListProps {
  appointments: Appointment[];
  isLoading: boolean;
  onEdit: (appointment: Appointment) => void;
  onDelete: (id: string) => void;
}

// Format date for Persian display
const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat('fa-IR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  }).format(date);
};

// Format time for Persian display
const formatTime = (date: Date) => {
  return new Intl.DateTimeFormat('fa-IR', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

// Helper function to get status color
const getStatusColor = (status: string) => {
  switch (status) {
    case 'scheduled':
      return '#3b82f6'; // Blue
    case 'completed':
      return '#10b981'; // Green
    case 'cancelled':
      return '#ef4444'; // Red
    case 'missed':
      return '#f59e0b'; // Amber
    default:
      return '#6b7280'; // Gray
  }
};

// Helper function to get status in Persian
const getStatusText = (status: string) => {
  switch (status) {
    case 'scheduled':
      return 'برنامه‌ریزی شده';
    case 'completed':
      return 'انجام شده';
    case 'cancelled':
      return 'لغو شده';
    case 'missed':
      return 'از دست رفته';
    default:
      return status;
  }
};

export default function AppointmentList({ 
  appointments, 
  isLoading, 
  onEdit, 
  onDelete 
}: AppointmentListProps) {
  
  if (isLoading) {
    return (
      <div className={styles.listContainer}>
        <div className={styles.emptyState}>
          <p>در حال بارگذاری قرارهای ملاقات...</p>
        </div>
      </div>
    );
  }
  
  if (appointments.length === 0) {
    return (
      <div className={styles.listContainer}>
        <div className={styles.emptyState}>
          <h3>هیچ قرار ملاقاتی یافت نشد</h3>
          <p>برای افزودن اولین قرار ملاقات خود، روی دکمه «قرار ملاقات جدید» کلیک کنید.</p>
        </div>
      </div>
    );
  }
  
  // Group appointments by date
  const groupedAppointments: { [key: string]: Appointment[] } = {};
  
  appointments.forEach(appointment => {
    const dateStr = formatDate(appointment.dateTime);
    
    if (!groupedAppointments[dateStr]) {
      groupedAppointments[dateStr] = [];
    }
    
    groupedAppointments[dateStr].push(appointment);
  });
  
  return (
    <div>
      {Object.entries(groupedAppointments).map(([date, appointmentGroup]) => (
        <div key={date} className={styles.dateGroup}>
          <h2 className={styles.dateHeader}>{date}</h2>
          
          <div className={styles.listContainer}>
            {appointmentGroup.map(appointment => (
              <div key={appointment.id} className={styles.appointmentCard}>
                <div className={styles.appointmentHeader}>
                  <div className={styles.appointmentTime}>
                    {formatTime(appointment.dateTime)}
                  </div>
                  <div 
                    className={styles.appointmentStatus}
                    style={{ 
                      backgroundColor: getStatusColor(appointment.status),
                      color: 'white',
                      padding: '0.25rem 0.75rem',
                      borderRadius: '9999px',
                      fontSize: '0.75rem',
                      fontWeight: 'bold'
                    }}
                  >
                    {getStatusText(appointment.status)}
                  </div>
                </div>
                
                <h3 className={styles.appointmentTitle}>{appointment.title}</h3>
                
                <div className={styles.appointmentDetails}>
                  <div className={styles.appointmentDetail}>
                    <span className={styles.detailLabel}>پزشک:</span>
                    <span className={styles.detailValue}>{appointment.doctorName}</span>
                  </div>
                  
                  {appointment.speciality && (
                    <div className={styles.appointmentDetail}>
                      <span className={styles.detailLabel}>تخصص:</span>
                      <span className={styles.detailValue}>{appointment.speciality}</span>
                    </div>
                  )}
                  
                  {appointment.location && (
                    <div className={styles.appointmentDetail}>
                      <span className={styles.detailLabel}>مکان:</span>
                      <span className={styles.detailValue}>{appointment.location}</span>
                    </div>
                  )}
                  
                  <div className={styles.appointmentDetail}>
                    <span className={styles.detailLabel}>مدت:</span>
                    <span className={styles.detailValue}>{appointment.duration} دقیقه</span>
                  </div>
                </div>
                
                {appointment.notes && (
                  <div className={styles.appointmentNotes}>
                    <p>{appointment.notes}</p>
                  </div>
                )}
                
                <div className={styles.appointmentActions}>
                  <button
                    className={styles.editButton}
                    onClick={() => onEdit(appointment)}
                    style={{
                      backgroundColor: '#f3f4f6',
                      color: '#374151',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '0.5rem 1rem',
                      fontSize: '0.875rem',
                      cursor: 'pointer',
                      fontFamily: 'inherit'
                    }}
                  >
                    ویرایش
                  </button>
                  <button
                    className={styles.deleteButton}
                    onClick={() => onDelete(appointment.id)}
                    style={{
                      backgroundColor: '#fee2e2',
                      color: '#b91c1c',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '0.5rem 1rem',
                      fontSize: '0.875rem',
                      cursor: 'pointer',
                      fontFamily: 'inherit'
                    }}
                  >
                    حذف
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
} 