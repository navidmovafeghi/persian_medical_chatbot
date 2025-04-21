import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { writeFile, readFile } from 'fs/promises';
import { join } from 'path';
import { mkdir } from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { existsSync } from 'fs';
import { PrismaClient } from '@prisma/client';
import PDFParser from 'pdf-parse';

const prisma = new PrismaClient();

// Conditional imports for local development
let pdfjsLib: any;

const isNetlify = process.env.NETLIFY === 'true';
const isLocalDev = process.env.NODE_ENV === 'development';

// Use /tmp directory in serverless environments, local directory otherwise
const getBaseUploadDir = () => {
  return isNetlify ? '/tmp/uploads' : join(process.cwd(), 'uploads');
};

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
function parseLabResults(text: string): any[] {
  const testResults = [];
  console.log('[PARSER] Starting to parse extracted text');
  console.log('[PARSER] Text length:', text.length);
  
  // Replace multiple spaces with single space to normalize text
  const normalizedText = text.replace(/\s+/g, ' ');
  console.log('[PARSER] Normalized text (first 200 chars):', normalizedText.substring(0, 200));
  
  // Split by newlines or potential test boundaries
  const lines = text.split(/\n|\r/);
  console.log('[PARSER] Split into', lines.length, 'lines');
  
  const defaultDate = new Date().toISOString().split('T')[0]; // Fallback date

  // Common lab test abbreviations to specifically look for
  // Expanded to include more common lab tests
  const commonLabTests = [
    'eGFR', 'CRE', 'BUN', 'Na', 'K', 'Cl', 'CO2', 'Cys-C', 'AST', 'ALT', 'ALP', 
    'GGT', 'T-BIL', 'HbA1c', 'WBC', 'RBC', 'HGB', 'HCT', 'PLT', 'TSH', 'CK', 'SEG', 'ST',
    'HDL', 'LDL', 'TC', 'TG', 'CRP', 'ESR', 'Ca', 'Mg', 'P', 'Glu', 'Cr', 'MCH', 'MCHC', 'MCV',
    'T3', 'T4', 'FSH', 'LH'
  ];
  
  // Log each line for debugging
  lines.forEach((line, index) => {
    const trimmedLine = line.trim();
    if (trimmedLine) {
      console.log(`[PARSER] Line ${index}: "${trimmedLine}"`);
    }
  });
  
  const allTests = [];
  
  // Special pattern for exact format in user's image: "TEST_NAME VALUE [H/L] (DATE)"
  // This will match formats like: "eGFR 37.7 (Apr 1)" or "CRE 1.61 H (Apr 1)"
  const specialPattern = /^\s*([A-Za-z0-9\-\.]{1,10})\s+([\d\.]+|\*+)\s*([HL])?\s*\(([^\)]+)\)/;
  
  // Process each line to find tests in the exact format shown in the image
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const match = line.match(specialPattern);
    if (match) {
      const [_, testName, result, flag, dateInfo] = match;
      
      console.log(`[PARSER] Found line-based match: ${testName} = ${result} ${flag || ''} (${dateInfo})`);
      
      allTests.push({
        testName: testName.trim(),
        testDate: dateInfo.trim() || defaultDate,
        result: result.trim(),
        unit: '',
        normalRange: '',
        notes: flag ? `Extracted from uploaded file - ${flag === 'H' ? 'High' : 'Low'} (${flag})` : 'Extracted from uploaded file',
        confidence: 'very high' // Highest confidence for line-based matches
      });
    }
  }
  
  // Create a regexp for exact matching of common lab test abbreviations
  const labTestPattern = new RegExp(
    `\\b(${commonLabTests.join('|')})\\s+([0-9\\.]+|\\*{1,3})\\s*([HL])?\\s*(?:\\(([^)]+)\\))?`, 
    'gi'
  );
  
  // First, try to match common lab test abbreviations specifically
  let matches = [...normalizedText.matchAll(labTestPattern)];
  
  // Process each match
  for (const match of matches) {
    const [fullMatch, testName, result, flag, dateInfo] = match;
    
    if (testName && result) {
      // Process date information
      let testDate = defaultDate;
      if (dateInfo && dateInfo.trim()) {
        testDate = dateInfo.trim();
      }
      
      let notes = 'Extracted from uploaded file';
      if (flag) {
        notes += ` - ${flag === 'H' ? 'High' : 'Low'} (${flag})`;
      }
      
      allTests.push({
        testName: testName.trim(),
        testDate: testDate,
        result: result.trim(),
        unit: '',
        normalRange: '',
        notes: notes,
        confidence: 'high'  // Higher confidence for exact matches
      });
      
      console.log(`[PARSER] Added test with exact match: ${testName} = ${result} ${flag || ''} (${testDate})`);
    }
  }
  
  // Add a more flexible pattern for test name and value
  const flexibleTestPattern = /\b([A-Za-z][A-Za-z0-9\-\.]{0,9})[:\s]+([\d\.]+|\*+)/g;
  matches = [...normalizedText.matchAll(flexibleTestPattern)];
  
  // Process each match - focus on shorter test names that might be abbreviated lab values
  const processedTests = new Set(allTests.map(t => t.testName.toUpperCase()));
  
  for (const match of matches) {
    const [fullMatch, testName, result] = match;
    
    if (testName && result && testName.length <= 5) {
      // Skip if this is a test we already captured or if it's a likely false positive
      if (processedTests.has(testName.toUpperCase()) || /^[0-9]/.test(testName) || testName.length < 1) {
        continue;
      }
      
      allTests.push({
        testName: testName.trim(),
        testDate: defaultDate,
        result: result.trim(),
        unit: '',
        normalRange: '',
        notes: 'Extracted from uploaded file',
        confidence: 'medium' // Medium confidence for flexible matches
      });
      
      console.log(`[PARSER] Added test with flexible match: ${testName} = ${result}`);
      processedTests.add(testName.toUpperCase());
    }
  }
  
  // Fallback pattern for other tests that might not be in our list
  const genericTestPattern = /\b([A-Za-z][A-Za-z0-9\-\.]{1,9})\s+([\d\.]+|\*+)\s*([HL])?\s*(?:\(([^)]*)\))?/g;
  
  // Skip tests we've already processed to avoid duplicates
  matches = [...normalizedText.matchAll(genericTestPattern)];
  for (const match of matches) {
    const [fullMatch, testName, result, flag, dateInfo] = match;
    
    if (testName && result) {
      // Skip if this is a test we already captured in the first pass
      // or if it's a likely false positive
      if (processedTests.has(testName.toUpperCase()) || /^[0-9]/.test(testName) || testName.length < 2) {
        continue;
      }
      
      // Process date information
      let testDate = defaultDate;
      if (dateInfo && dateInfo.trim()) {
        testDate = dateInfo.trim();
      }
      
      let notes = 'Extracted from uploaded file';
      if (flag) {
        notes += ` - ${flag === 'H' ? 'High' : 'Low'} (${flag})`;
      }
      
      allTests.push({
        testName: testName.trim(),
        testDate: testDate,
        result: result.trim(),
        unit: '',
        normalRange: '',
        notes: notes,
        confidence: 'medium' // Medium confidence for generic matches
      });
      
      console.log(`[PARSER] Added test with generic match: ${testName} = ${result} ${flag || ''} (${testDate})`);
      processedTests.add(testName.toUpperCase());
    }
  }
  
  // Return all found tests, sorted by confidence
  testResults.push(...allTests.sort((a, b) => {
    // First sort by confidence
    if (a.confidence === 'very high' && b.confidence !== 'very high') return -1;
    if (a.confidence !== 'very high' && b.confidence === 'very high') return 1;
    if (a.confidence === 'high' && b.confidence !== 'high') return -1;
    if (a.confidence !== 'high' && b.confidence === 'high') return 1;
    
    // Then sort by test name length (shorter test names first as they're more likely lab values)
    return a.testName.length - b.testName.length;
  }));
  
  // Fallback - create a generic entry if no tests found
  if (testResults.length === 0 && text.trim().length > 0) {
    console.log('[PARSER] No specific tests matched. Creating a fallback entry.');
    testResults.push({
      testName: 'Laboratory Data',
      testDate: defaultDate,
      result: '',
      unit: '',
      normalRange: '',
      notes: 'Could not parse specific tests. Please review and enter manually.',
      extractedText: text.substring(0, 500)
    });
  } else {
    console.log(`[PARSER] Total tests parsed: ${testResults.length}`);
  }
  
  // Convert results to the format expected by the client
  const clientResults = testResults.map(result => ({
    testName: result.testName,
    value: result.result,
    unit: result.unit,
    normalRange: result.normalRange,
    date: result.testDate,
    labName: 'Extracted from file'
  }));
  
  return clientResults;
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

