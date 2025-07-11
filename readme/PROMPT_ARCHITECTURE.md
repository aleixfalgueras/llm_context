# Prompt Architecture Documentation

This document explains the clean, service-owned prompt architecture that ensures privacy compliance and maintainable AI service development.

## 🎯 Architecture Overview

### **Core Principle: Service-Owned Prompts**
Each AI service defines its own explicit prompt within its route file, while client context is handled by a centralized, privacy-respecting utility.

### **Benefits**
- **🔍 Transparency**: All prompts are visible in their service files
- **🔒 Privacy Compliance**: User context selections strictly respected
- **🧹 Maintainability**: Easy to modify prompts without affecting other services
- **🎯 Flexibility**: Each service can customize how it uses client context
- **🛡️ Security**: Centralized privacy logic prevents accidental data leakage

## 🏗️ Technical Implementation

The prompt architecture leverages the modular structure with clean separation between AI services, client context handling, and the dual-model system (Google Gemini 2.0 Flash and OpenAI GPT-4.1 Nano).

### **Client Context Utilities** (`lib/client-context-utils.ts`)

#### `buildClientContextSection(client, selectedFields)`
```typescript
/**
 * Builds just the client context section for AI prompts
 * RESPECTS user privacy selections - only includes fields user explicitly chose
 * Returns empty string if no context fields are selected
 */
export function buildClientContextSection(client: Client, selectedFields: string[] = []): string {
  // Safety check - if no fields selected, return empty string
  if (selectedFields.length === 0) {
    return ''
  }

  const shouldIncludeCountry = selectedFields.includes('country')
  const shouldIncludeGeneralContext = selectedFields.includes('general_context')
  const shouldIncludeSpecificContext1 = selectedFields.includes('specific_context_1')
  const shouldIncludeSpecificContext2 = selectedFields.includes('specific_context_2')
  const shouldIncludeSpecificContext3 = selectedFields.includes('specific_context_3')

  // If no valid fields selected, return empty
  if (!shouldIncludeCountry && !shouldIncludeGeneralContext && !shouldIncludeSpecificContext1 && !shouldIncludeSpecificContext2 && !shouldIncludeSpecificContext3) {
    return ''
  }

  let contextSection = '\n\nCLIENT CONTEXT:'
  
  // Build context section based on selected fields
  if (shouldIncludeCountry && client.country) {
    contextSection += `\nCountry: ${client.country}`
    
    // Add general context after country without a label
    if (shouldIncludeGeneralContext && client.generalContext) {
      contextSection += ` ${client.generalContext}`
    }
    
    // Add specific context fields after general context (no labels)
    if (shouldIncludeSpecificContext1 && client.specificContext1) {
      contextSection += ` ${client.specificContext1}`
    }
    if (shouldIncludeSpecificContext2 && client.specificContext2) {
      contextSection += ` ${client.specificContext2}`
    }
    if (shouldIncludeSpecificContext3 && client.specificContext3) {
      contextSection += ` ${client.specificContext3}`
    }
  } else {
    // If country not selected, build context with fallback format
    const contextParts = []
    if (shouldIncludeGeneralContext && client.generalContext) {
      contextParts.push(client.generalContext)
    }
    if (shouldIncludeSpecificContext1 && client.specificContext1) {
      contextParts.push(client.specificContext1)
    }
    if (shouldIncludeSpecificContext2 && client.specificContext2) {
      contextParts.push(client.specificContext2)
    }
    if (shouldIncludeSpecificContext3 && client.specificContext3) {
      contextParts.push(client.specificContext3)
    }
    
    if (contextParts.length > 0) {
      contextSection += `\nCountry: ${contextParts.join(' ')}`
    }
  }

  return contextSection
}
```

#### `hasClientContext(selectedFields)`
```typescript
/**
 * Check if any client context was selected by the user
 * Useful for conditional prompt instructions
 */
export function hasClientContext(selectedFields: string[] = []): boolean {
  return selectedFields.length > 0 && 
         (selectedFields.includes('country') || 
          selectedFields.includes('general_context') ||
          selectedFields.includes('specific_context_1') ||
          selectedFields.includes('specific_context_2') ||
          selectedFields.includes('specific_context_3'))
}
```

## 🚀 Service Implementation Examples

### **1. Chat Assistant** (`app/api/chat/route.ts`)

