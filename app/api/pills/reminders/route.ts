import { NextResponse } from 'next/server';
import prisma from "@/lib/db";

/**
 * This API route is designed to be called by a cron job or scheduled task
 * to send reminders for upcoming pill intake times.
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
    
    // Calculate the time range for pills to remind
    // Look for active pills that need reminders within the next hour
    const now = new Date();
    const oneHourFromNow = new Date(now);
    oneHourFromNow.setHours(oneHourFromNow.getHours() + 1);
    
    // Find active pill reminders
    const activePillReminders = await (prisma as any).pillReminder.findMany({
      where: {
        status: 'active',
        reminderSent: false,
        // Pills that are currently active (either have no end date or the end date hasn't passed)
        OR: [
          { endDate: null },
          { endDate: { gte: now } },
        ]
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
    
    if (activePillReminders.length === 0) {
      return NextResponse.json({ message: 'No active pill reminders to check' });
    }
    
    // Process each active pill reminder
    const pillsToRemind = [];
    
    for (const pillReminder of activePillReminders) {
      try {
        // Parse the times from JSON string
        const times = JSON.parse(pillReminder.times);
        
        if (!Array.isArray(times) || times.length === 0) {
          continue;
        }
        
        // Check if any of the times are within the remind window
        const currentHour = now.getHours();
        const currentMinutes = now.getMinutes();
        
        for (const timeStr of times) {
          const [hourStr, minuteStr] = timeStr.split(':');
          const hour = parseInt(hourStr);
          const minute = parseInt(minuteStr);
          
          // Calculate the next occurrence of this time
          const reminderTime = new Date(now);
          reminderTime.setHours(hour, minute, 0, 0);
          
          // If the time has already passed today, check tomorrow's occurrence instead
          if (reminderTime < now) {
            reminderTime.setDate(reminderTime.getDate() + 1);
          }
          
          // Calculate the reminder window based on remindBefore setting (in minutes)
          const reminderWindowStart = new Date(reminderTime);
          reminderWindowStart.setMinutes(reminderWindowStart.getMinutes() - pillReminder.remindBefore);
          
          // Check if now is within the reminder window
          if (now >= reminderWindowStart && now <= reminderTime) {
            pillsToRemind.push({
              pillReminder,
              scheduledTime: reminderTime,
              timeString: timeStr
            });
            break; // Only need to remind once per pill, even if multiple times match
          }
        }
      } catch (error) {
        console.error(`Error processing pill reminder ${pillReminder.id}:`, error);
        continue;
      }
    }
    
    if (pillsToRemind.length === 0) {
      return NextResponse.json({ message: 'No pill reminders due within the next hour' });
    }
    
    // In a production app, we would integrate with an email or SMS service here
    // For now, we'll just mark the reminders as sent
    
    // Process each pill to remind
    const results = await Promise.all(
      pillsToRemind.map(async ({ pillReminder, timeString }) => {
        // In a real app, send an email or SMS here
        console.log(
          `Sending reminder for pill ${pillReminder.name} to ${pillReminder.user.email} for time ${timeString}`
        );
        
        // Update the pill reminder to mark reminder as sent
        const updated = await (prisma as any).pillReminder.update({
          where: { id: pillReminder.id },
          data: {
            reminderSent: true,
            reminded: new Date()
          }
        });
        
        return {
          id: updated.id,
          name: updated.name,
          success: true
        };
      })
    );
    
    return NextResponse.json({ 
      message: `Sent ${results.length} pill reminders`,
      results 
    });
    
  } catch (error) {
    console.error('Error sending pill reminders:', error);
    return NextResponse.json({ error: 'Error sending pill reminders' }, { status: 500 });
  }
} 