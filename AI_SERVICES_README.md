# AI Services Feature Implementation

## Overview

The AI Services feature provides AI-powered content generation for client management. Four services are currently implemented: **Diet Plan Generation**, **Workout Plan Generation**, **Blood Test Analysis**, and **Meeting Report Generation**, all creating personalized content based on client profiles and saving as documents. Additionally, the platform includes **Medical History PDF Extraction** for comprehensive medical information extraction during client profile creation.

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
- Optional nutritional targets (calories, protein)
- Optional additional information field for extra context
- **Optional client goals inclusion toggle** - Control whether client's goals influence diet generation
- AI generation using OpenAI with client context
- Live markdown editor with preview
- Save to Supabase storage
- Document tracking in database

### 3. Workout Plan Generation

#### Components:
- **Dialog Component**: `components/workout-generator-dialog.tsx`
- **API Routes**: 
  - `app/api/ai-services/generate-workout/route.ts` (Generation)
  - `app/api/ai-services/save-workout/route.ts` (Storage)

#### Features:
- Client selection dropdown with profile preview
- Date range input (start/end dates)
- Workout specifications (type, fitness level, frequency, duration)
- Equipment availability input
- Optional additional information field
- **Optional client goals inclusion toggle** - Control whether client's goals influence workout generation
- AI generation using OpenAI with client context
- Live markdown editor with preview
- Save to Supabase storage
- Document tracking in database

### 4. Blood Test Analysis

#### Components:
- **Dialog Component**: `components/blood-test-analysis-dialog.tsx`
- **API Routes**: 
  - `app/api/ai-services/extract-blood-test/route.ts` (PDF Extraction)
  - `app/api/ai-services/generate-blood-test-report/route.ts` (Report Generation)
  - `app/api/ai-services/save-blood-test-report/route.ts` (Storage)

#### Features:
- **PDF Upload**: Blood test report upload with validation (10MB limit)
- **AI-Powered Extraction**: Automatic parameter extraction from PDF using OpenAI
- **Parameter Review & Editing**: Full editing capability for extracted parameters
- **Anomalous Parameter Detection**: Automatic highlighting of high/low values
- **Parameter Search**: Search functionality across all extracted parameters
- **Parameter Sorting**: Anomalous parameters displayed first for priority review
- **Health Analysis**: Comprehensive analysis based on client profile (excluding goals)
- **Live Editor**: Edit generated report with real-time markdown preview
- **Document Storage**: Save to Supabase storage with database tracking

#### Blood Test Analysis Flow:
1. **Upload**: Client selection and PDF upload (compact button interface)
2. **Extraction**: AI extracts blood parameters, test info, and reference ranges
3. **Review**: 
   - Anomalous parameters highlighted at top
   - All parameters editable (name, value, unit, reference ranges, status)
   - Search functionality for quick parameter location
   - Add/remove parameters as needed
4. **Generation**: AI creates comprehensive health analysis (goals excluded for objectivity)
5. **Edit & Save**: Live markdown editor with preview, save to storage

#### Blood Test Parameters Extracted:
- **Parameter Details**: Name, value, unit, reference min/max, status
- **Test Information**: Test date, laboratory name, doctor name
- **Status Calculation**: Automatic normal/high/low determination
- **Multi-language Support**: Works with Spanish and English blood tests
- **Parameter Management**: Add, edit, remove, and search parameters

#### Key Technical Features:
- **PDF Processing**: Uses `pdf-parse` library for text extraction
- **Large Report Support**: 16,000 token limit for comprehensive blood panels
- **Parameter Prioritization**: Anomalous parameters sorted first
- **Editable Interface**: All extracted data can be corrected before analysis
- **Search Functionality**: Multi-field search across parameter names, values, units, status

### 5. Meeting Report Generation

