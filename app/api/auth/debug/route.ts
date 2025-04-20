import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/db';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, testPassword } = body;

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Find the user but don't expose the full password
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        password: true, // Include password for debugging
        name: true,
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found', message: 'No user found with that email' },
        { status: 404 }
      );
    }

    // Test database connection
    let dbStatus = "Connected";
    try {
      await prisma.$queryRaw`SELECT 1`;
    } catch (err) {
      dbStatus = `Error: ${err instanceof Error ? err.message : String(err)}`;
    }

    // For security, only return partial password hash to verify it exists
    const partialHash = user.password ? 
      `${user.password.substring(0, 10)}...` : 
      'No password set';
      
    // Check password validity if testPassword is provided
    let passwordStatus = null;
    if (testPassword && user.password) {
      try {
        const isValid = await bcrypt.compare(testPassword, user.password);
        passwordStatus = {
          isValid,
          message: isValid ? "Password is valid" : "Password is invalid"
        };
      } catch (err) {
        passwordStatus = {
          isValid: false,
          error: err instanceof Error ? err.message : String(err)
        };
      }
    }

    return NextResponse.json({
      message: 'User found',
      database: {
        status: dbStatus
      },
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        hasPassword: !!user.password,
        passwordFormat: partialHash,
        passwordStatus
      },
      serverTime: new Date().toISOString()
    });
  } catch (error) {
    console.error('Debug endpoint error:', error);
    return NextResponse.json(
      { 
        error: 'Error checking user', 
        details: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        serverTime: new Date().toISOString()
      },
      { status: 500 }
    );
  }
} 