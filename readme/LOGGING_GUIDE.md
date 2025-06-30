# 📊 Multi-AI Logging System Guide

I've added extensive temporal logging throughout your application to help with testing, debugging, and monitoring across 400+ models via OpenRouter. This guide explains how to use and interpret the logs for OpenRouter integration.

## 🚀 Quick Start

### Test the Logging System
```bash
# Run the test script to verify logging is working
npx tsx scripts/test-logging.ts

# Start your development server to see live logs
npm run dev
```

### View Logs
- **Server logs**: Check your terminal where `npm run dev` is running
- **Client logs**: Open browser DevTools (F12) → Console tab

## 📱 What's Been Logged

### Server-Side Logging (`lib/logger.ts`)
✅ **API Routes**
- `/api/chat` - Complete chat flow with timing
- `/api/prompts` - Prompt creation and retrieval  
- `/api/ai-services/generate-meeting-report` - AI document generation
- All request/response pairs with status codes

✅ **Database Operations**
- All Prisma queries with context
- Performance timing for DB operations
- Error handling for failed queries

✅ **Server Actions** (`lib/actions.ts`)
- Chat creation and management
- Message creation with validation
- Complete error handling with context

✅ **Authentication Flow** (`middleware.ts`)
- Request interception and timing
- Auth success/failure tracking
- Public vs protected route handling

### Client-Side Logging (`lib/client-logger.ts`)
✅ **User Interactions**
- Message sending and receiving
- Prompt selection and usage
- Chat export operations
- Form submissions and validations

✅ **Component Lifecycle**
- Component mounting/unmounting
- State changes and updates
- Performance timing for operations

✅ **API Calls from Frontend**
- Request/response logging with status
- Error handling and retry logic
- Performance measurement

## 🔍 Log Format

### Server Logs
```
[2024-01-20T10:30:45.123Z] INFO: Chat request authenticated | Context: {"userId":"user_123","chatId":"chat_456","model":"gpt-4o"}
```

### Client Logs  
```
[CLIENT][2024-01-20T10:30:45.123Z] INFO: Message sent | Context: {"chatId":"chat_456","component":"ChatInput","metadata":{"messageLength":25,"model":"gpt-4o"}}
```

## 📊 Log Context Fields

| Field | Description | Example |
|-------|-------------|---------|
| `userId` | Authenticated user ID | `user_2abc123def` |
| `chatId` | Chat session ID | `chat_789xyz` |
| `clientId` | Client/customer ID | `client_456abc` |
| `component` | Frontend component name | `ChatInput`, `useChat` |
| `operation` | Server operation | `POST /api/chat` |
| `model` | AI model used | `gpt-4o`, `gpt-4o-mini`, `claude-4-opus`, `claude-4-sonnet`, `claude-3-5-haiku` |
| `metadata` | Additional context | `{"duration":150,"messageLength":25}` |

## 🎯 Key Testing Scenarios

### 1. Chat Flow Testing
1. Create a new chat → Check chat creation logs
2. Send a message → Watch message flow logs  
3. Receive AI response → Monitor AI service logs
4. Export chat → Track export operation logs

### 2. Authentication Testing
1. Sign in/out → Check auth middleware logs
2. Access protected routes → Monitor auth success/failure
3. Try unauthorized access → Verify warning logs

### 3. Performance Testing
- All major operations have timing logs
- Look for `Started:` and `Completed:` pairs
- Duration is measured in milliseconds

### 4. Error Testing
- Trigger errors intentionally → Check error logs with stack traces
- Monitor failed API calls → Verify error context
- Test validation failures → Check warning logs

## 🔧 Customizing Logs

### Add More Logging to Components
```typescript
import { clientLogger } from '@/lib/client-logger'

// In your component
useEffect(() => {
  clientLogger.componentMount('MyComponent', { userId, someContext });
  return () => clientLogger.componentUnmount('MyComponent', { userId });
}, []);

// For user actions
const handleClick = () => {
  clientLogger.userInteraction('Button clicked', { 
    component: 'MyComponent',
    metadata: { buttonType: 'primary' }
  });
};
```

### Add More Server Logging
```typescript
import { logger, withTiming } from '@/lib/logger'

// In API routes or server actions
export async function myApiHandler(req: Request) {
  const endTiming = logger.startTiming('My API Operation');
  
  try {
    logger.apiRequest('POST', '/api/my-endpoint');
    
    // Your logic here
    const result = await withTiming(
      'Database operation',
      () => prisma.model.findMany(),
      { userId }
    );
    
    logger.apiResponse('POST', '/api/my-endpoint', 200, { userId });
    return Response.json(result);
  } catch (error) {
    logger.error('API error', error as Error, { userId });
    return new Response('Error', { status: 500 });
  } finally {
    endTiming();
  }
}
```

## 🚨 Important Notes

1. **Performance**: Logging adds minimal overhead but monitor in production
2. **Privacy**: No sensitive data (passwords, personal info) is logged
3. **Context**: Always include relevant context (userId, chatId, etc.)
4. **Timing**: Use timing functions for performance-critical operations
5. **Errors**: Always log errors with context for debugging

## 📈 Monitoring in Production

For production, consider:
- Reducing log levels (INFO and above)
- Using structured logging services (e.g., Winston, Pino)
- Implementing log aggregation (e.g., ELK stack, CloudWatch)
- Setting up alerts for ERROR level logs

## 🎉 Benefits

✅ **Debugging**: Easy to trace issues through the entire request flow  
✅ **Performance**: Identify slow operations with timing data  
✅ **User Experience**: Track user journeys and pain points  
✅ **Monitoring**: Comprehensive application health visibility  
✅ **Testing**: Verify all features work as expected  

---

The logging system is now ready! Start your app and interact with it to see the comprehensive logs in action. Every major operation is tracked with full context and timing information. 