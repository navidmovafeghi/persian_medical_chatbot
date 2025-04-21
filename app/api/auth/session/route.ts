import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  
  let userData = null;
  
  if (session?.user?.id) {
    try {
      userData = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
          id: true,
          email: true,
          name: true,
          emailVerified: true,
          // Don't return the password
        }
      });
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  }
  
  return NextResponse.json({
    authenticated: !!session,
    session: {
      ...session,
      // Remove any sensitive information if needed
    },
    userData,
    timestamp: new Date().toISOString()
  });
} 