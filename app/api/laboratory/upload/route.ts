import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { mkdir } from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';

// Function to extract text from images using Tesseract.js (OCR)
// Note: In a real implementation, you would need to install and import Tesseract.js
// and possibly other libraries for PDF parsing
async function extractTextFromImage(filePath: string): Promise<string> {
  // In a real implementation, you would use Tesseract.js to extract text
  // For demo purposes, we're returning mock text
  return `
CBC (Complete Blood Count)
Date: 2023-07-15
Patient: John Doe
Doctor: Dr. Smith

Results:
Hemoglobin (Hgb): 14.5 g/dL (Normal Range: 13.5-17.5 g/dL)
White Blood Cells (WBC): 7.8 x10^9/L (Normal Range: 4.5-11.0 x10^9/L)
Platelets: 250 x10^9/L (Normal Range: 150-450 x10^9/L)
  `;
}

// Function to parse PDF
// Note: In a real implementation, you would need to install and import pdf.js or similar
async function extractTextFromPDF(filePath: string): Promise<string> {
  // In a real implementation, you would use a PDF parsing library
  // For demo purposes, we're returning mock text
  return `
CBC (Complete Blood Count)
Date: 2023-07-15
Patient: John Doe
Doctor: Dr. Smith

Results:
Hemoglobin (Hgb): 14.5 g/dL (Normal Range: 13.5-17.5 g/dL)
White Blood Cells (WBC): 7.8 x10^9/L (Normal Range: 4.5-11.0 x10^9/L)
Platelets: 250 x10^9/L (Normal Range: 150-450 x10^9/L)
  `;
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
  try {
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
    
    // Create temp directory if it doesn't exist
    const uploadDir = join(process.cwd(), 'tmp', 'uploads');
    await mkdir(uploadDir, { recursive: true });
    
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
      { error: 'Error processing lab result file' },
      { status: 500 }
    );
  }
} 