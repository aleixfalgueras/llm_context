# AI Service Development Guide

This guide explains how to develop new AI services for the LLM Context application using the current OpenRouter dual-model architecture.

## 🎯 Overview

### **Current Architecture**
The application uses a service-owned prompt architecture with:
- **OpenRouter Integration**: Access to Google Gemini 2.0 Flash and OpenAI GPT-4.1 Nano
- **Service-Specific Prompts**: Each service defines its own prompt in its route file
- **Centralized Client Context**: Privacy-respecting client context system
- **Modular Design**: Clean separation between AI services, context handling, and UI

### **Existing Services**
1. **Chat Assistant** (`/app/api/chat/route.ts`) - Real-time AI conversations
2. **Meeting Report Generator** (`/app/api/ai-services/generate-meeting-report/route.ts`)
3. **Custom Document Generator** (`/app/api/ai-services/generate-custom-document/route.ts`)

## 🛠️ Step-by-Step Development Process

### **Step 1: Create the API Route**

Create a new API route file in `/app/api/ai-services/your-service-name/route.ts`:

```typescript
import { NextRequest } from 'next'
import { getAuth } from '@clerk/nextjs/server'
import { aiServiceMiddleware } from '@/lib/ai-service-api'
import { validateUsageLimits } from '@/lib/usage-middleware'
import { generateAIResponse } from '@/lib/openrouter/service'
import { buildClientContextSection } from '@/lib/client-context-utils'
import { getClientById } from '@/lib/database/client-operations'
import { ApiError, handleApiError } from '@/lib/api-error-handler'
import { logger } from '@/lib/logger'

export async function POST(request: NextRequest) {
  try {
    const endTiming = logger.startTiming('Your Service Generation')
    
    // Get user authentication
    const { userId } = getAuth(request)
    if (!userId) {
      throw new ApiError('Authentication required', 401)
    }

    // Parse and validate request body
    const body = await request.json()
    const { 
      clientId, 
      selectedContextFields = [],
      model = 'google/gemini-2.0-flash-001',
      // Add your service-specific fields here
      customInput,
      additionalData
    } = body

    // Validate required fields
    if (!clientId) {
      throw new ApiError('Client ID is required', 400)
    }

    // Validate usage limits
    await validateUsageLimits(userId)

    // Get client data
    const validClient = await getClientById(clientId, userId)
    if (!validClient) {
      throw new ApiError('Client not found', 404)
    }

    // Build client context section (respects privacy selections)
    const clientContextSection = buildClientContextSection(validClient, selectedContextFields)

    // Define your service-specific prompt
    const servicePrompt = `You are a professional AI assistant helping a marketing professional with [YOUR SERVICE PURPOSE].

CLIENT: ${validClient.name}

[YOUR SERVICE SPECIFIC INSTRUCTIONS]:
- [Instruction 1]
- [Instruction 2]
- [Instruction 3]

INPUT DATA:
${customInput}

${additionalData ? `
ADDITIONAL CONTEXT:
${additionalData}` : ''}

INSTRUCTIONS:
- [Detailed instructions for your service]
- Provide the response in markdown format for easy reading
- DO NOT include any disclaimers or AI provider-related content
- Provide ONLY the [service output] content in a delivery-ready format
- Focus on [specific requirements for your service]`

    // Add client context if provided
    let completePrompt = servicePrompt
    if (clientContextSection) {
      completePrompt = `${servicePrompt}${clientContextSection}`
    }

    // Generate AI response using OpenRouter
    const response = await generateAIResponse({
      userId,
      model,
      messages: [
        {
          role: 'system',
          content: completePrompt
        }
      ],
      temperature: 0.7,
      maxTokens: 8000
    })

    logger.info('Your Service generated successfully', {
      userId,
      clientId,
      model,
      contextFields: selectedContextFields
    })

    endTiming()

    return Response.json({
      content: response.content,
      usage: response.usage
    })

  } catch (error) {
    return handleApiError(error, 'Your Service generation failed')
  }
}
```

### **Step 2: Create the Save Endpoint**

Create a save endpoint at `/app/api/ai-services/save-your-service/route.ts`:

