# AI Coach Assistant

A modern AI-powered coaching assistant built with Next.js 14, React 18, and OpenAI integration. Designed for coaches and consultants to have personalized AI conversations with client-specific context.

## Features

### Core Functionality
- **AI Conversations**: Natural conversations with OpenAI's GPT-4o-mini with client context
- **Client Management**: Create, view, edit, and delete client profiles
- **Personalized Responses**: AI automatically uses client information for tailored advice
- **Chat Management**: Create, view, edit, and delete chat conversations associated with clients
- **Real-time Messaging**: Send and receive messages in real-time
- **Message History**: Persistent chat history stored in database
- **Context Optimization**: Efficient token usage with smart context injection
- **AI Services**: Generate personalized documents like diet plans using client profiles

### User Experience  
- **ChatGPT-like Interface**: Clean, minimalistic design similar to ChatGPT
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Optimistic Updates**: Instant UI feedback for better user experience
- **Authentication**: Secure user authentication with Clerk

### Security & Privacy
- **User Isolation**: Users can only see and access their own chats
- **Protected Routes**: Authentication required for all chat functionality
- **Database Security**: Proper data validation and user verification

## Tech Stack

### Frontend
- **Next.js 14.2.29**: React framework with App Router
- **React 18**: Modern React with hooks and concurrent features
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first CSS framework
- **shadcn/ui**: High-quality UI components

### Backend & Database
- **Supabase**: PostgreSQL database hosting
- **Prisma ORM**: Type-safe database operations
- **Server Actions**: Server-side data mutations
- **API Routes**: RESTful API endpoints

### Authentication & AI
- **Clerk**: Complete authentication solution
- **OpenAI API**: GPT-3.5-turbo for AI responses

## Project Structure

```
├── app/
│   ├── api/
│   │   ├── chat/          # Chat API endpoints
│   │   └── ai-services/   # AI document generation APIs
│   ├── ai-services/       # AI Services page
│   ├── chat/[id]/         # Individual chat pages
│   ├── clients/           # Client management pages
│   ├── sign-in/           # Authentication pages
│   ├── sign-up/
│   ├── layout.tsx         # Root layout with providers
│   └── page.tsx          # Home page
├── components/
│   ├── ui/               # shadcn/ui components
│   ├── chat-sidebar.tsx  # Chat history sidebar
│   ├── chat-messages.tsx # Message display
│   ├── chat-input.tsx    # Message input form
│   ├── ai-services-client.tsx # AI Services page
│   ├── diet-generator-dialog.tsx # Diet generation dialog
│   └── clients-page-client.tsx # Client management
├── hooks/
│   ├── use-chat.ts       # Chat functionality hook
│   └── use-toast.ts      # Toast notifications
├── lib/
│   ├── actions.ts        # Server actions for CRUD
│   ├── client-actions.ts # Client management actions
│   ├── document-actions.ts # Document management actions
│   ├── prisma.ts         # Database client
│   ├── supabase.ts       # Supabase client
│   └── utils.ts          # Utility functions
├── prisma/
│   └── schema.prisma     # Database schema
└── middleware.ts         # Authentication middleware
```

## Database Schema

### Chat Model
- `id`: Unique identifier
- `title`: Chat title (editable)
- `userId`: Owner's user ID
- `createdAt/updatedAt`: Timestamps
- `messages`: Related messages

### Message Model  
- `id`: Unique identifier
- `content`: Message text
- `role`: USER or ASSISTANT
- `chatId`: Parent chat ID
- `createdAt`: Timestamp

### Client Model
- `id`: Unique identifier
- `userId`: Coach/consultant's user ID
- `name`: Client's full name
- `email`: Optional contact email
- `phone`: Optional phone number
- `dateOfBirth`: Optional date of birth
- `height`: Optional height in centimeters
- `weight`: Optional weight in kilograms
- `country`: Optional client's country/location
- `goals`: Client's health and fitness goals
- `medicalHistory`: Medical conditions, allergies, etc.
- `notes`: General notes about the client
- `createdAt/updatedAt`: Timestamps

