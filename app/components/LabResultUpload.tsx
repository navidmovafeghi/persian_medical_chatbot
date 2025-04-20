'use client';

import { useState } from 'react';
import styles from '../profile/profile.module.css';

interface LabResultUploadProps {
  onDataExtracted: (data: {
    testName: string;
    testDate: string;
    result: string;
    unit?: string;
    normalRange?: string;
    notes?: string;
  }) => void;
  onCancel: () => void;
}

export default function LabResultUpload({ onDataExtracted, onCancel }: LabResultUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [extractedData, setExtractedData] = useState<any>(null);
  const [isReviewing, setIsReviewing] = useState(false);
  const [reviewData, setReviewData] = useState({
    testName: '',
    testDate: '',
    result: '',
    unit: '',
    normalRange: '',
    notes: '',
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setUploadError(null);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!file) {
      setUploadError('لطفا ابتدا یک فایل انتخاب کنید');
      return;
    }

    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      setUploadError('فقط فایل‌های PDF، JPG و PNG پشتیبانی می‌شوند');
      return;
    }

    setIsUploading(true);
    setUploadError(null);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/laboratory/upload', {
        method: 'POST',
        body: formData,
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'خطا در پردازش فایل');
      }
      
      // Set the extracted data for review
      setExtractedData(data.extractedData);
      setReviewData({
        testName: data.extractedData.testName || '',
        testDate: data.extractedData.testDate || new Date().toISOString().split('T')[0],
        result: data.extractedData.result || '',
        unit: data.extractedData.unit || '',
        normalRange: data.extractedData.normalRange || '',
        notes: data.extractedData.notes || '',
      });
      setIsReviewing(true);
    } catch (error) {
      console.error('Upload error:', error);
      setUploadError(error instanceof Error ? error.message : 'خطا در آپلود فایل');
    } finally {
      setIsUploading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setReviewData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleConfirm = () => {
    // Pass the confirmed data to the parent component
    onDataExtracted(reviewData);
  };

  return (
    <div className={styles.labForm}>
      <h3>آپلود نتیجه آزمایش</h3>
      
      {!isReviewing ? (
        <form onSubmit={handleUpload}>
          <div className={styles.formGroup}>
            <label className={styles.label}>
              فایل آزمایش (PDF یا تصویر)
            </label>
            <input
              type="file"
              onChange={handleFileChange}
              accept=".pdf,.jpg,.jpeg,.png"
              className={styles.input}
            />
            <p className={styles.uploadHint}>
              می‌توانید فایل PDF یا تصویر نتیجه آزمایش خود را آپلود کنید. سیستم به صورت خودکار اطلاعات را استخراج خواهد کرد.
            </p>
          </div>
          
          {uploadError && (
            <div className={styles.errorMessage}>{uploadError}</div>
          )}
          
          <div className={styles.buttonGroup}>
            <button
              type="submit"
              className={styles.saveButton}
              disabled={isUploading}
            >
              {isUploading ? 'در حال پردازش...' : 'آپلود و پردازش'}
            </button>
            <button
              type="button"
              className={styles.cancelButton}
              onClick={onCancel}
              disabled={isUploading}
            >
              انصراف
            </button>
          </div>
        </form>
      ) : (
        <div className={styles.reviewForm}>
          <p className={styles.reviewMessage}>
            لطفا اطلاعات استخراج شده را بررسی و در صورت نیاز ویرایش کنید:
          </p>
          
          <div className={styles.formGroup}>
            <label htmlFor="testName" className={styles.label}>نام آزمایش</label>
            <input
              id="testName"
              name="testName"
              type="text"
              value={reviewData.testName}
              onChange={handleInputChange}
              className={styles.input}
              required
            />
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="testDate" className={styles.label}>تاریخ آزمایش</label>
            <input
              id="testDate"
              name="testDate"
              type="date"
              value={reviewData.testDate}
              onChange={handleInputChange}
              className={styles.input}
              required
            />
          </div>
          
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="result" className={styles.label}>نتیجه</label>
              <input
                id="result"
                name="result"
                type="text"
                value={reviewData.result}
                onChange={handleInputChange}
                className={styles.input}
                required
              />
            </div>
            
            <div className={styles.formGroup}>
              <label htmlFor="unit" className={styles.label}>واحد (اختیاری)</label>
              <input
                id="unit"
                name="unit"
                type="text"
                value={reviewData.unit}
                onChange={handleInputChange}
                className={styles.input}
              />
            </div>
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="normalRange" className={styles.label}>محدوده نرمال (اختیاری)</label>
            <input
              id="normalRange"
              name="normalRange"
              type="text"
              value={reviewData.normalRange}
              onChange={handleInputChange}
              className={styles.input}
            />
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="notes" className={styles.label}>توضیحات (اختیاری)</label>
            <textarea
              id="notes"
              name="notes"
              value={reviewData.notes}
              onChange={handleInputChange}
              className={styles.textarea}
            ></textarea>
          </div>
          
          <div className={styles.buttonGroup}>
            <button
              type="button"
              className={styles.saveButton}
              onClick={handleConfirm}
            >
              ذخیره اطلاعات
            </button>
            <button
              type="button"
              className={styles.cancelButton}
              onClick={onCancel}
            >
              انصراف
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 