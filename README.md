# AI Marketing Assistant

A modern AI-powered marketing assistant built with Next.js 14, React 18, and OpenAI integration. Designed for marketing professionals and content creators to have personalized AI conversations with client-specific context for creating compelling marketing content.

## Features

### Core Functionality
- **AI Conversations**: Natural conversations with OpenAI's GPT-4o-mini with granular client context selection
- **Client Management**: Create, view, edit, and delete marketing client profiles
- **Custom Prompt Management**: Create, organize, and reuse personalized AI prompts with automatic client variable replacement
- **Granular Context Control**: Select specific client information fields (country, marketing goals, notes) for each conversation
- **Context Field Tracking**: View exactly which client fields were used as context for each chat
- **Chat Management**: Create, view, edit, and delete chat conversations with client association
- **Real-time Messaging**: Send and receive messages in real-time
- **Message History**: Persistent chat history stored in database with context metadata
- **Context Optimization**: Efficient token usage with smart context injection and field selection
- **AI Services**: Generate personalized marketing content with granular client context control

### User Experience  
- **ChatGPT-like Interface**: Clean, minimalistic design similar to ChatGPT
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Loading States**: Beautiful loading overlays during chat creation with progress feedback
- **Context Selection UI**: Intuitive checkboxes for selecting client context fields with dynamic labels
- **Context Visualization**: Green badges showing selected context fields for each chat
- **Optimistic Updates**: Instant UI feedback for better user experience
- **Authentication**: Secure user authentication with Clerk

### Security & Privacy
- **User Isolation**: Users can only see and access their own chats and clients
- **Protected Routes**: Authentication required for all functionality
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
- **OpenAI API**: GPT-4o-mini for AI responses

## Project Structure

```
├── app/
│   ├── api/
│   │   ├── chat/          # Chat API endpoints
│   │   ├── prompts/       # Prompt management APIs
│   │   │   ├── route.ts  # List and create prompts
│   │   │   ├── [id]/route.ts # Get, update, delete individual prompts
│   │   │   └── [id]/use/route.ts # Track prompt usage analytics
│   │   └── ai-services/   # AI document generation APIs
│   │       ├── generate-meeting-report/  # Meeting report generation
│   │       ├── generate-custom-document/ # Custom document generation
│   │       └── save-custom-document/     # Custom document storage
│   ├── ai-services/       # AI Services page
│   ├── assistant/         # AI Assistant functionality
│   │   ├── page.tsx      # Main assistant page with client selection
│   │   └── chat/[id]/    # Individual chat conversations
│   ├── clients/           # Client management pages
│   ├── prompts/           # Prompt management page
│   ├── sign-in/           # Authentication pages
│   ├── sign-up/
│   ├── layout.tsx         # Root layout with providers
│   └── page.tsx          # Home page
├── components/
│   ├── ui/               # shadcn/ui components
│   ├── chat-sidebar.tsx  # Chat history sidebar with new chat button
│   ├── chat-messages.tsx # Message display
│   ├── chat-input.tsx    # Message input form with prompt selector integration
│   ├── client-context-sidebar.tsx # Client selection and context configuration
│   ├── prompt-dialog.tsx # Create/edit prompt dialog with variable tooltip
│   ├── prompt-selector.tsx # Prompt selection dropdown for chat interface
│   ├── prompts-management.tsx # Complete prompt management dashboard
│   ├── ai-services-client.tsx # AI Services page
│   ├── meeting-report-dialog.tsx # Meeting report generation dialog
│   ├── custom-document-generator-dialog.tsx # Custom document generation with prompt integration
│   └── clients-page-client.tsx # Client management
├── hooks/
│   ├── use-chat.ts       # Chat functionality hook
│   └── use-toast.ts      # Toast notifications
├── lib/
│   ├── actions.ts        # Server actions for CRUD
│   ├── client-actions.ts # Client management actions
│   ├── document-actions.ts # Document management actions
│   ├── variable-replacement.ts # Client variable replacement utilities
│   ├── prisma.ts         # Database client
│   ├── supabase.ts       # Supabase client
│   └── utils.ts          # Utility functions
├── prisma/
│   └── schema.prisma     # Database schema
├── types/
│   └── client-context.ts # Shared types for client context selection
└── middleware.ts         # Authentication middleware
```

## Database Schema

### Chat Model
- `id`: Unique identifier
- `title`: Chat title (editable)
- `userId`: Owner's user ID
- `clientId`: Associated client ID (required)
- `contextFields`: Array of selected context field names (e.g., ["country", "goals"])
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
- `userId`: Marketing professional's user ID
- `name`: Client's business/brand name
- `email`: Optional contact email
- `phone`: Optional phone number
- `country`: Optional client's country/location
- `goals`: Client's marketing and content goals
- `notes`: General notes about the client
- `documentsLanguage`: Preferred language for generated content
- `createdAt/updatedAt`: Timestamps

