import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { writeFile, readFile } from 'fs/promises';
import { join } from 'path';
import { mkdir } from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';

// Conditional imports for local development
let Tesseract: any;
let pdfjsLib: any;

// Function to extract text from images using Tesseract.js (OCR)
async function extractTextFromImage(filePath: string): Promise<string> {
  try {
    console.log(`[OCR] Starting OCR on image: ${filePath}`);
    
    if (!Tesseract) {
      console.log('[OCR] Loading Tesseract.js dynamically');
      Tesseract = await import('tesseract.js');
    }
    
    if (!filePath || typeof filePath !== 'string') {
      throw new Error(`Invalid file path for OCR: ${filePath}`);
    }
    
    // Check if file exists
    const fs = await import('fs');
    if (!fs.existsSync(filePath)) {
      throw new Error(`File does not exist for OCR: ${filePath}`);
    }
    
    console.log(`[OCR] File verified, starting Tesseract recognition`);
    
    // Configure Tesseract worker and logging
    const { data: { text } } = await Tesseract.recognize(
      filePath,
      'eng+far', // English + Persian language
      {
        logger: (m: any) => {
          if (m.status === 'recognizing text') {
            console.log(`[OCR] Recognition progress: ${Math.floor(m.progress * 100)}%`);
          } else {
            console.log(`[OCR] Status: ${m.status}`);
          }
        }
      }
    );
    
    // Log a sample of the extracted text (first 100 chars)
    const textSample = text.substring(0, 100).replace(/\n/g, ' ');
    console.log(`[OCR] Extraction complete. Text sample: "${textSample}..."`);
    
    return text;
  } catch (error) {
    console.error('[OCR] Error in OCR processing:', error);
    throw new Error(`Failed to extract text from image: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Function to parse PDF
async function extractTextFromPDF(filePath: string): Promise<string> {
  try {
    console.log(`[PDF] Starting PDF extraction on: ${filePath}`);
    
    if (!pdfjsLib) {
      console.log('[PDF] Loading PDF.js dynamically');
      pdfjsLib = await import('pdfjs-dist');
      pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
    }
    
    if (!filePath || typeof filePath !== 'string') {
      throw new Error(`Invalid file path for PDF extraction: ${filePath}`);
    }
    
    // Check if file exists
    const fs = await import('fs');
    if (!fs.existsSync(filePath)) {
      throw new Error(`File does not exist for PDF extraction: ${filePath}`);
    }
    
    console.log(`[PDF] File verified, reading file content`);
    const data = await readFile(filePath);
    console.log(`[PDF] File read successful, file size: ${data.length} bytes`);
    
    console.log(`[PDF] Creating PDF document`);
    const loadingTask = pdfjsLib.getDocument({ data });
    const pdf = await loadingTask.promise;
    console.log(`[PDF] PDF loaded successfully, pages: ${pdf.numPages}`);
    
    let fullText = '';
    
    // Extract text from each page
    for (let i = 1; i <= pdf.numPages; i++) {
      console.log(`[PDF] Processing page ${i} of ${pdf.numPages}`);
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item: any) => item.str).join(' ');
      fullText += pageText + '\n';
    }
    
    // Log a sample of the extracted text (first 100 chars)
    const textSample = fullText.substring(0, 100).replace(/\n/g, ' ');
    console.log(`[PDF] Extraction complete. Text sample: "${textSample}..."`);
    
    return fullText;
  } catch (error) {
    console.error('[PDF] Error in PDF processing:', error);
    throw new Error(`Failed to extract text from PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Function to parse the extracted text to structured data
function parseLabResults(text: string) {
  // Extract common metadata
  // Extract date
  const dateMatch = text.match(/Date:\s*([0-9]{4}-[0-9]{2}-[0-9]{2}|[0-9]{2}\/[0-9]{2}\/[0-9]{4})/);
  const testDate = dateMatch ? dateMatch[1].trim() : new Date().toISOString().split('T')[0];
  
  // Initialize an array to hold all test results
  const testResults = [];
  
  // Try to find blood cell count tests
  const cbcTests = [
    { name: 'WBC', regex: /White\s*Blood\s*Cells?|WBC|Leukocytes?[\s\:]*([0-9\.]+)\s*([a-zA-Z\/]+)/ },
    { name: 'RBC', regex: /Red\s*Blood\s*Cells?|RBC|Erythrocytes?[\s\:]*([0-9\.]+)\s*([a-zA-Z\/]+)/ },
    { name: 'Hemoglobin', regex: /Hemoglobin[\s\(Hgb\)]*[\s\:]*([0-9\.]+)\s*([a-zA-Z\/]+)/ },
    { name: 'Hematocrit', regex: /Hematocrit[\s\(Hct\)]*[\s\:]*([0-9\.]+)\s*([a-zA-Z\/\%]+)/ },
    { name: 'Platelets', regex: /Platelets?[\s\:]*([0-9\.]+)\s*([a-zA-Z\/]+)/ }
  ];
  
  // Check for each CBC test
  cbcTests.forEach(test => {
    const match = text.match(test.regex);
    if (match) {
      testResults.push({
        testName: test.name,
        testDate: testDate,
        result: match[1],
        unit: match[2] || '',
        normalRange: '',
        notes: 'Extracted from uploaded file'
      });
    }
  });
  
  // Try to find blood chemistry tests
  const chemistryTests = [
    { name: 'Glucose', regex: /Glucose|Blood\s*Sugar[\s\:]*([0-9\.]+)\s*([a-zA-Z\/]+)/ },
    { name: 'Cholesterol', regex: /Cholesterol[\s\:]*([0-9\.]+)\s*([a-zA-Z\/]+)/ },
    { name: 'Triglycerides', regex: /Triglycerides[\s\:]*([0-9\.]+)\s*([a-zA-Z\/]+)/ },
    { name: 'HDL', regex: /HDL[\s\-]*Cholesterol[\s\:]*([0-9\.]+)\s*([a-zA-Z\/]+)/ },
    { name: 'LDL', regex: /LDL[\s\-]*Cholesterol[\s\:]*([0-9\.]+)\s*([a-zA-Z\/]+)/ }
  ];
  
  // Check for each chemistry test
  chemistryTests.forEach(test => {
    const match = text.match(test.regex);
    if (match) {
      testResults.push({
        testName: test.name,
        testDate: testDate,
        result: match[1],
        unit: match[2] || '',
        normalRange: '',
        notes: 'Extracted from uploaded file'
      });
    }
  });
  
  // Try to find liver function tests
  const liverTests = [
    { name: 'AST', regex: /AST|SGOT[\s\:]*([0-9\.]+)\s*([a-zA-Z\/]+)/ },
    { name: 'ALT', regex: /ALT|SGPT[\s\:]*([0-9\.]+)\s*([a-zA-Z\/]+)/ },
    { name: 'ALP', regex: /Alkaline\s*Phosphatase|ALP[\s\:]*([0-9\.]+)\s*([a-zA-Z\/]+)/ },
    { name: 'Bilirubin', regex: /Bilirubin[\s\:]*([0-9\.]+)\s*([a-zA-Z\/]+)/ }
  ];
  
  // Check for each liver test
  liverTests.forEach(test => {
    const match = text.match(test.regex);
    if (match) {
      testResults.push({
        testName: test.name,
        testDate: testDate,
        result: match[1],
        unit: match[2] || '',
        normalRange: '',
        notes: 'Extracted from uploaded file'
      });
    }
  });
  
  // Try to find kidney function tests
  const kidneyTests = [
    { name: 'Creatinine', regex: /Creatinine[\s\:]*([0-9\.]+)\s*([a-zA-Z\/]+)/ },
    { name: 'BUN', regex: /BUN|Blood\s*Urea\s*Nitrogen[\s\:]*([0-9\.]+)\s*([a-zA-Z\/]+)/ },
    { name: 'Uric Acid', regex: /Uric\s*Acid[\s\:]*([0-9\.]+)\s*([a-zA-Z\/]+)/ }
  ];
  
  // Check for each kidney test
  kidneyTests.forEach(test => {
    const match = text.match(test.regex);
    if (match) {
      testResults.push({
        testName: test.name,
        testDate: testDate,
        result: match[1],
        unit: match[2] || '',
        normalRange: '',
        notes: 'Extracted from uploaded file'
      });
    }
  });
  
  // If no specific tests matched, create a general lab result
  if (testResults.length === 0) {
    // Extract test name (fallback)
    const testNameMatch = text.match(/^([A-Za-z\s\(\)]+)/m);
    const testName = testNameMatch ? testNameMatch[1].trim() : 'Lab Test';
    
    testResults.push({
      testName: testName,
      testDate: testDate,
      result: '',
      unit: '',
      normalRange: '',
      notes: 'Please review and enter test results manually. Extraction was incomplete.',
    });
  }
  
  return testResults;
}

// Simple metadata extraction based on filename and file type for fallback
function extractBasicMetadata(filename: string, fileType: string) {
  // Extract test name from filename (convert dashes/underscores to spaces)
  const testName = filename
    .replace(/\.[^/.]+$/, '') // Remove file extension
    .replace(/[-_]/g, ' ') // Replace dashes and underscores with spaces
    .replace(/\b\w/g, c => c.toUpperCase()); // Capitalize first letter of each word

  // Use current date as test date
  const testDate = new Date().toISOString().split('T')[0];

  return {
    testName,
    testDate,
    result: '',
    unit: '',
    normalRange: '',
    notes: 'Please review and fill in the test results manually.',
  };
}

export async function POST(req: NextRequest) {
  let uploadDir = '';
  let processingStage = 'initializing';
  
  try {
    console.log('[LAB_UPLOAD] Starting upload processing');
    processingStage = 'environment_detection';
    
    // Check if we're in a serverless environment
    const isServerless = process.env.AWS_LAMBDA_FUNCTION_NAME || 
                        process.env.NETLIFY || 
                        process.env.VERCEL || 
                        process.cwd().includes('/var/task');
    
    console.log(`[LAB_UPLOAD] Environment detection: Serverless=${isServerless}, CWD=${process.cwd()}`);
    
    // Choose approach based on environment
    const useAdvancedProcessing = !isServerless;
    console.log(`[LAB_UPLOAD] Using advanced processing: ${useAdvancedProcessing}`);
    
    processingStage = 'creating_directories';
    
    // Set upload directory based on environment
    if (isServerless) {
      uploadDir = '/tmp';
    } else {
      // For local development, use paths relative to CWD
      const cwd = process.cwd();
      const tmpDir = join(cwd, 'tmp');
      
      // Ensure tmp directory exists
      const fs = await import('fs');
      if (!fs.existsSync(tmpDir)) {
        await mkdir(tmpDir, { recursive: true });
      }
      
      uploadDir = join(tmpDir, 'uploads');
      if (!fs.existsSync(uploadDir)) {
        await mkdir(uploadDir, { recursive: true });
      }
    }
    
    console.log(`[LAB_UPLOAD] Using upload directory: ${uploadDir}`);
    
    processingStage = 'auth_check';
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get form data
    processingStage = 'form_data_extraction';
    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }
    
    console.log(`[LAB_UPLOAD] File received: ${file.name}, type: ${file.type}, size: ${file.size} bytes`);
    
    let extractedData;
    let extractedText = '';
    
    if (useAdvancedProcessing) {
      // Advanced processing for local environment
      processingStage = 'file_saving';
      const filename = `${uuidv4()}-${file.name}`;
      const filePath = join(uploadDir, filename);
      console.log(`[LAB_UPLOAD] Saving file to: ${filePath}`);
      
      // Convert file to buffer and save to disk
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      await writeFile(filePath, buffer);
      console.log(`[LAB_UPLOAD] File saved successfully to: ${filePath}`);
      
      // Check if file was actually saved
      const fs = await import('fs');
      if (!fs.existsSync(filePath)) {
        throw new Error(`File was not saved at ${filePath}`);
      }
      
      try {
        // Extract text based on file type
        processingStage = 'text_extraction';
        console.log(`[LAB_UPLOAD] Processing file of type: ${file.type}`);
        
        if (file.type === 'application/pdf') {
          console.log('[LAB_UPLOAD] Starting PDF extraction');
          extractedText = await extractTextFromPDF(filePath);
          console.log('[LAB_UPLOAD] PDF extraction completed');
        } else if (file.type.startsWith('image/')) {
          console.log('[LAB_UPLOAD] Starting OCR extraction');
          extractedText = await extractTextFromImage(filePath);
          console.log('[LAB_UPLOAD] OCR extraction completed');
        } else {
          console.log('[LAB_UPLOAD] Unsupported file type, using basic extraction');
          extractedData = extractBasicMetadata(file.name, file.type);
          return NextResponse.json({
            success: true,
            extractedText: '',
            extractedData,
          });
        }
        
        // Parse the extracted text to structured data
        processingStage = 'data_parsing';
        console.log('[LAB_UPLOAD] Parsing extracted text');
        extractedData = parseLabResults(extractedText);
        console.log('[LAB_UPLOAD] Parsing complete');
        
        // Clean up the uploaded file
        try {
          await fs.promises.unlink(filePath);
          console.log(`[LAB_UPLOAD] Temporary file removed: ${filePath}`);
        } catch (cleanupError) {
          console.warn(`[LAB_UPLOAD] Failed to remove temporary file: ${filePath}`, cleanupError);
        }
      } catch (processingError) {
        console.error('[LAB_UPLOAD] Error in advanced processing, falling back to basic extraction:', processingError);
        extractedData = extractBasicMetadata(file.name, file.type);
        extractedText = '';
      }
    } else {
      // Simple processing for serverless environment
      processingStage = 'metadata_extraction';
      extractedData = extractBasicMetadata(file.name, file.type);
      console.log('[LAB_UPLOAD] Metadata extraction complete');
    }
    
    return NextResponse.json({
      success: true,
      extractedText,
      extractedData,
    });
  } catch (error) {
    console.error(`[LAB_UPLOAD] Error in stage "${processingStage}":`, error);
    
    // Try to get a sample of the extracted text if available
    let errorDetails = '';
    if (error instanceof Error) {
      errorDetails = error.message;
      if (error.stack) {
        console.error('[LAB_UPLOAD] Error stack:', error.stack);
      }
    }
    
    return NextResponse.json(
      { 
        error: 'Error processing lab result file',
        stage: processingStage,
        details: errorDetails,
        path: uploadDir || '/tmp',
        cwd: process.cwd(),
        env: process.env.NODE_ENV,
        serverless: process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.NETLIFY || process.env.VERCEL || false
      },
      { status: 500 }
    );
  }
} 