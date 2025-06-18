# AI Services Feature Implementation

## Overview

The AI Services feature provides AI-powered content generation for client management. The first service implemented is **Diet Plan Generation**, which creates personalized diet plans based on client profiles and saves them as markdown documents.

## Features Implemented

### 1. AI Services Page (`/ai-services`)

- **Location**: `app/ai-services/page.tsx`
- **Component**: `components/ai-services-client.tsx`
- **Navigation**: Added to main navbar with ⚡ icon

### 2. Diet Plan Generation

#### Components:
- **Dialog Component**: `components/diet-generator-dialog.tsx`
- **API Routes**: 
  - `app/api/ai-services/generate-diet/route.ts` (Generation)
  - `app/api/ai-services/save-diet/route.ts` (Storage)

#### Features:
- Client selection dropdown with profile preview
- Date range input (start/end dates)
- Optional additional information field for extra context
- **Optional client goals inclusion toggle** - Control whether client's goals influence diet generation
- AI generation using OpenAI with client context
- Live markdown editor with preview
- Save to Supabase storage
- Document tracking in database

### 3. Database Schema

#### New Document Model:
```prisma
model Document {
  id          String   @id @default(cuid())
  userId      String   // The coach's user ID
  clientId    String   // The client this document belongs to
  documentName String  // The name of the document
  documentPath String  // Path in Supabase storage
  documentType String  // Type of document (e.g., "diet", "workout", "plan")
  startDate   DateTime? // For time-based documents
  endDate     DateTime? // For time-based documents
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  client Client @relation(fields: [clientId], references: [id], onDelete: Cascade)
}
```

### 4. Supabase Storage Integration

#### Storage Structure:
```
documents/
├── {user_id}/
    ├── {client_id}/
        ├── {Client Name} Diet {start_date} to {end_date}.md
        └── ...
```

#### Setup:
- Private bucket with markdown/text support
- 10MB file size limit
- User-specific folder access

## Technical Implementation

### Client Context Reuse

The diet generation uses the same client context system as the AI Assistant:

**File Location**: `app/api/ai-services/generate-diet/route.ts` (lines 35-68)

```typescript
const clientContextPrompt = `You are a professional AI assistant helping a coach/consultant with their client. You have access to the following client information and should use it to provide personalized, relevant advice and responses.

CLIENT PROFILE:${client.dateOfBirth ? `
Age: ${Math.floor((new Date().getTime() - new Date(client.dateOfBirth).getTime()) / (1000 * 60 * 60 * 24 * 365))} years old` : ''}${client.height ? `
Height: ${client.height}cm` : ''}${client.weight ? `
Weight: ${client.weight}kg` : ''}${includeClientGoals && client.goals ? `

GOALS:
${client.goals}` : ''}${client.medicalHistory ? `

MEDICAL HISTORY:
${client.medicalHistory}` : ''}${client.notes ? `

ADDITIONAL NOTES:
${client.notes}` : ''}

DIET GENERATION REQUEST:
- Start Date: ${startDate}
- End Date: ${endDate}
- Duration: ${Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24))} days${additionalInfo ? `
- Additional Information: ${additionalInfo}` : ''}

INSTRUCTIONS:
- Create a comprehensive, personalized diet plan for this client
- Use the client's profile information to tailor recommendations
- Structure the diet plan in a clear, professional format
- Include meal plans, portion recommendations, and nutritional guidance
- Consider their${includeClientGoals && client.goals ? ' goals,' : ''} medical history, and personal circumstances${additionalInfo ? `
- Pay special attention to the additional information provided above` : ''}
- Provide the response in markdown format for easy reading
- DO NOT include any suggestions about consulting healthcare professionals
- DO NOT include any disclaimers or OpenAI-related content
- Provide ONLY the diet plan content in a delivery-ready format
- Make it actionable and specific to this client's needs`
```

### Client Goals Toggle Feature

The diet generation includes a toggle to control whether the client's goals should influence the AI's diet recommendations:

#### When Goals Are Included (Default):
- AI considers the client's fitness/health goals
- Diet plan is tailored to support specific objectives
- Example: Weight loss goals influence caloric recommendations

#### When Goals Are Excluded:
- AI focuses purely on nutritional health without goal bias
- Useful when client goals might conflict with dietary needs
- Example: Ignoring "gain muscle fast" goal for a balanced approach

#### Implementation:
**File Location**: `app/api/ai-services/generate-diet/route.ts` (lines 40-42, 58)

```typescript
// Goals are conditionally included in the AI prompt
${includeClientGoals && client.goals ? `
GOALS:
${client.goals}` : ''}