### Document Model
- `id`: Unique identifier
- `userId`: Marketing professional's user ID
- `clientId`: Associated client ID
- `documentName`: Document name/title
- `documentPath`: Storage path in Supabase
- `documentType`: Type (e.g., "meeting", "custom-document")
- `startDate/endDate`: Optional date range for time-based documents
- `createdAt/updatedAt`: Timestamps

### Prompt Model
- `id`: Unique identifier
- `userId`: Owner's user ID
- `name`: User-friendly prompt name
- `description`: Optional description of prompt purpose
- `content`: The actual prompt template with variable placeholders
- `category`: Organization category (marketing, content, strategy, social-media, copywriting, analysis, general, custom)
- `isActive`: Boolean flag to enable/disable prompts
- `usageCount`: Analytics counter for tracking popularity
- `createdAt/updatedAt`: Timestamps

## Custom Prompt Management System

### Overview
The Custom Prompt Management System allows users to create, organize, and reuse personalized AI prompts with automatic client variable replacement. This powerful feature transforms the AI assistant from a generic chat into a professional marketing tool with standardized, yet personalized content creation.

### Key Features

#### **Prompt Creation & Organization**
- **Rich Prompt Editor**: Create detailed prompt templates with descriptions and categories
- **Variable Support**: Use client data variables like `{client_name}`, `{goals}`, `{country}`
- **Category System**: Organize prompts by type (marketing, content, strategy, social-media, copywriting, analysis, general, custom)
- **Active/Inactive Status**: Enable or disable prompts without deleting them
- **Usage Analytics**: Track which prompts are used most frequently

#### **Smart Variable Replacement**
- **Automatic Substitution**: Client variables automatically replaced with actual data when prompt is selected
- **Real-time Processing**: Variables filled instantly when prompt is applied in chat
- **Context Awareness**: Uses current chat's associated client data for variable replacement
- **Fallback Handling**: Missing data shows placeholder labels (e.g., `[Client Name]` if no name available)

#### **Prompt Library Management**
- **Search & Filter**: Find prompts by name, description, or content
- **Category Filtering**: Filter prompts by category
- **Usage Sorting**: Sort by most used, recently updated, name, or creation date
- **Active/Inactive Toggle**: Show all prompts or only active ones

#### **Integration with AI Assistant**
- **Chat Integration**: "Use Prompt" button in chat interface for easy access
- **Prompt Selector**: Searchable dropdown with popular and recent prompts
- **Live Replacement**: Variables replaced in real-time before insertion into chat input
- **Usage Tracking**: Automatically tracks when prompts are used

### Variable System

#### **Available Client Variables**
```
{client_name}     → Client's business/brand name
{goals}           → Marketing and content goals
{country}         → Client's country/location
```

#### **Variable Replacement Examples**

**Template:**
```
Please create a comprehensive marketing strategy for {client_name}, a business located in {country}.

**Client Profile:**
- Marketing Goals: {goals}
- Target Market: {country}

Please provide personalized marketing recommendations based on this information.
```

**After Variable Replacement:**
```
Please create a comprehensive marketing strategy for TechStart Solutions, a business located in United States.

**Client Profile:**
- Marketing Goals: Increase brand awareness by 50%, launch social media campaigns, create engaging video content for product demos
- Target Market: United States

Please provide personalized marketing recommendations based on this information.
```

### Prompt Categories

#### **Marketing**
- Marketing strategy templates
- Campaign planning formats
- Brand positioning prompts

#### **Content**
- Content calendar templates
- Blog post structures
- Social media content formats

#### **Strategy**
- Brand strategy frameworks
- Competitive analysis templates
- Market research prompts

#### **Social Media**
- Platform-specific content templates
- Engagement strategy prompts
- Hashtag research formats

#### **Copywriting**
- Sales copy templates
- Email marketing formats
- Ad copy structures

#### **Analysis**
- Performance report formats
- Analytics review templates
- ROI calculation prompts

### Professional Prompt Examples

#### **Marketing Strategy Template**
```
**Marketing Strategy for {client_name}**

**Client Information:**
- Business: {client_name}
- Location: {country}

**Current Marketing Goals:**
{goals}

**Strategy Development:**
Please provide a comprehensive marketing strategy including:
1. Target audience analysis
2. Brand positioning recommendations
3. Content marketing plan
4. Social media strategy
5. Success metrics and KPIs
```

#### **Content Calendar Template**
```
**Content Calendar - {client_name}**

**Client Overview:**
- Business: {client_name}
- Location: {country}
- Marketing Goals: {goals}

Please create a detailed content calendar that includes:
1. Content themes and pillars
2. Platform-specific content
3. Posting schedule recommendations
4. Engagement strategies
5. Content types (video, images, text, etc.)
```