```typescript
import { NextRequest } from 'next'
import { getAuth } from '@clerk/nextjs/server'
import { saveDocument } from '@/lib/documents/service'
import { ApiError, handleApiError } from '@/lib/api-error-handler'
import { logger } from '@/lib/logger'

export async function POST(request: NextRequest) {
  try {
    const { userId } = getAuth(request)
    if (!userId) {
      throw new ApiError('Authentication required', 401)
    }

    const body = await request.json()
    const { content, title, clientId } = body

    if (!content || !title || !clientId) {
      throw new ApiError('Content, title, and client ID are required', 400)
    }

    // Save document with your service type
    const document = await saveDocument({
      userId,
      clientId,
      title,
      content,
      type: 'your-service-type', // Define your document type
      metadata: {
        generatedAt: new Date().toISOString(),
        // Add any service-specific metadata
      }
    })

    logger.info('Your Service document saved', {
      userId,
      clientId,
      documentId: document.id
    })

    return Response.json({ document })

  } catch (error) {
    return handleApiError(error, 'Failed to save your service document')
  }
}
```

### **Step 3: Create UI Components**

Create a dialog component in `/components/ai-services/your-service-dialog.tsx`:

```typescript
'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { ModelSelector } from '@/components/ui/model-selector'
import { ClientContextSidebar } from '@/components/clients/client-context-sidebar'
import { useAIServiceOperations } from '@/hooks/use-ai-service-operations'
import { useToast } from '@/hooks/use-toast'
import { Loader2 } from 'lucide-react'

interface YourServiceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  clientId: string
  clientName: string
}

export function YourServiceDialog({ 
  open, 
  onOpenChange, 
  clientId, 
  clientName 
}: YourServiceDialogProps) {
  const [title, setTitle] = useState('')
  const [customInput, setCustomInput] = useState('')
  const [additionalData, setAdditionalData] = useState('')
  const [selectedModel, setSelectedModel] = useState('google/gemini-2.0-flash-001')
  const [selectedContextFields, setSelectedContextFields] = useState<string[]>([])
  
  const { toast } = useToast()
  const {
    generateContent,
    saveDocument,
    isGenerating,
    isSaving,
    generatedContent
  } = useAIServiceOperations()

  const handleGenerate = async () => {
    if (!customInput.trim()) {
      toast({
        title: "Input Required",
        description: "Please provide the required input for your service.",
        variant: "destructive"
      })
      return
    }

    try {
      await generateContent('/api/ai-services/your-service-name', {
        clientId,
        selectedContextFields,
        model: selectedModel,
        customInput: customInput.trim(),
        additionalData: additionalData.trim() || undefined
      })
    } catch (error) {
      console.error('Generation failed:', error)
    }
  }

  const handleSave = async () => {
    if (!generatedContent || !title.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide a title for the document.",
        variant: "destructive"
      })
      return
    }

    try {
      await saveDocument('/api/ai-services/save-your-service', {
        content: generatedContent,
        title: title.trim(),
        clientId
      })

      toast({
        title: "Document Saved",
        description: "Your service document has been saved successfully."
      })

      onOpenChange(false)
    } catch (error) {
      console.error('Save failed:', error)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Your Service - {clientName}</DialogTitle>
        </DialogHeader>

        <div className="flex gap-6 h-full overflow-hidden">
          {/* Main Form */}
          <div className="flex-1 space-y-4 overflow-y-auto">
            <div>
              <Label htmlFor="title">Document Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter document title..."
              />
            </div>

            <div>
              <Label htmlFor="customInput">Your Service Input</Label>
              <Textarea
                id="customInput"
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                placeholder="Enter your service specific input..."
                rows={4}
              />
            </div>

            <div>
              <Label htmlFor="additionalData">Additional Information (Optional)</Label>
              <Textarea
                id="additionalData"
                value={additionalData}
                onChange={(e) => setAdditionalData(e.target.value)}
                placeholder="Any additional context or requirements..."
                rows={3}
              />
            </div>

            <div>
              <Label>AI Model</Label>
              <ModelSelector
                value={selectedModel}
                onValueChange={setSelectedModel}
              />
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={handleGenerate} 
                disabled={isGenerating || !customInput.trim()}
                className="flex-1"
              >
                {isGenerating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Generate Your Service
              </Button>

              {generatedContent && (
                <Button 
                  onClick={handleSave} 
                  disabled={isSaving || !title.trim()}
                  variant="outline"
                >
                  {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Save Document
                </Button>
              )}
            </div>

            {/* Generated Content Display */}
            {generatedContent && (
              <div className="mt-6 p-4 border rounded-lg">
                <h3 className="font-semibold mb-2">Generated Content:</h3>
                <div className="prose max-w-none">
                  {/* Render your generated content */}
                  <pre className="whitespace-pre-wrap">{generatedContent}</pre>
                </div>
              </div>
            )}
          </div>

          {/* Client Context Sidebar */}
          <ClientContextSidebar
            clientId={clientId}
            selectedFields={selectedContextFields}
            onSelectionChange={setSelectedContextFields}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}
```

