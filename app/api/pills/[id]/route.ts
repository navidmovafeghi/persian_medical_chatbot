import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";
import { checkPillReminderAccess } from '../route';

// GET /api/pills/[id] - Get a specific pill reminder
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

    // Check if user has access to this pill reminder
    const { pillReminder, status, error } = await checkPillReminderAccess(params.id, userId);

    if (error) {
      return NextResponse.json({ error }, { status });
    }

    return NextResponse.json(pillReminder);
  } catch (error) {
    console.error('Error fetching pill reminder:', error);
    return NextResponse.json({ error: 'Error fetching pill reminder' }, { status: 500 });
  }
}

// PUT /api/pills/[id] - Update a specific pill reminder
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

    // Check if user has access to this pill reminder
    const { pillReminder, status, error } = await checkPillReminderAccess(params.id, userId);

    if (error) {
      return NextResponse.json({ error }, { status });
    }

    // Get update data from request body
    const data = await request.json();

    // Parse dates if they're strings
    if (data.startDate && typeof data.startDate === 'string') {
      data.startDate = new Date(data.startDate);
    }

    if (data.endDate && typeof data.endDate === 'string') {
      data.endDate = new Date(data.endDate);
    }

    // Ensure times is stored as a JSON string if provided
    if (data.times) {
      if (Array.isArray(data.times)) {
        data.times = JSON.stringify(data.times);
      }
    }

    // Update pill reminder
    const updatedPillReminder = await (prisma as any).pillReminder.update({
      where: { id: params.id },
      data
    });

    return NextResponse.json(updatedPillReminder);
  } catch (error) {
    console.error('Error updating pill reminder:', error);
    return NextResponse.json({ error: 'Error updating pill reminder' }, { status: 500 });
  }
}

// DELETE /api/pills/[id] - Delete a specific pill reminder
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

    // Check if user has access to this pill reminder
    const { pillReminder, status, error } = await checkPillReminderAccess(params.id, userId);

    if (error) {
      return NextResponse.json({ error }, { status });
    }

    // Delete pill reminder
    await (prisma as any).pillReminder.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting pill reminder:', error);
    return NextResponse.json({ error: 'Error deleting pill reminder' }, { status: 500 });
  }
} 