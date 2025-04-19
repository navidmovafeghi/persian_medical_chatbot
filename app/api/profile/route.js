import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return new NextResponse(
        JSON.stringify({
          error: "Unauthorized",
        }),
        { status: 401 }
      );
    }

    const userProfile = await prisma.userProfile.findUnique({
      where: {
        userId: session.user.id,
      },
    });

    if (!userProfile) {
      return NextResponse.json({
        medicalHistory: "",
        drugHistory: "",
        allergies: "",
        bloodType: "",
        height: null,
        weight: null,
        dateOfBirth: null,
        gender: "",
        emergencyContact: ""
      });
    }

    return NextResponse.json(userProfile);
  } catch (error) {
    console.error("Error fetching profile:", error);
    return new NextResponse(
      JSON.stringify({
        error: "Failed to fetch profile",
      }),
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return new NextResponse(
        JSON.stringify({
          error: "Unauthorized",
        }),
        { status: 401 }
      );
    }

    const body = await req.json();
    const { 
      medicalHistory, 
      drugHistory,
      allergies,
      bloodType,
      height,
      weight,
      dateOfBirth,
      gender,
      emergencyContact
    } = body;

    // Convert dateOfBirth from string to Date if provided
    const dateOfBirthValue = dateOfBirth ? new Date(dateOfBirth) : null;

    const updatedProfile = await prisma.userProfile.upsert({
      where: {
        userId: session.user.id,
      },
      update: {
        medicalHistory,
        drugHistory,
        allergies,
        bloodType,
        height: height ? parseFloat(height) : null,
        weight: weight ? parseFloat(weight) : null,
        dateOfBirth: dateOfBirthValue,
        gender,
        emergencyContact
      },
      create: {
        userId: session.user.id,
        medicalHistory,
        drugHistory,
        allergies,
        bloodType,
        height: height ? parseFloat(height) : null,
        weight: weight ? parseFloat(weight) : null,
        dateOfBirth: dateOfBirthValue,
        gender,
        emergencyContact
      },
    });

    return NextResponse.json(updatedProfile);
  } catch (error) {
    console.error("Error updating profile:", error);
    return new NextResponse(
      JSON.stringify({
        error: "Failed to update profile",
        details: error.message
      }),
      { status: 500 }
    );
  }
} 