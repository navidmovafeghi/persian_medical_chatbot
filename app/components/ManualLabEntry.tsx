'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { toast } from 'react-hot-toast';
import styles from '../profile/profile.module.css';

interface ManualLabEntryProps {
  onClose: () => void;
}

export default function ManualLabEntry({ onClose }: ManualLabEntryProps) {
  const { data: session } = useSession();
  const isAuthenticated = !!session?.user;
  
  const [formData, setFormData] = useState({
    testName: '',
    testDate: new Date().toISOString().split('T')[0],
    result: '',
    unit: '',
    normalRange: '',
    notes: '',
  });
  
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isAuthenticated) {
      toast.error('لطفا ابتدا وارد حساب کاربری خود شوید');
      return;
    }
    
    // Validate form data
    if (!formData.testName || !formData.testDate || !formData.result) {
      setError('لطفا نام آزمایش، تاریخ و نتیجه را وارد کنید');
      return;
    }
    
    setSubmitting(true);
    setError(null);
    
    try {
      const response = await fetch('/api/laboratory', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save laboratory data');
      }
      
      // Show success message
      toast.success('نتیجه آزمایش با موفقیت ذخیره شد');
      
      // Close the form
      onClose();
      
    } catch (error) {
      console.error('Error saving laboratory data:', error);
      setError(error instanceof Error ? error.message : 'خطا در ذخیره اطلاعات آزمایشگاهی');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.labForm}>
      {error && <div className={styles.errorMessage}>{error}</div>}
      
      <div className={styles.formGroup}>
        <label htmlFor="testName" className={styles.label}>نام آزمایش</label>
        <input
          type="text"
          id="testName"
          name="testName"
          value={formData.testName}
          onChange={handleInputChange}
          className={styles.input}
          placeholder="مثال: قند خون ناشتا (FBS)"
          required
        />
      </div>
      
      <div className={styles.formGroup}>
        <label htmlFor="testDate" className={styles.label}>تاریخ آزمایش</label>
        <input
          type="date"
          id="testDate"
          name="testDate"
          value={formData.testDate}
          onChange={handleInputChange}
          className={styles.input}
          required
        />
      </div>
      
      <div className={styles.formRow}>
        <div className={styles.formGroup}>
          <label htmlFor="result" className={styles.label}>نتیجه</label>
          <input
            type="text"
            id="result"
            name="result"
            value={formData.result}
            onChange={handleInputChange}
            className={styles.input}
            placeholder="مثال: 95"
            required
          />
        </div>
        
        <div className={styles.formGroup}>
          <label htmlFor="unit" className={styles.label}>واحد (اختیاری)</label>
          <input
            type="text"
            id="unit"
            name="unit"
            value={formData.unit}
            onChange={handleInputChange}
            className={styles.input}
            placeholder="مثال: mg/dL"
          />
        </div>
      </div>
      
      <div className={styles.formGroup}>
        <label htmlFor="normalRange" className={styles.label}>محدوده نرمال (اختیاری)</label>
        <input
          type="text"
          id="normalRange"
          name="normalRange"
          value={formData.normalRange}
          onChange={handleInputChange}
          className={styles.input}
          placeholder="مثال: 70-110"
        />
      </div>
      
      <div className={styles.formGroup}>
        <label htmlFor="notes" className={styles.label}>توضیحات (اختیاری)</label>
        <textarea
          id="notes"
          name="notes"
          value={formData.notes}
          onChange={handleInputChange}
          className={styles.textarea}
          placeholder="هرگونه توضیح اضافی درباره این آزمایش"
        />
      </div>
      
      <div className={styles.buttonGroup}>
        <button 
          type="submit" 
          className={styles.saveButton}
          disabled={submitting}
        >
          {submitting ? 'در حال ذخیره...' : 'ذخیره نتیجه آزمایش'}
        </button>
        <button
          type="button"
          className={styles.cancelButton}
          onClick={onClose}
          disabled={submitting}
        >
          انصراف
        </button>
      </div>
    </form>
  );
} 