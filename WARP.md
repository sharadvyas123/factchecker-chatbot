# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Commands

### Development
- `npm run dev` - Start development server with Turbopack (localhost:3000)
- `npm run build` - Build for production with Turbopack
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Database Setup
Start MongoDB locally:
```powershell
# Using Docker (recommended)
docker run -d -p 27017:27017 --name mongodb mongo:latest

# Or start local MongoDB instance
mongod
```

### Testing Individual Components
No test framework is currently set up. For manual testing:
- Authentication: Test `/login`, `/signup`, and `/chat` routes
- API endpoints: Use tools like Postman or curl for `/api/auth/*`, `/api/chat`, `/api/messages`
- Middleware: Test route protection by accessing `/chat` without authentication

## Architecture

### Authentication System
- **Dual JWT verification**: Uses both `jsonwebtoken` (Node.js runtime) and `jose` (Edge runtime)
- **Cookie-based auth**: HTTP-only cookies with 7-day expiration
- **Route protection**: Middleware in `src/middleware.ts` protects `/chat` routes
- **Runtime compatibility**: Edge runtime for middleware, Node.js for API routes

### Database Architecture
- **MongoDB with Mongoose**: Connection pooling via cached global connection in `src/lib/mongodb.ts`
- **User model**: Email, hashed password (bcrypt), name, timestamps
- **Message model**: User reference, message text, response, fact-check results with confidence scores

### API Integration Pattern
- **N8N webhook integration**: Primary fact-checking service with fallback handling
- **Graceful degradation**: Falls back to basic response when N8N service is unavailable
- **Structured fact-check response**: Includes accuracy boolean, confidence percentage, explanation, and sources

### Next.js App Router Structure
- **Server/Client components**: API routes use Server Components, chat UI uses Client Components
- **Middleware-first auth**: Authentication handled at routing level before reaching components
- **TypeScript throughout**: Comprehensive type definitions in `src/types/` and model interfaces

### Key Technical Patterns
- **Connection caching**: MongoDB connections cached globally to prevent connection exhaustion
- **JWT dual-runtime**: Separate verification functions for Edge and Node.js runtimes
- **Client-side message management**: Real-time UI updates with optimistic message handling
- **Error boundaries**: Comprehensive error handling with user-friendly fallbacks

### Environment Dependencies
Required environment variables:
- `MONGODB_URI` - MongoDB connection string (defaults to localhost:27017)
- `JWT_SECRET` - Secret for JWT token signing
- `N8N_WEBHOOK_URL` - External fact-checking service endpoint

### External Service Integration
The application integrates with N8N for AI-powered fact-checking:
- **Input format**: JSON with message, userId, and timestamp
- **Expected response**: Structured JSON with accuracy assessment, confidence score, explanation, and sources
- **Timeout handling**: 30-second timeout with fallback response
- **Service resilience**: Continues functioning when N8N is unavailable

### Authentication Flow
1. User registration/login creates JWT token
2. Token stored in HTTP-only cookie
3. Middleware verifies token on protected routes using Edge-compatible verification
4. API routes use Node.js JWT verification for server-side operations
5. Client maintains user state in localStorage for UI personalization
