'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

interface Message {
  id: string;
  message: string;
  response: string;
  isFactChecked: boolean;
  factCheckResult?: {
    isAccurate: boolean;
    confidence: number;
    explanation: string;
    sources?: string[];
  };
  timestamp: Date;
  isUser: boolean;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState<{name: string; email: string} | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    // Get user from localStorage
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }

    // Load chat history
    loadChatHistory();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadChatHistory = async () => {
    try {
      const response = await fetch('/api/messages');
      if (response.ok) {
        const data = await response.json();
        
        // Transform the messages to show both user and bot messages
        const transformedMessages: Message[] = [];
        
        data.messages.forEach((msg: {id: string; message: string; response: string; isFactChecked: boolean; factCheckResult?: {isAccurate: boolean; confidence: number; explanation: string; sources?: string[]}; timestamp: string}) => {
          // Add user message
          transformedMessages.push({
            id: `${msg.id}-user`,
            message: msg.message,
            response: '',
            isFactChecked: false,
            timestamp: new Date(msg.timestamp),
            isUser: true,
          });
          
          // Add bot response
          transformedMessages.push({
            id: msg.id,
            message: msg.message,
            response: msg.response,
            isFactChecked: msg.isFactChecked,
            factCheckResult: msg.factCheckResult,
            timestamp: new Date(msg.timestamp),
            isUser: false,
          });
        });
        
        setMessages(transformedMessages);
      }
    } catch {
      // Error loading chat history
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      localStorage.removeItem('user');
      router.push('/login');
    } catch {
      // Logout error
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = inputMessage.trim();
    setInputMessage('');
    setIsLoading(true);

    // Add user message to UI immediately
    const tempUserMessage: Message = {
      id: Date.now().toString(),
      message: userMessage,
      response: '',
      isFactChecked: false,
      timestamp: new Date(),
      isUser: true,
    };
    setMessages(prev => [...prev, tempUserMessage]);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: userMessage }),
      });

      const data = await response.json();

      if (response.ok) {
        // Add bot response
        const botMessage: Message = {
          id: data.messageId || (Date.now() + 1).toString(),
          message: userMessage,
          response: data.response,
          isFactChecked: data.isFactChecked || false,
          factCheckResult: data.factCheckResult,
          timestamp: new Date(data.timestamp || Date.now()),
          isUser: false,
        };

        setMessages(prev => [...prev.slice(0, -1), tempUserMessage, botMessage]);
      } else {
        // Handle error
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          message: userMessage,
          response: data.error || 'Sorry, something went wrong. Please try again.',
          isFactChecked: false,
          timestamp: new Date(),
          isUser: false,
        };
        setMessages(prev => [...prev.slice(0, -1), tempUserMessage, errorMessage]);
      }
    } catch {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        message: userMessage,
        response: 'Network error. Please check your connection and try again.',
        isFactChecked: false,
        timestamp: new Date(),
        isUser: false,
      };
      setMessages(prev => [...prev.slice(0, -1), tempUserMessage, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b px-4 py-3 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">FactCheck Bot</h1>
          <p className="text-sm text-gray-500">AI-powered fact verification assistant</p>
        </div>
        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-600">Welcome, {user?.name}</span>
          <button
            onClick={handleLogout}
            className="text-sm text-indigo-600 hover:text-indigo-500 font-medium"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 mt-8">
            <div className="bg-white rounded-lg p-6 shadow-sm max-w-md mx-auto">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Welcome to FactCheck Bot!</h3>
              <p className="text-sm text-gray-600">
                I&apos;m here to help you verify information and check facts. 
                Send me a statement or claim, and I&apos;ll analyze it for accuracy.
              </p>
            </div>
          </div>
        ) : (
                          messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.isUser ? 'justify-end' : 'justify-start'}`}>
              {msg.isUser ? (
                <div className="bg-indigo-600 text-white rounded-lg px-4 py-2 max-w-xs lg:max-w-md">
                  <p className="text-sm">{msg.message}</p>
                </div>
              ) : (
                <div className="bg-white rounded-lg px-4 py-3 max-w-sm lg:max-w-lg shadow-sm">
                  <div className="text-sm text-gray-900 whitespace-pre-line break-words">
                    {msg.response}
                  </div>
                  
                  {msg.isFactChecked && msg.factCheckResult && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-md border">
                      <div className="flex items-center mb-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          msg.factCheckResult.isAccurate 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {msg.factCheckResult.isAccurate ? 'Accurate' : 'Inaccurate'}
                        </span>
                        <span className="ml-2 text-xs text-gray-500">
                          Confidence: {msg.factCheckResult.confidence}%
                        </span>
                      </div>
                      <p className="text-xs text-gray-700">{msg.factCheckResult.explanation}</p>
                      {msg.factCheckResult.sources && msg.factCheckResult.sources.length > 0 && (
                        <div className="mt-2">
                          <p className="text-xs text-gray-600 font-medium">Sources:</p>
                          <ul className="text-xs text-gray-600 list-disc list-inside">
                            {msg.factCheckResult.sources.map((source, idx) => (
                              <li key={idx}>{source}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white rounded-lg px-4 py-3 max-w-xs shadow-sm">
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
                <p className="text-sm text-gray-600">Analyzing your message...</p>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="bg-white text-black border-t px-4 py-3">
        <form onSubmit={handleSubmit} className="flex space-x-3">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Enter a statement or claim to fact-check..."
            disabled={isLoading}
            className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={isLoading || !inputMessage.trim()}
            className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
