import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';

// GET /api/laboratory - Get all laboratory data for the current user
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'غیرمجاز' }, { status: 401 });
    }

    // Check if Prisma client has the laboratoryData model
    if (!(prisma as any).laboratoryData) {
      return NextResponse.json({ 
        laboratoryData: [],
        message: 'Laboratory data model not available' 
      });
    }

    const laboratoryData = await (prisma as any).laboratoryData.findMany({
      where: { userId: session.user.id },
      orderBy: { testDate: 'desc' },
    });

    return NextResponse.json({ laboratoryData });
  } catch (error) {
    console.error('Error fetching laboratory data:', error);
    return NextResponse.json(
      { error: 'خطا در دریافت اطلاعات آزمایشگاهی', laboratoryData: [] },
      { status: 500 }
    );
  }
}

// POST /api/laboratory - Add new laboratory data
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'غیرمجاز' }, { status: 401 });
    }

    // Check if Prisma client has the laboratoryData model
    if (!(prisma as any).laboratoryData) {
      return NextResponse.json({ 
        error: 'Laboratory data model not available. Please restart the server.' 
      }, { status: 500 });
    }

    const { testName, testDate, result, unit, normalRange, notes } = await req.json();

    // Basic validation
    if (!testName || !testDate || !result) {
      return NextResponse.json(
        { error: 'نام آزمایش، تاریخ و نتیجه الزامی است' },
        { status: 400 }
      );
    }

    const newLabData = await (prisma as any).laboratoryData.create({
      data: {
        userId: session.user.id,
        testName,
        testDate: new Date(testDate),
        result,
        unit,
        normalRange,
        notes,
      },
    });

    return NextResponse.json({ success: true, data: newLabData });
  } catch (error) {
    console.error('Error adding laboratory data:', error);
    return NextResponse.json(
      { error: 'خطا در ذخیره اطلاعات آزمایشگاهی' },
      { status: 500 }
    );
  }
}

// DELETE /api/laboratory - Delete laboratory data
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'غیرمجاز' }, { status: 401 });
    }

    // Check if Prisma client has the laboratoryData model
    if (!(prisma as any).laboratoryData) {
      return NextResponse.json({ 
        error: 'Laboratory data model not available. Please restart the server.' 
      }, { status: 500 });
    }

    const { id } = await req.json();

    if (!id) {
      return NextResponse.json({ error: 'شناسه داده آزمایشگاهی الزامی است' }, { status: 400 });
    }

    // Verify ownership before deletion
    const labData = await (prisma as any).laboratoryData.findUnique({
      where: { id },
    });

    if (!labData || labData.userId !== session.user.id) {
      return NextResponse.json({ error: 'داده آزمایشگاهی یافت نشد یا شما مجاز به حذف آن نیستید' }, { status: 404 });
    }

    await (prisma as any).laboratoryData.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting laboratory data:', error);
    return NextResponse.json(
      { error: 'خطا در حذف داده آزمایشگاهی' },
      { status: 500 }
    );
  }
} 