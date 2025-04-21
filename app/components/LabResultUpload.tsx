'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import styles from '../profile/profile.module.css';
import { createTesseractWorker } from '../tesseract-preload';

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
  const [isProcessingLocally, setIsProcessingLocally] = useState(false);
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
    
    // Split text by lines to process each line
    const lines = text.split('\n');
    
    let currentTest: Partial<ExtractedData> = {};
    
    for (const line of lines) {
      // Skip empty lines
      if (!line.trim()) continue;
      
      // Check for test name pattern (typically starts with alphabetic characters)
      if (/[a-zA-Z\u0600-\u06FF]{2,}/.test(line) && !line.includes(':')) {
        // If we have a partial test record, save it before starting a new one
        if (currentTest.testName) {
          results.push({
            testName: currentTest.testName || 'Unknown Test',
            value: currentTest.value || '',
            unit: currentTest.unit || '',
            normalRange: currentTest.normalRange || '',
            date: new Date().toISOString().split('T')[0],
            labName: 'Extracted from file'
          });
        }
        
        // Start a new test
        currentTest = { testName: line.trim() };
      }
      
      // Check for value pattern (typically numeric)
      else if (/[0-9]/.test(line) && !currentTest.value) {
        currentTest.value = line.trim();
      }
      
      // Check for unit pattern (typically short text after value)
      else if (!currentTest.unit && currentTest.value) {
        currentTest.unit = line.trim();
      }
      
      // Check for reference range pattern
      else if (!currentTest.normalRange && line.toLowerCase().includes('normal') || 
               line.includes('reference') || 
               line.includes('range') || 
               line.includes('مرجع') || 
               line.includes('نرمال')) {
        currentTest.normalRange = line.trim();
      }
    }
    
    // Don't forget to add the last test if it exists
    if (currentTest.testName) {
      results.push({
        testName: currentTest.testName || 'Unknown Test',
        value: currentTest.value || '',
        unit: currentTest.unit || '',
        normalRange: currentTest.normalRange || '',
        date: new Date().toISOString().split('T')[0],
        labName: 'Extracted from file'
      });
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
    
    console.log('Parsed results:', results);
    return results;
  };

  const processFileLocally = async (file: File) => {
    if (!file) return;
    
    setIsProcessingLocally(true);
    setProcessingStatus('Initializing OCR engine...');
    
    try {
      const worker = await createTesseractWorker('fas', (m) => {
        if (m.status === 'recognizing text') {
          setProcessingStatus(`Processing: ${Math.floor(m.progress * 100)}%`);
        } else {
          setProcessingStatus(`${m.status}...`);
        }
      });
      
      setProcessingStatus('Reading file...');
      
      // Get file as base64
      const reader = new FileReader();
      const fileDataPromise = new Promise<string>((resolve) => {
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });
      
      const fileData = await fileDataPromise;
      
      setProcessingStatus('Recognizing text...');
      const { data } = await worker.recognize(fileData);
      
      setProcessingStatus('Analyzing results...');
      const extractedData = parseExtractedText(data.text);
      setExtractedResults(extractedData);
      
      setProcessingStatus('Processing complete!');
      toast.success('استخراج اطلاعات با موفقیت انجام شد');
      await worker.terminate();
    } catch (error) {
      console.error('Error processing file locally:', error);
      setUploadError(`Error processing file: ${error instanceof Error ? error.message : String(error)}`);
      setProcessingStatus('');
      toast.error('خطا در پردازش فایل');
    } finally {
      setIsProcessingLocally(false);
    }
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
      processFileLocally(file);
    }
  }, [file]);

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

  return (
    <div className={styles.formSection}>
      <h3>آپلود نتایج آزمایش</h3>
      
      <div className={styles.formGroup}>
        <label htmlFor="lab-file">انتخاب فایل PDF یا تصویر آزمایش:</label>
        <input
          type="file"
          id="lab-file"
          ref={fileInputRef}
          accept=".pdf,.jpg,.jpeg,.png"
          onChange={handleFileChange}
          disabled={isUploading || isProcessingLocally}
          className={styles.fileInput}
        />
        
        {file && (
          <div className={styles.fileInfo}>
            <p>فایل انتخاب شده: {file.name}</p>
            <button 
              type="button" 
              onClick={clearFile}
              className={styles.clearButton}
              disabled={isUploading || isProcessingLocally}
            >
              پاک کردن
            </button>
          </div>
        )}
      </div>
      
      {processingStatus && (
        <div className={styles.statusMessage}>
          <p>{processingStatus}</p>
        </div>
      )}
      
      {uploadError && (
        <div className={styles.errorMessage}>
          <p>{uploadError}</p>
        </div>
      )}
      
      {extractedResults.length > 0 && (
        <div className={styles.extractedData}>
          <h4>اطلاعات استخراج شده:</h4>
          
          {extractedResults.length > 1 && (
            <div className={styles.testNavigation}>
              <button 
                onClick={() => handleNavigation('prev')}
                disabled={currentResultIndex === 0}
                className={styles.navButton}
              >
                قبلی
              </button>
              
              <span className={styles.testCounter}>
                {currentResultIndex + 1} از {extractedResults.length}
              </span>
              
              <button 
                onClick={() => handleNavigation('next')}
                disabled={currentResultIndex === extractedResults.length - 1}
                className={styles.navButton}
              >
                بعدی
              </button>
            </div>
          )}
          
          <div className={styles.resultPreview}>
            <p><strong>نام آزمایش:</strong> {extractedResults[currentResultIndex].testName}</p>
            <p><strong>مقدار:</strong> {extractedResults[currentResultIndex].value}</p>
            <p><strong>واحد:</strong> {extractedResults[currentResultIndex].unit}</p>
            <p><strong>محدوده مرجع:</strong> {extractedResults[currentResultIndex].normalRange}</p>
          </div>
          
          <div className={styles.formActions}>
            <button
              type="button"
              onClick={submitExtractedResults}
              disabled={isProcessingLocally || !validateResults()}
              className={styles.submitButton}
            >
              {extractedResults.length > 1 ? `ذخیره ${extractedResults.length} نتیجه آزمایش` : 'ذخیره نتیجه آزمایش'}
            </button>
            
            <button
              type="button"
              onClick={onCancel}
              className={styles.cancelButton}
            >
              انصراف
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LabResultUpload; 