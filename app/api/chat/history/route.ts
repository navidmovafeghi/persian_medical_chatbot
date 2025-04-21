import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';

export async function GET() {
  // Get the session to authenticate the user
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user?.id) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }
  
  try {
    // Get the user's chat messages
    const chatMessages = await prisma.chatMessage.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 50, // Get the 50 most recent messages
    });
    
    return NextResponse.json({ 
      messages: chatMessages,
      success: true 
    });
  } catch (error) {
    console.error('Error fetching chat history:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch chat history', 
      success: false 
    }, { status: 500 });
  }
} 