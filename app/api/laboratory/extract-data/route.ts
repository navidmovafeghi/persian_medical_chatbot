import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { GoogleGenerativeAI } from '@google/generative-ai';

const MODEL_NAME = "gemini-1.5-pro";
// Use the provided API key directly
const API_KEY = "AIzaSyDQIcvMhQ6ieUySiDg7McBvmP4nqsT-eeU";

interface LabTest {
  testName: string;
  value: string;
  unit: string;
  normalRange: string;
  date?: string;
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }
    
    const fileBytes = await file.arrayBuffer();
    const buffer = Buffer.from(fileBytes);
    const fileBase64 = buffer.toString('base64');
    
    // Use Google Gemini API for document parsing
    const results = await extractLabResultsWithAI(fileBase64, file.type);
    
    return NextResponse.json({ results });
  } catch (error) {
    console.error('Error processing laboratory data extraction:', error);
    return NextResponse.json(
      { error: 'Failed to process laboratory data' },
      { status: 500 }
    );
  }
}

async function extractLabResultsWithAI(fileBase64: string, mimeType: string) {
  if (!API_KEY) {
    throw new Error('Google AI API key is not configured');
  }
  
  const genAI = new GoogleGenerativeAI(API_KEY);
  const model = genAI.getGenerativeModel({ model: MODEL_NAME });
  
  // Set up the prompt to extract lab results
  const prompt = `
  You are a medical document parser specialized in extracting laboratory test results.
  
  Analyze the provided lab report image/document and extract all laboratory test results in the following structured format:
  
  For each test found, extract:
  1. testName: The standardized name or abbreviation of the test (e.g., K for Potassium)
  2. value: The numeric result value
  3. unit: The unit of measurement (e.g., mg/dL)
  4. normalRange: The reference range, if available
  5. date: The test date in YYYY-MM-DD format, if found in the document
  
  Return the results as a JSON array of test objects.
  
  Important guidelines:
  - Focus on common lab tests like: CBC (Complete Blood Count), Electrolytes (Na, K, Cl), Liver Function (ALT, AST, ALP), Lipid Panel (HDL, LDL), Blood Sugar (FBS, HbA1c), etc.
  - Standardize test names to common abbreviations when possible (K for Potassium, Na for Sodium, etc.)
  - If a test name appears in Persian and English, use the English abbreviation
  - Extract the date of the test if available
  - If you're not confident about a test, skip it
  
  For example, the output should look like:
  [
    {
      "testName": "K",
      "value": "4.2",
      "unit": "mmol/L",
      "normalRange": "3.5-5.0",
      "date": "2023-08-15"
    },
    {
      "testName": "HbA1c",
      "value": "5.7",
      "unit": "%",
      "normalRange": "4.0-5.6",
      "date": "2023-08-15"
    }
  ]
  `;
  
  // Create content parts
  const imagePart = {
    inlineData: {
      data: fileBase64,
      mimeType
    }
  };
  
  // Generate content with the model
  const result = await model.generateContent({
    contents: [{ role: 'user', parts: [{ text: prompt }, imagePart] }],
    generationConfig: {
      temperature: 0,
      topP: 0.1,
      topK: 16,
      maxOutputTokens: 4096,
    }
  });
  
  const response = result.response;
  const responseText = response.text();
  
  // Try to extract JSON from the response
  try {
    // If the response is already JSON, parse it directly
    if (responseText.trim().startsWith('[') && responseText.trim().endsWith(']')) {
      return JSON.parse(responseText);
    }
    
    // Otherwise, try to extract JSON from the text (handling markdown code blocks)
    const jsonMatch = responseText.match(/\[\s*\{[\s\S]*\}\s*\]/);
    if (jsonMatch) {
      const jsonString = jsonMatch[0].replace(/```json|```/g, '').trim();
      return JSON.parse(jsonString);
    }
    
    // If no JSON was found, return empty array
    console.warn('No valid JSON found in AI response');
    return [];
  } catch (error) {
    console.error('Error parsing AI response:', error, responseText);
    return [];
  }
} 