'use client';

import { useState, useEffect } from 'react';
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
  remindBefore: number;
  status: string;
  reminderSent: boolean;
}

interface AppointmentFormProps {
  appointment: Appointment | null;
  onSubmit: (data: Partial<Appointment>) => void;
  onCancel: () => void;
  isLoading: boolean;
}

export default function AppointmentForm({
  appointment,
  onSubmit,
  onCancel,
  isLoading
}: AppointmentFormProps) {
  // Form state
  const [title, setTitle] = useState('');
  const [doctorName, setDoctorName] = useState('');
  const [speciality, setSpeciality] = useState('');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [duration, setDuration] = useState(30);
  const [remindBefore, setRemindBefore] = useState(24);
  const [status, setStatus] = useState('scheduled');
  
  // Validation state
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  
  // Initialize form with appointment data if editing
  useEffect(() => {
    if (appointment) {
      setTitle(appointment.title);
      setDoctorName(appointment.doctorName);
      setSpeciality(appointment.speciality || '');
      setLocation(appointment.location || '');
      setNotes(appointment.notes || '');
      
      // Format date for input field (YYYY-MM-DD)
      const dateObj = new Date(appointment.dateTime);
      const formattedDate = dateObj.toISOString().split('T')[0];
      setDate(formattedDate);
      
      // Format time for input field (HH:MM)
      const hours = dateObj.getHours().toString().padStart(2, '0');
      const minutes = dateObj.getMinutes().toString().padStart(2, '0');
      setTime(`${hours}:${minutes}`);
      
      setDuration(appointment.duration);
      setRemindBefore(appointment.remindBefore);
      setStatus(appointment.status);
    } else {
      // Initialize with defaults for new appointment
      const now = new Date();
      const formattedDate = now.toISOString().split('T')[0];
      setDate(formattedDate);
      
      // Default time to current hour rounded up to nearest half hour
      const hours = now.getHours();
      const minutes = now.getMinutes() > 30 ? '00' : '30';
      const nextHour = minutes === '00' ? (hours + 1) % 24 : hours;
      setTime(`${nextHour.toString().padStart(2, '0')}:${minutes}`);
    }
  }, [appointment]);
  
  // Form validation
  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};
    
    if (!title.trim()) {
      newErrors.title = 'عنوان قرار ملاقات الزامی است';
    }
    
    if (!doctorName.trim()) {
      newErrors.doctorName = 'نام پزشک الزامی است';
    }
    
    if (!date) {
      newErrors.date = 'تاریخ قرار ملاقات الزامی است';
    }
    
    if (!time) {
      newErrors.time = 'زمان قرار ملاقات الزامی است';
    }
    
    if (duration <= 0) {
      newErrors.duration = 'مدت قرار ملاقات باید بیشتر از صفر باشد';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Form submission handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    // Combine date and time into a single DateTime
    const dateTimeStr = `${date}T${time}:00`;
    const dateTime = new Date(dateTimeStr);
    
    // Prepare data for submission
    const appointmentData: Partial<Appointment> = {
      title,
      doctorName,
      speciality: speciality || undefined,
      location: location || undefined,
      notes: notes || undefined,
      dateTime,
      duration,
      remindBefore,
      status
    };
    
    onSubmit(appointmentData);
  };
  
  return (
    <div className={styles.formContainer}>
      <h2 className={styles.formTitle}>
        {appointment ? 'ویرایش قرار ملاقات' : 'قرار ملاقات جدید'}
      </h2>
      
      <form onSubmit={handleSubmit}>
        <div className={styles.formGroup}>
          <label htmlFor="title" className={styles.formLabel}>
            عنوان قرار ملاقات *
          </label>
          <input
            type="text"
            id="title"
            className={styles.formInput}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="مثال: ویزیت دوره‌ای قلب"
            disabled={isLoading}
            dir="rtl"
          />
          {errors.title && <div className={styles.errorMessage}>{errors.title}</div>}
        </div>
        
        <div className={styles.formGroup}>
          <label htmlFor="doctorName" className={styles.formLabel}>
            نام پزشک *
          </label>
          <input
            type="text"
            id="doctorName"
            className={styles.formInput}
            value={doctorName}
            onChange={(e) => setDoctorName(e.target.value)}
            placeholder="مثال: دکتر محمدی"
            disabled={isLoading}
            dir="rtl"
          />
          {errors.doctorName && <div className={styles.errorMessage}>{errors.doctorName}</div>}
        </div>
        
        <div className={styles.formGroup}>
          <label htmlFor="speciality" className={styles.formLabel}>
            تخصص پزشک
          </label>
          <input
            type="text"
            id="speciality"
            className={styles.formInput}
            value={speciality}
            onChange={(e) => setSpeciality(e.target.value)}
            placeholder="مثال: متخصص قلب و عروق"
            disabled={isLoading}
            dir="rtl"
          />
        </div>
        
        <div className={styles.formRow} style={{ display: 'flex', gap: '1rem' }}>
          <div className={styles.formGroup} style={{ flex: 1 }}>
            <label htmlFor="date" className={styles.formLabel}>
              تاریخ *
            </label>
            <input
              type="date"
              id="date"
              className={styles.formInput}
              value={date}
              onChange={(e) => setDate(e.target.value)}
              disabled={isLoading}
            />
            {errors.date && <div className={styles.errorMessage}>{errors.date}</div>}
          </div>
          
          <div className={styles.formGroup} style={{ flex: 1 }}>
            <label htmlFor="time" className={styles.formLabel}>
              زمان *
            </label>
            <input
              type="time"
              id="time"
              className={styles.formInput}
              value={time}
              onChange={(e) => setTime(e.target.value)}
              disabled={isLoading}
            />
            {errors.time && <div className={styles.errorMessage}>{errors.time}</div>}
          </div>
        </div>
        
        <div className={styles.formRow} style={{ display: 'flex', gap: '1rem' }}>
          <div className={styles.formGroup} style={{ flex: 1 }}>
            <label htmlFor="duration" className={styles.formLabel}>
              مدت (دقیقه) *
            </label>
            <input
              type="number"
              id="duration"
              className={styles.formInput}
              value={duration}
              onChange={(e) => setDuration(parseInt(e.target.value))}
              min="5"
              step="5"
              disabled={isLoading}
            />
            {errors.duration && <div className={styles.errorMessage}>{errors.duration}</div>}
          </div>
          
          <div className={styles.formGroup} style={{ flex: 1 }}>
            <label htmlFor="remindBefore" className={styles.formLabel}>
              یادآوری قبل از (ساعت)
            </label>
            <select
              id="remindBefore"
              className={styles.formSelect}
              value={remindBefore}
              onChange={(e) => setRemindBefore(parseInt(e.target.value))}
              disabled={isLoading}
            >
              <option value="1">1 ساعت قبل</option>
              <option value="2">2 ساعت قبل</option>
              <option value="3">3 ساعت قبل</option>
              <option value="6">6 ساعت قبل</option>
              <option value="12">12 ساعت قبل</option>
              <option value="24">1 روز قبل</option>
              <option value="48">2 روز قبل</option>
              <option value="72">3 روز قبل</option>
            </select>
          </div>
        </div>
        
        <div className={styles.formGroup}>
          <label htmlFor="location" className={styles.formLabel}>
            مکان
          </label>
          <input
            type="text"
            id="location"
            className={styles.formInput}
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="مثال: بیمارستان میلاد، ساختمان شماره 2، طبقه 3"
            disabled={isLoading}
            dir="rtl"
          />
        </div>
        
        {appointment && (
          <div className={styles.formGroup}>
            <label htmlFor="status" className={styles.formLabel}>
              وضعیت
            </label>
            <select
              id="status"
              className={styles.formSelect}
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              disabled={isLoading}
            >
              <option value="scheduled">برنامه‌ریزی شده</option>
              <option value="completed">انجام شده</option>
              <option value="cancelled">لغو شده</option>
              <option value="missed">از دست رفته</option>
            </select>
          </div>
        )}
        
        <div className={styles.formGroup}>
          <label htmlFor="notes" className={styles.formLabel}>
            یادداشت‌ها
          </label>
          <textarea
            id="notes"
            className={styles.formTextarea}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="یادداشت‌های اضافی برای این قرار ملاقات"
            rows={4}
            disabled={isLoading}
            dir="rtl"
          ></textarea>
        </div>
        
        <div className={styles.formActions}>
          <button
            type="button"
            className={styles.cancelButton}
            onClick={onCancel}
            disabled={isLoading}
          >
            انصراف
          </button>
          <button
            type="submit"
            className={styles.submitButton}
            disabled={isLoading}
          >
            {isLoading ? 'در حال ذخیره...' : appointment ? 'به‌روزرسانی' : 'ایجاد قرار ملاقات'}
          </button>
        </div>
      </form>
    </div>
  );
} 