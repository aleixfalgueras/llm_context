import { auth } from '@clerk/nextjs/server'
import OpenAI from 'openai'
import { prisma } from '@/lib/prisma'
import pdf from 'pdf-parse'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Constants for handling large documents
const MAX_FILE_SIZE_MB = 50 // 50MB max file size
const MAX_TEXT_LENGTH = 400000 // Increased to ~100k tokens worth of text for comprehensive extraction
const CHUNK_SIZE = 200000 // Increased chunk size for larger processing

export async function POST(req: Request) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return new Response('Unauthorized', { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get('file') as File
    const clientId = formData.get('clientId') as string
    const additionalInfo = formData.get('additionalInfo') as string

    if (!file) {
      return new Response('No file provided', { status: 400 })
    }

    // Check file size (50MB limit for 40-page PDFs)
    const fileSizeMB = file.size / (1024 * 1024)
    if (fileSizeMB > MAX_FILE_SIZE_MB) {
      return new Response(`File too large. Maximum size is ${MAX_FILE_SIZE_MB}MB. Your file is ${fileSizeMB.toFixed(1)}MB.`, { status: 400 })
    }

    // If clientId is provided, verify client ownership
    if (clientId) {
      const client = await prisma.client.findFirst({
        where: {
          id: clientId,
          userId: userId
        }
      })

      if (!client) {
        return new Response('Client not found or access denied', { status: 404 })
      }
    }

    // Extract text from PDF
    const fileBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(fileBuffer)
    
    let pdfText: string
    try {
      const pdfData = await pdf(buffer)
      pdfText = pdfData.text
      
      if (!pdfText || pdfText.trim().length === 0) {
        throw new Error('No text content found in PDF')
      }

      // Check text length and provide feedback
      console.log(`Extracted text length: ${pdfText.length} characters`)
      
      if (pdfText.length > MAX_TEXT_LENGTH) {
        console.log(`Large document detected (${pdfText.length} chars). Truncating to ${MAX_TEXT_LENGTH} chars.`)
        // Truncate text but try to keep complete sentences
        pdfText = pdfText.substring(0, MAX_TEXT_LENGTH)
        const lastPeriod = pdfText.lastIndexOf('.')
        const lastNewline = pdfText.lastIndexOf('\n')
        const cutoff = Math.max(lastPeriod, lastNewline)
        if (cutoff > MAX_TEXT_LENGTH * 0.8) {
          pdfText = pdfText.substring(0, cutoff + 1)
        }
        pdfText += '\n\n[Note: Document was truncated due to length. This represents the first portion of the medical history.]'
      }

    } catch (pdfError) {
      console.error('PDF parsing error:', pdfError)
      return new Response('Failed to extract text from PDF. Please ensure the PDF contains readable text and is not password protected.', { status: 400 })
    }

    // Create extraction prompt for medical history
    const extractionPrompt = `You are an expert medical information specialist tasked with extracting comprehensive medical history information from documents while maintaining complete patient privacy through anonymization.

CRITICAL PRIVACY REQUIREMENTS - REMOVE ALL:
- Patient names, addresses, phone numbers, emails, SSNs
- Medical record numbers, insurance IDs, account numbers
- Specific dates (convert to relative timeframes like "2 years ago", "January 2020")
- Provider names, clinic names, hospital names (replace with generic terms)
- Any other personally identifiable information

COMPREHENSIVE EXTRACTION REQUIREMENTS:
Extract ALL medically relevant information including:

1. **DIAGNOSES & CONDITIONS**: 
   - Primary diagnoses, working diagnoses, differential diagnoses
   - Current conditions, past medical history, chronic conditions
   - Suspected conditions and assessments
   - Disease severity and staging

2. **MEDICATIONS & TREATMENTS**:
   - Current medications, past medications, discontinued medications
   - Dosages, frequencies, routes of administration
   - Treatment responses, side effects, adherence issues
   - Planned treatments and recommendations

3. **LABORATORY & DIAGNOSTIC RESULTS**:
   - Blood work, urinalysis, cultures, biopsies
   - Abnormal values with reference ranges
   - Trending results over time
   - Pending tests and recommendations

4. **IMAGING & PROCEDURES**:
   - X-rays, CT, MRI, ultrasound, endoscopy results
   - Surgical procedures, interventions
   - Findings, impressions, recommendations

5. **SYMPTOMS & CLINICAL PRESENTATION**:
   - Chief complaints, presenting symptoms
   - Constitutional symptoms (fever, fatigue, weight changes)
   - Functional limitations and quality of life impact
   - Symptom timeline and progression

6. **FAMILY & SOCIAL HISTORY**:
   - Family medical history with relationships
   - Social determinants of health
   - Occupational exposures and impacts
   - Lifestyle factors affecting health

7. **ALLERGIES & ADVERSE REACTIONS**:
   - Drug allergies, environmental allergies
   - Severity of reactions, specific symptoms
   - Cross-reactivity concerns

8. **ASSESSMENTS & PLANS**:
   - Clinical assessments and impressions
   - Treatment plans and recommendations
   - Follow-up requirements
   - Patient education provided

Return extracted information in this comprehensive JSON format:
{
  "primaryDiagnoses": [
    {
      "diagnosis": "primary diagnosis name",
      "status": "confirmed/suspected/rule-out",
      "timeframe": "when diagnosed",
      "severity": "mild/moderate/severe",
      "notes": "additional clinical details"
    }
  ],
  "conditions": [
    {
      "condition": "condition name",
      "status": "current/past/chronic",
      "timeframe": "duration or onset",
      "severity": "impact level",
      "treatment": "current management",
      "notes": "progression, complications, etc."
    }
  ],
  "medications": [
    {
      "medication": "medication name",
      "dosage": "dose and frequency",
      "status": "current/past/discontinued",
      "indication": "what it treats",
      "response": "effectiveness/side effects",
      "notes": "additional details"
    }
  ],
  "allergies": [
    {
      "allergen": "substance causing reaction",
      "reaction": "type of reaction",
      "severity": "mild/moderate/severe/life-threatening",
      "onset": "when reaction occurs",
      "notes": "additional details"
    }
  ],
  "surgeries": [
    {
      "procedure": "surgical procedure",
      "timeframe": "when performed",
      "indication": "reason for surgery",
      "outcome": "result/complications",
      "notes": "recovery details"
    }
  ],
  "labResults": [
    {
      "test": "laboratory test name",
      "result": "value and reference range",
      "timeframe": "when performed",
      "significance": "clinical interpretation",
      "trend": "improving/worsening/stable"
    }
  ],
  "imaging": [
    {
      "study": "type of imaging",
      "findings": "key findings",
      "timeframe": "when performed",
      "impression": "radiologist impression",
      "significance": "clinical relevance"
    }
  ],
  "symptoms": [
    {
      "symptom": "symptom description",
      "onset": "when it started",
      "duration": "how long it lasts",
      "severity": "mild/moderate/severe",
      "triggers": "what causes it",
      "impact": "effect on daily life",
      "notes": "additional details"
    }
  ],
  "familyHistory": [
    {
      "condition": "family medical condition",
      "relation": "family member relationship",
      "age": "age at diagnosis if mentioned",
      "notes": "additional family history details"
    }
  ],
  "socialHistory": {
    "occupation": "job and occupational exposures",
    "smoking": "smoking history and status",
    "alcohol": "alcohol use patterns",
    "drugs": "recreational drug use",
    "exercise": "physical activity level",
    "diet": "dietary patterns and restrictions"
  },
  "lifestyle": {
    "functionalStatus": "ability to perform daily activities",
    "workImpact": "how illness affects work",
    "sleepPatterns": "sleep quality and patterns",
    "stressFactors": "psychological and social stressors",
    "supportSystem": "family and social support"
  },
  "vitalSigns": [
    {
      "parameter": "vital sign type",
      "value": "measured value",
      "timeframe": "when measured",
      "significance": "normal/abnormal interpretation"
    }
  ],
  "physicalExam": [
    {
      "system": "body system examined",
      "findings": "examination findings",
      "significance": "normal/abnormal/concerning"
    }
  ],
  "assessmentPlan": [
    {
      "problem": "clinical problem",
      "assessment": "clinical assessment",
      "plan": "treatment plan",
      "followUp": "follow-up requirements"
    }
  ],
  "summary": {
    "primaryConcerns": "Main medical issues and diagnoses",
    "currentTreatments": "Current medications and treatments",
    "keyFindings": "Important lab results, imaging, and exam findings",
    "functionalImpact": "How conditions affect daily life and work",
    "riskFactors": "Family history and lifestyle risk factors",
    "clinicalStatus": "Overall clinical picture and trajectory"
  }
}

${additionalInfo ? `ADDITIONAL EXTRACTION INSTRUCTIONS:
${additionalInfo}

Pay special attention to the additional instructions above.` : ''}

MEDICAL DOCUMENT TEXT:
${pdfText}

Extract comprehensive medical information according to the detailed JSON format above. Capture ALL relevant medical details while maintaining complete patient privacy through anonymization. Focus on providing a thorough medical picture that would be valuable for healthcare providers and health coaches.`

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "user",
            content: extractionPrompt
          }
        ],
        max_tokens: 32000,
        temperature: 0.1,
      })

      const extractedText = response.choices[0]?.message?.content
      if (!extractedText) {
        throw new Error('No response from OpenAI')
      }

      // Parse the JSON response
      let extractedData
      try {
        // Remove markdown formatting if present
        let cleanedText = extractedText.trim()
        if (cleanedText.startsWith('```json')) {
          cleanedText = cleanedText.replace(/^```json\s*/, '')
        }
        if (cleanedText.endsWith('```')) {
          cleanedText = cleanedText.replace(/\s*```$/, '')
        }
        
        // Find JSON object
        const jsonMatch = cleanedText.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          let jsonString = jsonMatch[0]
          
          // Try to fix incomplete JSON by adding closing brackets if needed
          let openBraces = 0
          let openBrackets = 0
          let inString = false
          let escapeNext = false
          
          for (let i = 0; i < jsonString.length; i++) {
            const char = jsonString[i]
            
            if (escapeNext) {
              escapeNext = false
              continue
            }
            
            if (char === '\\') {
              escapeNext = true
              continue
            }
            
            if (char === '"' && !escapeNext) {
              inString = !inString
              continue
            }
            
            if (!inString) {
              if (char === '{') openBraces++
              if (char === '}') openBraces--
              if (char === '[') openBrackets++
              if (char === ']') openBrackets--
            }
          }
          
          // Add missing closing brackets
          while (openBrackets > 0) {
            jsonString += ']'
            openBrackets--
          }
          while (openBraces > 0) {
            jsonString += '}'
            openBraces--
          }
          
          extractedData = JSON.parse(jsonString)
        } else {
          throw new Error('No valid JSON found in response')
        }
      } catch (parseError) {
        console.error('Failed to parse JSON:', extractedText)
        throw new Error('Failed to parse extracted data')
      }

      // Validate extracted data structure
      if (!extractedData.summary) {
        extractedData.summary = {
          primaryConcerns: "No specific primary concerns mentioned.",
          currentTreatments: "No current treatments mentioned.",
          keyFindings: "No key findings mentioned.",
          functionalImpact: "No functional impact mentioned.",
          riskFactors: "No risk factors mentioned.",
          clinicalStatus: "No clinical status mentioned."
        }
      }

      // Ensure other critical arrays exist
      if (!extractedData.primaryDiagnoses) extractedData.primaryDiagnoses = []
      if (!extractedData.conditions) extractedData.conditions = []
      if (!extractedData.medications) extractedData.medications = []
      if (!extractedData.labResults) extractedData.labResults = []
      if (!extractedData.imaging) extractedData.imaging = []
      if (!extractedData.symptoms) extractedData.symptoms = []
      if (!extractedData.assessmentPlan) extractedData.assessmentPlan = []

      // Create a readable summary from the structured sections
      const summaryText = Object.entries(extractedData.summary)
        .filter(([key, value]) => value && typeof value === 'string' && value.trim())
        .map(([key, value]) => {
          const sectionTitles: Record<string, string> = {
            primaryConcerns: "Primary Concerns",
            currentTreatments: "Current Treatments",
            keyFindings: "Key Findings",
            functionalImpact: "Functional Impact",
            riskFactors: "Risk Factors",
            clinicalStatus: "Clinical Status"
          }
          return `${sectionTitles[key] || key}: ${value}`
        })
        .join('\n\n')

      // Add metadata about processing
      const processingInfo = {
        originalTextLength: pdfText.length,
        fileSizeMB: fileSizeMB.toFixed(2),
        wasContentTruncated: pdfText.includes('[Note: Document was truncated due to length'),
        extractedSections: {
          primaryDiagnoses: extractedData.primaryDiagnoses?.length || 0,
          conditions: extractedData.conditions?.length || 0,
          medications: extractedData.medications?.length || 0,
          labResults: extractedData.labResults?.length || 0,
          imaging: extractedData.imaging?.length || 0,
          symptoms: extractedData.symptoms?.length || 0,
          assessmentPlan: extractedData.assessmentPlan?.length || 0
        }
      }

      return Response.json({ 
        success: true, 
        extractedData,
        summary: summaryText || "Medical history information extracted from uploaded document.",
        processingInfo 
      })

    } catch (openaiError: any) {
      console.error('OpenAI API error:', openaiError)
      
      // Check if it's a token limit error
      if (openaiError.message?.includes('token') || openaiError.message?.includes('context')) {
        return new Response('Document is too large to process. Please try with a shorter document or contact support.', { status: 413 })
      }
      
      return new Response('Failed to process the medical history document. Please try again or contact support if the issue persists.', { status: 500 })
    }

  } catch (error) {
    console.error('Medical history extraction error:', error)
    return new Response('Internal server error', { status: 500 })
  }
} 