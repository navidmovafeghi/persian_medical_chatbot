import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import bcrypt from "bcryptjs";

// WARNING: This endpoint is for development testing only
// It should be disabled or removed in production

export async function GET(req: NextRequest) {
  try {
    // Only allow this in development environment
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'This endpoint is disabled in production' }, { status: 403 });
    }

    // Check if we already have users
    const userCount = await prisma.user.count();
    
    if (userCount > 0) {
      // We already have users, just return the first one for testing
      const testUser = await prisma.user.findFirst({
        select: {
          id: true,
          email: true,
          name: true,
          // Don't return password
        }
      });
      
      return NextResponse.json({
        message: 'Test user already exists',
        user: testUser,
        created: false
      });
    }
    
    // Create a test user if none exists
    const hashedPassword = await bcrypt.hash('testpassword123', 10);
    
    const newUser = await prisma.user.create({
      data: {
        email: 'test@example.com',
        name: 'Test User',
        password: hashedPassword,
      }
    });
    
    // Also create a profile for this user
    await prisma.userProfile.create({
      data: {
        userId: newUser.id,
        gender: 'male',
        medicalHistory: 'Test medical history',
      }
    });
    
    return NextResponse.json({
      message: 'Test user created successfully',
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
      },
      created: true
    });
  } catch (error) {
    console.error('Error creating test user:', error);
    return NextResponse.json({ error: 'Failed to create test user' }, { status: 500 });
  }
} 