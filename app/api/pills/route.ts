import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";

// GET /api/pills - Get all pill reminders for logged-in user
export async function GET(request: Request) {
  try {
    // Verify authentication
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get query parameters
    const url = new URL(request.url);
    const status = url.searchParams.get('status') || undefined;
    const fromDate = url.searchParams.get('from');
    const toDate = url.searchParams.get('to');

    // Build the where clause for filtering
    const where: any = { userId };
    
    // Add status filter if provided
    if (status) {
      where.status = status;
    }
    
    // Add date range filter if provided
    if (fromDate || toDate) {
      where.startDate = {};
      
      if (fromDate) {
        where.startDate.gte = new Date(fromDate);
      }
      
      if (toDate) {
        where.startDate.lte = new Date(toDate);
      }
    }

    // Get pill reminders
    const pillReminders = await (prisma as any).pillReminder.findMany({
      where,
      orderBy: { startDate: 'asc' }
    });

    return NextResponse.json(pillReminders);
  } catch (error) {
    console.error('Error fetching pill reminders:', error);
    return NextResponse.json({ error: 'Error fetching pill reminders' }, { status: 500 });
  }
}

// POST /api/pills - Create a new pill reminder
export async function POST(request: Request) {
  try {
    // Verify authentication
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get pill reminder data from request body
    const data = await request.json();
    
    // Validate required fields
    if (!data.name || !data.dosage || !data.frequency || !data.times || !data.startDate) {
      return NextResponse.json({
        error: 'Missing required fields: name, dosage, frequency, times, and startDate are required'
      }, { status: 400 });
    }

    // Parse dates if they're strings
    if (typeof data.startDate === 'string') {
      data.startDate = new Date(data.startDate);
    }

    if (data.endDate && typeof data.endDate === 'string') {
      data.endDate = new Date(data.endDate);
    }

    // Ensure times is stored as a JSON string
    if (Array.isArray(data.times)) {
      data.times = JSON.stringify(data.times);
    }

    // Create pill reminder
    const pillReminder = await (prisma as any).pillReminder.create({
      data: {
        ...data,
        userId
      }
    });

    return NextResponse.json(pillReminder, { status: 201 });
  } catch (error) {
    console.error('Error creating pill reminder:', error);
    return NextResponse.json({ error: 'Error creating pill reminder' }, { status: 500 });
  }
}

// Utility function to check if user has permission to access the pill reminder
export async function checkPillReminderAccess(pillReminderId: string, userId: string) {
  const pillReminder = await (prisma as any).pillReminder.findUnique({
    where: { id: pillReminderId }
  });

  if (!pillReminder) {
    return { status: 404, error: 'Pill reminder not found' };
  }

  if (pillReminder.userId !== userId) {
    return { status: 403, error: 'You do not have permission to access this pill reminder' };
  }

  return { pillReminder };
} 