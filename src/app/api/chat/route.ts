import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dbConnect from '@/lib/mongodb';
import Message from '@/models/Message';
import { getUserFromRequest } from '@/lib/auth';

// Initialize Google Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || '');
const model = genAI.getGenerativeModel({ model: "models/gemini-2.5-pro" });  // Updated model name

// Handle CORS preflight requests
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

export async function POST(request: NextRequest) {
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

    const { message } = await request.json();

    if (!message || !message.trim()) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    try {
      // Create chat configuration
      const chat = model.startChat({
        generationConfig: {
          temperature: 0.7,
          topK: 1,
          topP: 1,
          maxOutputTokens: 2048,
        },
      });

      const prompt = `Fact check this statement: "${message.trim()}". 
      Is it accurate? Provide a brief explanation.`;
      
      const result = await chat.sendMessage(prompt).catch((error) => {
        console.error('Gemini API Error:', error);
        throw new Error(`Gemini API Error: ${error.message}`);
      });

      if (!result) {
        throw new Error('No response from Gemini API');
      }

      const text = result.response.text();
      console.log("AI Response:", text);

      // Simplified response handling for base model
      const responseText = `🔍 Fact-Check Result:\n\n${text}`;

      // Save message to database with simplified structure
      const savedMessage = await Message.create({
        userId: user.userId,
        message: message.trim(),
        response: responseText,
        isFactChecked: true,
        factCheckResult: {
          isAccurate: text.toLowerCase().includes('accurate') || text.toLowerCase().includes('correct'),
          confidence: 70, // Lower confidence for base model
          explanation: text,
          sources: [],
        },
      });

      return NextResponse.json({
        messageId: savedMessage._id,
        response: savedMessage.response,
        isFactChecked: true,
        timestamp: savedMessage.createdAt,
      });

    } catch (error: unknown) {
      const errorMessage = 'I\'m currently unable to perform fact-checking. Please try again later.';

      // Fallback response when AI service is unavailable
      const fallbackMessage = await Message.create({
        userId: user.userId,
        message: message.trim(),
        response: errorMessage,
        isFactChecked: false,
      });

      return NextResponse.json({
        messageId: fallbackMessage._id,
        response: fallbackMessage.response,
        isFactChecked: fallbackMessage.isFactChecked,
        timestamp: fallbackMessage.createdAt,
        warning: 'Fact-checking service temporarily unavailable',
      });
    }

  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
