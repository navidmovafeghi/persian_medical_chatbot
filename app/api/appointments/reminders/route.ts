import { NextResponse } from 'next/server';
import prisma from "@/lib/db";

/**
 * This API route is designed to be called by a cron job or scheduled task
 * to send reminders for upcoming appointments.
 */
export async function POST(request: Request) {
  try {
    // Check for API key to secure this endpoint
    // This would be a secret key only known to the cron service
    const apiKey = request.headers.get('x-api-key');
    const configuredApiKey = process.env.CRON_API_KEY;
    
    if (!apiKey || apiKey !== configuredApiKey) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Calculate the time range for appointments to remind
    // Look for appointments in the next 24 hours that haven't been reminded yet
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setHours(tomorrow.getHours() + 24);
    
    // Find appointments that need reminders
    const appointments = await prisma.appointment.findMany({
      where: {
        dateTime: {
          gte: now,
          lte: tomorrow
        },
        reminderSent: false,
        status: 'scheduled'
      },
      include: {
        user: {
          select: {
            email: true,
            name: true
          }
        }
      }
    });
    
    if (appointments.length === 0) {
      return NextResponse.json({ message: 'No appointments to remind' });
    }
    
    // In a production app, we would integrate with an email service here
    // For now, we'll just mark the reminders as sent
    
    // Process each appointment
    const results = await Promise.all(
      appointments.map(async (appointment) => {
        // In a real app, send an email here
        // console.log(`Sending reminder for appointment ${appointment.id} to ${appointment.user.email}`);
        
        // Update the appointment to mark reminder as sent
        const updated = await prisma.appointment.update({
          where: { id: appointment.id },
          data: {
            reminderSent: true,
            reminded: new Date()
          }
        });
        
        return {
          id: updated.id,
          success: true
        };
      })
    );
    
    return NextResponse.json({ 
      message: `Sent ${results.length} reminders`,
      results 
    });
    
  } catch (error) {
    console.error('Error sending reminders:', error);
    return NextResponse.json({ error: 'Error sending reminders' }, { status: 500 });
  }
}

// For testing purposes, we'll also allow GET requests
export async function GET(request: Request) {
  const url = new URL(request.url);
  const testMode = url.searchParams.get('test') === 'true';
  
  if (!testMode) {
    return NextResponse.json({ error: 'This endpoint is for testing only' }, { status: 400 });
  }
  
  // Mock the behavior of the POST handler
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setHours(tomorrow.getHours() + 24);
  
  const appointments = await prisma.appointment.findMany({
    where: {
      dateTime: {
        gte: now,
        lte: tomorrow
      },
      status: 'scheduled'
    },
    include: {
      user: {
        select: {
          email: true,
          name: true
        }
      }
    }
  });
  
  return NextResponse.json({ 
    message: `Found ${appointments.length} upcoming appointments in the next 24 hours`,
    appointments: appointments.map(apt => ({
      id: apt.id,
      title: apt.title,
      dateTime: apt.dateTime,
      reminderSent: apt.reminderSent,
      userEmail: apt.user.email
    }))
  });
} 