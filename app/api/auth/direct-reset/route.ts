import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/db';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, newPassword } = body;

    console.log(`Direct password reset attempt for email: ${email}`);

    if (!email || !newPassword) {
      console.log('Missing required fields');
      return NextResponse.json(
        { error: 'Email and new password are required' },
        { status: 400 }
      );
    }

    // Validate password
    if (newPassword.length < 6) {
      console.log('Password too short');
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    console.log('Checking database connection...');
    // Check database connection
    try {
      await prisma.$queryRaw`SELECT 1`;
      console.log('Database connection OK');
    } catch (err) {
      console.error('Database connection error:', err);
      return NextResponse.json(
        { error: 'Database connection error', details: err },
        { status: 500 }
      );
    }

    // Hash the password
    console.log('Hashing password...');
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    console.log('Password hashed successfully');

    // Check if user exists
    console.log('Finding user...');
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      console.log('User not found');
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    console.log('User found, updating password...');
    // Update password directly using raw SQL to bypass any ORM issues
    try {
      await prisma.$executeRaw`
        UPDATE "User"
        SET password = ${hashedPassword}
        WHERE email = ${email}
      `;
      console.log('Password updated successfully with raw SQL');
    } catch (err) {
      console.error('Raw SQL update error:', err);
      
      // Fallback to ORM update if raw query fails
      console.log('Trying fallback ORM update...');
      await prisma.user.update({
        where: { email },
        data: { password: hashedPassword },
      });
      console.log('Password updated successfully with ORM');
    }

    return NextResponse.json({
      message: 'Password reset successful',
      success: true
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Direct password reset error:', errorMessage);
    return NextResponse.json(
      { 
        error: 'Password reset failed', 
        details: errorMessage,
        success: false 
      },
      { status: 500 }
    );
  }
} 