export async function POST(request: NextRequest) {
  try {
    console.log('[SERVER] Laboratory upload request received');
    
    // Verify authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      console.log('[SERVER] Authentication failed');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userEmail = session.user.email;
    
    // Find user
    const user = await prisma.user.findUnique({
      where: { email: userEmail },
    });

    if (!user) {
      console.log('[SERVER] User not found:', userEmail);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    console.log('[SERVER] Processing upload for user:', userEmail);
    
    // Get data from the form
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    
    // Get metadata from form
    const testName = formData.get('testName') as string || '';
    const testValue = formData.get('testValue') as string || '';
    const testUnit = formData.get('testUnit') as string || '';
    const referenceRange = formData.get('referenceRange') as string || '';
    
    if (!file) {
      console.log('[SERVER] No file in request');
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }
    
    console.log(`[SERVER] File received: ${file.name}, type: ${file.type}, size: ${file.size} bytes`);
    
    // Simple validation
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      console.log('[SERVER] Invalid file type:', file.type);
      return NextResponse.json({ 
        error: 'Invalid file type', 
        stage: 'validation',
        details: `Only PDF, JPG, and PNG files are supported. Received: ${file.type}`
      }, { status: 400 });
    }
    
    // Create upload directory
    const baseUploadDir = getBaseUploadDir();
    const userUploadDir = join(baseUploadDir, user.id);
    
    try {
      console.log(`[SERVER] Creating upload directory: ${userUploadDir}`);
      await mkdir(userUploadDir, { recursive: true });
    } catch (e) {
      console.error('[SERVER] Failed to create upload directory:', e);
      return NextResponse.json({ 
        error: 'Failed to create upload directory', 
        stage: 'directory_creation',
        details: e instanceof Error ? e.message : String(e)
      }, { status: 500 });
    }
    
    // Save file
    const fileExtension = file.name.split('.').pop() || 'pdf';
    const timestamp = Date.now();
    const filename = `lab_result_${timestamp}.${fileExtension}`;
    const filepath = join(userUploadDir, filename);
    
    try {
      console.log(`[SERVER] Saving file to: ${filepath}`);
      const buffer = Buffer.from(await file.arrayBuffer());
      await writeFile(filepath, buffer);
      console.log('[SERVER] File saved successfully');
    } catch (e) {
      console.error('[SERVER] Failed to save file:', e);
      return NextResponse.json({ 
        error: 'Failed to save file', 
        stage: 'file_saving',
        details: e instanceof Error ? e.message : String(e)
      }, { status: 500 });
    }
    
    // Save to database with the provided metadata
    try {
      const labResult = await prisma.laboratoryData.create({
        data: {
          userId: user.id,
          testName: testName || file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '),
          result: testValue,
          unit: testUnit,
          normalRange: referenceRange,
          testDate: new Date(),
          notes: 'Uploaded from file'
        },
      });
      
      console.log('[SERVER] Lab result saved to database:', labResult.id);
      
      return NextResponse.json({
        success: true,
        message: 'تست آزمایشگاهی با موفقیت ذخیره شد',
        resultId: labResult.id
      });
    } catch (e) {
      console.error('[SERVER] Database error:', e);
      return NextResponse.json({ 
        error: 'Failed to save to database', 
        stage: 'database',
        details: e instanceof Error ? e.message : String(e)
      }, { status: 500 });
    }
    
  } catch (error) {
    console.error('[SERVER] Unhandled error in upload route:', error);
    return NextResponse.json({ 
      error: 'An unexpected error occurred', 
      stage: 'unknown',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}