#### Components:
- **Dialog Component**: `components/meeting-report-dialog.tsx`
- **API Routes**: 
  - `app/api/ai-services/generate-meeting-report/route.ts` (Generation)
  - `app/api/ai-services/save-meeting-report/route.ts` (Storage)

#### Features:
- Client selection dropdown with profile preview
- Meeting date input
- Large text area for meeting transcription input
- **Optional client context toggle** - Control whether client's profile influences analysis
- Optional additional context field for extra information
- AI generation using OpenAI with structured report format
- Live markdown editor with preview
- Save to Supabase storage
- Document tracking in database

#### Meeting Report Analysis Flow:
1. **Setup**: Client selection and meeting date input
2. **Transcription**: Paste or type meeting transcription/notes
3. **Context Control**: Toggle client profile information usage
4. **Additional Context**: Optional field for extra meeting context
5. **Generation**: AI creates structured meeting report with actionable insights
6. **Edit & Save**: Live markdown editor with preview, save to storage

#### Meeting Report Structure:
- **Meeting Summary**: Overview of the session
- **Key Discussion Points**: Main topics covered
- **Client Progress & Updates**: Progress since last meeting
- **Action Items & Next Steps**: Specific, actionable tasks
- **Recommendations**: Professional advice and suggestions

#### Key Features:
- **Transcription Analysis**: AI processes meeting notes to extract insights
- **Actionable Insights**: Focus on practical next steps
- **Client Context Integration**: Optional use of client profile for personalized analysis
- **Professional Format**: Structured, professional meeting documentation
- **Flexible Input**: Accepts transcriptions, notes, or bullet points

### 6. Medical History PDF Extraction

#### Components:
- **Integration**: Embedded in `components/client-form.tsx`
- **API Route**: `app/api/ai-services/extract-medical-history/route.ts`

#### Features:
- **Comprehensive Data Extraction**: AI-powered extraction of medical information from PDF documents
- **Privacy-First Processing**: Complete anonymization of all personally identifiable information
- **Advanced Medical Understanding**: Extracts diagnoses, medications, lab results, imaging findings, and assessments
- **Large Document Support**: Handles up to 40 pages and 50MB PDF files with intelligent truncation
- **Real-time Processing**: Immediate extraction and population of medical history field
- **User Control**: Review and edit extracted information before saving
- **Secure Processing**: Memory-only processing with no file storage

#### Medical History Extraction Flow:
1. **Upload**: PDF upload during client creation or editing (up to 50MB)
2. **Processing**: AI extracts comprehensive medical information using GPT-4o-mini
3. **Anonymization**: Automatic removal of all personal identifiers
4. **Structuring**: Organization into comprehensive medical sections
5. **Review**: User reviews and edits extracted information
6. **Integration**: Extracted summary populates medical history field

#### Extracted Medical Information:
- **Primary Diagnoses**: Working diagnoses, differential diagnoses, suspected conditions
- **Conditions**: Current/past/chronic conditions with severity and treatment details
- **Medications**: Current, past, discontinued medications with dosages and responses
- **Laboratory Results**: Blood work, values, reference ranges, trends, clinical significance
- **Imaging Studies**: CT, MRI, X-ray findings with impressions and clinical relevance
- **Symptoms**: Onset, duration, severity, triggers, functional impact
- **Vital Signs**: Measurements with normal/abnormal interpretations
- **Physical Examinations**: System-by-system findings with clinical significance
- **Assessment Plans**: Clinical assessments, treatment plans, follow-up requirements
- **Social/Family History**: Occupation, exposures, family medical history

#### Technical Specifications:
- **Processing Capacity**: Up to 400,000 characters of text extraction
- **AI Model**: OpenAI GPT-4o-mini with 32,000 token output capacity
- **Document Types**: Hospital summaries, consultation notes, lab reports, treatment plans
- **Privacy Compliance**: HIPAA-compliant processing with complete anonymization
- **Integration Points**: Available during both client creation and editing workflows
- **Error Handling**: Graceful handling of processing failures with informative feedback

