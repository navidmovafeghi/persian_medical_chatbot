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
    const { data: { text } } = await Tesseract.recognize(
      filePath,
      'eng+far', // English + Persian language
      {
        logger: (m: any) => console.log(m)
      }
    );
    return text;
  } catch (error) {
    console.error('Error in OCR processing:', error);
    throw new Error('Failed to extract text from image');
  }
}

// Function to parse PDF
async function extractTextFromPDF(filePath: string): Promise<string> {
  try {
    const data = await readFile(filePath);
    const loadingTask = pdfjsLib.getDocument({ data });
    const pdf = await loadingTask.promise;
    
    let fullText = '';
    
    // Extract text from each page
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item: any) => item.str).join(' ');
      fullText += pageText + '\n';
    }
    
    return fullText;
  } catch (error) {
    console.error('Error in PDF processing:', error);
    throw new Error('Failed to extract text from PDF');
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
  
  try {
    // Ensure that an upload directory exists
    try {
      // Get absolute path to the upload directory
      const cwd = process.cwd();
      console.log(`Current working directory: ${cwd}`);
      
      // First try tmp directory
      const tmpDir = join(cwd, 'tmp');
      console.log(`Ensuring tmp directory exists at: ${tmpDir}`);
      await mkdir(tmpDir, { recursive: true });
      
      uploadDir = join(tmpDir, 'uploads');
      console.log(`Ensuring uploads directory exists at: ${uploadDir}`);
      await mkdir(uploadDir, { recursive: true });
      
      // Verify directories exist
      const fs = await import('fs');
      const uploadExists = fs.existsSync(uploadDir);
      
      if (!uploadExists) {
        throw new Error(`Failed to create or verify upload directory at ${uploadDir}`);
      }
      
      console.log(`Successfully created/verified upload directory at: ${uploadDir}`);
    } catch (tmpDirError) {
      console.warn('Failed to use tmp directory, trying public directory fallback:', tmpDirError);
      
      try {
        // Fallback to the public directory which should be writable
        const publicDir = join(process.cwd(), 'public');
        const publicUploadsDir = join(publicDir, 'uploads');
        console.log(`Trying fallback directory at: ${publicUploadsDir}`);
        
        await mkdir(publicUploadsDir, { recursive: true });
        
        // Verify directory exists
        const fs = await import('fs');
        const uploadExists = fs.existsSync(publicUploadsDir);
        
        if (!uploadExists) {
          throw new Error(`Failed to create fallback directory at ${publicUploadsDir}`);
        }
        
        uploadDir = publicUploadsDir;
        console.log(`Successfully created/verified fallback upload directory at: ${uploadDir}`);
      } catch (fallbackError: any) {
        console.error('Error creating fallback directory:', fallbackError);
        throw new Error(`Failed to create any upload directory: ${fallbackError.message}`);
      }
    }

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get form data
    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }
    
    // Generate a unique filename
    const filename = `${uuidv4()}-${file.name}`;
    const filePath = join(uploadDir, filename);
    
    // Convert file to buffer and save to disk
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);
    
    // Extract text based on file type
    let extractedText = '';
    if (file.type === 'application/pdf') {
      extractedText = await extractTextFromPDF(filePath);
    } else if (file.type.startsWith('image/')) {
      extractedText = await extractTextFromImage(filePath);
    } else {
      return NextResponse.json({ error: 'Unsupported file type' }, { status: 400 });
    }
    
    // Parse the extracted text to structured data
    const extractedData = parseLabResults(extractedText);
    
    return NextResponse.json({
      success: true,
      extractedText,
      extractedData,
    });
  } catch (error) {
    console.error('Error processing lab result file:', error);
    return NextResponse.json(
      { 
        error: 'Error processing lab result file',
        details: error instanceof Error ? error.message : 'Unknown error',
        path: uploadDir || join(process.cwd(), 'tmp', 'uploads'),
        cwd: process.cwd()
      },
      { status: 500 }
    );
  }
} 