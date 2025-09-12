import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import dbConnect from '@/lib/mongodb';
import Message from '@/models/Message';
import { getUserFromRequest } from '@/lib/auth';

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


      let responseText = "Could not parse response from fact-checking service.";
      let factCheckData = null;

      // Function to recursively find the content array
      function findContentArray(obj: unknown): unknown {
        if (Array.isArray(obj)) {
          // Check if this array contains content objects
          if (obj[0] && typeof obj[0] === 'object' && obj[0] !== null) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const item = obj[0] as any;
            if (item.content && item.content.parts) {
              return obj;
            }
          }
        }

        if (typeof obj === 'object' && obj !== null) {
          const objRecord = obj as Record<string, unknown>;
          for (const key in objRecord) {
            const result = findContentArray(objRecord[key]);
            if (result) return result;
          }
        }

        return null;
      }

      try {
        const responseData = n8nResponse.data;

        // Find the content array recursively
        const contentArray = findContentArray(responseData);

        if (Array.isArray(contentArray) && contentArray[0]) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const firstItem = contentArray[0] as any;
          if (firstItem.content && firstItem.content.parts && firstItem.content.parts[0]) {
            const extractedText = firstItem.content.parts[0].text;

            // Try to parse as JSON first
            try {
              factCheckData = JSON.parse(extractedText);

              // Handle the structured fact check response
              if (factCheckData.fact_check_result && factCheckData.explanation) {
                const isAccurate = factCheckData.fact_check_result === "true";
                const explanation = factCheckData.explanation;

                responseText = `🔍 Fact-Check Result:\n\n`;
                responseText += `${isAccurate ? '✅ ACCURATE' : '❌ INACCURATE'}\n\n`;
                responseText += `📝 Explanation: ${explanation}`;
              } else {
                // Handle other JSON structures
                responseText = extractedText;
              }
            } catch {
              // If it's not JSON, just use the text directly
              responseText = extractedText.replace(/"/g, ''); // Remove quotes
            }
          }
        } else {
          // Final fallback - show user-friendly message
          responseText = "I received a response from the fact-checking service, but couldn't parse it properly. Please try rephrasing your question.";
        }
      } catch {
        responseText = "I received a response from the fact-checking service, but couldn't parse it properly. Please try rephrasing your question.";
      }

      // Save message to database
      const savedMessage = await Message.create({
        userId: user.userId,
        message: message.trim(),
        response: responseText,
        isFactChecked: factCheckData ? true : false,
        factCheckResult: factCheckData ? {
          isAccurate: factCheckData.fact_check_result === "true",
          confidence: factCheckData.fact_check_result === "true" ? 95 : 90,
          explanation: factCheckData.explanation || "No explanation provided",
          sources: [],
        } : undefined,
      });

      return NextResponse.json({
        messageId: savedMessage._id,
        response: savedMessage.response,
        isFactChecked: savedMessage.isFactChecked,
        timestamp: savedMessage.createdAt,
      });

    } catch (n8nError: unknown) {
      const error = n8nError as { code?: string; response?: { status?: number }; message?: string };

      let errorMessage = 'I\'m currently unable to perform fact-checking due to a service issue.';

      if (error?.code === 'ECONNREFUSED') {
        errorMessage += ' The fact-checking service appears to be unavailable.';
      } else if (error?.response?.status) {
        errorMessage += ` Service returned error: ${error.response.status}`;
      } else if (error?.code === 'ENOTFOUND') {
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

  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
