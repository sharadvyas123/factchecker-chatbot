import jwt from 'jsonwebtoken';
import { jwtVerify } from 'jose';
import { NextRequest } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET || 'your-fallback-secret-key';

export interface UserPayload {
  userId: string;
  email: string;
  iat?: number;
  exp?: number;
}

// For Edge Runtime (middleware)
export async function verifyTokenEdge(token: string): Promise<UserPayload | null> {
  try {
    console.log('Verifying token with jose (Edge Runtime)');
    const secret = new TextEncoder().encode(JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    console.log('Token verified successfully for user:', payload.email);
    return {
      userId: payload.userId as string,
      email: payload.email as string,
      iat: payload.iat,
      exp: payload.exp,
    };
  } catch (error) {
    console.log('Token verification failed (Edge):', error);
    return null;
  }
}

// For Node.js Runtime (API routes)
export function verifyToken(token: string): UserPayload | null {
  try {
    console.log('Verifying token with jsonwebtoken (Node.js Runtime)');
    const decoded = jwt.verify(token, JWT_SECRET) as UserPayload;
    console.log('Token verified successfully for user:', decoded.email);
    return decoded;
  } catch (error) {
    console.log('Token verification failed (Node.js):', error);
    return null;
  }
}

export function getUserFromRequest(request: NextRequest): UserPayload | null {
  const token = request.cookies.get('auth-token')?.value;
  
  if (!token) {
    return null;
  }

  return verifyToken(token);
}