### **Step 4: Add to AI Services Page**

Update `/components/ai-services/ai-services-client.tsx` to include your new service:

```typescript
// Add your service card
<ServiceCard
  title="Your Service"
  description="Brief description of what your service does"
  features={[
    "Feature 1",
    "Feature 2", 
    "Feature 3"
  ]}
  onSelect={() => setActiveService('your-service')}
  isAvailable={true}
/>

// Add your dialog to the render section
{activeService === 'your-service' && selectedClient && (
  <YourServiceDialog
    open={true}
    onOpenChange={() => setActiveService(null)}
    clientId={selectedClient.id}
    clientName={selectedClient.name}
  />
)}
```

## 🏗️ Architecture Guidelines

### **Prompt Design**
1. **Service-Specific**: Each service owns its prompt in the route file
2. **Clear Instructions**: Provide specific, actionable instructions
3. **Context Integration**: Use `buildClientContextSection()` for client data
4. **Output Format**: Specify desired output format (markdown, structured, etc.)

### **Client Context Handling**
```typescript
// Always use the centralized function
const clientContextSection = buildClientContextSection(validClient, selectedContextFields)

// Only add to prompt if context is provided
if (clientContextSection) {
  completePrompt = `${basePrompt}${clientContextSection}`
}
```

### **Error Handling**
```typescript
try {
  // Service logic
} catch (error) {
  return handleApiError(error, 'Service-specific error message')
}
```

### **Usage Tracking**
```typescript
// Always validate before generating
await validateUsageLimits(userId)

// Use the OpenRouter service for automatic tracking
const response = await generateAIResponse({
  userId,
  model,
  messages,
  temperature,
  maxTokens
})
```

## 🔧 Testing Your Service

### **Manual Testing**
1. **Authentication**: Ensure proper user authentication
2. **Client Context**: Test with different context field selections
3. **Model Selection**: Test with both Google Gemini 2.0 Flash and OpenAI GPT-4.1 Nano
4. **Error Scenarios**: Test with invalid inputs and missing data
5. **Usage Limits**: Test behavior when approaching token limits

### **Integration Testing**
```bash
# Test the generation endpoint
curl -X POST http://localhost:3000/api/ai-services/your-service-name \
  -H "Content-Type: application/json" \
  -d '{
    "clientId": "test_client_id",
    "selectedContextFields": ["country"],
    "model": "google/gemini-2.0-flash-001",
    "customInput": "Test input"
  }'

# Test the save endpoint
curl -X POST http://localhost:3000/api/ai-services/save-your-service \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Generated content",
    "title": "Test Document",
    "clientId": "test_client_id"
  }'
```

## 📋 Best Practices

### **Performance**
1. **Efficient Prompts**: Keep prompts concise but complete
2. **Reasonable Token Limits**: Use appropriate maxTokens (typically 8000)
3. **Caching**: Consider caching for frequently used data
4. **Async Operations**: Use proper async/await patterns

### **Security**
1. **Input Validation**: Always validate and sanitize inputs
2. **User Authorization**: Verify user ownership of clients and documents
3. **Privacy Compliance**: Respect client context selections
4. **Error Information**: Don't leak sensitive data in error messages

### **User Experience**
1. **Loading States**: Show progress during generation and saving
2. **Error Feedback**: Provide clear, actionable error messages
3. **Validation**: Validate inputs before submission
4. **Success Feedback**: Confirm successful operations

### **Code Quality**
1. **TypeScript**: Use proper type definitions
2. **Error Handling**: Comprehensive try-catch blocks
3. **Logging**: Log important operations for debugging
4. **Documentation**: Document service-specific requirements

## 🚀 Deployment Considerations

### **Environment Variables**
Ensure your service works with existing OpenRouter configuration:
```env
OPENROUTER_API_KEY="your_key"
OPENROUTER_DEFAULT_MODEL="google/gemini-2.0-flash-001"
```

### **Database Migrations**
If your service needs new document types or metadata:
```prisma
// Add to Document model if needed
enum DocumentType {
  MEETING_REPORT
  CUSTOM_DOCUMENT
  CHAT_EXPORT
  YOUR_SERVICE_TYPE  // Add your type here
}
```

---

**This guide provides a complete foundation for developing new AI services that integrate seamlessly with the existing OpenRouter dual-model architecture while maintaining privacy, security, and user experience standards.**