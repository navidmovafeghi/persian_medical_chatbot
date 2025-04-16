import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import { NextResponse } from 'next/server';

const MODEL_NAME = "gemini-1.5-flash"; // Or your preferred model

export async function POST(request: Request) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
  }

  try {
    const body = await request.json();
    const userMessage = body.message;

    if (!userMessage) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });

    const generationConfig = {
      temperature: 0.8, // Adjust creativity (0-1)
      topK: 1,
      topP: 1,
      maxOutputTokens: 2048, // Adjust response length limit
    };

    // Basic safety settings - adjust as needed for medical context
    const safetySettings = [
      {
        category: HarmCategory.HARM_CATEGORY_HARASSMENT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
    ];

    // Consider adding conversation history here for better context
    // Add system instructions for Persian context
    const systemInstruction = "شما یک ربات چت پزشکی مفید هستید که به زبان فارسی پاسخ می دهید."; // "You are a helpful medical chatbot that responds in Persian."
    
    const contents = [
        { 
            role: "user", 
            parts: [
                {text: systemInstruction}, // Add system instruction before user message
                {text: userMessage}
            ]
        }
        // If managing history, add previous messages here
    ];

    const result = await model.generateContent({
      contents: contents, // Use the updated contents array
      generationConfig,
      safetySettings,
    });

    if (result.response) {
      const botResponse = result.response.text();
      return NextResponse.json({ response: botResponse });
    } else {
      // Handle cases where the response might be blocked due to safety settings
      console.error("Gemini API response blocked or empty:", result);
      return NextResponse.json({ error: 'Failed to get response from Gemini. It might have been blocked.' }, { status: 500 });
    }

  } catch (error) {
    console.error("Error calling Gemini API:", error);
    return NextResponse.json({ error: 'Internal server error calling Gemini API' }, { status: 500 });
  }
} 