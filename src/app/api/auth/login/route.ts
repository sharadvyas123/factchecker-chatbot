import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';

const JWT_SECRET = process.env.JWT_SECRET;

export async function POST(request: NextRequest) {
  try {
    // Log environment check
    console.log('Login attempt - checking environment variables...');
    
    if (!JWT_SECRET) {
      console.error('JWT_SECRET is missing from environment variables');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }
    
    if (!process.env.MONGODB_URI) {
      console.error('MONGODB_URI is missing from environment variables');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }
    
    console.log('Environment variables OK, connecting to database...');
    await dbConnect();
    console.log('Database connection successful, processing login...');
    
    const { email, password } = await request.json();
    console.log('Login request parsed, email:', email?.substring(0, 3) + '***');

    // Validate input
    if (!email || !password) {
      console.error('Missing email or password in request');
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Find user
    console.log('Searching for user in database...');
    const user = await User.findOne({ email });
    console.log('User found:', !!user);
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Check password
    console.log('Verifying password...');
    const isPasswordValid = await bcrypt.compare(password, user.password);
    console.log('Password valid:', isPasswordValid);
    if (!isPasswordValid) {
      console.log('Password verification failed');
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Create JWT token
    console.log('Creating JWT token...');
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      JWT_SECRET!,
      { expiresIn: '7d' }
    );
    console.log('JWT token created successfully');

    // Remove password from response
    const userResponse = {
      id: user._id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
    };

    // Create response with cookie
    const response = NextResponse.json(
      { message: 'Login successful', user: userResponse, token },
      { status: 200 }
    );

    // Set HTTP-only cookie
    console.log('Setting authentication cookie...');
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax', // Changed from 'strict' to 'lax' for better compatibility
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/', // Explicitly set path
    });
    
    console.log('Login successful, returning response');
    return response;
  } catch (error) {
    // Log error for debugging in production
    console.error('Login error:', error);
    
    // Return generic error message to client
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
