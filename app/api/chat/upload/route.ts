import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';
import { GoogleGenerativeAI } from '@google/generative-ai';

const MODEL_NAME = "gemini-1.5-pro";
// Use the provided API key directly
const API_KEY = "AIzaSyDQIcvMhQ6ieUySiDg7McBvmP4nqsT-eeU";

// Note: Next.js App Router doesn't use this config
// export const config = {
//   api: {
//     bodyParser: false,
//   },
// };

export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    
    if (!userId) {
      return NextResponse.json({ error: 'User must be logged in to upload files' }, { status: 401 });
    }
    
    // Verify user exists in database
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    // Get form data
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as string;
    let conversationId = formData.get('conversationId') as string;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }
    
    if (!type || type !== 'lab_results') {
      return NextResponse.json({ error: 'Invalid file type' }, { status: 400 });
    }
    
    // Generate a new conversation ID if not provided
    if (!conversationId) {
      conversationId = uuidv4();
    }
    
    // Save the upload message to the conversation
    const uploadMessage = await prisma.chatMessage.create({
      data: {
        text: `آپلود نتایج آزمایش: ${file.name}`,
        sender: 'user',
        user: {
          connect: {
            id: userId
          }
        },
        conversationId
      }
    });
    
    // Process the file with Google Gemini API
    let extractedData: any[] = [];
    
    if (file.type.startsWith('image/') || file.type === 'application/pdf') {
      try {
        // Convert file to base64
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const fileBase64 = buffer.toString('base64');
        
        console.log(`Processing file of type ${file.type} and size ${buffer.length} bytes`);
        
        // Extract lab results using AI
        extractedData = await extractLabResultsWithAI(fileBase64, file.type);
      } catch (error) {
        console.error('Error processing file with AI:', error);
        // Create a detailed error message in the conversation
        const errorMessage = await prisma.chatMessage.create({
          data: {
            text: `خطا در پردازش فایل: ${error instanceof Error ? error.message : 'خطای ناشناخته'}`,
            sender: 'bot',
            user: {
              connect: {
                id: userId
              }
            },
            conversationId
          }
        });
        return NextResponse.json({ 
          error: 'Error processing file with AI', 
          details: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
      }
    } else {
      return NextResponse.json({ error: 'Unsupported file type' }, { status: 400 });
    }
    
    // Handle the extracted data
    if (extractedData.length > 0) {
      // Format the lab results for display
      const formattedResults = extractedData.map((result: any) => 
        `${result.testName}: ${result.value}${result.unit ? ' ' + result.unit : ''}`
      ).join('\n');
      
      // Create a response message with buttons instead of a text prompt
      const botResponseText = `نتایج آزمایش زیر از فایل شما استخراج شد:\n\n${formattedResults}\n\n<div class="lab-result-actions">
<button class="action-button save-results" data-action="save-lab-results">ذخیره نتایج</button>
<button class="action-button discard-results" data-action="discard-lab-results">انصراف</button>
</div>`;
      
      // Instead of using metadata field, we'll include an identifier in the text itself
      // and store the data in a global variable or database table later if needed
      
      try {
        // Save the bot response without using the metadata field
        await prisma.chatMessage.create({
          data: {
            text: botResponseText,
            sender: 'bot',
            user: {
              connect: {
                id: userId
              }
            },
            conversationId
          }
        });
        
        return NextResponse.json({
          response: botResponseText,
          conversationId,
          labResultsDetected: true,
          extractedData
        });
      } catch (dbError) {
        console.error('Error saving bot message to database:', dbError);
        return NextResponse.json({ 
          error: 'Error saving results to database', 
          details: dbError instanceof Error ? dbError.message : String(dbError)
        }, { status: 500 });
      }
    } else {
      // No lab results found
      const noResultsMessage = 'متاسفانه نتوانستم نتایج آزمایش را از فایل شما استخراج کنم. لطفاً فایل با کیفیت بهتر آپلود کنید یا نتایج را به صورت متنی وارد کنید.';
      
      try {
        await prisma.chatMessage.create({
          data: {
            text: noResultsMessage,
            sender: 'bot',
            user: {
              connect: {
                id: userId
              }
            },
            conversationId
          }
        });
        
        return NextResponse.json({
          response: noResultsMessage,
          conversationId,
          labResultsDetected: false
        });
      } catch (dbError) {
        console.error('Error saving no results message to database:', dbError);
        return NextResponse.json({ 
          error: 'Error saving message to database', 
          details: dbError instanceof Error ? dbError.message : String(dbError)
        }, { status: 500 });
      }
    }
  } catch (error) {
    console.error('Error handling file upload:', error);
    return NextResponse.json({ 
      error: 'Error processing file upload', 
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

async function extractLabResultsWithAI(fileBase64: string, mimeType: string) {
  if (!API_KEY) {
    throw new Error('Google AI API key is not configured');
  }
  
  try {
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
    - Pay special attention to Persian lab results format and conventions
    
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
    
    console.log(`Sending request to Gemini API for model: ${MODEL_NAME}`);
    
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
    
    console.log(`Received response from Gemini API, length: ${responseText.length} characters`);
    
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
      console.warn('No valid JSON found in AI response:', responseText);
      return [];
    } catch (error) {
      console.error('Error parsing AI response:', error, responseText);
      return [];
    }
  } catch (error) {
    console.error('Error in Gemini API call:', error);
    throw new Error(`Gemini API error: ${error instanceof Error ? error.message : String(error)}`);
  }
} 