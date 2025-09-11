# FactCheck Bot

A Next.js app with custom authentication (MongoDB + JWT), a responsive chat UI, and N8N webhook integration for AI-powered fact-checking.

## Features
- ✅ Next.js App Router (TypeScript, Tailwind CSS)
- 🔐 Custom login/signup with hashed passwords (bcrypt) and JWT cookies
- 🛡️ Protected chat page via middleware
- 🗄️ MongoDB (Mongoose) models for User and Message
- 🤖 N8N webhook integration for fact-checking
- 📱 Responsive, polished UI
- 🎯 Landing page with clear navigation

## Prerequisites
- Node.js 18+
- MongoDB running locally on port 27017
- N8N running locally (optional, fallback provided)

## Quick Start
1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Start MongoDB**
   ```bash
   # Using Docker
   docker run -d -p 27017:27017 --name mongodb mongo:latest
   
   # Or start your local MongoDB instance
   mongod
   ```

3. **Configure environment** (already set up in `.env.local`)
   - `MONGODB_URI`: MongoDB connection string
   - `JWT_SECRET`: Secret key for JWT tokens
   - `N8N_WEBHOOK_URL`: Your N8N webhook endpoint

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open [http://localhost:3000](http://localhost:3000)**

## Usage
1. Visit the landing page at `/`
2. Click "Get Started" or "Sign Up" to create an account
3. After registration, log in with your credentials
4. Start chatting with the FactCheck Bot at `/chat`
5. Submit claims or statements to get AI-powered fact-checking results

## N8N Integration

### Setting up N8N Webhook
1. Install N8N: `npm install -g n8n`
2. Start N8N: `n8n start`
3. Create a new workflow with:
   - **Webhook Trigger**: Listen for POST requests at `/webhook/factcheck`
   - **Expected JSON body**:
     ```json
     {
       "message": "The claim to fact-check",
       "userId": "<user-mongodb-id>",
       "timestamp": "<iso-date-string>"
     }
     ```
   - **Expected Response**:
     ```json
     {
       "response": "AI analysis of the claim",
       "isAccurate": true,
       "confidence": 87,
       "explanation": "Detailed explanation of why it's true/false",
       "sources": ["https://source1.com", "https://source2.com"]
     }
     ```

### N8N Workflow Example
Create nodes to:
1. Receive webhook data
2. Process the claim (connect to AI services, search engines, fact-checking APIs)
3. Return structured response

**Note**: If N8N is unavailable, the app provides fallback responses.

## Project Structure
```
src/
├── app/
│   ├── api/           # API routes
│   │   ├── auth/      # Authentication endpoints
│   │   ├── chat/      # Chat message handling
│   │   └── messages/  # Message history
│   ├── chat/          # Protected chat page
│   ├── login/         # Login page
│   ├── signup/        # Registration page
│   └── page.tsx       # Landing page
├── lib/               # Utilities
│   ├── mongodb.ts     # Database connection
│   └── auth.ts        # Authentication helpers
├── models/            # Mongoose schemas
│   ├── User.ts        # User model
│   └── Message.ts     # Message model
├── types/             # TypeScript declarations
└── middleware.ts      # Route protection
```

## API Endpoints
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/chat` - Send message for fact-checking
- `GET /api/messages` - Get user's chat history

## Scripts
- `npm run dev` — Start development server
- `npm run build` — Build for production
- `npm run start` — Start production server
- `npm run lint` — Run ESLint

## Security Features
- Password hashing with bcrypt
- HTTP-only JWT cookies
- Route protection middleware
- Input validation and sanitization
- Environment variable configuration

## Contributing
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License
MIT License - feel free to use this project for your own fact-checking applications!
