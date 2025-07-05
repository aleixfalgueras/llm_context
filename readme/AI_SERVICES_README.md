# AI Marketing Services Documentation

This document provides detailed information about the AI Services feature for marketing content generation. The AI Services allow users to generate personalized marketing documents using Google Gemini 2.0 Flash and OpenAI GPT-4.1 Nano through OpenRouter with granular client context control and professional output formatting.

## 🎯 Overview

AI Services provide automated marketing content generation using client profiles and custom prompts through the dual-model architecture (Google Gemini 2.0 Flash and OpenAI GPT-4.1 Nano). The feature leverages a unified client context system while each service maintains its own specialized prompts to generate personalized, professional marketing documents that are ready for client delivery.

## 🏗️ Core Technology

### **Prompt Architecture (New)**
- **Service-Owned Prompts**: Each AI service defines its own explicit prompt within its route file
- **Shared Client Context**: Services call `buildClientContextSection()` for consistent client information integration
- **Privacy-First Design**: User context selections are strictly respected across all services
- **Clear Separation**: Prompts are visible and maintainable in their respective service files
- **Flexible Integration**: Services can customize how they use client context based on their specific needs

### **Client Context Integration**
- **Granular Context Selection**: Choose specific client information fields to include in generation (country, general context, 3 specific context fields)
- **Dynamic UI**: Checkboxes only appear for fields with actual client data
- **Context Visualization**: Selected fields displayed with actual values (e.g., "Country (United States)")
- **Consistent System**: Same context selection system as the AI Assistant for familiarity
- **Privacy-First**: Only selected data is sent to AI provider APIs
- **Centralized Privacy Logic**: `buildClientContextSection()` ensures consistent privacy respect

### **AI Processing Architecture**
- **Dual Model System**: Google Gemini 2.0 Flash ($0.10/M input, $0.40/M output) and OpenAI GPT-4.1 Nano (same pricing) for optimal cost efficiency
- **OpenRouter Integration**: Unified API access through OpenRouter with business-sustainable pricing across both models
- **Cost-Optimized Selection**: Models chosen for 86-91% profit margins while maintaining high quality
- **Token Usage Tracking**: Real-time monitoring across both models without confusing cost estimates
- **Business Sustainability**: Pricing ensures long-term platform viability with excellent margins
- **Model Choice**: Users can select preferred model per service, with preferences saved across sessions
- **Error Handling**: Comprehensive error management with fallback capabilities across both providers
- **Client Variable Replacement**: Automatic substitution of client variables in prompts
- **Professional Output**: Production-ready marketing content formatted for client delivery
- **Real-time Generation**: Interactive content creation with immediate feedback via streaming
- **Multi-language Support**: Generate content in 10+ languages based on client preferences

### **Document Management Module** (`/lib/documents/`)
- **Modular Architecture**: Separated into repository, storage service, server service, and client service
- **Automatic Storage**: All generated content saved to Supabase with organized structure
- **Document Export**: Download documents in original Markdown format
- **Version Control**: Document history and metadata tracking
- **File Organization**: Structured storage by user/client/document type
- **Document Editing**: Update content and rename documents after creation
- **Server/Client Separation**: Clean separation for Next.js App Router compatibility

## 🚀 Currently Implemented Services

### **1. Meeting Report Generator**

#### **Purpose**
Generate comprehensive, professional meeting reports from client meeting transcriptions, detailed notes, or agendas.

#### **Prompt Structure**
The meeting report service uses its own specialized prompt that focuses on:
- Professional meeting documentation
- Actionable insights and next steps
- Clear, structured output format
- Objective meeting content analysis
- **Minimal Client Context**: Only includes client name for personalization
- **No Privacy Concerns**: Meeting reports don't use the full client context system

#### **Key Features**
- **Meeting Date Selection**: Calendar picker for accurate date recording
- **Flexible Input**: Accept meeting transcriptions, detailed notes, or agenda items
- **Isolated Prompt Logic**: Service-specific prompt optimized for meeting documentation
- **Structured Output**: Professional formatting with clear sections and action items
- **Multi-language Output**: Generate reports in client's preferred language

#### **Output Structure**
- Meeting Summary
- Key Discussion Points
- Outcomes & Decisions Made
- Action Items & Next Steps
- Follow-up Requirements
- Professional formatting with clear sections

### **2. Custom Document Generator**

#### **Purpose**
Create personalized marketing documents using custom prompt templates with automatic client variable replacement.

#### **Prompt Structure**
The custom document service:
- **User-Defined Prompts**: Uses prompts from user's prompt library or custom input
- **Client Context Integration**: Calls `buildClientContextSection()` to respect user privacy selections
- **Variable Substitution**: Automatic replacement of `{client_name}`, `{country}`
- **Flexible Context**: Only includes client information fields user explicitly selected
- **Service-Specific Logic**: Appends client context section to user's custom prompt

#### **Key Features**
- **Prompt Library Integration**: Use existing custom prompts or create new ones
- **Variable Substitution**: Automatic replacement of client variables
- **Custom Instructions**: Add specific requirements for each document
- **Context Selection**: Include relevant client information fields based on user choice (country, general context, up to 3 specific context fields)
- **Professional Formatting**: Markdown output optimized for business delivery

