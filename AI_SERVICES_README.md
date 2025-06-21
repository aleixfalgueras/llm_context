# AI Marketing Services Documentation

This document provides detailed information about the AI Services feature for marketing content generation. The AI Services allow users to generate personalized marketing documents with granular client context control.

## Overview

AI Services provide automated marketing content generation using client profiles. The feature reuses the same client context system as the AI Assistant to generate personalized, professional marketing documents. Two main services are currently implemented.

## Core Technology

### Client Context Integration
- **Granular Context Selection**: Choose specific client information fields to include in generation
- **Dynamic UI**: Checkboxes only appear for fields with actual client data
- **Context Visualization**: Selected fields displayed with actual values (e.g., "Country (United States)")
- **Consistent System**: Same context selection system as the AI Assistant for familiarity

### AI Processing
- **OpenAI Integration**: Uses GPT-4o-mini for content generation
- **Client Variable Replacement**: Automatic substitution of client variables in prompts
- **Professional Output**: Production-ready marketing content for client delivery
- **Real-time Generation**: Interactive content creation with immediate feedback

## Implemented Services

### 1. Meeting Report Generation

#### Purpose
Generate professional meeting reports for client consultations, strategy sessions, and project discussions.

#### Features
- **Date Selection**: Specific meeting date picker
- **Agenda Input**: Optional meeting agenda or topics to discuss
- **Participant Information**: Optional attendee details
- **Context Selection**: Choose relevant client information fields
- **Professional Format**: Structured meeting report with sections for agenda, discussion points, action items, and next steps

#### Context Usage
- **Default Selection**: No fields selected by default (objective meeting documentation)
- **Available Fields**: Country, Marketing Goals, Notes
- **Context Purpose**: Personalizes meeting reports with relevant client background

#### Generated Content Structure
```markdown
# Meeting Report - [Client Name]
**Date:** [Selected Date]
**Type:** Marketing Consultation

## Meeting Overview
[Meeting context and purpose]

## Agenda
[Meeting topics and agenda items]

## Discussion Points
[Key points discussed during meeting]

## Client Background
[Selected client context fields]

## Action Items
[Specific action items and responsibilities]

## Next Steps
[Follow-up actions and timeline]

## Meeting Notes
[Additional notes and observations]
```

### 2. Document Generation

#### Purpose
Generate any type of marketing document using custom prompts and client context.

#### Features
- **Prompt Integration**: Select from user's custom prompt library
- **Variable Replacement**: Automatic client variable substitution in prompts
- **Context Selection**: Granular control over client information included
- **Custom Output**: Flexible document generation based on selected prompt
- **Real-time Processing**: Interactive prompt selection and content generation

#### Context Usage
- **Dynamic Selection**: All available client fields can be selected
- **Available Fields**: Country, Marketing Goals, Notes
- **Context Variables**: `{client_name}`, `{goals}`, `{country}` automatically replaced

#### Workflow
1. **Select Client**: Choose the client for document generation
2. **Choose Prompt**: Select a prompt from your custom prompt library
3. **Configure Context**: Select which client fields to include
4. **Preview Variables**: See client variables that will be replaced
5. **Generate Content**: AI creates personalized document based on prompt and context
6. **Review & Edit**: Use the built-in editor to modify generated content
7. **Save Document**: Store final document in Supabase with proper naming

#### Example Use Cases
- Marketing strategy reports
- Content calendars
- Social media plans
- Campaign proposals
- Brand guidelines
- Competitive analysis reports
- Client onboarding documents

## Technical Implementation

### Context Selection System

#### Dynamic Field Display
```typescript
interface ClientContextSelection {
  country: boolean;
  goals: boolean;
  notes: boolean;
}

// Only show checkboxes for fields with actual data
const availableFields = [
  { key: 'country', label: `Country (${client.country})`, visible: !!client.country },
  { key: 'goals', label: `Marketing Goals (${client.goals?.substring(0, 50)}...)`, visible: !!client.goals },
  { key: 'notes', label: `Notes (${client.notes?.substring(0, 50)}...)`, visible: !!client.notes }
].filter(field => field.visible);
```

#### Context Processing
- **System Prompt Enhancement**: Selected client context added to AI system prompt
- **Professional Formatting**: Context presented in structured, professional format
- **Privacy Compliance**: Only selected fields included in AI processing
- **Token Optimization**: Efficient context injection to minimize API costs

### Document Storage

#### File Organization
```
Storage Structure:
└── documents/
    └── {userId}/
        └── {clientId}/
            ├── {Client Name} Meeting Report {date}.md
            └── {Client Name} {Document Type} {timestamp}.md
```

#### Naming Conventions
- **Meeting Reports**: `{Client Name} Meeting Report {YYYY-MM-DD}.md`
- **Generated Documents**: `{Client Name} {Prompt Name} {YYYY-MM-DD-HH-mm}.md`
- **Fallback Names**: Automatic naming when client name unavailable

