import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/db';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email } = body;

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

    // For security, only return partial password hash to verify it exists
    const partialHash = user.password ? 
      `${user.password.substring(0, 10)}...` : 
      'No password set';

    return NextResponse.json({
      message: 'User found',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        hasPassword: !!user.password,
        passwordFormat: partialHash
      }
    });
  } catch (error) {
    console.error('Debug endpoint error:', error);
    return NextResponse.json(
      { error: 'Error checking user', details: error },
      { status: 500 }
    );
  }
} 