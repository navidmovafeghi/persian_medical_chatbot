import { NextRequest, NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { mkdir } from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';
import '../../../tesseract-preload'; // Import preload script
import { tesseractWorkerOptions } from '../../../tesseract-preload';

// Dynamic imports to avoid serverless issues
let Tesseract: any;

// Interface for pattern results
interface PatternResults {
  [key: string]: Array<{
    testName: string;
    result: string;
    flag: string;
    raw: string;
  }>;
}

// Function to extract text from images using Tesseract.js (OCR) with detailed debug info
async function extractTextFromImage(filePath: string): Promise<any> {
  try {
    console.log(`[DEBUG_OCR] Starting OCR on image: ${filePath}`);
    
    // Load Tesseract.js
    try {
      Tesseract = await import('tesseract.js');
      console.log('[DEBUG_OCR] Tesseract.js loaded successfully');
    } catch (importError) {
      console.error('[DEBUG_OCR] Error loading Tesseract.js:', importError);
      return { error: `Failed to import Tesseract.js: ${importError instanceof Error ? importError.message : 'Unknown error'}` };
    }
    
    // Check if file exists
    const fs = await import('fs');
    console.log(`[DEBUG_OCR] Checking if file exists: ${filePath}`);
    const fileExists = fs.existsSync(filePath);
    console.log(`[DEBUG_OCR] File exists: ${fileExists}`);
    
    if (!fileExists) {
      return { error: `File not found: ${filePath}` };
    }
    
    // Get file stat to confirm file size
    try {
      const stat = await fs.promises.stat(filePath);
      console.log(`[DEBUG_OCR] File size: ${stat.size} bytes`);
      if (stat.size === 0) {
        return { error: 'File is empty (0 bytes)' };
      }
    } catch (statError) {
      console.error('[DEBUG_OCR] Error checking file stats:', statError);
    }
    
    // Try a simpler approach with the preloaded worker options
    let rawText = '';
    let confidence = 0;
    
    try {
      console.log('[DEBUG_OCR] Creating worker with CDN paths');
      console.log('[DEBUG_OCR] Worker options:', JSON.stringify(tesseractWorkerOptions));
      
      // Use simplified approach with CDN paths
      const { recognize } = Tesseract;
      
      console.log('[DEBUG_OCR] Recognizing image...');
      const result = await recognize(
        filePath,
        'eng',
        {
          logger: m => console.log(`[DEBUG_OCR] ${m.status}: ${Math.round(m.progress * 100)}%`),
          ...tesseractWorkerOptions
        }
      );
      
      console.log('[DEBUG_OCR] Recognition complete');
      rawText = result.data.text || '';
      confidence = result.data.confidence || 0;
      
      // Log a sample of the extracted text
      const textSample = rawText.substring(0, 200).replace(/\n/g, ' ');
      console.log(`[DEBUG_OCR] Text sample: "${textSample}..."`);
    } catch (recognizeError) {
      console.error('[DEBUG_OCR] Error during recognition:', recognizeError);
      return { 
        error: `OCR recognition failed: ${recognizeError instanceof Error ? recognizeError.message : 'Unknown error'}` 
      };
    }
    
    if (rawText.length === 0) {
      console.warn('[DEBUG_OCR] No text was extracted from the image');
      return {
        error: 'No text was extracted from the image. This could be due to image quality, format issues, or OCR limitations.',
        confidence,
        rawText: '',
        lines: []
      };
    }
    
    // Process the extracted text
    const lines = rawText.split('\n');
    console.log(`[DEBUG_OCR] Extracted ${lines.length} lines of text`);
    
    // Try to parse using multiple patterns
    const labTestPatterns = [
      // Pattern 1: Common lab format like "eGFR 37.7 (Apr 1)"
      { 
        name: "Standard Pattern", 
        regex: /\b([A-Za-z0-9\-\.]{1,10})\s+([\d\.]+|\*+)\s*([HL])?\s*(?:\(([^)]*)\))?/g
      },
      // Pattern 2: Simpler pattern for just test name and value
      { 
        name: "Simple Pattern", 
        regex: /\b([A-Za-z0-9\-\.]{1,10})\s+([\d\.]+|\*+)/g
      },
      // Pattern 3: Very flexible pattern
      { 
        name: "Flexible Pattern", 
        regex: /([A-Za-z][A-Za-z0-9\-\.]{0,9})[:\s]+([\d\.]+|\*+)/g
      }
    ];
    
    // Process with each pattern
    const patternResults: PatternResults = {};
    
    for (const pattern of labTestPatterns) {
      const matches = [...rawText.matchAll(pattern.regex)];
      const extractedTests = [];
      
      for (const match of matches) {
        if (match.length >= 3) {
          const testName = match[1].trim();
          const result = match[2].trim();
          const flag = match.length > 3 ? match[3] : '';
          
          // Skip likely false positives
          if (testName.length < 2 || /^[0-9]/.test(testName)) {
            continue;
          }
          
          extractedTests.push({
            testName,
            result,
            flag: flag || '',
            raw: match[0]
          });
        }
      }
      
      patternResults[pattern.name] = extractedTests;
    }
    
    return {
      rawText,
      lines: lines.slice(0, 50).map((line: string) => line.trim()).filter((line: string) => line),
      patternResults,
      confidence
    };
  } catch (error) {
    console.error('[DEBUG_OCR] Error in OCR processing:', error);
    return { 
      error: `Failed to extract text from image: ${error instanceof Error ? error.message : 'Unknown error'}` 
    };
  }
}

export async function POST(req: NextRequest) {
  try {
    console.log('[DEBUG_OCR] Starting debug OCR processing');
    
    // Set up temp directory
    const cwd = process.cwd();
    const tmpDir = join(cwd, 'tmp');
    
    // Ensure tmp directory exists
    const fs = await import('fs');
    if (!fs.existsSync(tmpDir)) {
      await mkdir(tmpDir, { recursive: true });
    }
    
    const uploadDir = join(tmpDir, 'debug-ocr');
    if (!fs.existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }
    
    // Get form data
    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }
    
    console.log(`[DEBUG_OCR] File received: ${file.name}, type: ${file.type}, size: ${file.size} bytes`);
    
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ 
        error: 'Only image files are supported for debug OCR (jpg, png, etc)' 
      }, { status: 400 });
    }
    
    // Save file to disk
    const filename = `${uuidv4()}-${file.name}`;
    const filePath = join(uploadDir, filename);
    console.log(`[DEBUG_OCR] Saving file to: ${filePath}`);
    
    // Convert file to buffer and save to disk
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);
    console.log(`[DEBUG_OCR] File saved successfully`);
    
    // Process with OCR
    const extractionResult = await extractTextFromImage(filePath);
    
    // Clean up the file
    try {
      await fs.promises.unlink(filePath);
      console.log(`[DEBUG_OCR] Temporary file removed`);
    } catch (cleanupError) {
      console.warn(`[DEBUG_OCR] Failed to remove temporary file:`, cleanupError);
    }
    
    return NextResponse.json({
      success: true,
      result: extractionResult
    });
  } catch (error) {
    console.error('[DEBUG_OCR] Error:', error);
    
    return NextResponse.json(
      { 
        error: 'Error in debug OCR processing',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 