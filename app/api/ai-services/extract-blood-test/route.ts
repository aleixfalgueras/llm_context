import { auth } from '@clerk/nextjs/server'
import OpenAI from 'openai'
import { prisma } from '@/lib/prisma'
import pdf from 'pdf-parse'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

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

    if (!file || !clientId) {
      return new Response('Missing required fields', { status: 400 })
    }

    // Verify client ownership
    const client = await prisma.client.findFirst({
      where: {
        id: clientId,
        userId,
      },
    })
    
    if (!client) {
      return new Response('Client not found', { status: 404 })
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
    } catch (pdfError) {
      console.error('PDF parsing error:', pdfError)
      return new Response('Failed to extract text from PDF', { status: 400 })
    }

    // Create extraction prompt
    const extractionPrompt = `You are a medical data extraction specialist. Extract all blood test parameters from the following text content.

For each parameter, extract:
1. Parameter name (e.g., "Hemoglobin", "White Blood Cells", "Glucose")
2. Value (the actual test result)
3. Unit (e.g., "g/dL", "cells/μL", "mg/dL")
4. Reference minimum value
5. Reference maximum value
6. Status (normal, high, low) if indicated

Return the data in this exact JSON format:
{
  "testInfo": {
    "testDate": "extracted date from text in YYYY-MM-DD format",
    "labName": "laboratory name if found",
    "doctorName": "doctor name if found"
  },
  "parameters": [
    {
      "name": "parameter name",
      "value": "test value",
      "unit": "unit",
      "referenceMin": "minimum reference value",
      "referenceMax": "maximum reference value",
      "status": "normal/high/low or null if not indicated"
    }
  ]
}

Instructions:
- Extract ALL blood test parameters you can find
- Be very careful with numbers and units
- If a reference range is given as "5.0-10.0", extract referenceMin as "5.0" and referenceMax as "10.0"
- Use null for any fields you cannot find
- Ensure all extracted values are accurate

${additionalInfo ? `SPECIAL FORMAT INSTRUCTIONS:
${additionalInfo}

Pay attention to the format guidance above.` : ''}

BLOOD TEST REPORT TEXT:
${pdfText}

Extract the blood test data according to the JSON format specified above.`

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "user",
            content: extractionPrompt
          }
        ],
        max_tokens: 16000,
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

      // Validate extracted data
      if (!extractedData.parameters || !Array.isArray(extractedData.parameters)) {
        throw new Error('Invalid extracted data format')
      }

      // Calculate status for parameters where it's missing
      extractedData.parameters = extractedData.parameters.map((param: any) => {
        if (!param.status && param.value && param.referenceMin && param.referenceMax) {
          const value = parseFloat(param.value.toString().replace(/[^\d.-]/g, ''))
          const minRef = parseFloat(param.referenceMin.toString().replace(/[^\d.-]/g, ''))
          const maxRef = parseFloat(param.referenceMax.toString().replace(/[^\d.-]/g, ''))
          
          if (!isNaN(value) && !isNaN(minRef) && !isNaN(maxRef)) {
            if (value < minRef) {
              param.status = 'low'
            } else if (value > maxRef) {
              param.status = 'high'
            } else {
              param.status = 'normal'
            }
          }
        }
        return param
      })

      return Response.json({ 
        success: true, 
        extractedData 
      })

    } catch (openaiError) {
      console.error('OpenAI API error:', openaiError)
      return new Response('Failed to process the blood test document', { status: 500 })
    }

  } catch (error) {
    console.error('Blood test extraction error:', error)
    return new Response('Internal server error', { status: 500 })
  }
} 