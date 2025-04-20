import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { writeFile, readFile } from 'fs/promises';
import { join } from 'path';
import { mkdir } from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';
// @ts-ignore
import * as Tesseract from 'tesseract.js';
// @ts-ignore
import * as pdfjsLib from 'pdfjs-dist';

// Set PDF.js worker path
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

// Function to extract text from images using Tesseract.js (OCR)
async function extractTextFromImage(filePath: string): Promise<string> {
  try {
    console.log(`[OCR] Starting OCR on image: ${filePath}`);
    
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
  // This is a simple implementation.
  // In a real-world scenario, you would use more sophisticated NLP or regex
  // to extract data from different lab result formats
  
  // Extract test name
  const testNameMatch = text.match(/^([A-Za-z\s\(\)]+)/m);
  const testName = testNameMatch ? testNameMatch[1].trim() : '';
  
  // Extract date
  const dateMatch = text.match(/Date:\s*([0-9]{4}-[0-9]{2}-[0-9]{2}|[0-9]{2}\/[0-9]{2}\/[0-9]{4})/);
  const testDate = dateMatch ? dateMatch[1].trim() : '';
  
  // Try to find specific test results
  // This is just an example for hemoglobin; you would expand this for various tests
  const hemoglobinMatch = text.match(/Hemoglobin[\s\(Hgb\)]*:\s*([\d\.]+)\s*([a-zA-Z\/]+)\s*\(Normal Range:\s*([\d\.\-]+)\s*([a-zA-Z\/]+)\)/);
  
  if (hemoglobinMatch) {
    return {
      testName: testName || 'Hemoglobin',
      testDate: testDate,
      // Convert date format if needed
      result: hemoglobinMatch[1],
      unit: hemoglobinMatch[2],
      normalRange: hemoglobinMatch[3] + ' ' + hemoglobinMatch[4],
      notes: 'Automatically extracted from uploaded file',
    };
  }
  
  // If no specific test matched, return basic info
  return {
    testName: testName || 'Lab Test',
    testDate: testDate,
    result: '',
    unit: '',
    normalRange: '',
    notes: 'Please review and enter test results manually. Extraction was incomplete.',
  };
}

export async function POST(req: NextRequest) {
  let uploadDir = '';
  let processingStage = 'initializing';
  
  try {
    // Ensure that an upload directory exists
    try {
      processingStage = 'creating_directories';
      // Check if we're in a serverless environment
      const isServerless = process.env.AWS_LAMBDA_FUNCTION_NAME || 
                          process.env.NETLIFY || 
                          process.env.VERCEL || 
                          process.cwd().includes('/var/task');
      
      console.log(`[LAB_UPLOAD] Environment detection: Serverless=${isServerless}, CWD=${process.cwd()}`);
      
      if (isServerless) {
        // In serverless environments, only /tmp is writable
        console.log('[LAB_UPLOAD] Serverless environment detected, using /tmp directory');
        uploadDir = '/tmp/uploads';
      } else {
        // For local development, use paths relative to CWD
        const cwd = process.cwd();
        console.log(`[LAB_UPLOAD] Local environment, using relative paths from: ${cwd}`);
        uploadDir = join(cwd, 'tmp', 'uploads');
      }
      
      console.log(`[LAB_UPLOAD] Using upload directory: ${uploadDir}`);
      
      // Create the directory if it doesn't exist
      await mkdir(uploadDir, { recursive: true });
      
      // Verify directory exists and is writable
      const fs = await import('fs');
      
      if (!fs.existsSync(uploadDir)) {
        throw new Error(`Failed to create upload directory at ${uploadDir}`);
      }
      
      // Test write permissions by creating a test file
      const testFilePath = join(uploadDir, '.write-test');
      try {
        await writeFile(testFilePath, 'test');
        await fs.promises.unlink(testFilePath);
        console.log(`[LAB_UPLOAD] Directory is writable: ${uploadDir}`);
      } catch (writeError) {
        console.error(`[LAB_UPLOAD] Directory is not writable: ${uploadDir}`, writeError);
        throw new Error(`Directory exists but is not writable: ${uploadDir}`);
      }
      
    } catch (dirError: any) {
      console.warn('[LAB_UPLOAD] Failed to use primary directory, trying fallback:', dirError);
      
      try {
        // Last resort fallback - try /tmp directly if available
        uploadDir = '/tmp';
        console.log(`[LAB_UPLOAD] Trying absolute fallback directory at: ${uploadDir}`);
        
        // Verify directory exists and is writable
        const fs = await import('fs');
        
        // Test write permissions by creating a test file
        const testFilePath = join(uploadDir, '.write-test');
        try {
          await writeFile(testFilePath, 'test');
          await fs.promises.unlink(testFilePath);
          console.log(`[LAB_UPLOAD] Fallback directory is writable: ${uploadDir}`);
        } catch (writeError) {
          console.error(`[LAB_UPLOAD] Fallback directory is not writable: ${uploadDir}`, writeError);
          throw new Error(`Cannot find any writable directory for file uploads`);
        }
      } catch (fallbackError: any) {
        console.error('[LAB_UPLOAD] Error creating fallback directory:', fallbackError);
        throw new Error(`Failed to create any upload directory: ${fallbackError.message}`);
      }
    }

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
    
    // Generate a unique filename
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
    
    // Extract text based on file type
    processingStage = 'text_extraction';
    let extractedText = '';
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
      return NextResponse.json({ error: 'Unsupported file type' }, { status: 400 });
    }
    
    // Parse the extracted text to structured data
    processingStage = 'data_parsing';
    console.log('[LAB_UPLOAD] Parsing extracted text');
    const extractedData = parseLabResults(extractedText);
    console.log('[LAB_UPLOAD] Parsing complete, returning results');
    
    // Clean up the uploaded file
    try {
      await fs.promises.unlink(filePath);
      console.log(`[LAB_UPLOAD] Temporary file removed: ${filePath}`);
    } catch (cleanupError) {
      console.warn(`[LAB_UPLOAD] Failed to remove temporary file: ${filePath}`, cleanupError);
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