// Instructions also conditionally reference goals
Consider their${includeClientGoals && client.goals ? ' goals,' : ''} medical history, and personal circumstances
```

### File Naming Convention

Documents are saved with the following naming pattern:
```
{Client Name} Diet {YYYY-MM-DD} to {YYYY-MM-DD}.md
```

Example: `John Doe Diet 2024-01-15 to 2024-02-15.md`

### API Endpoints

#### Generate Diet: `POST /api/ai-services/generate-diet`
**Request Body:**
```json
{
  "clientId": "string",
  "startDate": "YYYY-MM-DD",
  "endDate": "YYYY-MM-DD",
  "additionalInfo": "string (optional)",
  "includeClientGoals": "boolean (optional, defaults to true)"
}
```

**Response:**
```json
{
  "diet": "markdown formatted diet plan"
}
```

#### Save Diet: `POST /api/ai-services/save-diet`
**Request Body:**
```json
{
  "clientId": "string",
  "startDate": "YYYY-MM-DD", 
  "endDate": "YYYY-MM-DD",
  "additionalInfo": "string (optional)",
  "includeClientGoals": "boolean (optional)",
  "dietContent": "markdown content"
}
```

**Response:**
```json
{
  "success": true,
  "document": {
    "id": "string",
    "name": "document name",
    "path": "storage path",
    "type": "diet",
    "startDate": "date",
    "endDate": "date"
  }
}
```

## Security & Privacy

### Authentication
- All routes protected with Clerk authentication
- User ID verification on all operations
- Client ownership validation

### Data Privacy
- Same privacy model as AI Assistant
- No client names/emails sent to OpenAI
- Only health information and goals used for context

### Storage Security
- Private Supabase bucket
- User-specific folder structure
- Document ownership validation

## Usage Flow

1. **Navigate to AI Services**: User clicks AI Services in navbar
2. **Select Service**: Click "Get Started" on Diet Generation
3. **Choose Client**: Select from dropdown with profile preview
4. **Set Date Range**: Pick start and end dates for diet plan
5. **Add Context** (Optional): Enter additional information for this specific diet plan
6. **Configure Goals**: Toggle whether to include client's goals in generation (checked by default)
7. **Generate**: AI creates personalized diet using client context
8. **Edit & Preview**: Modify content with live markdown preview
9. **Save**: Document saved to Supabase storage and tracked in database

## Future Enhancements

### Planned Services
- **Workout Plan Generation**: Custom exercise routines
- **Progress Reports**: Client achievement tracking
- **Meal Prep Guides**: Detailed preparation instructions

### Potential Features
- Document version history
- Template system
- Batch generation
- Client portal access
- PDF export
- Email delivery

## Setup Instructions

### 1. Database Migration
```bash
npx prisma generate
npx prisma db push
```

### 2. Supabase Storage Setup
```bash
node scripts/setup-supabase-storage.js
```

### 3. Environment Variables
Ensure these are set in `.env.local`:
```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_KEY=your_supabase_service_role_key
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_KEY=your_supabase_anon_key
OPENAI_API_KEY=your_openai_api_key
SUPABASE_DOCUMENTS_BUCKET=documents
```

### 4. Install Dependencies
All required dependencies are already included:
- `@supabase/supabase-js` for storage
- `react-markdown` for preview
- `lucide-react` for icons

## File Structure

```
app/
├── ai-services/
│   └── page.tsx
├── api/
│   └── ai-services/
│       ├── generate-diet/
│       │   └── route.ts
│       └── save-diet/
│           └── route.ts
components/
├── ai-services-client.tsx
├── diet-generator-dialog.tsx
└── ui/
    └── select.tsx (added)
lib/
├── supabase.ts (new)
└── document-actions.ts (new)
prisma/
└── schema.prisma (updated)
scripts/
└── setup-supabase-storage.js (new)
```

## Testing

1. Ensure you have clients created in the system
2. Navigate to `/ai-services`
3. Test diet generation with different clients
4. Verify documents are saved and retrievable
5. Check Supabase storage bucket for files

The feature is fully functional and ready for use! 