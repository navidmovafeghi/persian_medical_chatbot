'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import LabResultUpload from './LabResultUpload';
import styles from '../profile/profile.module.css';

// Laboratory data interface
interface LaboratoryData {
  id: string;
  testName: string;
  testDate: string;
  result: string;
  unit?: string;
  normalRange?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export default function LaboratorySection() {
  const { data: session } = useSession();
  const isAuthenticated = !!session?.user;
  
  const [laboratoryData, setLaboratoryData] = useState<LaboratoryData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // State for form
  const [showForm, setShowForm] = useState(false);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [formData, setFormData] = useState({
    testName: '',
    testDate: new Date().toISOString().split('T')[0],
    result: '',
    unit: '',
    normalRange: '',
    notes: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  
  // Fetch laboratory data
  useEffect(() => {
    const fetchLaboratoryData = async () => {
      if (!isAuthenticated) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        const response = await fetch('/api/laboratory');
        
        if (!response.ok) {
          throw new Error('Failed to fetch laboratory data');
        }
        
        const data = await response.json();
        setLaboratoryData(data.laboratoryData || []);
      } catch (error) {
        console.error('Error fetching laboratory data:', error);
        setError('خطا در دریافت اطلاعات آزمایشگاهی');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchLaboratoryData();
  }, [isAuthenticated]);
  
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
    
    if (!isAuthenticated) return;
    
    // Validate form data
    if (!formData.testName || !formData.testDate || !formData.result) {
      setSubmitError('لطفا نام آزمایش، تاریخ و نتیجه را وارد کنید');
      return;
    }
    
    setSubmitting(true);
    setSubmitError(null);
    
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
      
      // Reset form and reload data
      setFormData({
        testName: '',
        testDate: new Date().toISOString().split('T')[0],
        result: '',
        unit: '',
        normalRange: '',
        notes: '',
      });
      setShowForm(false);
      
      // Refresh laboratory data
      const refreshResponse = await fetch('/api/laboratory');
      const refreshData = await refreshResponse.json();
      setLaboratoryData(refreshData.laboratoryData || []);
    } catch (error) {
      console.error('Error saving laboratory data:', error);
      setSubmitError(error instanceof Error ? error.message : 'خطا در ذخیره اطلاعات آزمایشگاهی');
    } finally {
      setSubmitting(false);
    }
  };
  
  // Handle deleting laboratory data
  const handleDelete = async (id: string) => {
    if (!confirm('آیا از حذف این نتیجه آزمایش اطمینان دارید؟')) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/laboratory', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete laboratory data');
      }
      
      // Remove the deleted item from state
      setLaboratoryData(prev => prev.filter(item => item.id !== id));
    } catch (error) {
      console.error('Error deleting laboratory data:', error);
      setError('خطا در حذف اطلاعات آزمایشگاهی');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle the extracted data from OCR
  const handleExtractedData = async (extractedData: any[] | any) => {
    console.log('[CLIENT] Received test results:', extractedData);
    
    // If no data was extracted, show error
    if (!extractedData || (Array.isArray(extractedData) && extractedData.length === 0)) {
      setSubmitError('هیچ اطلاعاتی از فایل استخراج نشد');
      return;
    }
    
    // If we have multiple test results, save them one by one
    if (Array.isArray(extractedData) && extractedData.length > 0) {
      setSubmitting(true);
      setSubmitError(null);
      
      try {
        // Save each test result
        for (const testResult of extractedData) {
          // Skip empty results
          if (!testResult.testName || !testResult.testDate) {
            continue;
          }
          
          const response = await fetch('/api/laboratory', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(testResult),
          });
          
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to save laboratory data');
          }
        }
        
        // Success! Close the form and refresh data
        setShowForm(false);
        setShowUploadForm(false);
        
        // Reset form data
        setFormData({
          testName: '',
          testDate: new Date().toISOString().split('T')[0],
          result: '',
          unit: '',
          normalRange: '',
          notes: '',
        });
        
        // Refresh laboratory data
        const refreshResponse = await fetch('/api/laboratory');
        const refreshData = await refreshResponse.json();
        setLaboratoryData(refreshData.laboratoryData || []);
      } catch (error) {
        console.error('Error saving laboratory data:', error);
        setSubmitError(error instanceof Error ? error.message : 'خطا در ذخیره اطلاعات آزمایشگاهی');
      } finally {
        setSubmitting(false);
      }
    } else {
      // Handle single result (backward compatibility)
      const singleResult = extractedData as any; // Cast to any for backward compatibility
      setFormData({
        testName: singleResult.testName || '',
        testDate: singleResult.testDate || new Date().toISOString().split('T')[0],
        result: singleResult.result || '',
        unit: singleResult.unit || '',
        normalRange: singleResult.normalRange || '',
        notes: singleResult.notes || '',
      });
      
      // Toggle forms
      setShowUploadForm(false);
      setShowForm(true);
    }
  };
  
  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('fa-IR');
    } catch (e) {
      return dateString;
    }
  };
  
  return (
    <div className={styles.formSection} id="laboratory">
      <div className={styles.sectionHeader}>
        <h2>نتایج آزمایشگاهی</h2>
        <div className={styles.actionButtons}>
          <button
            className={styles.uploadButton}
            onClick={() => {
              setShowUploadForm(true);
              setShowForm(false);
            }}
            disabled={isLoading || showForm || showUploadForm}
          >
            آپلود از فایل
          </button>
          <button
            className={styles.addButton}
            onClick={() => {
              setShowForm(true);
              setShowUploadForm(false);
            }}
            disabled={isLoading || showForm || showUploadForm}
          >
            افزودن دستی
          </button>
        </div>
      </div>
      
      {error && <div className={styles.errorMessage}>{error}</div>}
      
      {/* Upload Form */}
      {showUploadForm && (
        <LabResultUpload
          onDataExtracted={handleExtractedData}
          onCancel={() => setShowUploadForm(false)}
        />
      )}
      
      {/* Manual Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className={styles.labForm}>
          <div className={styles.formGroup}>
            <label htmlFor="testName" className={styles.label}>نام آزمایش</label>
            <input
              id="testName"
              name="testName"
              type="text"
              value={formData.testName}
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
                id="result"
                name="result"
                type="text"
                value={formData.result}
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
                value={formData.unit}
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
              value={formData.normalRange}
              onChange={handleInputChange}
              className={styles.input}
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
            ></textarea>
          </div>
          
          {submitError && <div className={styles.errorMessage}>{submitError}</div>}
          
          <div className={styles.buttonGroup}>
            <button
              type="submit"
              className={styles.saveButton}
              disabled={submitting}
            >
              {submitting ? 'در حال ذخیره...' : 'ذخیره نتیجه'}
            </button>
            <button
              type="button"
              className={styles.cancelButton}
              onClick={() => setShowForm(false)}
              disabled={submitting}
            >
              انصراف
            </button>
          </div>
        </form>
      )}
      
      {/* Laboratory Data List */}
      {isLoading ? (
        <div className={styles.loading}>در حال بارگذاری...</div>
      ) : laboratoryData.length === 0 ? (
        <div className={styles.noDataMessage}>
          هیچ نتیجه آزمایشی ثبت نشده است.
        </div>
      ) : (
        <div className={styles.labDataContainer}>
          {laboratoryData.map((labData) => (
            <div key={labData.id} className={styles.labDataCard}>
              <div className={styles.labDataHeader}>
                <h3>{labData.testName}</h3>
                <button
                  className={styles.deleteButton}
                  onClick={() => handleDelete(labData.id)}
                  disabled={isLoading}
                >
                  حذف
                </button>
              </div>
              <div className={styles.labDataDetails}>
                <p className={styles.labDate}>
                  <span>تاریخ:</span>
                  {formatDate(labData.testDate)}
                </p>
                <p className={styles.labResult}>
                  <span>نتیجه:</span>
                  {labData.result}
                  {labData.unit && <span className={styles.unit}>{labData.unit}</span>}
                </p>
                {labData.normalRange && (
                  <p className={styles.labNormalRange}>
                    <span>محدوده نرمال:</span>
                    {labData.normalRange}
                  </p>
                )}
                {labData.notes && (
                  <p className={styles.labNotes}>
                    <span>توضیحات:</span>
                    {labData.notes}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 