#### **Input Options**
- **Existing Prompt**: Select from your prompt library
- **Custom Prompt**: Create one-time custom instructions
- **Document Title**: Professional document naming
- **Additional Instructions**: Specific requirements or modifications
- **Client Context**: Select relevant information fields (respects user privacy) - up to 5 context fields available

#### **Variable System**
```
{country}         → Client's country/location
{general_context} → Client's general context

Note: The 3 specific context fields (specificContext1, specificContext2, specificContext3) 
are available for context selection but do not have corresponding template variables 
for security reasons. Their content is included in the context section when selected.
```

## 📋 Document Storage & Management

### **Storage Architecture**
```
Supabase Storage Structure:
└── user_id/
    └── client_id/
        ├── meeting_reports/
        │   └── YYYY-MM-DD_meeting_report.md
        ├── custom_documents/
        │   └── document_name.md
        └── chat_exports/
            └── chat_title_YYYY-MM-DD.md
```

### **Document Metadata**
Each document includes:
- **Document Type**: meeting-report, custom-document, chat-export
- **Client Association**: Linked to specific client profile
- **Creation Date**: Timestamp and date range (if applicable)
- **Language**: Document generation language
- **Source Information**: Original prompt or meeting details
- **File Path**: Supabase storage location

### **Export Capabilities**
- **Markdown Export**: Professional document export in Markdown format

- **Download Options**: Direct file download from storage
- **Sharing Links**: Secure, temporary access links

## 🎨 User Interface Components

### **Service Selection Dashboard**
- **Service Cards**: Visual representation of each AI service
- **Feature Lists**: Clear capability descriptions
- **Status Indicators**: Available/coming soon badges
- **Quick Actions**: Direct service access buttons

### **Context Selection Interface**
- **Client Dropdown**: Choose which client to generate content for
- **Dynamic Fields**: Only show fields with actual data
- **Value Preview**: Display actual field values in labels
- **Selection Memory**: Remember context preferences per service

### **Generation Forms**
- **Service-Specific Fields**: Tailored inputs for each service type
- **Real-time Validation**: Immediate feedback on required fields
- **Progress Indicators**: Loading states during generation
- **Error Handling**: Clear error messages and recovery options

### **Document Preview & Management**
- **Instant Preview**: Generated content displayed immediately
- **Edit Capabilities**: Modify content and document names after creation
- **Metadata Display**: Show document details and context used
- **Action Buttons**: Save, export, and download options
- **Document Organization**: Structured file management with search and filtering

## 🔧 Technical Implementation

### **Prompt Architecture**
```typescript
// Each service owns its prompt
// app/api/ai-services/generate-meeting-report/route.ts
const meetingReportPrompt = `You are a professional AI assistant helping a marketing professional generate a comprehensive meeting report...
CLIENT: ${validClient.name}
MEETING INFORMATION:
...`

// app/api/ai-services/generate-custom-document/route.ts
const clientContextSection = buildClientContextSection(validClient, selectedContextFields)
let completePrompt = processedPrompt
if (clientContextSection) {
  completePrompt = `${processedPrompt}${clientContextSection}`
}
```

### **Client Context System**
```typescript
// lib/client-context-utils.ts
export function buildClientContextSection(client: Client, selectedFields: string[] = []): string {
  // Respects user privacy selections
  // Returns formatted client context section
  // Returns empty string if no fields selected
}

export function hasClientContext(selectedFields: string[] = []): boolean {
  // Helper to check if any context was selected
}
```

### **API Architecture**
```
AI Services API Structure:
├── /api/ai-services/
│   ├── generate-meeting-report/     # Own prompt + minimal client info
│   ├── generate-custom-document/    # User prompt + client context section
│   ├── save-meeting-report/         # Save generated meeting reports
│   ├── save-custom-document/        # Save custom documents
│   └── save-chat-export/           # Save exported chat conversations
```

### **AI Integration Module** (`/lib/openrouter/`)
- **Modular Architecture**: Clean separation between client, service, error handler, and stream handler
- **OpenRouter Integration**: Unified API access to Google Gemini 2.0 Flash and OpenAI GPT-4.1 Nano
- **Dual Model Support**: Both premium models available with identical pricing ($0.10/M input, $0.40/M output)
- **Usage Tracking**: Automatic token consumption monitoring across both models
- **Temperature Control**: Configurable creativity settings (default 0.7)
- **Max Tokens**: Controlled output length (8,000 tokens) for consistent quality
- **Streaming Support**: Real-time response processing for both Google and OpenAI models
- **Robust Error Handling**: Comprehensive error management with provider-specific fallbacks
- **Performance Monitoring**: Track response times and token usage with detailed logging

### **Security Features**
- **User Verification**: All operations verify user ownership
- **Data Isolation**: Complete separation between user accounts
- **Input Sanitization**: Comprehensive validation of all inputs
- **Secure Storage**: Encrypted file storage via Supabase
- **Privacy Enforcement**: Client context selections strictly respected

