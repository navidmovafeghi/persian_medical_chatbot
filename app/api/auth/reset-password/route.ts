import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/db';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, newPassword } = body;

    console.log(`Password reset attempt for email: ${email}`);

    if (!email || !newPassword) {
      console.log('Missing required fields:', { 
        hasEmail: !!email, 
        hasPassword: !!newPassword 
      });
      
      return NextResponse.json(
        { error: 'ایمیل و رمز عبور جدید الزامی است' },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      console.log('Password too short');
      return NextResponse.json(
        { error: 'رمز عبور باید حداقل 6 کاراکتر باشد' },
        { status: 400 }
      );
    }

    // Check if user exists
    console.log('Checking if user exists...');
    const user = await prisma.user.findUnique({
      where: { email },
    }).catch(err => {
      console.error('Database error when finding user:', err);
      throw new Error('Database error: ' + err.message);
    });

    if (!user) {
      console.log('User not found');
      return NextResponse.json(
        { error: 'کاربری با این ایمیل یافت نشد' },
        { status: 404 }
      );
    }

    console.log('User found, hashing password...');
    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10)
      .catch(err => {
        console.error('Error hashing password:', err);
        throw new Error('Password hashing error: ' + err.message);
      });

    // Update the user's password
    console.log('Updating user password...');
    await prisma.user.update({
      where: { email },
      data: {
        password: hashedPassword,
      },
    }).catch(err => {
      console.error('Database error when updating password:', err);
      throw new Error('Database update error: ' + err.message);
    });

    console.log('Password reset successful');
    return NextResponse.json({
      message: 'رمز عبور با موفقیت بازنشانی شد',
      success: true
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    console.error('Password reset error:', errorMessage);
    console.error('Error stack:', errorStack);
    
    return NextResponse.json(
      { 
        error: 'خطا در بازنشانی رمز عبور', 
        success: false,
        details: errorMessage,
        serverTime: new Date().toISOString()
      },
      { status: 500 }
    );
  }
} 