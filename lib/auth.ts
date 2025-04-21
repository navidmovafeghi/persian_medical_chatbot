// lib/auth.ts
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { AuthOptions } from "next-auth";
import prisma from "@/lib/db";

// Extend the built-in session type to include the user ID
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    }
  }
}

export const authOptions: AuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Invalid credentials");
        }

        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email
          }
        });

        if (!user || !user.password) {
          throw new Error("User not found");
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isPasswordValid) {
          throw new Error("Invalid password");
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
        };
      }
    })
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/auth/signin",
    // Add other custom pages if needed
  },
  callbacks: {
    async session({ session, token }) {
      console.log("Session callback received:", { session, token });
      
      if (session?.user && token) {
        session.user.id = token.id as string;
        
        // Log the modified session
        console.log("Session callback returning:", session);
      }
      return session;
    },
    async jwt({ token, user }) {
      console.log("JWT callback received:", { token, user });
      
      if (user) {
        token.id = user.id;
      }
      
      // Log the modified token
      console.log("JWT callback returning:", token);
      
      return token;
    }
  },
  debug: process.env.NODE_ENV === 'development',
  secret: process.env.NEXTAUTH_SECRET,
}; 