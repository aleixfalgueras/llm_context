# AI Coach Assistant

A modern AI-powered coaching assistant built with Next.js 14, React 18, and OpenAI integration. Designed for coaches and consultants to have personalized AI conversations with client-specific context.

## Features

### Core Functionality
- **AI Conversations**: Natural conversations with OpenAI's GPT-4o-mini with granular client context selection
- **Client Management**: Create, view, edit, and delete client profiles
- **Custom Prompt Management**: Create, organize, and reuse personalized AI prompts with automatic client variable replacement
- **Medical History PDF Extraction**: AI-powered comprehensive extraction from medical documents with privacy protection
- **Granular Context Control**: Select specific client information fields (age, height, weight, country, goals, medical history, notes) for each conversation
- **Context Field Tracking**: View exactly which client fields were used as context for each chat
- **Chat Management**: Create, view, edit, and delete chat conversations with client association
- **Real-time Messaging**: Send and receive messages in real-time
- **Message History**: Persistent chat history stored in database with context metadata
- **Context Optimization**: Efficient token usage with smart context injection and field selection
- **AI Services**: Generate personalized documents with granular client context control

### User Experience  
- **ChatGPT-like Interface**: Clean, minimalistic design similar to ChatGPT
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Loading States**: Beautiful loading overlays during chat creation with progress feedback
- **Context Selection UI**: Intuitive checkboxes for selecting client context fields with dynamic labels
- **Context Visualization**: Green badges showing selected context fields for each chat
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
│   │   ├── prompts/       # Prompt management APIs
│   │   │   ├── route.ts  # List and create prompts
│   │   │   ├── [id]/route.ts # Get, update, delete individual prompts
│   │   │   └── [id]/use/route.ts # Track prompt usage analytics
│   │   └── ai-services/   # AI document generation APIs
│   │       ├── extract-medical-history/  # Medical history PDF extraction
│   │       ├── generate-diet/            # Diet plan generation
│   │       ├── generate-workout/         # Workout plan generation
│   │       ├── extract-blood-test/       # Blood test PDF extraction
│   │       ├── generate-blood-test-report/ # Blood test analysis
│   │       └── generate-meeting-report/  # Meeting report generation
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
│   ├── ui/               # shadcn/ui components (including new badge.tsx)
│   ├── chat-sidebar.tsx  # Chat history sidebar with new chat button
│   ├── chat-messages.tsx # Message display
│   ├── chat-input.tsx    # Message input form with prompt selector integration
│   ├── client-context-sidebar.tsx # Client selection and context configuration
│   ├── prompt-dialog.tsx # Create/edit prompt dialog with variable tooltip
│   ├── prompt-selector.tsx # Prompt selection dropdown for chat interface
│   ├── prompts-management.tsx # Complete prompt management dashboard
│   ├── ai-services-client.tsx # AI Services page
│   ├── diet-generator-dialog.tsx # Diet generation dialog with context selection
│   ├── workout-generator-dialog.tsx # Workout generation dialog with context selection
│   ├── blood-test-analysis-dialog.tsx # Blood test analysis dialog with context selection
│   ├── meeting-report-dialog.tsx # Meeting report generation dialog
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
- `contextFields`: Array of selected context field names (e.g., ["age", "height", "goals"])
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
- `medicalHistory`: Comprehensive medical information (can be manually entered or AI-extracted from PDFs)
- `notes`: General notes about the client
- `createdAt/updatedAt`: Timestamps

### Document Model
- `id`: Unique identifier
- `userId`: Coach/consultant's user ID
- `clientId`: Associated client ID
- `documentName`: Document name/title
- `documentPath`: Storage path in Supabase
- `documentType`: Type (e.g., "diet", "workout", "blood-test-analysis", "meeting")
- `startDate/endDate`: Optional date range for time-based documents
- `createdAt/updatedAt`: Timestamps

### Prompt Model
- `id`: Unique identifier
- `userId`: Owner's user ID
- `name`: User-friendly prompt name
- `description`: Optional description of prompt purpose
- `content`: The actual prompt template with variable placeholders
- `category`: Organization category (medical, fitness, nutrition, coaching, analysis, formatting, general, custom)
- `isActive`: Boolean flag to enable/disable prompts
- `usageCount`: Analytics counter for tracking popularity
- `createdAt/updatedAt`: Timestamps

## Custom Prompt Management System

### Overview
The Custom Prompt Management System allows users to create, organize, and reuse personalized AI prompts with automatic client variable replacement. This powerful feature transforms the AI assistant from a generic chat into a professional coaching tool with standardized, yet personalized responses.

### Key Features