### Document Model
- `id`: Unique identifier
- `userId`: Coach/consultant's user ID
- `clientId`: Associated client ID
- `documentName`: Document name/title
- `documentPath`: Storage path in Supabase
- `documentType`: Type (e.g., "diet", "workout")
- `startDate/endDate`: Optional date range for time-based documents
- `createdAt/updatedAt`: Timestamps

## AI Client Context System

### Overview
Each chat is associated with a specific client, and their information is automatically provided to the AI as context for personalized responses. The client context is intelligently managed to optimize token usage and conversation flow.

### Context Injection Strategy
- **First Message Only**: Client context is added as a system message only on the first user message
- **Memory-Based**: Subsequent messages rely on conversation memory, avoiding repeated context
- **Token Efficient**: Prevents duplicate information, reducing API costs and improving response times

### System Prompt Template

The following system prompt is dynamically constructed with client context (sections only included if data exists):

**File Location**: `app/api/chat/route.ts` (lines 72-95)

```typescript
const systemPrompt = `You are a professional AI assistant helping a coach/consultant with their client. You have access to the following client information and should use it to provide personalized, relevant advice and responses.

CLIENT PROFILE:${client.dateOfBirth ? `
Age: ${Math.floor((new Date().getTime() - new Date(client.dateOfBirth).getTime()) / (1000 * 60 * 60 * 24 * 365))} years old` : ''}${client.height ? `
Height: ${client.height}cm` : ''}${client.weight ? `
Weight: ${client.weight}kg` : ''}${client.country ? `
Country: ${client.country}` : ''}${client.goals ? `

GOALS:
${client.goals}` : ''}${client.medicalHistory ? `

MEDICAL HISTORY:
${client.medicalHistory}` : ''}${client.notes ? `

ADDITIONAL NOTES:
${client.notes}` : ''}

INSTRUCTIONS:
- Use this client information to personalize your responses
- Reference their specific goals and circumstances when relevant
- Be professional, empathetic, and supportive
- Provide actionable advice tailored to their profile
- If medical advice is requested, remind them to consult with healthcare professionals
- Maintain confidentiality and professionalism at all times
- Never reference the client by name or any personally identifiable information

Respond naturally and conversationally while keeping this context in mind.`
```

**Key Features:**
- **Conditional Sections**: Only includes data that exists (age, height, weight, goals, medical history, notes)
- **Privacy-Safe**: No personally identifiable information sent to OpenAI
- **Dynamic Construction**: Template adapts based on available client data

### Example Client Context

Here's an example of how the system prompt looks with actual client data:

```
You are a professional AI assistant helping a coach/consultant with their client. You have access to the following client information and should use it to provide personalized, relevant advice and responses.

CLIENT PROFILE:
Age: 35 years old
Height: 165cm
Weight: 70kg
Country: United States

GOALS:
Lose 15kg for wedding in 6 months, improve cardiovascular health, and build lean muscle. Wants to feel confident and energetic.

MEDICAL HISTORY:
Mild asthma (exercise-induced), no known food allergies. Previous ankle injury from running (2019, fully recovered). Takes daily multivitamin.

ADDITIONAL NOTES:
Busy professional schedule, prefers morning workouts. Has access to home gym equipment. Vegetarian diet for 3 years. Gets stressed easily which affects eating habits.

INSTRUCTIONS:
- Use this client information to personalize your responses
- Reference their specific goals and circumstances when relevant
- Be professional, empathetic, and supportive
- Provide actionable advice tailored to their profile
- If medical advice is requested, remind them to consult with healthcare professionals
- Maintain confidentiality and professionalism at all times
- Never reference the client by name or any personally identifiable information

Respond naturally and conversationally while keeping this context in mind.
```

### OpenAI API Configuration

The application uses configurable environment variables for OpenAI parameters, allowing easy tuning without code changes. All values are automatically validated to ensure they fall within OpenAI's acceptable ranges:

