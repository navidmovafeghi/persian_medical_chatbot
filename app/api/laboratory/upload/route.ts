import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { writeFile, readFile } from 'fs/promises';
import { join } from 'path';
import { mkdir } from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';

// Simple metadata extraction based on filename and file type
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
    processingStage = 'creating_directories';
    
    // In serverless environments, only /tmp is writable
    uploadDir = '/tmp';
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
    
    // Skip saving file to disk and complex processing, just extract basic metadata
    processingStage = 'metadata_extraction';
    const extractedData = extractBasicMetadata(file.name, file.type);
    console.log('[LAB_UPLOAD] Metadata extraction complete');
    
    return NextResponse.json({
      success: true,
      extractedText: '', // No text extraction in this simplified version
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