#### Privacy and Security Features:
- **No File Storage**: PDFs processed in memory only, never stored permanently
- **Automatic Anonymization**: Names, addresses, dates, provider names removed
- **User Authentication**: Requires valid login and client ownership verification
- **Secure API**: All endpoints protected with authentication middleware
- **Data Control**: Users have complete control over what information is saved

#### Usage Integration:
- **Client Creation**: Upload and extract medical history during new client setup
- **Client Editing**: Add or update medical history for existing clients
- **Override Protection**: Warns before replacing existing medical history content
- **Summary Format**: Organized plain text summary with section headers
- **Progress Feedback**: Real-time processing status and completion notifications

### 7. Database Schema

#### Document Model:
```prisma
model Document {
  id          String   @id @default(cuid())
  userId      String   // The coach's user ID
  clientId    String   // The client this document belongs to
  documentName String  // The name of the document
  documentPath String  // Path in Supabase storage
  documentType String  // Type: "diet", "workout", "blood-test-analysis", "meeting"
  startDate   DateTime? // For time-based documents (diet/workout)
  endDate     DateTime? // For time-based documents (diet/workout)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  client Client @relation(fields: [clientId], references: [id], onDelete: Cascade)
}
```

### 8. Supabase Storage Integration

#### Storage Structure:
```
documents/
├── {user_id}/
    ├── {client_id}/
        ├── {Client Name} Diet {start_date} to {end_date}.md
        ├── {Client Name} Workout {start_date} to {end_date}.md
        ├── {Client Name} Blood Test Analysis {test_date}.md
        ├── {Client Name} Meeting Report - {meeting_date}.md
        └── ...
```

#### Setup:
- Private bucket with markdown/text support
- 10MB file size limit for documents and PDF uploads
- User-specific folder access

## Technical Implementation

### Client Context Strategy

All AI services use the same client context system, with one important distinction:

#### Diet & Workout Generation (Goals Included):
- **Optional Goals Toggle**: User can choose to include/exclude client goals
- **Personalized Recommendations**: Based on fitness/health objectives
- **Goal-Oriented Output**: Plans aligned with client aspirations

#### Blood Test Analysis (Goals Excluded):
- **Medical Objectivity**: Goals are never included in context
- **Health-Focused Analysis**: Based purely on clinical data and health optimization
- **Unbiased Recommendations**: Medical interpretations not influenced by fitness goals

#### Meeting Report Generation (Goals Optional):
- **Client Context Toggle**: User can choose to include/exclude client profile information
- **Flexible Analysis**: Can generate reports with or without client context
- **Actionable Insights**: Focus on practical next steps and professional documentation
- **Meeting-Focused**: Analysis based on meeting content and optional client context

### Client Goals Toggle Feature

Diet, workout, and meeting report generation include toggles to control client context influence:

#### When Goals Are Included (Default for diet/workout):
- AI considers the client's fitness/health goals
- Plans tailored to support specific objectives
- Example: Weight loss goals influence caloric recommendations

#### When Goals Are Excluded:
- AI focuses purely on health without goal bias
- Useful when goals might conflict with optimal plans
- Blood test analysis always excludes goals for medical objectivity

### File Naming Conventions

Documents are saved with specific naming patterns:

```
Diet Plans: {Client Name} Diet {YYYY-MM-DD} to {YYYY-MM-DD}.md
Workout Plans: {Client Name} Workout {YYYY-MM-DD} to {YYYY-MM-DD}.md
Blood Test Analysis: {Client Name} Blood Test Analysis {YYYY-MM-DD}.md
Meeting Reports: {Client Name} Meeting Report - {YYYY-MM-DD}.md
```

## API Endpoints

### Blood Test Analysis

#### Extract Blood Test: `POST /api/ai-services/extract-blood-test`
**Request Body (FormData):**
```
file: PDF file (max 10MB)
clientId: string
additionalInfo: string (optional - for non-standard PDF formats)
```

