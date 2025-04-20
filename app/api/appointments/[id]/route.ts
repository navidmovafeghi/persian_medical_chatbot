import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";

// GET /api/appointments/[id] - Get a specific appointment
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Verify authentication
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const appointmentId = params.id;
    
    // Check if user has access to this appointment
    const result = await checkAppointmentAccess(appointmentId, userId);
    
    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    return NextResponse.json(result.appointment);
  } catch (error) {
    console.error('Error fetching appointment:', error);
    return NextResponse.json({ error: 'Error fetching appointment' }, { status: 500 });
  }
}

// PUT /api/appointments/[id] - Update an appointment
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Verify authentication
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const appointmentId = params.id;
    
    // Check if user has access to this appointment
    const accessResult = await checkAppointmentAccess(appointmentId, userId);
    
    if ('error' in accessResult) {
      return NextResponse.json({ error: accessResult.error }, { status: accessResult.status });
    }

    // Get update data from request body
    const data = await request.json();
    
    // Parse the date if it's a string
    if (data.dateTime && typeof data.dateTime === 'string') {
      data.dateTime = new Date(data.dateTime);
    }

    // Update appointment
    const updatedAppointment = await prisma.appointment.update({
      where: { id: appointmentId },
      data
    });

    return NextResponse.json(updatedAppointment);
  } catch (error) {
    console.error('Error updating appointment:', error);
    return NextResponse.json({ error: 'Error updating appointment' }, { status: 500 });
  }
}

// DELETE /api/appointments/[id] - Delete an appointment
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Verify authentication
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const appointmentId = params.id;
    
    // Check if user has access to this appointment
    const result = await checkAppointmentAccess(appointmentId, userId);
    
    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    // Delete appointment
    await prisma.appointment.delete({
      where: { id: appointmentId }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting appointment:', error);
    return NextResponse.json({ error: 'Error deleting appointment' }, { status: 500 });
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