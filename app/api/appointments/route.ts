import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";

// GET /api/appointments - Get all appointments for logged-in user
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
      where.dateTime = {};
      
      if (fromDate) {
        where.dateTime.gte = new Date(fromDate);
      }
      
      if (toDate) {
        where.dateTime.lte = new Date(toDate);
      }
    }

    // Get appointments
    const appointments = await prisma.appointment.findMany({
      where,
      orderBy: { dateTime: 'asc' }
    });

    return NextResponse.json(appointments);
  } catch (error) {
    console.error('Error fetching appointments:', error);
    return NextResponse.json({ error: 'Error fetching appointments' }, { status: 500 });
  }
}

// POST /api/appointments - Create a new appointment
export async function POST(request: Request) {
  try {
    // Verify authentication
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get appointment data from request body
    const data = await request.json();
    
    // Validate required fields
    if (!data.title || !data.doctorName || !data.dateTime || !data.duration) {
      return NextResponse.json({
        error: 'Missing required fields: title, doctorName, dateTime, and duration are required'
      }, { status: 400 });
    }

    // Parse the date if it's a string
    if (typeof data.dateTime === 'string') {
      data.dateTime = new Date(data.dateTime);
    }

    // Create appointment
    const appointment = await prisma.appointment.create({
      data: {
        ...data,
        userId
      }
    });

    return NextResponse.json(appointment, { status: 201 });
  } catch (error) {
    console.error('Error creating appointment:', error);
    return NextResponse.json({ error: 'Error creating appointment' }, { status: 500 });
  }
}

// Utility function to check if user has permission to access the appointment
async function checkAppointmentAccess(appointmentId: string, userId: string) {
  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId }
  });

  if (!appointment) {
    return { status: 404, error: 'Appointment not found' };
  }

  if (appointment.userId !== userId) {
    return { status: 403, error: 'You do not have permission to access this appointment' };
  }

  return { appointment };
} 