#### Metadata Tracking
```typescript
interface Document {
  id: string;
  userId: string;
  clientId: string;
  documentName: string;
  documentPath: string;
  documentType: 'MEETING' | 'CUSTOM_DOCUMENT';
  startDate?: Date;
  endDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}
```

### AI Processing Pipeline

#### 1. Context Preparation
```typescript
const buildSystemPrompt = (client: Client, selectedFields: ClientContextSelection) => {
  let context = `You are a professional AI assistant helping a marketing service provider create content for their client.`;
  
  if (selectedFields.country && client.country) {
    context += `\n\nClient Location: ${client.country}`;
  }
  
  if (selectedFields.goals && client.goals) {
    context += `\n\nMarketing Goals:\n${client.goals}`;
  }
  
  if (selectedFields.notes && client.notes) {
    context += `\n\nAdditional Notes:\n${client.notes}`;
  }
  
  return context;
};
```

#### 2. Content Generation
- **OpenAI API**: GPT-4o-mini model for high-quality, cost-effective generation
- **Streaming Response**: Real-time content generation with progress feedback
- **Error Handling**: Graceful handling of API failures with user feedback
- **Content Validation**: Basic validation of generated content structure

#### 3. Post-Processing
- **Markdown Formatting**: Proper markdown structure for professional appearance
- **Variable Substitution**: Final pass to ensure all variables are replaced
- **Content Sanitization**: Remove any potential harmful or inappropriate content
- **Quality Assurance**: Basic checks for content completeness and coherence

## User Interface

### Service Selection
- **Card-Based Layout**: Visual service selection with descriptions
- **Context Preview**: Show which client fields will be available
- **Service Status**: Clear indication of available vs. coming soon services

### Generation Dialog
- **Step-by-Step Process**: Guided workflow for document generation
- **Real-time Feedback**: Progress indicators and status updates
- **Context Visualization**: Clear display of selected client information
- **Edit Capabilities**: Built-in editor for content modification

### Content Editor
- **Markdown Support**: Rich text editing with markdown preview
- **Real-time Preview**: Live preview of formatted content
- **Save Options**: Multiple save and export options
- **Version History**: Track document modifications (future feature)

## API Endpoints

### Meeting Report Generation
```
POST /api/ai-services/generate-meeting-report
- Body: { clientId, meetingDate, agenda, participants, contextSelection }
- Returns: { content, documentPath, metadata }
```

### Document Generation
```
POST /api/ai-services/generate-custom-document
- Body: { clientId, promptId, contextSelection }
- Returns: { content, documentPath, metadata }
```

### Document Storage
```
POST /api/ai-services/save-custom-document
- Body: { documentContent, documentName, clientId, documentType }
- Returns: { documentPath, documentId, success }
```

## Security & Privacy

### Authentication
- **User Verification**: All requests require valid authentication
- **Client Ownership**: Users can only generate documents for their own clients
- **Prompt Access**: Users can only use their own custom prompts

### Data Protection
- **Context Control**: Users explicitly choose what client information to include
- **No Storage**: Client data not permanently stored in AI processing
- **Audit Trail**: Document generation tracked for transparency
- **Secure Storage**: Documents stored with user-specific access controls

## Future Enhancements

### Planned Features
- **Template Library**: Pre-built marketing document templates
- **Batch Processing**: Generate multiple documents simultaneously
- **Document Collaboration**: Share and collaborate on generated documents
- **Version Control**: Track document changes and revisions
- **Export Options**: PDF, Word, and other format exports
- **Analytics**: Track document performance and client engagement

### Additional Services
- **Campaign Builder**: Generate complete marketing campaigns
- **Content Series**: Create interconnected content pieces
- **Performance Reports**: Generate analytics and performance summaries
- **Competitive Analysis**: AI-powered competitor research documents
- **Brand Guidelines**: Generate comprehensive brand style guides

## Best Practices

### Prompt Creation
- **Clear Instructions**: Use specific, actionable language in prompts
- **Variable Usage**: Leverage client variables for personalization
- **Category Organization**: Organize prompts by document type or purpose
- **Testing**: Test prompts with different client profiles

### Context Selection
- **Relevance**: Only select client fields relevant to the document type
- **Privacy**: Consider what information is necessary vs. nice-to-have
- **Efficiency**: More context isn't always better - be strategic
- **Consistency**: Use similar context selections for similar document types

### Content Quality
- **Review Process**: Always review generated content before client delivery
- **Brand Alignment**: Ensure content matches client's brand voice and style
- **Accuracy**: Verify all facts and figures in generated content
- **Personalization**: Add human touches to make content more engaging

Built with ❤️ for marketing professionals creating exceptional content for their clients. 