import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";
import { v4 as uuidv4 } from 'uuid';

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

// GET route to retrieve chat history
export async function GET(request: Request) {
  try {
    // Get the user session to identify the user
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json({ error: 'User must be logged in to retrieve chat history' }, { status: 401 });
    }

    // Extract the conversation ID from the URL if provided
    const url = new URL(request.url);
    const conversationId = url.searchParams.get('conversationId');

    // If no conversationId is provided, get all conversation IDs for the user
    if (!conversationId) {
      const conversations = await prisma.chatMessage.findMany({
        where: { userId },
        distinct: ['conversationId'],
        select: { 
          conversationId: true,
          createdAt: true
        },
        orderBy: { createdAt: 'desc' }
      });
      
      return NextResponse.json({ conversations });
    }

    // Get all messages for a specific conversation
    const messages = await prisma.chatMessage.findMany({
      where: {
        userId,
        conversationId
      },
      orderBy: { createdAt: 'asc' }
    });

    return NextResponse.json({ messages });

  } catch (error) {
    console.error("Error retrieving chat history:", error);
    return NextResponse.json({ error: 'Error retrieving chat history' }, { status: 500 });
  }
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
    let conversationId = body.conversationId;

    // Generate a new conversation ID if not provided
    if (!conversationId) {
      conversationId = uuidv4();
    }

    if (!userMessage) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // If we have a userId, check if the user exists in the database
    let userExists = false;
    if (userId) {
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });
      userExists = !!user;
      
      if (!userExists) {
        console.warn(`User with ID ${userId} does not exist in the database. Will use anonymous mode.`);
      }
    }

    // Use null for userId if the user doesn't exist in the database
    const messageUserId = userExists ? userId : null;

    // Check for appointment intent before sending to Gemini
    const appointmentIntent = detectAppointmentIntent(userMessage);
    if (appointmentIntent && userExists && userId) {
      // Save the user message
      await prisma.chatMessage.create({
        data: {
          text: userMessage,
          sender: 'user',
          userId: messageUserId,
          conversationId
        }
      });

      try {
        // Create appointment based on detected information
        const appointment = await prisma.appointment.create({
          data: {
            userId, // Now we've confirmed userId is a string and the user exists
            title: appointmentIntent.title || 'قرار ملاقات پزشکی',
            doctorName: appointmentIntent.doctorName || 'دکتر',
            speciality: appointmentIntent.speciality,
            dateTime: appointmentIntent.dateTime,
            duration: appointmentIntent.duration || 30,
            status: 'scheduled',
          }
        });

        // Create a confirmation message
        const botResponse = `قرار ملاقات شما با موفقیت ثبت شد:
تاریخ: ${new Date(appointment.dateTime).toLocaleDateString('fa-IR')}
زمان: ${new Date(appointment.dateTime).toLocaleTimeString('fa-IR')}
پزشک: ${appointment.doctorName}
${appointment.speciality ? `تخصص: ${appointment.speciality}` : ''}
عنوان: ${appointment.title}
مدت: ${appointment.duration} دقیقه

شما می‌توانید این قرار را در بخش «قرارهای ملاقات» مشاهده و مدیریت کنید.`;

        // Save the bot response
        await prisma.chatMessage.create({
          data: {
            text: botResponse,
            sender: 'bot',
            userId: messageUserId,
            conversationId
          }
        });

        return NextResponse.json({ 
          response: botResponse,
          conversationId,
          appointmentCreated: true,
          appointment
        });
      } catch (error) {
        console.error("Error creating appointment:", error);
        // Continue with normal chat flow if appointment creation fails
      }
    }

    // Save user message to database if we get here
    try {
      await prisma.chatMessage.create({
        data: {
          text: userMessage,
          sender: 'user',
          userId: messageUserId,
          conversationId
        }
      });
    } catch (error) {
      console.warn("Failed to save user message:", error);
      // Continue with chat flow even if saving fails
    }

    // Fetch user profile if the user is logged in and exists
    let userProfile: UserProfile | null = null;
    if (userExists) {
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
    
    // Fetch previous messages for context if user is logged in
    const conversationHistory: Array<{
      role: string;
      parts: Array<{ text: string }>;
    }> = [];
    
    if (userId) {
      const previousMessages = await prisma.chatMessage.findMany({
        where: {
          userId,
          conversationId,
        },
        orderBy: { createdAt: 'asc' },
        take: 10, // Limit to last 10 messages for context
      });
      
      // Convert to format expected by Gemini API
      previousMessages.forEach(msg => {
        conversationHistory.push({
          role: msg.sender === 'user' ? 'user' : 'model',
          parts: [{ text: msg.text }]
        });
      });
    }
    
    // Structure the chat for Gemini
    const contents = [
      { 
        role: "user", 
        parts: [{ text: systemInstruction }]
      }
    ];
    
    // Add conversation history if available
    if (conversationHistory.length > 0) {
      contents.push(...conversationHistory);
    }
    
    // Add current user message
    contents.push({
      role: "user",
      parts: [{ text: userMessage }]
    });

    const result = await model.generateContent({
      contents: contents,
      generationConfig,
      safetySettings,
    });

    if (result.response) {
      const botResponse = result.response.text();
      
      // Save bot response to database
      try {
        await prisma.chatMessage.create({
          data: {
            text: botResponse,
            sender: 'bot',
            userId: messageUserId,
            conversationId
          }
        });
      } catch (error) {
        console.warn("Failed to save bot response:", error);
        // Continue anyway to return response to user
      }
      
      return NextResponse.json({ 
        response: botResponse,
        conversationId // Return the conversation ID for the client to use
      });
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

/**
 * Detects appointment intent in a user message
 * @param message The user message to analyze
 * @returns Appointment data if intent detected, null otherwise
 */
function detectAppointmentIntent(message: string): {
  title?: string;
  doctorName?: string;
  speciality?: string;
  dateTime: Date;
  duration?: number;
} | null {
  // Persian date/time patterns
  const datePatterns = [
    // Match dates like "فردا" (tomorrow)
    { regex: /فردا/i, handler: () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(10, 0, 0, 0); // Default to 10 AM
      return tomorrow;
    }},
    // Match dates like "پس فردا" (day after tomorrow)
    { regex: /پس ?فردا/i, handler: () => {
      const dayAfterTomorrow = new Date();
      dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
      dayAfterTomorrow.setHours(10, 0, 0, 0); // Default to 10 AM
      return dayAfterTomorrow;
    }},
    // Match specific Persian dates (needs more robust implementation)
    { regex: /(\d{1,2})\s?(شهریور|مهر|آبان|آذر|دی|بهمن|اسفند|فروردین|اردیبهشت|خرداد|تیر|مرداد)/i, 
      handler: (matches: RegExpMatchArray) => {
      const day = parseInt(matches[1]);
      const persianMonths: Record<string, number> = {
        'فروردین': 0, 'اردیبهشت': 1, 'خرداد': 2, 'تیر': 3, 
        'مرداد': 4, 'شهریور': 5, 'مهر': 6, 'آبان': 7, 
        'آذر': 8, 'دی': 9, 'بهمن': 10, 'اسفند': 11
      };
      
      const monthName = matches[2] as string;
      const month = persianMonths[monthName];
      if (month === undefined || day < 1 || day > 31) return null;
      
      // This is a simplified conversion and needs a proper Persian calendar library
      // for accurate conversion in a production environment
      const date = new Date();
      date.setMonth(month);
      date.setDate(day);
      date.setHours(10, 0, 0, 0); // Default to 10 AM
      
      // If the date is in the past, assume it's for next year
      if (date < new Date()) {
        date.setFullYear(date.getFullYear() + 1);
      }
      
      return date;
    }},
    // Match time patterns
    { regex: /ساعت\s?(\d{1,2})(?::(\d{2}))?/i, 
      handler: (matches: RegExpMatchArray) => {
      const hours = parseInt(matches[1]);
      const minutes = matches[2] ? parseInt(matches[2]) : 0;
      
      if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;
      
      const date = new Date();
      // If time is earlier than current time, assume tomorrow
      if (date.getHours() > hours || (date.getHours() === hours && date.getMinutes() >= minutes)) {
        date.setDate(date.getDate() + 1);
      }
      date.setHours(hours, minutes, 0, 0);
      return date;
    }}
  ];

  // Try to extract doctor information
  let doctorName: string | undefined;
  let speciality: string | undefined;

  // Look for doctor patterns like "دکتر علوی" or "متخصص قلب"
  const doctorMatch = message.match(/دکتر\s+([^\s,]+)/i);
  if (doctorMatch) {
    doctorName = doctorMatch[0]; // Use the full match "دکتر علوی"
  }

  const specialityMatch = message.match(/متخصص\s+([^\s,]+)/i);
  if (specialityMatch) {
    speciality = specialityMatch[1];
  }

  // Look for appointment keywords
  const appointmentKeywords = [
    'قرار', 'نوبت', 'ویزیت', 'معاینه', 'دکتر', 'پزشک', 'مشاوره'
  ];

  // Check if message contains appointment keywords
  const containsAppointmentKeywords = appointmentKeywords.some(keyword => 
    message.includes(keyword)
  );

  if (!containsAppointmentKeywords) {
    return null;
  }

  // Try to extract a date from the message
  let appointmentDate: Date | null = null;
  
  for (const pattern of datePatterns) {
    const matches = message.match(pattern.regex);
    if (matches) {
      const extractedDate = pattern.handler(matches);
      if (extractedDate) {
        appointmentDate = extractedDate;
        break;
      }
    }
  }

  // If no date was found, use tomorrow at 10 AM as default
  if (!appointmentDate) {
    appointmentDate = new Date();
    appointmentDate.setDate(appointmentDate.getDate() + 1);
    appointmentDate.setHours(10, 0, 0, 0);
  }

  // Try to extract duration (default to 30 minutes)
  let duration = 30;
  const durationMatch = message.match(/(\d+)\s?(?:دقیقه|ساعت)/i);
  if (durationMatch) {
    const extractedDuration = parseInt(durationMatch[1]);
    // If "ساعت" (hour) is mentioned, convert to minutes
    if (durationMatch[0].includes('ساعت')) {
      duration = extractedDuration * 60;
    } else {
      duration = extractedDuration;
    }
  }

  // Extract potential title
  let title: string | undefined;
  const purposeMatch = message.match(/(?:برای|جهت)\s+([^.،؟!]+)/i);
  if (purposeMatch) {
    title = purposeMatch[1].trim();
  }

  return {
    title,
    doctorName,
    speciality,
    dateTime: appointmentDate,
    duration
  };
} 