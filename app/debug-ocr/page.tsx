'use client';

import { useState } from 'react';
import styles from '../profile/profile.module.css';

export default function DebugOCRPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<any>(null);
  const [tesseractStatus, setTesseractStatus] = useState<any>(null);
  const [checkingTesseract, setCheckingTesseract] = useState(false);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!file) {
      setError('Please select a file first');
      return;
    }
    
    if (!file.type.startsWith('image/')) {
      setError('Only image files are supported (jpg, png, etc)');
      return;
    }
    
    setIsProcessing(true);
    setError(null);
    setResults(null);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/laboratory/debug-ocr', {
        method: 'POST',
        body: formData
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Error processing image');
      }
      
      setResults(data.result);
    } catch (error) {
      console.error('Error:', error);
      setError(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      setIsProcessing(false);
    }
  };
  
  const checkTesseractInstallation = async () => {
    setCheckingTesseract(true);
    try {
      const response = await fetch('/api/laboratory/tesseract-check');
      const data = await response.json();
      setTesseractStatus(data);
    } catch (error) {
      console.error('Error checking Tesseract:', error);
      setTesseractStatus({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error checking Tesseract'
      });
    } finally {
      setCheckingTesseract(false);
    }
  };
  
  return (
    <div className={styles.profileContainer}>
      <h1>Lab Result OCR Debugger</h1>
      <p>Upload a lab result image to see detailed OCR extraction results and pattern matching.</p>
      
      <div className={styles.tesseractCheck}>
        <button
          onClick={checkTesseractInstallation}
          disabled={checkingTesseract}
          className={styles.checkButton}
        >
          {checkingTesseract ? 'Checking...' : 'Check Tesseract.js Installation'}
        </button>
        
        {tesseractStatus && (
          <div className={tesseractStatus.success ? styles.successMessage : styles.errorMessage}>
            <h3>Tesseract.js Status</h3>
            {tesseractStatus.success ? (
              <div>
                <p>✅ Tesseract.js is correctly installed and available</p>
                <pre className={styles.codeBlock}>
                  {JSON.stringify(tesseractStatus, null, 2)}
                </pre>
              </div>
            ) : (
              <div>
                <p>❌ Tesseract.js installation issue: {tesseractStatus.error}</p>
                <p>Try running: <code>npm install tesseract.js --save</code> in your project</p>
              </div>
            )}
          </div>
        )}
      </div>
      
      <form onSubmit={handleSubmit} className={styles.labForm}>
        <div className={styles.formGroup}>
          <label className={styles.label}>
            Lab Result Image
          </label>
          <input
            type="file"
            onChange={handleFileChange}
            accept="image/*"
            className={styles.input}
          />
          <p className={styles.uploadHint}>
            For best results use a clear, high-resolution image. JPG or PNG formats work best.
          </p>
        </div>
        
        {error && <div className={styles.errorMessage}>{error}</div>}
        
        <div className={styles.buttonGroup}>
          <button
            type="submit"
            className={styles.saveButton}
            disabled={isProcessing || !file}
          >
            {isProcessing ? 'Processing...' : 'Process Image'}
          </button>
        </div>
      </form>
      
      {results && (
        <div className={styles.debugResults}>
          <h2>OCR Results</h2>
          
          {results.error ? (
            <div className={styles.errorMessage}>
              <h3>Error Occurred</h3>
              <p>{results.error}</p>
              <div className={styles.troubleshootingTips}>
                <h4>Troubleshooting Tips:</h4>
                <ul>
                  <li>Try uploading a clearer image with higher resolution</li>
                  <li>Make sure the image is right-side up</li>
                  <li>Try a different image format (convert to JPG or PNG)</li>
                  <li>Ensure the lab result text is clearly visible and not blurry</li>
                </ul>
              </div>
            </div>
          ) : (
            <>
              <div className={styles.resultSection}>
                <h3>OCR Confidence</h3>
                <p>{results.confidence ? `${Math.round(results.confidence)}%` : 'Not available'}</p>
              </div>
              
              <div className={styles.resultSection}>
                <h3>Extracted Lines</h3>
                <pre className={styles.codeBlock}>
                  {results.lines && results.lines.length > 0 
                    ? results.lines.map((line: string, i: number) => (
                        `${i+1}: ${line}\n`
                      )).join('') 
                    : 'No lines extracted'}
                </pre>
              </div>
              
              <div className={styles.resultSection}>
                <h3>Pattern Matching Results</h3>
                
                {results.patternResults && Object.keys(results.patternResults).length > 0 ? (
                  Object.keys(results.patternResults).map(patternName => (
                    <div key={patternName} className={styles.patternResult}>
                      <h4>{patternName}</h4>
                      <p>Found {results.patternResults[patternName].length} tests</p>
                      
                      {results.patternResults[patternName].length > 0 ? (
                        <table className={styles.resultTable}>
                          <thead>
                            <tr>
                              <th>Test Name</th>
                              <th>Result</th>
                              <th>Flag</th>
                              <th>Raw Match</th>
                            </tr>
                          </thead>
                          <tbody>
                            {results.patternResults[patternName].map((test: any, i: number) => (
                              <tr key={i}>
                                <td>{test.testName}</td>
                                <td>{test.result}</td>
                                <td>{test.flag}</td>
                                <td>{test.raw}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      ) : (
                        <p>No matches found with this pattern</p>
                      )}
                    </div>
                  ))
                ) : (
                  <p>No pattern matches found in the extracted text</p>
                )}
              </div>
              
              <div className={styles.resultSection}>
                <h3>Raw Extracted Text</h3>
                <details>
                  <summary className={styles.detailsSummary}>Show raw text ({results.rawText ? results.rawText.length : 0} characters)</summary>
                  <pre className={styles.codeBlock}>
                    {results.rawText || 'No text extracted'}
                  </pre>
                </details>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
} 