**Response:**
```json
{
  "success": true,
  "extractedData": {
    "testInfo": {
      "testDate": "YYYY-MM-DD",
      "labName": "laboratory name",
      "doctorName": "doctor name"
    },
    "parameters": [
      {
        "name": "parameter name",
        "value": "test value",
        "unit": "unit",
        "referenceMin": "min value",
        "referenceMax": "max value",
        "status": "normal/high/low"
      }
    ]
  }
}
```

#### Generate Blood Test Report: `POST /api/ai-services/generate-blood-test-report`
**Request Body:**
```json
{
  "clientId": "string",
  "testDate": "YYYY-MM-DD",
  "additionalInfo": "string (optional)",
  "extractedData": "extracted parameters object"
}
```

**Response:**
```json
{
  "success": true,
  "report": "markdown formatted analysis report"
}
```

#### Save Blood Test Report: `POST /api/ai-services/save-blood-test-report`
**Request Body:**
```json
{
  "clientId": "string",
  "testDate": "YYYY-MM-DD",
  "additionalInfo": "string (optional)",
  "extractedData": "extracted parameters object",
  "reportContent": "markdown content"
}
```

### Diet Generation

#### Generate Diet: `POST /api/ai-services/generate-diet`
**Request Body:**
```json
{
  "clientId": "string",
  "startDate": "YYYY-MM-DD",
  "endDate": "YYYY-MM-DD",
  "dailyCalories": "string (optional)",
  "proteinTarget": "string (optional)",
  "additionalInfo": "string (optional)",
  "includeClientGoals": "boolean (optional, defaults to true)"
}
```

#### Save Diet: `POST /api/ai-services/save-diet`
**Request Body:**
```json
{
  "clientId": "string",
  "startDate": "YYYY-MM-DD", 
  "endDate": "YYYY-MM-DD",
  "dailyCalories": "string (optional)",
  "proteinTarget": "string (optional)",
  "additionalInfo": "string (optional)",
  "includeClientGoals": "boolean (optional)",
  "dietContent": "markdown content"
}
```

### Workout Generation

#### Generate Workout: `POST /api/ai-services/generate-workout`
**Request Body:**
```json
{
  "clientId": "string",
  "startDate": "YYYY-MM-DD",
  "endDate": "YYYY-MM-DD",
  "workoutType": "string (optional)",
  "fitnessLevel": "string (optional)",
  "daysPerWeek": "string (optional)",
  "sessionDuration": "string (optional)",
  "equipment": "string (optional)",
  "additionalInfo": "string (optional)",
  "includeClientGoals": "boolean (optional, defaults to true)"
}
```

