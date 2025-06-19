import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { supabaseServer } from '@/lib/supabase'

export async function POST(req: Request) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return new Response('Unauthorized', { status: 401 })
    }

    const { clientId, testDate, additionalInfo, extractedData, reportContent } = await req.json()

    if (!clientId || !reportContent) {
      return new Response('Missing required fields', { status: 400 })
    }

    // Use extracted date if available, otherwise fall back to provided date or current date
    const finalTestDate = extractedData?.testInfo?.testDate || testDate || new Date().toISOString().split('T')[0]

    // Get client information
    const client = await prisma.client.findFirst({
      where: {
        id: clientId,
        userId,
      },
    })
    
    if (!client) {
      return new Response('Client not found', { status: 404 })
    }

    // Create filename with test date
    const formattedTestDate = new Date(finalTestDate).toISOString().split('T')[0]
    const documentName = `${client.name} Blood Test Analysis ${formattedTestDate}`
    const fileName = `${documentName}.md`
    const filePath = `${userId}/${clientId}/${fileName}`

    try {
      // Upload to Supabase storage
      const { data: uploadData, error: uploadError } = await supabaseServer.storage
        .from(process.env.SUPABASE_DOCUMENTS_BUCKET || 'documents')
        .upload(filePath, reportContent, {
          contentType: 'text/markdown',
          upsert: true
        })

      if (uploadError) {
        console.error('Supabase upload error:', uploadError)
        throw new Error('Failed to upload document')
      }

      // Save document metadata to database
      const document = await prisma.document.create({
        data: {
          userId,
          clientId,
          documentName,
          documentPath: filePath,
          documentType: 'blood-test-analysis',
          startDate: new Date(finalTestDate),
          endDate: new Date(finalTestDate), // For blood tests, start and end date are the same
        },
      })

      return Response.json({
        success: true,
        document: {
          id: document.id,
          name: document.documentName,
          path: document.documentPath,
          type: document.documentType,
          testDate: document.startDate,
        }
      })

    } catch (storageError) {
      console.error('Storage error:', storageError)
      throw new Error('Failed to save blood test report')
    }

  } catch (error) {
    console.error('Save blood test report error:', error)
    return new Response(
      error instanceof Error ? error.message : 'Internal server error',
      { status: 500 }
    )
  }
} 