## 📊 Analytics & Tracking

### **Usage Metrics**
- **Service Popularity**: Track which services are used most
- **Document Generation**: Count documents per client/service
- **Success Rates**: Monitor successful vs. failed generations
- **User Engagement**: Track feature adoption and usage patterns
- **Privacy Compliance**: Monitor client context selection patterns

### **Cost Management & Analytics**
- **Token Usage Tracking**: Monitor consumption patterns for Gemini 2.0 Flash and GPT-4.1 Nano
- **Cost-Optimized Pricing**: Subscription pricing covers AI costs with 89-91% profit margins
- **Per-User Analytics**: Track usage per user for billing and limit enforcement
- **Real-time Monitoring**: Live token consumption tracking without confusing cost estimates
- **Business Sustainability**: Pricing model ensures long-term platform viability
- **Usage Limits**: Fair token limits based on subscription tier with automatic enforcement

## 🚀 Future Enhancements

### **Planned Services**
- **Campaign Builder**: Complete marketing campaign generation
- **Content Series Creator**: Interconnected content piece generation
- **Performance Report Generator**: Analytics and KPI reporting
- **Competitive Analysis**: AI-powered competitor research
- **Brand Guidelines Generator**: Comprehensive brand style guides
- **Social Media Calendar**: Automated content scheduling
- **Email Campaign Creator**: Personalized email marketing content

### **Advanced Features**
- **Batch Processing**: Generate multiple documents simultaneously
- **Template Marketplace**: Share and discover prompt templates
- **Integration APIs**: Connect with external marketing tools
- **White-label Options**: Custom branding for agencies
- **Advanced Analytics**: Detailed performance and ROI tracking

### **User Experience Improvements**
- **Drag & Drop Interface**: Visual document builder
- **Real-time Collaboration**: Multi-user document editing
- **Version History**: Track document changes and revisions
- **Client Portal**: Dedicated client access to their documents
- **Mobile App**: Native iOS/Android applications

## 📈 Best Practices

### **Prompt Creation**
- **Clear Instructions**: Use specific, actionable language
- **Variable Usage**: Leverage client variables for personalization
- **Testing**: Validate prompts with different client profiles
- **Iteration**: Refine prompts based on output quality

### **Context Selection**
- **Relevance**: Only select client fields relevant to the document
- **Privacy**: Consider what information is necessary vs. nice-to-have
- **Efficiency**: More context isn't always better - be strategic
- **Consistency**: Use similar context selections for similar documents

### **Content Quality**
- **Review Process**: Always review generated content before delivery
- **Brand Alignment**: Ensure content matches client's brand voice
- **Accuracy**: Verify all facts and figures in generated content
- **Personalization**: Add human touches for authentic engagement

### **Workflow Optimization**
- **Prompt Library**: Build reusable templates for common tasks
- **Context Presets**: Save frequently used context combinations
- **Batch Generation**: Create multiple documents in single sessions
- **Client Feedback**: Incorporate client preferences into future content

## 🛡️ Privacy & Compliance

### **Data Handling**
- **Minimal Data Transfer**: Only selected fields sent to OpenAI
- **No Personal Identifiers**: Client names and sensitive data handled carefully
- **Audit Trails**: Complete logging of all data processing activities
- **GDPR Compliance**: Full compliance with privacy regulations

### **Client Data Protection**
- **Encryption**: All data encrypted in transit and at rest
- **Access Controls**: Role-based access to client information
- **Data Retention**: Configurable retention policies
- **Deletion Rights**: Complete data removal capabilities

## 🎛️ Dual Model Architecture

### **Available Models**
- **Google Gemini 2.0 Flash**: Latest Google model with enhanced reasoning and 1M context length
- **OpenAI GPT-4.1 Nano**: Efficient OpenAI model with excellent performance and 200K context length

### **Model Selection Interface**
- **Unified Access**: All subscription tiers have access to both premium models
- **Per-Service Selection**: Choose appropriate model for each AI service type
- **Persistent Preferences**: Model choices are saved and remembered across sessions
- **Cost Consistency**: Both models have identical pricing for predictable costs

### **Subscription Pricing**
```
Basic Plan - $10/month:
- 5M tokens per month (91.25% profit margin)
- 3 client profiles
- 50 MB storage

Pro Plan - $25/month:  
- 15M tokens per month (89.5% profit margin)
- Unlimited client profiles
- 200 MB storage

Business Plan - $50/month:
- 40M tokens per month (86% profit margin)
- Unlimited client profiles
- 2 GB storage
```

### **Token Management**
- **Fair Usage Limits**: Token limits calculated based on most expensive models
- **Real-time Tracking**: Monitor consumption without confusing cost estimates
- **Automatic Enforcement**: Usage limits enforced at API level

---

**The AI Services suite transforms marketing content creation from time-consuming manual work into efficient, personalized, AI-powered generation while maintaining the highest standards of quality and privacy.**

*For technical support or feature requests, use the built-in feedback system at `/feedback`.* 