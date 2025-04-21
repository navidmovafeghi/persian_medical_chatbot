'use client';

import { useState, useEffect } from 'react';
import styles from '../pills/pills.module.css';

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
}

interface PillReminderFormProps {
  pillReminder: PillReminder | null;
  onSubmit: (data: Partial<PillReminder>) => void;
  onCancel: () => void;
  isLoading: boolean;
}

export default function PillReminderForm({
  pillReminder,
  onSubmit,
  onCancel,
  isLoading
}: PillReminderFormProps) {
  // Form state
  const [name, setName] = useState('');
  const [dosage, setDosage] = useState('');
  const [frequency, setFrequency] = useState('daily');
  const [timesList, setTimesList] = useState<string[]>(['08:00']);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [withFood, setWithFood] = useState(false);
  const [notes, setNotes] = useState('');
  const [remindBefore, setRemindBefore] = useState(15);
  const [status, setStatus] = useState('active');
  
  // Validation state
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  
  // Initialize form with pill reminder data if editing
  useEffect(() => {
    if (pillReminder) {
      setName(pillReminder.name);
      setDosage(pillReminder.dosage);
      setFrequency(pillReminder.frequency);
      
      // Parse times from JSON string
      try {
        const parsedTimes = JSON.parse(pillReminder.times);
        setTimesList(Array.isArray(parsedTimes) ? parsedTimes : ['08:00']);
      } catch (e) {
        setTimesList(['08:00']);
      }
      
      // Format date for input field (YYYY-MM-DD)
      const startDateObj = new Date(pillReminder.startDate);
      const formattedStartDate = startDateObj.toISOString().split('T')[0];
      setStartDate(formattedStartDate);
      
      if (pillReminder.endDate) {
        const endDateObj = new Date(pillReminder.endDate);
        const formattedEndDate = endDateObj.toISOString().split('T')[0];
        setEndDate(formattedEndDate);
      } else {
        setEndDate('');
      }
      
      setWithFood(pillReminder.withFood);
      setNotes(pillReminder.notes || '');
      setRemindBefore(pillReminder.remindBefore);
      setStatus(pillReminder.status);
    } else {
      // Initialize with defaults for new pill reminder
      const today = new Date();
      const formattedDate = today.toISOString().split('T')[0];
      setStartDate(formattedDate);
      setEndDate('');
    }
  }, [pillReminder]);
  
  // Form validation
  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};
    
    if (!name.trim()) {
      newErrors.name = 'نام دارو الزامی است';
    }
    
    if (!dosage.trim()) {
      newErrors.dosage = 'دوز دارو الزامی است';
    }
    
    if (timesList.length === 0) {
      newErrors.times = 'حداقل یک زمان برای یادآوری الزامی است';
    }
    
    if (!startDate) {
      newErrors.startDate = 'تاریخ شروع الزامی است';
    }
    
    if (endDate && new Date(endDate) < new Date(startDate)) {
      newErrors.endDate = 'تاریخ پایان باید بعد از تاریخ شروع باشد';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Add another time slot
  const addTimeSlot = () => {
    setTimesList([...timesList, '08:00']);
  };
  
  // Remove a time slot
  const removeTimeSlot = (index: number) => {
    const newTimesList = [...timesList];
    newTimesList.splice(index, 1);
    setTimesList(newTimesList);
  };
  
  // Update a time slot
  const updateTimeSlot = (index: number, value: string) => {
    const newTimesList = [...timesList];
    newTimesList[index] = value;
    setTimesList(newTimesList);
  };
  
  // Form submission handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    // Convert dates to Date objects
    const startDateObj = new Date(startDate);
    let endDateObj = undefined;
    
    if (endDate) {
      endDateObj = new Date(endDate);
    }
    
    // Prepare data for submission
    const pillReminderData: Partial<PillReminder> = {
      name,
      dosage,
      frequency,
      times: JSON.stringify(timesList),
      startDate: startDateObj,
      endDate: endDateObj,
      withFood,
      notes: notes || undefined,
      remindBefore,
      status
    };
    
    onSubmit(pillReminderData);
  };
  
  return (
    <div className={styles.formContainer}>
      <h2 className={styles.formTitle}>
        {pillReminder ? 'ویرایش یادآور دارو' : 'یادآور داروی جدید'}
      </h2>
      
      <form onSubmit={handleSubmit}>
        <div className={styles.formGroup}>
          <label htmlFor="name" className={styles.formLabel}>
            نام دارو *
          </label>
          <input
            type="text"
            id="name"
            className={styles.formInput}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="مثال: آسپرین"
            disabled={isLoading}
            dir="rtl"
          />
          {errors.name && <div className={styles.errorMessage}>{errors.name}</div>}
        </div>
        
        <div className={styles.formGroup}>
          <label htmlFor="dosage" className={styles.formLabel}>
            دوز دارو *
          </label>
          <input
            type="text"
            id="dosage"
            className={styles.formInput}
            value={dosage}
            onChange={(e) => setDosage(e.target.value)}
            placeholder="مثال: ۱ قرص یا ۱۰ میلی‌گرم"
            disabled={isLoading}
            dir="rtl"
          />
          {errors.dosage && <div className={styles.errorMessage}>{errors.dosage}</div>}
        </div>
        
        <div className={styles.formGroup}>
          <label htmlFor="frequency" className={styles.formLabel}>
            تناوب مصرف
          </label>
          <select
            id="frequency"
            className={styles.formInput}
            value={frequency}
            onChange={(e) => setFrequency(e.target.value)}
            disabled={isLoading}
            dir="rtl"
          >
            <option value="daily">روزانه</option>
            <option value="twice_daily">دو بار در روز</option>
            <option value="three_times_daily">سه بار در روز</option>
            <option value="weekly">هفتگی</option>
            <option value="monthly">ماهانه</option>
            <option value="as_needed">در صورت نیاز</option>
          </select>
        </div>
        
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>
            زمان‌های مصرف *
          </label>
          {timesList.map((time, index) => (
            <div key={index} className={styles.timeSlotContainer} style={{ display: 'flex', marginBottom: '10px' }}>
              <input
                type="time"
                className={styles.formInput}
                style={{ flex: 1 }}
                value={time}
                onChange={(e) => updateTimeSlot(index, e.target.value)}
                disabled={isLoading}
              />
              {timesList.length > 1 && (
                <button
                  type="button"
                  className={styles.removeButton}
                  style={{ marginLeft: '10px' }}
                  onClick={() => removeTimeSlot(index)}
                  disabled={isLoading}
                >
                  حذف
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            className={styles.addButton}
            onClick={addTimeSlot}
            disabled={isLoading}
          >
            + اضافه کردن زمان
          </button>
          {errors.times && <div className={styles.errorMessage}>{errors.times}</div>}
        </div>
        
        <div className={styles.formRow} style={{ display: 'flex', gap: '1rem' }}>
          <div className={styles.formGroup} style={{ flex: 1 }}>
            <label htmlFor="startDate" className={styles.formLabel}>
              تاریخ شروع *
            </label>
            <input
              type="date"
              id="startDate"
              className={styles.formInput}
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              disabled={isLoading}
            />
            {errors.startDate && <div className={styles.errorMessage}>{errors.startDate}</div>}
          </div>
          
          <div className={styles.formGroup} style={{ flex: 1 }}>
            <label htmlFor="endDate" className={styles.formLabel}>
              تاریخ پایان (اختیاری)
            </label>
            <input
              type="date"
              id="endDate"
              className={styles.formInput}
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              disabled={isLoading}
            />
            {errors.endDate && <div className={styles.errorMessage}>{errors.endDate}</div>}
          </div>
        </div>
        
        <div className={styles.formGroup}>
          <label className={styles.formLabel} style={{ display: 'flex', alignItems: 'center' }}>
            <input
              type="checkbox"
              checked={withFood}
              onChange={(e) => setWithFood(e.target.checked)}
              disabled={isLoading}
              style={{ marginLeft: '10px' }}
            />
            مصرف همراه با غذا
          </label>
        </div>
        
        <div className={styles.formGroup}>
          <label htmlFor="remindBefore" className={styles.formLabel}>
            یادآوری قبل از زمان مصرف (دقیقه)
          </label>
          <input
            type="number"
            id="remindBefore"
            className={styles.formInput}
            value={remindBefore}
            onChange={(e) => setRemindBefore(parseInt(e.target.value))}
            min="0"
            max="120"
            disabled={isLoading}
          />
        </div>
        
        <div className={styles.formGroup}>
          <label htmlFor="notes" className={styles.formLabel}>
            توضیحات اضافی
          </label>
          <textarea
            id="notes"
            className={styles.formTextarea}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            placeholder="هرگونه توضیح اضافی درباره نحوه مصرف دارو"
            disabled={isLoading}
            dir="rtl"
          />
        </div>
        
        <div className={styles.formGroup}>
          <label htmlFor="status" className={styles.formLabel}>
            وضعیت
          </label>
          <select
            id="status"
            className={styles.formInput}
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            disabled={isLoading}
            dir="rtl"
          >
            <option value="active">فعال</option>
            <option value="completed">تمام شده</option>
            <option value="paused">موقتاً متوقف</option>
            <option value="cancelled">لغو شده</option>
          </select>
        </div>
        
        <div className={styles.formButtons}>
          <button
            type="submit"
            className={styles.submitButton}
            disabled={isLoading}
          >
            {isLoading ? 'در حال ذخیره...' : (pillReminder ? 'به‌روزرسانی' : 'ذخیره')}
          </button>
          
          <button
            type="button"
            className={styles.cancelButton}
            onClick={onCancel}
            disabled={isLoading}
          >
            انصراف
          </button>
        </div>
      </form>
    </div>
  );
} 