```typescript
// Uses the modular AI wrapper (lib/ai/wrapper.ts) with OpenRouter integration
// Build chat system prompt with user-selected client context
const selectedContextFields = (chat as any).contextFields || []
const clientContextSection = buildClientContextSection(client, selectedContextFields)
const hasContext = hasClientContext(selectedContextFields)

const systemPrompt = `You are a professional AI assistant helping a marketing service provider with their business.${hasContext ? ' You have access to the following client information and should use it to provide personalized, relevant advice and responses.' : ''}${clientContextSection}

INSTRUCTIONS:
- ${hasContext ? 'Use this client information to personalize your responses when relevant' : 'Provide helpful general business advice'}
- ${hasContext ? 'Reference their specific circumstances when it adds value to your response' : 'Keep responses broadly applicable but actionable'}
- Be professional, knowledgeable, and supportive
- Help with any aspect of marketing business operations: strategy, client management, content creation, campaigns, analysis, operations, industry insights, problem-solving, etc.
- Provide practical, actionable advice tailored to marketing professionals
- Maintain confidentiality and professionalism at all times

Respond naturally and conversationally while keeping this context in mind.`
```

**Key Features:**
- **Comprehensive Business Assistant**: Not limited to content creation
- **Conditional Context**: Only mentions client info if user selected fields
- **Flexible Scope**: Helps with all aspects of marketing business operations
- **Privacy Compliance**: Respects user's context field selections

### **2. Custom Document Generator** (`app/api/ai-services/generate-custom-document/route.ts`)

```typescript
// Uses the modular OpenRouter service (lib/openrouter/service.ts) with usage tracking
// Build client context section if fields are selected - RESPECTS user privacy choices
const clientContextSection = buildClientContextSection(validClient, selectedContextFields)

// Create the complete prompt with client context section
let completePrompt = processedPrompt

if (clientContextSection) {
  completePrompt = `${processedPrompt}${clientContextSection}`
}
```

**Key Features:**
- **User-Defined Prompts**: Uses prompts from user's library or custom input
- **Optional Context**: Only adds client context if user selected fields
- **Clean Integration**: Appends context section to user's prompt
- **Privacy First**: No context added if user didn't select any fields

### **3. Meeting Report Generator** (`app/api/ai-services/generate-meeting-report/route.ts`)

```typescript
// Uses the unified AI wrapper (lib/ai/wrapper.ts) with automatic usage tracking
// Build the meeting report prompt (always in English)
const meetingReportPrompt = `You are a professional AI assistant helping a marketing professional generate a comprehensive meeting report with actionable steps. Focus on documenting what happened during the meeting and creating clear next steps.

CLIENT: ${validClient.name}

MEETING INFORMATION:
- Meeting Date: ${meetingDate}
- Meeting Transcription:
${meetingTranscription}${additionalInfo ? `

ADDITIONAL INFORMATION:
${additionalInfo}` : ''}

INSTRUCTIONS:
- Create a comprehensive meeting report based on the transcription provided
- Focus on documenting the meeting content objectively and professionally
- Structure the report in a clear, professional format with the following sections:
  1. Meeting Summary
  2. Key Discussion Points
  3. Outcomes & Decisions
  4. Action Items & Next Steps
  5. Follow-up Requirements
- Include specific, actionable steps with clear timelines where applicable
- Base recommendations solely on what was discussed in the meeting${additionalInfo ? `
- Pay special attention to the additional information provided above` : ''}
- Provide the response in markdown format for easy reading
- DO NOT include any disclaimers or AI provider-related content
- Provide ONLY the meeting report content in a delivery-ready format
- Make the action items specific, measurable, and achievable
- Focus on practical next steps that can be implemented immediately
- Generate the response in English with clear, professional language`
```

**Key Features:**
- **Isolated Prompt Logic**: Doesn't use the client context system
- **Minimal Client Info**: Only includes client name for personalization
- **Service-Specific**: Optimized specifically for meeting documentation
- **No Privacy Concerns**: Meeting reports don't need the full context selection system

## 🔒 Privacy & Security

### **Privacy Guarantees**
1. **Explicit User Control**: Only client fields explicitly selected by user are shared
2. **Fail-Safe Design**: Defaults to no context sharing if no fields selected
3. **Centralized Logic**: Single source of truth prevents inconsistencies
4. **Audit Trail**: Context selections logged for compliance

