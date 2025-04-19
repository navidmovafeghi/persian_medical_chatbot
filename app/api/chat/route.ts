import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";

const MODEL_NAME = "gemini-1.5-flash"; // Or your preferred model

// Define an interface for the UserProfile type
interface UserProfile {
  id: string;
  userId: string;
  medicalHistory: string | null;
  drugHistory: string | null;
  allergies: string | null;
  bloodType: string | null;
  height: number | null;
  weight: number | null;
  dateOfBirth: Date | null;
  gender: string | null;
  emergencyContact: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export async function POST(request: Request) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
  }

  try {
    // Get the user session to identify the user
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    const body = await request.json();
    const userMessage = body.message;

    if (!userMessage) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // Fetch user profile if the user is logged in
    let userProfile: UserProfile | null = null;
    if (userId) {
      userProfile = await prisma.userProfile.findUnique({
        where: { userId },
      }) as UserProfile | null;
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

    // Create a system instruction including user profile data if available
    let systemInstruction = "شما یک ربات چت پزشکی مفید هستید که به زبان فارسی پاسخ می دهید."; // "You are a helpful medical chatbot that responds in Persian."
    
    // Add user profile information to the system instruction if available
    if (userProfile) {
      systemInstruction += "\n\nاطلاعات پزشکی کاربر:\n";
      
      if (userProfile.medicalHistory) {
        systemInstruction += `سابقه پزشکی: ${userProfile.medicalHistory}\n`;
      }
      
      if (userProfile.drugHistory) {
        systemInstruction += `داروهای مصرفی: ${userProfile.drugHistory}\n`;
      }
      
      if (userProfile.allergies) {
        systemInstruction += `حساسیت‌ها: ${userProfile.allergies}\n`;
      }
      
      if (userProfile.bloodType) {
        systemInstruction += `گروه خونی: ${userProfile.bloodType}\n`;
      }
      
      if (userProfile.gender) {
        systemInstruction += `جنسیت: ${userProfile.gender}\n`;
      }
      
      if (userProfile.height) {
        systemInstruction += `قد: ${userProfile.height} سانتی‌متر\n`;
      }
      
      if (userProfile.weight) {
        systemInstruction += `وزن: ${userProfile.weight} کیلوگرم\n`;
      }
      
      if (userProfile.dateOfBirth) {
        const birthDate = new Date(userProfile.dateOfBirth);
        const age = Math.floor((new Date().getTime() - birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
        systemInstruction += `سن: ${age} سال\n`;
      }
      
      systemInstruction += "\nلطفاً این اطلاعات را در نظر بگیرید و پاسخ‌های خود را بر اساس آن‌ها تنظیم کنید، اما از اشاره مستقیم به این داده‌ها در پاسخ خودداری کنید مگر اینکه مرتبط با سوال باشد.";
    } else {
      systemInstruction += "\n\nهیچ اطلاعات پزشکی خاصی برای این کاربر در دسترس نیست.";
    }
    
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