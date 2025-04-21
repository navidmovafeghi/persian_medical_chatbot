import { NextResponse } from 'next/server';
import prisma from "@/lib/db";

/**
 * This API route is designed to be called by a cron job or scheduled task
 * to reset the reminderSent flag for pill reminders at the end of each day,
 * so they can be sent again the next day.
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
    
    // Get all active pill reminders that have had reminders sent
    const activePillReminders = await (prisma as any).pillReminder.findMany({
      where: {
        status: 'active',
        reminderSent: true
      }
    });
    
    if (activePillReminders.length === 0) {
      return NextResponse.json({ message: 'No pill reminders to reset' });
    }
    
    // Reset reminderSent flag for all active pill reminders
    const resetResult = await (prisma as any).pillReminder.updateMany({
      where: {
        status: 'active',
        reminderSent: true
      },
      data: {
        reminderSent: false
      }
    });
    
    return NextResponse.json({ 
      message: `Reset ${resetResult.count} pill reminders`,
      count: resetResult.count
    });
    
  } catch (error) {
    console.error('Error resetting pill reminders:', error);
    return NextResponse.json({ error: 'Error resetting pill reminders' }, { status: 500 });
  }
} 