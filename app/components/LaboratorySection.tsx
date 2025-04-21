'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import LabResultUpload from './LabResultUpload';
import styles from '../profile/profile.module.css';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns-jalali';
import ManualLabEntry from './ManualLabEntry';
import LabResultsChart from './LabResultsChart';
import Link from 'next/link';

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

interface ExtractedData {
  testName: string;
  value: string;
  unit?: string;
  normalRange?: string;
  date?: string;
  labName?: string;
}

// Add a new interface for the grouped lab results
interface GroupedLabResults {
  id: string;
  fileId: string;
  reportDate: string;
  results: LaboratoryData[];
}

interface LabResult {
  id: string;
  testName: string;
  testDate: string;
  result: string;
  unit: string;
  normalRange: string;
  notes: string | null;
}

interface LaboratorySectionProps {
  initialResults?: LabResult[];
}

export default function LaboratorySection({ initialResults = [] }: LaboratorySectionProps) {
  const { data: session } = useSession();
  const isAuthenticated = !!session?.user;
  
  const [laboratoryData, setLaboratoryData] = useState<LaboratoryData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // State for form
  const [showForm, setShowForm] = useState(false);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [showManualForm, setShowManualForm] = useState(false);
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
  const [isUploading, setIsUploading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Add state for grouped lab data
  const [groupedLabData, setGroupedLabData] = useState<GroupedLabResults[]>([]);
  
  const [results, setResults] = useState<LabResult[]>(initialResults);
  
  const router = useRouter();

  // Add a state for the active tab
  const [activeTab, setActiveTab] = useState<'table' | 'chart'>('chart');

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
        
        // Group lab data by report date
        const groupedData: { [key: string]: GroupedLabResults } = {};
        
        (data.laboratoryData || []).forEach((lab: LaboratoryData) => {
          // Extract fileId or use date as grouping key
          const fileId = lab.notes?.match(/fileId:([a-z0-9-]+)/)?.[1] || '';
          const groupKey = fileId || lab.testDate;
          
          if (!groupedData[groupKey]) {
            groupedData[groupKey] = {
              id: groupKey,
              fileId: fileId,
              reportDate: lab.testDate,
              results: []
            };
          }
          
          groupedData[groupKey].results.push(lab);
        });
        
        setGroupedLabData(Object.values(groupedData));
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
  const handleExtractedData = async (extractedData: ExtractedData[] | ExtractedData | any) => {
    setIsUploading(false);
    
    // Handle empty results
    if (!extractedData || 
        (Array.isArray(extractedData) && extractedData.length === 0) ||
        (!Array.isArray(extractedData) && Object.keys(extractedData).length === 0)) {
      setSubmitError('هیچ اطلاعاتی از فایل استخراج نشد');
      toast.error('داده‌ای استخراج نشد');
      return;
    }
    
    // If extractedData is an array (multiple results)
    if (Array.isArray(extractedData)) {
      console.log('Processing multiple extracted results:', extractedData);
      
      // Save each result one by one
      setSubmitting(true);
      setSubmitError(null);
      
      try {
        let savedCount = 0;
        // Generate a unique ID for this report
        const reportFileId = `report-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        for (const result of extractedData) {
          if (result.testName && result.value) {
            // Format the data according to your API requirements
            const testData = {
              testName: result.testName,
              testDate: result.date || new Date().toISOString().split('T')[0],
              result: result.value, // Use value field from extracted data
              unit: result.unit || '',
              normalRange: result.normalRange || '',
              notes: `${result.labName ? `Lab: ${result.labName}` : ''} fileId:${reportFileId}`,
            };
            
            console.log('Saving lab test:', testData);
            
            try {
              const response = await fetch('/api/laboratory', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify(testData),
              });
              
              const responseData = await response.json();
              
              if (!response.ok) {
                console.error('API response error:', responseData);
                throw new Error(responseData.error || `Failed to save: ${response.statusText}`);
              }
              
              savedCount++;
            } catch (saveError) {
              console.error('Error saving individual test:', saveError);
              // Continue with other tests even if one fails
            }
          }
        }
        
        if (savedCount === 0) {
          throw new Error('No tests could be saved. Please check your login status and try again.');
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
        
        // Show success message
        toast.success(`${savedCount} نتیجه با موفقیت ذخیره شد`);
        
        // Refresh laboratory data
        try {
          const refreshResponse = await fetch('/api/laboratory');
          const refreshData = await refreshResponse.json();
          setLaboratoryData(refreshData.laboratoryData || []);
          
          // Group lab data by report date
          const groupedData: { [key: string]: GroupedLabResults } = {};
          
          (refreshData.laboratoryData || []).forEach((lab: LaboratoryData) => {
            // Extract fileId or use date as grouping key
            const fileId = lab.notes?.match(/fileId:([a-z0-9-]+)/)?.[1] || '';
            const groupKey = fileId || lab.testDate;
            
            if (!groupedData[groupKey]) {
              groupedData[groupKey] = {
                id: groupKey,
                fileId: fileId,
                reportDate: lab.testDate,
                results: []
              };
            }
            
            groupedData[groupKey].results.push(lab);
          });
          
          setGroupedLabData(Object.values(groupedData));
        } catch (refreshError) {
          console.error('Error refreshing laboratory data:', refreshError);
          // Don't throw, we already saved the data successfully
        }
      } catch (error: any) {
        console.error('Error saving laboratory data:', error);
        setSubmitError(error instanceof Error ? error.message : 'خطا در ذخیره اطلاعات آزمایشگاهی');
        toast.error(`خطا در ذخیره نتایج: ${error.message || 'خطای نامشخص'}`);
      } finally {
        setSubmitting(false);
      }
    } else {
      // Handle single result (backward compatibility)
      const singleResult = extractedData as any; // Cast to any for backward compatibility
      
      if (singleResult.testName && (singleResult.value || singleResult.testValue)) {
        setFormData({
          testName: singleResult.testName || '',
          testDate: singleResult.date || singleResult.testDate || new Date().toISOString().split('T')[0],
          result: singleResult.value || singleResult.testValue || '',
          unit: singleResult.unit || singleResult.testUnit || '',
          normalRange: singleResult.normalRange || singleResult.referenceRange || '',
          notes: singleResult.labName ? `Lab: ${singleResult.labName}` : '',
        });
        
        // Toggle forms
        setShowUploadForm(false);
        setShowForm(true);
        toast.success('اطلاعات استخراج شده با موفقیت دریافت شد');
      } else {
        setSubmitError('داده های آزمایش ناقص است');
        toast.error('داده های آزمایش ناقص است');
      }
    }
  };
  
  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, "yyyy/MM/dd");
    } catch (e) {
      return dateString;
    }
  };
  
  const closeAllForms = () => {
    setShowUploadForm(false);
    setShowForm(false);
    setShowManualForm(false);
  };

  return (
    <div className={styles.profileSection}>
      <div className={styles.sectionHeader}>
        <h2>نتایج آزمایشگاهی</h2>
        <div className={styles.sectionActions}>
          <Link href="/" className={styles.actionButton} style={{ backgroundColor: '#10b981' }}>
            <span className={styles.buttonIcon}>💬</span>
            چت با پزشک هوشمند
          </Link>
          <button 
            className={styles.actionButton} 
            onClick={() => {
              closeAllForms();
              setShowUploadForm(true);
            }}
          >
            <span className={styles.buttonIcon}>📄</span>
            آپلود از فایل
          </button>
          <button 
            className={styles.actionButton}
            onClick={() => {
              closeAllForms();
              setShowManualForm(true);
            }}
          >
            <span className={styles.buttonIcon}>✏️</span>
            افزودن دستی
          </button>
        </div>
      </div>

      {/* Tab navigation */}
      {laboratoryData.length > 0 && (
        <div className={styles.tabButtons}>
          <button 
            className={`${styles.tabButton} ${activeTab === 'chart' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('chart')}
          >
            نمودار
          </button>
          <button 
            className={`${styles.tabButton} ${activeTab === 'table' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('table')}
          >
            جدول
          </button>
        </div>
      )}

      {/* Chart view */}
      {laboratoryData.length > 0 && activeTab === 'chart' && (
        <LabResultsChart laboratoryData={laboratoryData} />
      )}

      {/* Table view */}
      {(laboratoryData.length === 0 || activeTab === 'table') && (
        results.length > 0 ? (
          <div className={styles.dataTable}>
            <div className={styles.tableHeader}>
              <div className={styles.tableHeaderCell}>نام آزمایش</div>
              <div className={styles.tableHeaderCell}>تاریخ</div>
              <div className={styles.tableHeaderCell}>نتیجه</div>
              <div className={styles.tableHeaderCell}>واحد</div>
              <div className={styles.tableHeaderCell}>محدوده نرمال</div>
              <div className={styles.tableHeaderCell}>توضیحات</div>
              <div className={styles.tableHeaderCell}>عملیات</div>
            </div>
            {results.map((result) => (
              <div key={result.id} className={styles.tableRow}>
                <div className={styles.tableCell}>{result.testName}</div>
                <div className={styles.tableCell}>{formatDate(result.testDate)}</div>
                <div className={styles.tableCell}>{result.result}</div>
                <div className={styles.tableCell}>{result.unit}</div>
                <div className={styles.tableCell}>{result.normalRange}</div>
                <div className={styles.tableCell}>{result.notes}</div>
                <div className={styles.tableCell}>
                  <button 
                    className={styles.deleteButton}
                    onClick={() => handleDelete(result.id)}
                  >
                    حذف
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className={styles.emptyState}>
            <div className={styles.emptyStateIcon}>🔬</div>
            <p>هنوز هیچ نتیجه آزمایشی ثبت نشده است.</p>
            <p>با استفاده از دکمه های بالا نتایج آزمایش خود را اضافه کنید.</p>
          </div>
        )
      )}

      {showUploadForm && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h3>آپلود نتایج آزمایش</h3>
              <button 
                className={styles.modalClose}
                onClick={() => setShowUploadForm(false)}
              >
                ×
              </button>
            </div>
            <div className={styles.modalBody}>
              <LabResultUpload 
                onDataExtracted={handleExtractedData} 
                onCancel={() => setShowUploadForm(false)} 
              />
            </div>
          </div>
        </div>
      )}

      {showManualForm && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h3>افزودن دستی نتایج آزمایش</h3>
              <button 
                className={styles.modalClose}
                onClick={() => setShowManualForm(false)}
              >
                ×
              </button>
            </div>
            <div className={styles.modalBody}>
              <ManualLabEntry onClose={() => setShowManualForm(false)} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 