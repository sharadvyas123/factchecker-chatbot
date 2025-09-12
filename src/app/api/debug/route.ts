import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const debug = {
      timestamp: new Date().toISOString(),
      nodeEnv: process.env.NODE_ENV,
      hasMongoUri: !!process.env.MONGODB_URI,
      hasJwtSecret: !!process.env.JWT_SECRET,
      hasN8nWebhook: !!process.env.N8N_WEBHOOK_URL,
      mongoUriLength: process.env.MONGODB_URI?.length || 0,
      jwtSecretLength: process.env.JWT_SECRET?.length || 0,
      // Show first few chars of mongo URI to verify (without exposing credentials)
      mongoUriStart: process.env.MONGODB_URI?.substring(0, 20) + '...',
    };

    console.log('Debug info:', debug);

    return NextResponse.json({
      message: 'Debug info collected',
      debug,
      status: 'Environment check complete'
    });
  } catch (error) {
    console.error('Debug route error:', error);
    return NextResponse.json(
      { error: 'Debug route failed', details: String(error) },
      { status: 500 }
    );
  }
}