| Environment Variable | Default Value | Valid Range | Description |
|---------------------|---------------|-------------|-------------|
| `OPENAI_API_MODEL` | `gpt-4o-mini` | Any OpenAI model | OpenAI model to use |
| `OPENAI_TEMPERATURE` | `0.7` | 0.0 - 2.0 | Creativity vs consistency balance |
| `OPENAI_MAX_TOKENS` | `1000` | 1+ | Maximum response length |
| `OPENAI_PRESENCE_PENALTY` | `0.1` | -2.0 to 2.0 | Penalty for repetitive content |
| `OPENAI_FREQUENCY_PENALTY` | `0.1` | -2.0 to 2.0 | Penalty for frequent words |

#### Parameter Explanations:

- **Temperature (0.7)**: Provides a good balance between creative, personalized responses and consistent, professional advice. Lower values (0.1-0.3) make responses more focused and deterministic, higher values (0.8-1.0) make them more creative but potentially less consistent.

- **Max Tokens (1000)**: Ensures responses are comprehensive but not overly long, suitable for chat interface. Adjust based on your needs: 500 for shorter responses, 1500+ for more detailed explanations.

- **Presence Penalty (0.1)**: Slight reduction in repetitive content across the conversation. Range: -2.0 to 2.0. Positive values encourage new topics, negative values encourage staying on topic.

- **Frequency Penalty (0.1)**: Encourages vocabulary diversity while maintaining natural language. Range: -2.0 to 2.0. Positive values reduce word repetition.

## AI Services

### Overview
AI Services provide automated document generation using client profiles. The feature reuses the same client context system as the AI Assistant to generate personalized, professional documents. Three services are currently implemented.

### Implemented Services

#### 1. Diet Plan Generation
Creates personalized nutrition plans based on:
- **Client Profile**: Age, height, weight, medical history, notes
- **Goals Control**: Optional toggle to include/exclude client goals
- **Date Range**: Specific start and end dates for the diet plan
- **Nutritional Targets**: Optional calorie and protein targets
- **Additional Context**: Optional extra information for customization

#### 2. Workout Plan Generation
Creates custom exercise routines based on:
- **Client Profile**: Age, fitness level, health conditions
- **Goals Control**: Optional toggle to include/exclude client goals
- **Date Range**: Specific start and end dates for the workout plan
- **Workout Specifications**: Type, frequency, duration, equipment
- **Additional Context**: Injuries, preferences, special requirements

#### 3. Blood Test Analysis
Analyzes medical blood test reports with:
- **PDF Upload**: Direct upload of blood test reports (10MB limit)
- **AI Extraction**: Automatic parameter extraction from PDF
- **Parameter Review**: Edit and validate all extracted data
- **Anomalous Detection**: Automatic highlighting of concerning values
- **Health Analysis**: Comprehensive analysis excluding goals for medical objectivity
- **Multi-language Support**: Works with Spanish and English reports

### Key Features Across All Services:
- **Client Context Integration**: Uses the same context system as AI Assistant
- **Live Editor**: Edit generated content with real-time markdown preview
- **Supabase Storage**: Documents saved to organized folder structure
- **Database Tracking**: All documents tracked with metadata
- **Professional Output**: Production-ready content for client delivery

### Document Storage:
- **Format**: Markdown files for easy editing and display
- **Structure**: `{user_id}/{client_id}/{document_name}.md`
- **Naming Patterns**: 
  - Diet: `{Client Name} Diet {start_date} to {end_date}.md`
  - Workout: `{Client Name} Workout {start_date} to {end_date}.md`
  - Blood Test: `{Client Name} Blood Test Analysis {test_date}.md`
- **Security**: Private storage with user-specific access

### Goals Toggle Strategy:
- **Diet & Workout Plans**: Optional goals inclusion (default: enabled)
- **Blood Test Analysis**: Goals always excluded for medical objectivity

For detailed implementation information, see [AI_SERVICES_README.md](AI_SERVICES_README.md).

#### Customization Examples:

