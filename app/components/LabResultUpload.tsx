'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import styles from '../profile/profile.module.css';

interface ExtractedData {
  testName: string;
  value: string;
  unit: string;
  normalRange: string;
  date?: string;
  labName?: string;
}

interface LabResultUploadProps {
  onDataExtracted: (data: ExtractedData[] | ExtractedData) => void;
  onCancel: () => void;
}

const LabResultUpload: React.FC<LabResultUploadProps> = ({ onDataExtracted, onCancel }) => {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [extractedResults, setExtractedResults] = useState<ExtractedData[]>([]);
  const [currentResultIndex, setCurrentResultIndex] = useState(0);
  const [processingStatus, setProcessingStatus] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0] || null;
    setFile(selectedFile);
    setUploadError(null);
    setExtractedResults([]);
    setCurrentResultIndex(0);
    setProcessingStatus('');
  };

  const clearFile = () => {
    setFile(null);
    setUploadError(null);
    setExtractedResults([]);
    setCurrentResultIndex(0);
    setProcessingStatus('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const parseExtractedText = (text: string): ExtractedData[] => {
    console.log('Parsing extracted text:', text);
    
    // Simple pattern matching for test name, value, unit, and reference range
    const results: ExtractedData[] = [];
    
    // Define common lab test abbreviations with their variations and Persian names
    const commonLabTests = [
      // Electrolytes
      { key: 'K', variations: ['K', 'K+', 'Potassium', 'پتاسیم'] },
      { key: 'Na', variations: ['Na', 'Na+', 'Sodium', 'سدیم'] },
      { key: 'Cl', variations: ['Cl', 'Cl-', 'Chloride', 'کلر', 'کلراید'] },
      { key: 'Ca', variations: ['Ca', 'Ca2+', 'Calcium', 'کلسیم'] },
      { key: 'Mg', variations: ['Mg', 'Mg2+', 'Magnesium', 'منیزیم'] },
      { key: 'P', variations: ['P', 'Phosphorus', 'فسفر'] },
      
      // Blood Count
      { key: 'RBC', variations: ['RBC', 'Red Blood Cell', 'Red Blood Cells', 'گلبول قرمز'] },
      { key: 'WBC', variations: ['WBC', 'White Blood Cell', 'White Blood Cells', 'گلبول سفید', 'لکوسیت'] },
      { key: 'Hgb', variations: ['Hgb', 'HGB', 'Hemoglobin', 'هموگلوبین'] },
      { key: 'HCT', variations: ['HCT', 'Hct', 'Hematocrit', 'هماتوکریت'] },
      { key: 'PLT', variations: ['PLT', 'Platelets', 'پلاکت'] },
      { key: 'MCV', variations: ['MCV', 'Mean Corpuscular Volume', 'حجم متوسط گلبولی'] },
      { key: 'MCH', variations: ['MCH', 'Mean Corpuscular Hemoglobin', 'هموگلوبین متوسط گلبولی'] },
      { key: 'MCHC', variations: ['MCHC', 'Mean Corpuscular Hemoglobin Concentration', 'غلظت متوسط هموگلوبین گلبولی'] },
      
      // Hormones
      { key: 'TSH', variations: ['TSH', 'Thyroid Stimulating Hormone', 'هورمون محرک تیروئید'] },
      { key: 'T3', variations: ['T3', 'Triiodothyronine', 'تری یدوتیرونین'] },
      { key: 'T4', variations: ['T4', 'Thyroxine', 'تیروکسین'] },
      { key: 'FSH', variations: ['FSH', 'Follicle Stimulating Hormone', 'هورمون محرک فولیکولی'] },
      { key: 'LH', variations: ['LH', 'Luteinizing Hormone', 'هورمون لوتئینی'] },
      
      // Liver function
      { key: 'AST', variations: ['AST', 'SGOT', 'Aspartate Aminotransferase', 'آسپارتات آمینوترانسفراز'] },
      { key: 'ALT', variations: ['ALT', 'SGPT', 'Alanine Aminotransferase', 'آلانین آمینوترانسفراز'] },
      { key: 'ALP', variations: ['ALP', 'Alkaline Phosphatase', 'آلکالین فسفاتاز'] },
      { key: 'GGT', variations: ['GGT', 'Gamma-Glutamyl Transferase', 'گاما گلوتامیل ترانسفراز'] },
      
      // Lipids
      { key: 'HDL', variations: ['HDL', 'High Density Lipoprotein', 'لیپوپروتئین با چگالی بالا'] },
      { key: 'LDL', variations: ['LDL', 'Low Density Lipoprotein', 'لیپوپروتئین با چگالی پایین'] },
      { key: 'TC', variations: ['TC', 'Total Cholesterol', 'کلسترول تام', 'کلسترول کل'] },
      { key: 'TG', variations: ['TG', 'Triglycerides', 'تری گلیسیرید'] },
      
      // Others
      { key: 'FBS', variations: ['FBS', 'Fasting Blood Sugar', 'قند خون ناشتا'] },
      { key: 'BS', variations: ['BS', 'Blood Sugar', 'قند خون'] },
      { key: 'Glucose', variations: ['Glucose', 'گلوکز'] },
      { key: 'HbA1c', variations: ['HbA1c', 'Hemoglobin A1c', 'هموگلوبین A1c'] },
      { key: 'CRP', variations: ['CRP', 'C-Reactive Protein', 'پروتئین واکنشی C'] },
      { key: 'ESR', variations: ['ESR', 'Erythrocyte Sedimentation Rate', 'سرعت رسوب گلبول قرمز'] },
      { key: 'BUN', variations: ['BUN', 'Blood Urea Nitrogen', 'اوره خون', 'نیتروژن اوره خون'] },
      { key: 'Cr', variations: ['Cr', 'Creatinine', 'کراتینین'] },
      { key: 'UA', variations: ['UA', 'Uric Acid', 'اسید اوریک'] }
    ];
    
    // Split text by lines to process each line
    const lines = text.split('\n');
    
    // Method 1: Look for patterns like "K: 3.5" or "K 3.5"
    // Enhanced regex that can handle more formats: K: 3.5, K = 3.5, K-3.5, K 3.5, Potassium: 3.5 mmol/L
    const testValuePattern = /\b([A-Za-z0-9\u0600-\u06FF\-\.]+)\s*[:=\-]?\s*([\d\.]+)\s*([A-Za-z%\/]+)?/g;
    let matches = [...text.matchAll(testValuePattern)];
    
    // Process pattern matches
    for (const match of matches) {
      const [fullMatch, possibleTestName, value, unit] = match;
      
      // Skip if test name is too short or starts with a number (likely not a test name)
      if (possibleTestName.length < 1 || /^\d+$/.test(possibleTestName)) continue;
      
      // Normalize the test name (remove spaces, convert to uppercase)
      const normalizedTestName = possibleTestName.trim().toUpperCase();
      
      // Check if it's a common lab test or similar to one
      const matchedTest = commonLabTests.find(test => 
        test.variations.some(variation => 
          variation.toUpperCase() === normalizedTestName ||
          normalizedTestName.includes(variation.toUpperCase())
        )
      );
      
      if (matchedTest) {
        // Use the standardized key name for the test
        results.push({
          testName: matchedTest.key,
          value: value.trim(),
          unit: unit ? unit.trim() : '',
          normalRange: '',
          date: new Date().toISOString().split('T')[0],
          labName: 'Extracted from file'
        });
      } else if (possibleTestName.length <= 6) {
        // Allow short test names that might be abbreviations
        results.push({
          testName: possibleTestName.trim(),
          value: value.trim(),
          unit: unit ? unit.trim() : '',
          normalRange: '',
          date: new Date().toISOString().split('T')[0],
          labName: 'Extracted from file'
        });
      }
    }
    
    // Method 2: Process line by line for tests that may span multiple lines
    let currentTest: Partial<ExtractedData> = {};
    
    for (const line of lines) {
      // Skip empty lines
      if (!line.trim()) continue;
      
      // Try to match test name with value on same line first
      const lineMatch = line.match(/\b([A-Za-z0-9\u0600-\u06FF\-\.]+)\s*[:=\-]?\s*([\d\.]+)\s*([A-Za-z%\/]+)?/);
      if (lineMatch) {
        const [_, possibleTestName, value, unit] = lineMatch;
        
        // Normalize the test name (remove spaces, convert to uppercase)
        const normalizedTestName = possibleTestName.trim().toUpperCase();
        
        // Check if it's a common test and not already added
        const matchedTest = commonLabTests.find(test => 
          test.variations.some(variation => 
            variation.toUpperCase() === normalizedTestName ||
            normalizedTestName.includes(variation.toUpperCase())
          )
        );
        
        const alreadyAdded = results.some(result => {
          // Check if this test is already added either by its standardized key or its original name
          return (matchedTest && result.testName === matchedTest.key) || 
                 result.testName.toUpperCase() === possibleTestName.trim().toUpperCase();
        });
        
        if (matchedTest && !alreadyAdded) {
          results.push({
            testName: matchedTest.key,
            value: value.trim(),
            unit: unit ? unit.trim() : '',
            normalRange: '',
            date: new Date().toISOString().split('T')[0],
            labName: 'Extracted from file'
          });
          continue;
        } else if (possibleTestName.length <= 6 && !alreadyAdded) {
          // Allow short test names that might be abbreviations
          results.push({
            testName: possibleTestName.trim(),
            value: value.trim(),
            unit: unit ? unit.trim() : '',
            normalRange: '',
            date: new Date().toISOString().split('T')[0],
            labName: 'Extracted from file'
          });
          continue;
        }
      }
      
      // Check for test name pattern 
      const isLabTest = commonLabTests.some(test => 
        test.variations.some(variation => 
          line.trim().toUpperCase() === variation.toUpperCase() ||
          line.trim().toUpperCase().includes(variation.toUpperCase())
        )
      );
      
      if (/^[a-zA-Z\u0600-\u06FF]{1,6}$/.test(line.trim()) || isLabTest) {
        // If we have a partial test record, save it before starting a new one
        if (currentTest.testName && currentTest.value) {
          // Find the matched test for standardized naming
          const matchedTest = commonLabTests.find(test => 
            test.variations.some(variation => 
              currentTest.testName?.toUpperCase() === variation.toUpperCase() ||
              (currentTest.testName?.toUpperCase() || '').includes(variation.toUpperCase())
            )
          );
          
          const alreadyAdded = results.some(result => {
            return (matchedTest && result.testName === matchedTest.key) || 
                   result.testName.toUpperCase() === currentTest.testName?.toUpperCase();
          });
          
          if (!alreadyAdded) {
            results.push({
              testName: matchedTest ? matchedTest.key : (currentTest.testName || 'Unknown Test'),
              value: currentTest.value || '',
              unit: currentTest.unit || '',
              normalRange: currentTest.normalRange || '',
              date: new Date().toISOString().split('T')[0],
              labName: 'Extracted from file'
            });
          }
        }
        
        // Find the matched test for the new test we're starting
        const matchedTest = commonLabTests.find(test => 
          test.variations.some(variation => 
            line.trim().toUpperCase() === variation.toUpperCase() ||
            line.trim().toUpperCase().includes(variation.toUpperCase())
          )
        );
        
        // Start a new test
        currentTest = { 
          testName: matchedTest ? matchedTest.key : line.trim() 
        };
      }
      
      // Check for value pattern (typically numeric)
      else if (/[0-9]/.test(line) && !currentTest.value) {
        // Extract the numeric part as the value
        const numericMatch = line.match(/([\d\.]+)/);
        if (numericMatch) {
          currentTest.value = numericMatch[1];
          
          // Also try to extract unit if it follows the number
          const unitMatch = line.match(/([\d\.]+)\s*([A-Za-z%\/]+)/);
          if (unitMatch && unitMatch[2]) {
            currentTest.unit = unitMatch[2].trim();
          }
        } else {
          currentTest.value = line.trim();
        }
      }
      
      // Check for unit pattern (typically short text after value)
      else if (!currentTest.unit && currentTest.value) {
        const unitCandidates = ['mmol/L', 'mg/dL', 'g/dL', 'mL', 'ng/mL', 'pg/mL', 'U/L', 'IU/L', '%', 'mmHg', 'fL', 'pg'];
        const foundUnit = unitCandidates.find(unit => line.includes(unit));
        
        if (foundUnit) {
          currentTest.unit = foundUnit;
        } else if (line.length < 10) {  // Short lines might be units
          currentTest.unit = line.trim();
        }
      }
      
      // Check for reference range pattern
      else if (!currentTest.normalRange && (
        line.toLowerCase().includes('normal') || 
        line.toLowerCase().includes('reference') || 
        line.toLowerCase().includes('range') || 
        line.includes('مرجع') || 
        line.includes('نرمال') ||
        line.includes('-') ||
        /\d+\s*-\s*\d+/.test(line) // Pattern like "3.5 - 5.0"
      )) {
        currentTest.normalRange = line.trim();
      }
    }
    
    // Don't forget to add the last test if it exists
    if (currentTest.testName && currentTest.value) {
      // Find the matched test for standardized naming
      const matchedTest = commonLabTests.find(test => 
        test.variations.some(variation => 
          currentTest.testName?.toUpperCase() === variation.toUpperCase() ||
          (currentTest.testName?.toUpperCase() || '').includes(variation.toUpperCase())
        )
      );
      
      const alreadyAdded = results.some(result => {
        return (matchedTest && result.testName === matchedTest.key) || 
               result.testName.toUpperCase() === currentTest.testName?.toUpperCase();
      });
      
      if (!alreadyAdded) {
        results.push({
          testName: matchedTest ? matchedTest.key : (currentTest.testName || 'Unknown Test'),
          value: currentTest.value || '',
          unit: currentTest.unit || '',
          normalRange: currentTest.normalRange || '',
          date: new Date().toISOString().split('T')[0],
          labName: 'Extracted from file'
        });
      }
    }
    
    // If no structured data was found but we have text, create a single result
    if (results.length === 0 && text.trim()) {
      results.push({
        testName: 'Extracted Text',
        value: '',
        unit: '',
        normalRange: text.trim(),
        date: new Date().toISOString().split('T')[0],
        labName: 'Extracted from file'
      });
    }
    
    // Look for date patterns in the text to update all results with the same date if found
    const datePatterns = [
      /(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/, // YYYY/MM/DD or YYYY-MM-DD
      /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/, // DD/MM/YYYY or DD-MM-YYYY
      /(\d{1,2})\s(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s(\d{4})/i // 15 January 2023
    ];
    
    for (const pattern of datePatterns) {
      const dateMatch = text.match(pattern);
      if (dateMatch) {
        let extractedDate;
        if (pattern.toString().includes('Jan|Feb|Mar')) {
          // Month name format
          const day = dateMatch[1];
          const month = dateMatch[2]; // This will be the month name
          const year = dateMatch[3];
          extractedDate = new Date(`${month} ${day}, ${year}`);
        } else if (pattern.toString().includes('\\d{4})[\\')) {
          // YYYY/MM/DD format
          const year = dateMatch[1];
          const month = dateMatch[2];
          const day = dateMatch[3];
          extractedDate = new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`);
        } else {
          // DD/MM/YYYY format
          const day = dateMatch[1];
          const month = dateMatch[2];
          const year = dateMatch[3];
          extractedDate = new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`);
        }
        
        if (!isNaN(extractedDate.getTime())) {
          const formattedDate = extractedDate.toISOString().split('T')[0];
          // Update all results with this date
          results.forEach(result => {
            result.date = formattedDate;
          });
          break; // Stop after finding the first valid date
        }
      }
    }
    
    console.log('Parsed results:', results);
    return results;
  };

  const submitExtractedResults = () => {
    if (extractedResults.length === 0) {
      setUploadError('اطلاعاتی از فایل استخراج نشد');
      toast.error('اطلاعاتی از فایل استخراج نشد');
      return;
    }
    
    try {
      // If multiple results, pass the whole array
      if (extractedResults.length > 1) {
        onDataExtracted(extractedResults);
        toast.success(`${extractedResults.length} نتیجه استخراج شد`);
      } else {
        // If single result, pass just that result
        onDataExtracted(extractedResults[0]);
        toast.success('نتیجه با موفقیت استخراج شد');
      }
    } catch (error) {
      console.error('Error submitting results:', error);
      setUploadError(`خطا در ارسال نتایج: ${error instanceof Error ? error.message : String(error)}`);
      toast.error('خطا در ارسال نتایج');
    }
  };
  
  // Process file when selected
  useEffect(() => {
    if (file) {
      uploadFileForAiExtraction(file);
    }
  }, [file]);
  
  // Add a new function to process file with AI
  const uploadFileForAiExtraction = async (file: File) => {
    setIsUploading(true);
    setProcessingStatus('در حال آپلود و پردازش فایل...');
    
    try {
      // Create a form with the file
      const formData = new FormData();
      formData.append('file', file);
      
      // Make the API call
      const response = await fetch('/api/laboratory/extract-data', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to extract data');
      }
      
      const data = await response.json();
      console.log('Extracted data from API:', data);
      
      // Update state with the extracted results
      if (data.results && Array.isArray(data.results) && data.results.length > 0) {
        setExtractedResults(data.results);
        setProcessingStatus('');
      } else if (data.result) {
        // Single result format
        setExtractedResults([{
          testName: data.result.testName || '',
          value: data.result.value || '',
          unit: data.result.unit || '',
          normalRange: data.result.normalRange || '',
          date: data.result.date || new Date().toISOString().split('T')[0],
          labName: data.result.labName || ''
        }]);
        setProcessingStatus('');
      } else {
        throw new Error('No data extracted from the image');
      }
    } catch (error) {
      console.error('Error in AI extraction:', error);
      setUploadError(error instanceof Error ? error.message : 'خطا در استخراج اطلاعات');
      toast.error('خطا در استخراج اطلاعات');
    } finally {
      setIsUploading(false);
    }
  };

  // Add a new function to handle result previewing and navigation
  const handleNavigation = (direction: 'next' | 'prev') => {
    if (direction === 'next' && currentResultIndex < extractedResults.length - 1) {
      setCurrentResultIndex(currentResultIndex + 1);
    } else if (direction === 'prev' && currentResultIndex > 0) {
      setCurrentResultIndex(currentResultIndex - 1);
    }
  };

  // Add a function to validate the test results before submission
  const validateResults = (): boolean => {
    // Ensure we have at least one test result with required fields
    if (extractedResults.length === 0) {
      return false;
    }
    
    // Check if at least one result has required fields
    return extractedResults.some(result => 
      !!result.testName && (!!result.value || result.value === '0')
    );
  };

  const handleFileClick = () => {
    if (!file) return;
    
    setUploadError(null);
    
    if (file.type === 'application/pdf' || file.type.startsWith('image/')) {
      uploadFileForAiExtraction(file);
    } else {
      setUploadError('فایل باید PDF یا تصویر باشد');
    }
  };

  return (
    <div className={styles.uploadContainer}>
      <div className={styles.uploadHeader}>
        <h2>آپلود نتایج آزمایش</h2>
        <p>فایل PDF یا تصویر نتایج آزمایش خود را آپلود کنید تا به صورت خودکار پردازش شود.</p>
      </div>
      
      {/* File input */}
      <div className={styles.fileUploadSection}>
        {!file ? (
          <label htmlFor="lab-file" className={styles.fileLabel}>
            <span className={styles.fileLabelIcon}>📄</span>
            <span className={styles.fileLabelText}>انتخاب فایل آزمایش</span>
            <input 
              type="file" 
              id="lab-file" 
              accept=".pdf,.png,.jpg,.jpeg" 
              onChange={handleFileChange} 
              className={styles.fileInput} 
              ref={fileInputRef}
              disabled={isUploading}
            />
          </label>
        ) : (
          <div className={styles.fileInfo}>
            <div className={styles.fileName}>
              <span className={styles.fileIcon}>📄</span> {file.name}
            </div>
            <button 
              className={styles.clearButton} 
              onClick={clearFile}
              disabled={isUploading}
            >
              حذف
            </button>
          </div>
        )}
      </div>
      
      {file && (
        <div className={styles.uploadActions}>
          <button 
            className={styles.uploadButton} 
            onClick={handleFileClick}
            disabled={isUploading}
          >
            {isUploading ? (
              <>
                <span>در حال پردازش...</span>
                <div className={styles.spinner}></div>
              </>
            ) : (
              'استخراج اطلاعات'
            )}
          </button>
        </div>
      )}
      
      {processingStatus && (
        <div className={styles.statusMessage}>
          {processingStatus}
          {isUploading && <div className={styles.spinner}></div>}
        </div>
      )}
      
      {uploadError && (
        <div className={styles.errorMessage}>{uploadError}</div>
      )}
      
      {/* Show extracted results for review if available */}
      {extractedResults.length > 0 && (
        <div className={styles.extractedData}>
          <h4>نتایج استخراج شده</h4>
          
          {/* Navigation controls for multiple results */}
          {extractedResults.length > 1 && (
            <div className={styles.testNavigation}>
              <button 
                className={styles.navButton}
                onClick={() => handleNavigation('prev')}
                disabled={currentResultIndex === 0}
              >
                قبلی
              </button>
              <span className={styles.testCounter}>
                {currentResultIndex + 1} از {extractedResults.length}
              </span>
              <button 
                className={styles.navButton}
                onClick={() => handleNavigation('next')}
                disabled={currentResultIndex === extractedResults.length - 1}
              >
                بعدی
              </button>
            </div>
          )}
          
          {/* Current result */}
          <div className={styles.resultPreview}>
            <div className={styles.resultPreviewItem}>
              <div className={styles.resultLabel}>نوع آزمایش:</div>
              <div className={styles.resultValue}>{extractedResults[currentResultIndex].testName}</div>
            </div>
            <div className={styles.resultPreviewItem}>
              <div className={styles.resultLabel}>مقدار:</div>
              <div className={styles.resultValue}>{extractedResults[currentResultIndex].value}</div>
            </div>
            {extractedResults[currentResultIndex].unit && (
              <div className={styles.resultPreviewItem}>
                <div className={styles.resultLabel}>واحد:</div>
                <div className={styles.resultValue}>{extractedResults[currentResultIndex].unit}</div>
              </div>
            )}
            {extractedResults[currentResultIndex].normalRange && (
              <div className={styles.resultPreviewItem}>
                <div className={styles.resultLabel}>محدوده نرمال:</div>
                <div className={styles.resultValue}>{extractedResults[currentResultIndex].normalRange}</div>
              </div>
            )}
            {extractedResults[currentResultIndex].date && (
              <div className={styles.resultPreviewItem}>
                <div className={styles.resultLabel}>تاریخ:</div>
                <div className={styles.resultValue}>{extractedResults[currentResultIndex].date}</div>
              </div>
            )}
          </div>
          
          {/* Actions for extracted results */}
          <div className={styles.formActions}>
            <button 
              className={styles.submitButton}
              onClick={submitExtractedResults}
            >
              ذخیره نتایج
            </button>
            <button 
              className={styles.cancelButton}
              onClick={onCancel}
            >
              انصراف
            </button>
          </div>
        </div>
      )}
      
      {!isUploading && !extractedResults.length && (
        <div className={styles.formActions}>
          <button 
            className={styles.cancelButton}
            onClick={onCancel}
          >
            انصراف
          </button>
        </div>
      )}
    </div>
  );
}

export default LabResultUpload; 