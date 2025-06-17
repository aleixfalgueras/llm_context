# AI Chat Assistant

A modern AI-powered chatbot application built with Next.js 14, React 18, and OpenAI integration.

## Features

### Core Functionality
- **AI Conversations**: Natural conversations with OpenAI's GPT-3.5-turbo
- **Chat Management**: Create, view, edit, and delete chat conversations
- **Real-time Messaging**: Send and receive messages in real-time
- **Message History**: Persistent chat history stored in database
- **Notes Management**: Upload, view, and delete markdown/text notes with cloud storage

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
│   ├── api/chat/          # Chat API endpoints
│   ├── chat/[id]/         # Individual chat pages
│   ├── sign-in/           # Authentication pages
│   ├── sign-up/
│   ├── layout.tsx         # Root layout with providers
│   └── page.tsx          # Home page
├── components/
│   ├── ui/               # shadcn/ui components
│   ├── chat-sidebar.tsx  # Chat history sidebar
│   ├── chat-messages.tsx # Message display
│   ├── chat-input.tsx    # Message input form
│   └── chat-interface.tsx # Landing page interface
├── hooks/
│   ├── use-chat.ts       # Chat functionality hook
│   └── use-toast.ts      # Toast notifications
├── lib/
│   ├── actions.ts        # Server actions for CRUD
│   ├── prisma.ts         # Database client
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

# OpenAI
OPENAI_API_KEY="your_openai_api_key"
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

## Usage

1. **Sign Up/Sign In**: Create an account or sign in with Clerk
2. **Create Chat**: Click "New Chat" in the sidebar
3. **Send Messages**: Type your message and press Enter or click Send
4. **Manage Chats**: Edit titles or delete chats using the dropdown menu
5. **View History**: Click on any chat in the sidebar to view conversation
6. **Upload Notes**: Click the "Notes" button to open the notes sidebar
7. **Manage Notes**: Upload .md or .txt files, view content, and delete notes as needed

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