### **Implementation Safety**
```typescript
// SAFE: Returns empty string if no context selected
const contextSection = buildClientContextSection(client, selectedFields)

// SAFE: Checks for actual context before conditional logic
const hasContext = hasClientContext(selectedFields)

// SAFE: Only adds context if user explicitly selected fields
if (contextSection) {
  completePrompt = `${basePrompt}${contextSection}`
}
```

## 📋 Development Guidelines

### **Adding New AI Services**

1. **Define Service Prompt in Route File**
   ```typescript
   // app/api/ai-services/your-service/route.ts
   const servicePrompt = `Your service-specific prompt here...`
   ```

2. **Add Client Context if Needed**
   ```typescript
   const clientContextSection = buildClientContextSection(validClient, selectedContextFields)
   
   if (clientContextSection) {
     completePrompt = `${servicePrompt}${clientContextSection}`
   }
   ```

3. **Handle Context in UI**
   - Use existing context selection components
   - Pass `selectedContextFields` to your API
   - Respect user privacy choices

### **Modifying Existing Prompts**

1. **Find the Service Route File**
   - Chat: `app/api/chat/route.ts`
   - Custom Documents: `app/api/ai-services/generate-custom-document/route.ts`
   - Meeting Reports: `app/api/ai-services/generate-meeting-report/route.ts`

2. **Edit the Prompt Directly**
   - Prompts are explicitly defined in their service files
   - No hidden or shared prompt logic
   - Test changes immediately

3. **Maintain Privacy Compliance**
   - Don't bypass `buildClientContextSection()`
   - Don't access client fields directly in prompts
   - Always respect user context selections

### **Best Practices**

1. **Keep Prompts Explicit**: Define prompts directly in service files
2. **Use Context Functions**: Always use `buildClientContextSection()` for client data
3. **Respect User Choices**: Never bypass privacy controls
4. **Test Privacy**: Verify context selection works correctly
5. **Document Changes**: Update README when modifying prompt behavior

## 🧪 Testing Privacy Compliance

### **Test Cases**

1. **No Context Selected**
   ```typescript
   buildClientContextSection(client, []) // Should return ""
   hasClientContext([]) // Should return false
   ```

2. **Country Only**
   ```typescript
   buildClientContextSection(client, ['country']) // Should include only country
   hasClientContext(['country']) // Should return true
   ```

3. **General Context Only**
   ```typescript
   buildClientContextSection(client, ['general_context']) // Should include only general context
   hasClientContext(['general_context']) // Should return true
   ```

4. **Specific Context Fields**
   ```typescript
   buildClientContextSection(client, ['specific_context_1']) // Should include only specific context 1
   buildClientContextSection(client, ['specific_context_2']) // Should include only specific context 2
   buildClientContextSection(client, ['specific_context_3']) // Should include only specific context 3
   hasClientContext(['specific_context_1']) // Should return true
   ```

5. **Multiple Fields**
   ```typescript
   buildClientContextSection(client, ['country', 'general_context']) // Should include both
buildClientContextSection(client, ['country', 'general_context', 'specific_context_1']) // Should include all three
buildClientContextSection(client, ['specific_context_1', 'specific_context_2', 'specific_context_3']) // All specific contexts
hasClientContext(['country', 'general_context', 'specific_context_1']) // Should return true
   ```

### **Manual Testing**

1. Create a chat with no context selected → AI should provide general advice
2. Create a chat with country selected → AI should mention country when relevant
3. Create a chat with general context selected → AI should reference general context when helpful
4. Generate document with no context → Should use base prompt only
5. Generate document with context → Should append client context section

## 📈 Benefits Achieved

### **For Developers**
- **Clear Code**: Prompts are explicit and visible
- **Easy Maintenance**: Change prompts without affecting other services
- **Type Safety**: TypeScript ensures proper context handling
- **Privacy Compliance**: Centralized logic prevents mistakes

### **For Users**
- **Privacy Control**: Explicit control over what information is shared
- **Transparency**: Can see exactly what context is being used
- **Consistency**: Same privacy controls across all services
- **Flexibility**: Can choose different context for different chats/documents

### **For Business**
- **Compliance**: GDPR-ready privacy controls
- **Scalability**: Easy to add new AI services
- **Maintainability**: Clear separation of concerns
- **Reliability**: Centralized privacy logic reduces bugs 