#### **Social Media Strategy**
```
**Social Media Strategy for {client_name}**

**Business Profile:**
- Company: {client_name}
- Market: {country}
- Objectives: {goals}

Please develop a comprehensive social media strategy including:
1. Platform selection and rationale
2. Content themes and messaging
3. Posting frequency and timing
4. Community engagement tactics
5. Growth strategies and metrics
```

## AI Client Context System

### Overview
Each chat is associated with a specific client with **granular context field selection**. Users can choose exactly which client information fields to include as context for each conversation. This provides complete control over personalization while optimizing token usage and maintaining privacy.

### Granular Context Selection
- **Field-Level Control**: Select specific client fields (country, marketing goals, notes)
- **Dynamic UI**: Checkboxes only appear for fields with actual client data
- **Context Visualization**: Selected fields shown as green badges with field names
- **Persistent Tracking**: Context selections stored in database and displayed for each chat

### Context Injection Strategy
- **First Message Only**: Selected client context is added as a system message only on the first user message
- **Memory-Based**: Subsequent messages rely on conversation memory, avoiding repeated context
- **Token Efficient**: Only selected fields included, reducing API costs and improving response times
- **Context Transparency**: Users can see exactly which fields were used for each conversation

### System Prompt Template

The following system prompt is dynamically constructed with client context:

```typescript
const systemPrompt = `You are a professional AI assistant helping a marketing service provider with their client. You have access to the following client information and should use it to provide personalized, relevant advice and responses for content creation and marketing strategies.

CLIENT PROFILE:${client.country ? `
Country: ${client.country}` : ''}${client.goals ? `

MARKETING GOALS:
${client.goals}` : ''}${client.notes ? `

ADDITIONAL NOTES:
${client.notes}` : ''}

INSTRUCTIONS:
- Use this client information to personalize your responses for content creation and marketing strategies
- Reference their specific marketing goals and circumstances when relevant
- Be professional, creative, and supportive
- Provide actionable advice tailored to their marketing and content needs
- Focus on content creation, social media strategies, and marketing campaigns
- Maintain confidentiality and professionalism at all times

Respond naturally and conversationally while keeping this context in mind.`
```

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

# Supabase Storage (for documents)
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
npm install --legacy-peer-deps
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

### Getting Started
1. **Sign Up/Sign In**: Create an account or sign in with Clerk
2. **Create Clients**: Go to `/clients` to add marketing client profiles with their information

### Prompt Management Workflow
3. **Create Custom Prompts**: Go to `/prompts` to build your prompt library
   - **Prompt Creation**: Use the "New Prompt" button to create templates
   - **Variable Integration**: Include client variables like `{client_name}`, `{goals}`, `{country}`
   - **Category Organization**: Organize prompts by type (marketing, content, strategy, social-media, etc.)
   - **Usage Analytics**: Track which prompts are most effective

### AI Assistant Workflow
4. **Navigate to Assistant**: Go to `/assistant` for the main AI chat interface
5. **Select Client**: Choose a client from the dropdown menu
6. **Configure Context**: Select which client information fields to include:
   - Country, Marketing Goals, Notes
   - Only fields with actual data are shown
   - Dynamic labels show actual values (e.g., "Country (United States)")
7. **Create Chat**: Click "New Chat" with loading feedback during creation
8. **Use Custom Prompts**: Click "Use Prompt" to access your prompt library
   - **Automatic Variable Replacement**: Client data automatically fills template variables
   - **Smart Search**: Find prompts by name, category, or content
   - **Popular Prompts**: Quick access to most-used and recent prompts
9. **Send Messages**: Type your message (or use prompts) and press Enter or click Send
10. **View Context**: See selected context fields displayed as green badges in sidebar
11. **Chat Navigation**: Use "New Chat" button in chat sidebar or return to `/assistant`

### Chat Management
12. **Manage Chats**: Edit titles or delete chats using the dropdown menu
13. **View History**: Click on any chat in the sidebar to view conversation
14. **Context Transparency**: See exactly which client fields were used for each chat
15. **Client Information**: View essential client info in the right sidebar during chats

### Prompt Management
16. **Prompt Library**: Access `/prompts` to manage your prompt collection
17. **Analytics Dashboard**: View usage statistics and prompt performance
18. **Organization**: Search, filter, and categorize prompts for easy access

### AI Services
19. **Generate Documents**: Use `/ai-services` to create personalized marketing content
20. **Context Selection**: Same granular field selection available for all AI services
21. **Service-Specific Features**: Generate meeting reports and custom marketing documents

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

Built with ❤️ for marketing professionals and content creators.
