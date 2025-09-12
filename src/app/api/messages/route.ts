import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Message from '@/models/Message';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    
    // Authenticate user
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user's messages
    const messages = await Message.find({ userId: user.userId })
      .sort({ createdAt: 1 })
      .limit(100) // Limit to last 100 messages
      .lean();

    // Transform messages for frontend
    const transformedMessages = messages.map(msg => ({
      id: String(msg._id),
      message: msg.message,
      response: msg.response,
      isFactChecked: msg.isFactChecked,
      factCheckResult: msg.factCheckResult,
      timestamp: msg.createdAt,
      isUser: false, // This will be handled by frontend to show user/bot pairs
    }));

    return NextResponse.json({
      messages: transformedMessages,
    });

  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
