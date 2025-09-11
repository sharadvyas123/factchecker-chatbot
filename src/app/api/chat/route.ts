import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import dbConnect from '@/lib/mongodb';
import Message from '@/models/Message';
import { getUserFromRequest } from '@/lib/auth';

// Handle CORS preflight requests
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL || 'https://sharadvyas.app.n8n.cloud/webhook/fact-check';

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
      // Send message to N8N webhook for fact-checking
      const n8nResponse = await axios.post(
        N8N_WEBHOOK_URL,
        {
          message: message.trim(),
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 30000, // 30 second timeout
        }
      );

      console.log('Raw N8N response:', JSON.stringify(n8nResponse.data, null, 2));

      let responseText = "Could not parse response from fact-checking service.";

      try {
        const responseData = n8nResponse.data;
        // The user wants a simpler way to extract the text.
        // Based on the provided sample, the text is deeply nested.
        // This is brittle and depends on the exact structure of the response.
        const key1 = Object.keys(responseData)[0];
        const key2 = Object.keys(responseData[key1])[0];
        const contentArray = responseData[key1][key2];
        responseText = contentArray[0].content.parts[0].text;
      } catch (e) {
        console.error("Could not parse n8n response with simplified logic", e);
        // If parsing fails, just stringify the whole response.
        responseText = JSON.stringify(n8nResponse.data);
      }
      
      // Save message to database
      const savedMessage = await Message.create({
        userId: user.userId,
        message: message.trim(),
        response: responseText,
        isFactChecked: false, // Not fully fact-checked, just displaying text
      });

      return NextResponse.json({
        messageId: savedMessage._id,
        response: savedMessage.response,
        isFactChecked: savedMessage.isFactChecked,
        timestamp: savedMessage.createdAt,
      });

    } catch (n8nError: any) {
      console.error('N8N webhook error:', n8nError?.response?.data || n8nError.message || n8nError);
      
      let errorMessage = 'I\'m currently unable to perform fact-checking due to a service issue.';
      
      if (n8nError?.code === 'ECONNREFUSED') {
        errorMessage += ' The fact-checking service appears to be unavailable.';
      } else if (n8nError?.response?.status) {
        errorMessage += ` Service returned error: ${n8nError.response.status}`;
      } else if (n8nError?.code === 'ENOTFOUND') {
        errorMessage += ' Could not connect to the fact-checking service.';
      }
      
      errorMessage += '\n\nPlease try again later, or check reliable sources for verification.';
      
      // Fallback response when N8N is unavailable
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

  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