#### **Prompt Creation & Organization**
- **Rich Prompt Editor**: Create detailed prompt templates with descriptions and categories
- **Variable Support**: Use client data variables like `{client_name}`, `{medical_history}`, `{goals}`, `{age}`, `{height}`, `{weight}`, `{country}`
- **Category System**: Organize prompts by type (medical, fitness, nutrition, coaching, analysis, formatting, general, custom)
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
{client_name}     → Client's full name
{medical_history} → Complete medical history
{goals}           → Client's goals and objectives
{age}             → Calculated age from date of birth
{height}          → Height in centimeters
{weight}          → Weight in kilograms
{country}         → Client's country/location
```

#### **Variable Replacement Examples**

**Template:**
```
Please create a comprehensive assessment for {client_name}, a {age}-year-old from {country}.

**Client Profile:**
- Goals: {goals}
- Physical: {height} tall, {weight}
- Medical considerations: {medical_history}

Please provide personalized recommendations based on this information.
```

**After Variable Replacement:**
```
Please create a comprehensive assessment for John Smith, a 35-year-old from United States.

**Client Profile:**
- Goals: Lose 15kg for wedding in 6 months, improve cardiovascular health
- Physical: 175cm tall, 80kg
- Medical considerations: Mild asthma (exercise-induced), no known allergies

Please provide personalized recommendations based on this information.
```

### Prompt Categories

#### **Medical**
- Medical report formats
- Health assessment templates
- Clinical recommendation structures

#### **Fitness**
- Workout plan templates
- Exercise assessment formats
- Fitness goal evaluation prompts

#### **Nutrition**
- Diet plan structures
- Nutritional assessment templates
- Meal planning prompts

#### **Coaching**
- Motivational communication styles
- Progress check-in templates
- Client consultation frameworks

#### **Analysis**
- Progress report formats
- Data analysis templates
- Performance evaluation structures

#### **Formatting**
- Professional email templates
- Document formatting guides
- Communication style prompts

### Usage Analytics

#### **Tracking Metrics**
- **Usage Count**: How many times each prompt has been used
- **Popular Prompts**: Most frequently used prompts highlighted
- **Recent Activity**: Recently created and updated prompts
- **Category Distribution**: Prompt distribution across categories

#### **Analytics Dashboard**
- **Total Prompts**: Count of all prompts (active and inactive)
- **Active Prompts**: Count of currently enabled prompts
- **Most Used Prompt**: Identifies the most popular prompt with usage count
- **Category Overview**: Visual representation of prompt categories

### Management Interface

#### **Prompt Cards**
- **Visual Organization**: Card-based layout with soft blue styling
- **Quick Actions**: Edit, enable/disable, and delete prompts directly from cards
- **Usage Indicators**: Display usage count and activity status
- **Category Badges**: Visual category identification
- **Description Preview**: Show prompt descriptions for easy identification

#### **Advanced Features**
- **Bulk Operations**: Enable/disable multiple prompts
- **Export/Import**: Share prompt templates between users (future feature)
- **Template Library**: Pre-built professional prompt templates
- **Collaboration**: Share prompts with team members (future feature)

### Professional Prompt Examples

#### **Medical Report Template**
```
**Medical Assessment for {client_name}**

**Patient Information:**
- Age: {age}
- Physical: {height}, {weight}
- Location: {country}

**Medical History:**
{medical_history}

**Current Goals:**
{goals}

**Assessment & Recommendations:**
Please provide a comprehensive medical assessment with specific recommendations based on the patient's history and goals.
```

#### **Fitness Evaluation Template**
```
**Fitness Assessment - {client_name}**

**Client Profile:**
- {age} years old, {height}, {weight}
- Location: {country}
- Goals: {goals}

**Medical Considerations:**
{medical_history}

Please conduct a thorough fitness evaluation and provide:
1. Current fitness level assessment
2. Customized exercise recommendations
3. Safety considerations based on medical history
4. Progressive training plan aligned with goals
```

#### **Motivational Coaching Style**
```
Hi {client_name}! 🌟

I'm excited to work with you on your journey! Your goals of {goals} are absolutely achievable.

**What makes you unique:**
- Your commitment at {age} is inspiring
- Your health profile shows: {medical_history}
- Your location in {country} gives us great opportunities

