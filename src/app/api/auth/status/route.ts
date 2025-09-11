import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);
    
    if (user) {
      return NextResponse.json({
        authenticated: true,
        user: {
          userId: user.userId,
          email: user.email,
        }
      });
    } else {
      return NextResponse.json({
        authenticated: false,
      });
    }
  } catch (error) {
    console.error('Auth status check error:', error);
    return NextResponse.json({
      authenticated: false,
      error: 'Failed to check auth status'
    });
  }
}
