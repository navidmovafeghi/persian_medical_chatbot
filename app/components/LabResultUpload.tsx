'use client';

import { useState } from 'react';
import styles from '../profile/profile.module.css';

interface TestResult {
  testName: string;
  testDate: string;
  result: string;
  unit?: string;
  normalRange?: string;
  notes?: string;
}

interface LabResultUploadProps {
  onDataExtracted: (data: TestResult[]) => void;
  onCancel: () => void;
}

export default function LabResultUpload({ onDataExtracted, onCancel }: LabResultUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [extractedData, setExtractedData] = useState<TestResult[]>([]);
  const [isReviewing, setIsReviewing] = useState(false);
  const [currentTestIndex, setCurrentTestIndex] = useState(0);
  
  // State for keeping track of test results with ability to edit
  const [reviewData, setReviewData] = useState<TestResult[]>([{
    testName: '',
    testDate: '',
    result: '',
    unit: '',
    normalRange: '',
    notes: '',
  }]);

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
      console.log(`[CLIENT] Uploading file: ${file.name}, type: ${file.type}, size: ${file.size} bytes`);
      
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/laboratory/upload', {
        method: 'POST',
        body: formData,
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        console.error('[CLIENT] Upload error response:', data);
        let errorMessage = data.error || 'خطا در پردازش فایل';
        
        // Add detailed error information if available
        if (data.stage && data.details) {
          console.error(`[CLIENT] Error in stage "${data.stage}": ${data.details}`);
          errorMessage = `${errorMessage} - مرحله: ${data.stage} - ${data.details}`;
        }
        
        throw new Error(errorMessage);
      }
      
      console.log('[CLIENT] Upload successful, data:', data);
      
      // Ensure data.extractedData is an array
      const extractedResults = Array.isArray(data.extractedData) ? data.extractedData : [data.extractedData];
      
      console.log(`[CLIENT] Found ${extractedResults.length} test results`);
      
      // If we have no results, create a default empty one
      if (extractedResults.length === 0) {
        extractedResults.push({
          testName: file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '),
          testDate: new Date().toISOString().split('T')[0],
          result: '',
          unit: '',
          normalRange: '',
          notes: 'Please enter test results manually.',
        });
      }
      
      // Set the extracted data for review
      setExtractedData(extractedResults);
      setReviewData(extractedResults);
      setCurrentTestIndex(0);
      setIsReviewing(true);
    } catch (error) {
      console.error('[CLIENT] Upload error:', error);
      setUploadError(error instanceof Error ? error.message : 'خطا در آپلود فایل');
    } finally {
      setIsUploading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    setReviewData(prev => {
      const updated = [...prev];
      updated[currentTestIndex] = {
        ...updated[currentTestIndex],
        [name]: value
      };
      return updated;
    });
  };

  const handleNextTest = () => {
    if (currentTestIndex < reviewData.length - 1) {
      setCurrentTestIndex(prev => prev + 1);
    }
  };

  const handlePrevTest = () => {
    if (currentTestIndex > 0) {
      setCurrentTestIndex(prev => prev - 1);
    }
  };

  const handleAddTest = () => {
    setReviewData(prev => [
      ...prev,
      {
        testName: '',
        testDate: new Date().toISOString().split('T')[0],
        result: '',
        unit: '',
        normalRange: '',
        notes: '',
      }
    ]);
    setCurrentTestIndex(reviewData.length);
  };

  const handleDeleteTest = () => {
    if (reviewData.length <= 1) {
      return; // Don't delete the last test
    }
    
    setReviewData(prev => {
      const updated = prev.filter((_, index) => index !== currentTestIndex);
      return updated;
    });
    
    setCurrentTestIndex(prev => {
      if (prev >= reviewData.length - 1) {
        return reviewData.length - 2;
      }
      return prev;
    });
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
            {reviewData.length > 1 
              ? `لطفا اطلاعات استخراج شده را بررسی و در صورت نیاز ویرایش کنید (آزمایش ${currentTestIndex + 1} از ${reviewData.length}):` 
              : 'لطفا اطلاعات استخراج شده را بررسی و در صورت نیاز ویرایش کنید:'}
          </p>
          
          {/* Test navigation buttons (if multiple tests) */}
          {reviewData.length > 1 && (
            <div className={styles.testNavigation}>
              <button 
                type="button" 
                onClick={handlePrevTest} 
                disabled={currentTestIndex === 0}
                className={styles.navButton}
              >
                آزمایش قبلی
              </button>
              <span className={styles.testCounter}>
                {currentTestIndex + 1} / {reviewData.length}
              </span>
              <button 
                type="button" 
                onClick={handleNextTest} 
                disabled={currentTestIndex === reviewData.length - 1}
                className={styles.navButton}
              >
                آزمایش بعدی
              </button>
            </div>
          )}
          
          {/* Form fields for the current test */}
          <div className={styles.formGroup}>
            <label htmlFor="testName" className={styles.label}>نام آزمایش</label>
            <input
              id="testName"
              name="testName"
              type="text"
              value={reviewData[currentTestIndex].testName}
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
              value={reviewData[currentTestIndex].testDate}
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
                value={reviewData[currentTestIndex].result}
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
                value={reviewData[currentTestIndex].unit}
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
              value={reviewData[currentTestIndex].normalRange}
              onChange={handleInputChange}
              className={styles.input}
            />
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="notes" className={styles.label}>توضیحات (اختیاری)</label>
            <textarea
              id="notes"
              name="notes"
              value={reviewData[currentTestIndex].notes}
              onChange={handleInputChange}
              className={styles.textarea}
            ></textarea>
          </div>
          
          {/* Test management buttons */}
          <div className={styles.testManagement}>
            <button 
              type="button" 
              onClick={handleAddTest}
              className={styles.addTestButton}
            >
              افزودن آزمایش دیگر
            </button>
            
            {reviewData.length > 1 && (
              <button 
                type="button" 
                onClick={handleDeleteTest}
                className={styles.deleteTestButton}
              >
                حذف این آزمایش
              </button>
            )}
          </div>
          
          <div className={styles.buttonGroup}>
            <button
              type="button"
              className={styles.saveButton}
              onClick={handleConfirm}
            >
              ذخیره همه اطلاعات
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