Let's create a personalized plan that fits your life perfectly! What specific area would you like to focus on first?
```

## AI Client Context System

### Overview
Each chat is associated with a specific client with **granular context field selection**. Users can choose exactly which client information fields to include as context for each conversation. This provides complete control over personalization while optimizing token usage and maintaining privacy.

### Granular Context Selection
- **Field-Level Control**: Select specific client fields (age, height, weight, country, goals, medical history, notes)
- **Dynamic UI**: Checkboxes only appear for fields with actual client data
- **Context Visualization**: Selected fields shown as green badges with field names
- **Persistent Tracking**: Context selections stored in database and displayed for each chat

### Context Injection Strategy
- **First Message Only**: Selected client context is added as a system message only on the first user message
- **Memory-Based**: Subsequent messages rely on conversation memory, avoiding repeated context
- **Token Efficient**: Only selected fields included, reducing API costs and improving response times
- **Context Transparency**: Users can see exactly which fields were used for each conversation

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
- **Granular Context Selection**: Choose specific client fields (age, height, weight, country, goals, medical history, notes)
- **Dynamic UI**: Checkboxes only show for fields with actual client data
- **Date Range**: Specific start and end dates for the diet plan
- **Nutritional Targets**: Optional calorie and protein targets
- **Additional Context**: Optional extra information for customization

#### 2. Workout Plan Generation
Creates custom exercise routines based on:
- **Granular Context Selection**: Choose specific client fields for personalization
- **Dynamic Field Display**: Only available fields shown with actual values
- **Date Range**: Specific start and end dates for the workout plan
- **Workout Specifications**: Type, frequency, duration, equipment
- **Additional Context**: Injuries, preferences, special requirements

#### 3. Blood Test Analysis
Analyzes medical blood test reports with:
- **PDF Upload**: Direct upload of blood test reports (10MB limit)
- **AI Extraction**: Automatic parameter extraction from PDF
- **Parameter Review**: Edit and validate all extracted data
- **Anomalous Detection**: Automatic highlighting of concerning values
- **Context Selection**: Choose client fields for analysis (goals excluded by default for medical objectivity)
- **Multi-language Support**: Works with Spanish and English reports

### Key Features Across All Services:
- **Granular Context Control**: Same field-level selection system as AI Assistant
- **Context Presets**: Default selections based on service type (fitness, medical, general)
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

### Context Selection Strategy:
- **Diet & Workout Plans**: Fitness preset (all fields selected by default)
- **Blood Test Analysis**: Medical preset (goals excluded by default for objectivity)
- **Meeting Reports**: No client context (focused on objective documentation)

For detailed implementation information, see [AI_SERVICES_README.md](AI_SERVICES_README.md).

## Medical History PDF Extraction

### Overview
The Medical History PDF Extraction feature provides comprehensive AI-powered extraction of medical information from PDF documents. This feature enhances client profile creation by automatically extracting and organizing medical data while maintaining complete patient privacy through anonymization.

### Key Features

#### **Comprehensive Data Extraction**
- **Primary Diagnoses**: Working diagnoses, differential diagnoses, suspected conditions
- **Detailed Conditions**: Current/past/chronic conditions with severity and treatment information
- **Medications**: Current, past, and discontinued medications with dosages, responses, and side effects
- **Laboratory Results**: Blood work, values, reference ranges, trends, and clinical significance
- **Imaging Studies**: CT, MRI, X-ray findings with impressions and clinical relevance
- **Symptoms**: Onset, duration, severity, triggers, and functional impact assessment
- **Assessment Plans**: Clinical assessments, treatment plans, and follow-up requirements

#### **Enhanced Clinical Information**
- **Vital Signs**: Measurements with normal/abnormal interpretations
- **Physical Examinations**: System-by-system findings with clinical significance
- **Social History**: Occupation, exposures, lifestyle factors affecting health
- **Functional Status**: Work impact, daily activities, sleep patterns, quality of life
- **Family History**: Detailed family medical history with relationships and conditions

#### **Privacy-First Approach**
- **Complete Anonymization**: Automatically removes all personally identifiable information
- **HIPAA-Compliant Processing**: No storage of PDF files - processing in memory only
- **Secure Extraction**: User authentication and client ownership verification required
- **Privacy Protection**: Names, addresses, dates, provider names automatically anonymized

#### **Advanced Processing Capabilities**
- **Large Document Support**: Handles up to 40 pages and 50MB PDF files
- **Smart Text Processing**: Up to 400,000 characters with intelligent truncation
- **High Token Output**: 32,000 token responses for comprehensive extraction
- **Multi-format Support**: Works with various medical document formats and layouts

### Technical Implementation

#### **AI Processing Pipeline**
1. **PDF Upload**: Secure file upload with size and format validation
2. **Text Extraction**: Advanced PDF parsing using `pdf-parse` library
3. **AI Analysis**: OpenAI GPT-4o-mini processes text with comprehensive medical prompts
4. **Data Structuring**: Organizes extracted information into structured JSON format
5. **Summary Generation**: Creates readable summary organized by medical sections
6. **Privacy Validation**: Ensures all personal information has been anonymized

#### **Extracted Data Structure**
```json
{
  "primaryDiagnoses": [{"diagnosis", "status", "timeframe", "severity", "notes"}],
  "conditions": [{"condition", "status", "treatment", "progression"}],
  "medications": [{"medication", "dosage", "indication", "response"}],
  "labResults": [{"test", "result", "significance", "trend"}],
  "imaging": [{"study", "findings", "impression", "significance"}],
  "symptoms": [{"symptom", "onset", "severity", "impact"}],
  "vitalSigns": [{"parameter", "value", "significance"}],
  "physicalExam": [{"system", "findings", "significance"}],
  "assessmentPlan": [{"problem", "assessment", "plan", "followUp"}],
  "summary": {
    "primaryConcerns": "Main medical issues and diagnoses",
    "currentTreatments": "Current medications and treatments",
    "keyFindings": "Important lab results and exam findings",
    "functionalImpact": "How conditions affect daily life",
    "riskFactors": "Family history and lifestyle factors",
    "clinicalStatus": "Overall clinical picture and trajectory"
  }
}
```

#### **Integration Points**
- **Client Form**: Available during both client creation and editing
- **Real-time Processing**: Immediate extraction and population of medical history field
- **User Control**: Review and edit extracted information before saving
- **Override Protection**: Warns users before replacing existing medical history content

### Usage Workflow

#### **For New Clients**
1. Fill out client form with basic information
2. Upload medical history PDF using the "Upload PDF" button
3. Click "Extract" to process the document with AI
4. Review and edit the extracted medical history information
5. Complete client creation with comprehensive medical history populated

#### **For Existing Clients**
1. Edit client profile
2. Upload medical history PDF
3. AI extracts and organizes medical information
4. Review and modify extracted content as needed
5. Save updated client profile with enhanced medical history

### Processing Capabilities

#### **Document Types Supported**
- Hospital discharge summaries
- Physician consultation notes
- Medical history and physical examination reports
- Specialist reports and assessments
- Laboratory and diagnostic reports
- Treatment summaries and care plans

#### **Clinical Information Extracted**
- **Diagnostic Information**: Primary and differential diagnoses, suspected conditions
- **Treatment History**: Current and past medications, procedures, therapies
- **Clinical Findings**: Lab results, imaging findings, physical exam results
- **Functional Assessment**: Impact on daily activities, work capacity, quality of life
- **Risk Factors**: Family history, lifestyle factors, occupational exposures
- **Care Plans**: Treatment recommendations, follow-up requirements, patient education

### Security and Compliance

#### **Privacy Protections**
- **No File Storage**: PDFs processed in memory only, never stored permanently
- **Automatic Anonymization**: All personal identifiers removed during processing
- **User Authentication**: Requires valid user login and client ownership verification
- **Secure Processing**: All API calls secured with authentication middleware

#### **Data Handling**
- **Memory-Only Processing**: PDF content processed and discarded immediately
- **Structured Output**: Only anonymized medical information stored in client profile
- **User Control**: Complete control over what information is saved
- **Audit Trail**: Processing metadata available for transparency

### Performance Optimizations

- **Intelligent Truncation**: Smart text truncation at sentence boundaries for large documents
- **Efficient Processing**: Optimized prompts for comprehensive yet efficient extraction
- **Progress Feedback**: Real-time processing status and completion notifications
- **Error Handling**: Graceful handling of processing failures with informative error messages

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

### Getting Started
1. **Sign Up/Sign In**: Create an account or sign in with Clerk
2. **Create Clients**: Go to `/clients` to add client profiles with their information
   - **Medical History PDF Extraction**: Upload medical PDFs for AI-powered comprehensive extraction
   - **Privacy Protection**: All personal information automatically anonymized during extraction

### Prompt Management Workflow
3. **Create Custom Prompts**: Go to `/prompts` to build your prompt library
   - **Prompt Creation**: Use the "New Prompt" button to create templates
   - **Variable Integration**: Include client variables like `{client_name}`, `{medical_history}`, `{goals}`
   - **Category Organization**: Organize prompts by type (medical, fitness, nutrition, coaching, etc.)
   - **Usage Analytics**: Track which prompts are most effective

### AI Assistant Workflow
4. **Navigate to Assistant**: Go to `/assistant` for the main AI chat interface
5. **Select Client**: Choose a client from the dropdown menu
6. **Configure Context**: Select which client information fields to include:
   - Age, Height, Weight, Country, Goals, Medical History, Notes
   - Only fields with actual data are shown
   - Dynamic labels show actual values (e.g., "Age (25 years)", "Height (175cm)")
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
19. **Template Sharing**: Export/import prompt templates (future feature)

### AI Services
20. **Generate Documents**: Use `/ai-services` to create personalized documents
21. **Context Selection**: Same granular field selection available for all AI services
22. **Service-Specific Presets**: Appropriate defaults based on document type

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