#### Save Workout: `POST /api/ai-services/save-workout`
**Request Body:**
```json
{
  "clientId": "string",
  "startDate": "YYYY-MM-DD",
  "endDate": "YYYY-MM-DD",
  "workoutType": "string (optional)",
  "fitnessLevel": "string (optional)",
  "daysPerWeek": "string (optional)",
  "sessionDuration": "string (optional)",
  "equipment": "string (optional)",
  "additionalInfo": "string (optional)",
  "includeClientGoals": "boolean (optional)",
  "workoutContent": "markdown content"
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
- Health information and client profile used for context
- Blood test analysis excludes goals for medical objectivity

### Storage Security
- Private Supabase bucket
- User-specific folder structure
- Document ownership validation
- PDF uploads validated and processed securely

## Usage Flow

### Diet/Workout Generation:
1. **Navigate to AI Services**: User clicks AI Services in navbar
2. **Select Service**: Click "Get Started" on desired service
3. **Choose Client**: Select from dropdown with profile preview
4. **Configure Parameters**: Set date range, specifications, targets
5. **Add Context** (Optional): Enter additional information
6. **Configure Goals**: Toggle whether to include client's goals (default: yes)
7. **Generate**: AI creates personalized plan using client context
8. **Edit & Preview**: Modify content with live markdown preview
9. **Save**: Document saved to Supabase storage and tracked in database

### Blood Test Analysis:
1. **Navigate to AI Services**: User clicks AI Services in navbar
2. **Select Blood Test Analysis**: Click "Get Started" on service
3. **Choose Client & Upload**: Select client and upload PDF via button
4. **AI Extraction**: System extracts parameters and test information
5. **Review Parameters**: 
   - View anomalous parameters highlighted at top
   - Edit any extracted data using search and edit interface
   - Add/remove parameters as needed
6. **Generate Analysis**: AI creates health analysis (excluding goals)
7. **Edit & Preview**: Modify report with live markdown preview
8. **Save**: Document saved to storage with database tracking

## Dependencies & Setup

### Additional Dependencies for Blood Test Analysis:
- `pdf-parse`: PDF text extraction
- `@types/pdf-parse`: Type definitions (manual)

### Environment Variables:
```env
# Required for all services
SUPABASE_URL=your_supabase_project_url
SUPABASE_KEY=your_supabase_service_role_key
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_KEY=your_supabase_anon_key
OPENAI_API_KEY=your_openai_api_key
SUPABASE_DOCUMENTS_BUCKET=documents

# Optional OpenAI configuration
OPENAI_API_MODEL=gpt-4o-mini
OPENAI_TEMPERATURE=0.7
```

### Next.js Configuration:
```javascript
// next.config.mjs
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['pdf-parse']
  }
}
```

### TypeScript Configuration:
```json
// tsconfig.json - include types directory
{
  "compilerOptions": {
    "typeRoots": ["./node_modules/@types", "./types"]
  },
  "include": ["types/**/*.d.ts"]
}
```

## File Structure

```
app/
├── ai-services/
│   └── page.tsx
├── api/
│   └── ai-services/
│       ├── extract-blood-test/
│       │   └── route.ts
│       ├── generate-blood-test-report/
│       │   └── route.ts
│       ├── save-blood-test-report/
│       │   └── route.ts
│       ├── generate-diet/
│       │   └── route.ts
│       ├── save-diet/
│       │   └── route.ts
│       ├── generate-workout/
│       │   └── route.ts
│       └── save-workout/
│           └── route.ts
components/
├── ai-services-client.tsx
├── blood-test-analysis-dialog.tsx
├── diet-generator-dialog.tsx
├── workout-generator-dialog.tsx
└── ui/
    └── (UI components)
types/
└── pdf-parse.d.ts
lib/
├── supabase.ts
└── document-actions.ts
prisma/
└── schema.prisma (updated)
scripts/
└── setup-supabase-storage.js
```

## Testing

### Diet & Workout Generation:
1. Ensure you have clients created in the system
2. Navigate to `/ai-services`
3. Test generation with different clients and parameters
4. Verify documents are saved and retrievable
5. Test goal inclusion/exclusion toggle

### Blood Test Analysis:
1. Prepare PDF blood test reports for testing
2. Test extraction with different PDF formats
3. Verify parameter editing and search functionality
4. Test anomalous parameter detection
5. Verify comprehensive analysis generation
6. Test with both English and Spanish blood tests

## Future Enhancements

### Implemented Services (✅ Completed)
- **Diet Plan Generation**: Custom nutrition plans
- **Workout Plan Generation**: Custom exercise routines  
- **Blood Test Analysis**: PDF upload and health insights

### Planned Services
- **Progress Report Generation**: Client progress summaries
- **Meal Prep Guides**: Detailed preparation instructions
- **Supplement Recommendations**: Personalized supplement plans

### Potential Features
- Document version history
- Template system for common plans
- Batch generation for multiple clients
- Client portal access to documents
- PDF export functionality
- Email delivery system
- Integration with wearable devices

The AI Services feature is fully functional with three comprehensive services ready for production use! 