```bash
# For more creative, varied responses
OPENAI_TEMPERATURE=0.9
OPENAI_PRESENCE_PENALTY=0.3
OPENAI_FREQUENCY_PENALTY=0.3

# For more focused, consistent responses  
OPENAI_TEMPERATURE=0.3
OPENAI_PRESENCE_PENALTY=0.0
OPENAI_FREQUENCY_PENALTY=0.0

# For longer, detailed responses
OPENAI_MAX_TOKENS=1500
```

### Context Flow Example

**First Message:**
```
System: [Full client context as shown above]
User: "Hi, I need help with my fitness routine"
Assistant: "Hi there! I'd be happy to help you with your fitness routine. Given your goal to lose 15kg for your wedding in 6 months and your preference for morning workouts, let's create a plan that works with your busy schedule..."
```

**Subsequent Messages:**
```
User: "What about my diet?"
Assistant: "Great question! Since you've been vegetarian for 3 years, we can definitely work with that. For your weight loss goal, let's focus on protein-rich vegetarian options that will also support your muscle building..."
```

Notice how the AI remembers the client's context without it being re-sent, while maintaining privacy by not using names.

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account
- Clerk account
- OpenAI API key

### Environment Variables
Create a `.env.local` file with:

```env
# Database
DATABASE_URL="your_supabase_database_url"
DIRECT_URL="your_supabase_direct_url"

# Supabase Storage (for notes)
SUPABASE_URL="your_supabase_project_url"
SUPABASE_KEY="your_supabase_service_role_key"
NEXT_PUBLIC_SUPABASE_URL="your_supabase_project_url"
NEXT_PUBLIC_SUPABASE_KEY="your_supabase_anon_key"

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="your_clerk_publishable_key"
CLERK_SECRET_KEY="your_clerk_secret_key"

# OpenAI Configuration
OPENAI_API_KEY="your_openai_api_key"
OPENAI_API_MODEL="gpt-4o-mini"
OPENAI_TEMPERATURE="0.7"
OPENAI_MAX_TOKENS="1000"
OPENAI_PRESENCE_PENALTY="0.1"
OPENAI_FREQUENCY_PENALTY="0.1"
```

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up the database:
```bash
npx prisma generate
npx prisma db push
```

3. Start the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🧪 Tests

### Working Test Files:
- **`example.test.ts`** - Basic Jest functionality (math, arrays, objects)
- **`simple.test.ts`** - Core Jest matchers and testing patterns

### Usage:
```bash
# Run all working tests
npm test

# Run specific test
npm test -- __tests__/example.test.ts
npm test -- __tests__/simple.test.ts
```

## Usage

1. **Sign Up/Sign In**: Create an account or sign in with Clerk
2. **Create Clients**: Go to `/clients` to add client profiles with their information
3. **Select Client**: Click "Select Client" in the sidebar to choose a client for context
4. **Create Chat**: Click "New Chat" (only enabled after client selection)
5. **Send Messages**: Type your message and press Enter or click Send
6. **Personalized Responses**: AI automatically uses client context for tailored advice
7. **Manage Chats**: Edit titles or delete chats using the dropdown menu
8. **View History**: Click on any chat in the sidebar to view conversation and associated client
9. **Client Context**: View client information in the right sidebar during chats

## Architecture Decisions

### Server Actions vs API Routes
- **Server Actions**: Used for simple CRUD operations (create/delete/update chats)
- **API Routes**: Used for complex AI integration and streaming responses

### Custom Hooks
- **useChat**: Encapsulates chat logic, optimistic updates, and API calls
- **useToast**: Handles user notifications and feedback

### Authentication Strategy
- **Middleware Protection**: Routes protected at the edge
- **User Verification**: Database operations verify user ownership
- **Redirect Flow**: Unauthenticated users redirected to sign-in

## Performance Optimizations

- **Optimistic Updates**: Immediate UI feedback
- **Database Indexing**: Efficient queries with proper relations
- **Component Optimization**: Client/server component separation
- **Bundle Optimization**: Tree-shaking and code splitting

## Security Features

- **Route Protection**: Authentication middleware
- **Data Validation**: Prisma schema validation
- **User Isolation**: Database-level user filtering
- **Input Sanitization**: Safe message handling

Built with ❤️ using modern web technologies.
