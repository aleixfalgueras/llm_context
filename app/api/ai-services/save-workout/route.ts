import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { supabaseServer } from '@/lib/supabase'
import { STORAGE_CONFIG } from '@/lib/config'

export async function POST(req: Request) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return new Response('Unauthorized', { status: 401 })
    }

    const { clientId, startDate, endDate, workoutContent, additionalInfo } = await req.json()

    if (!clientId || !startDate || !endDate || !workoutContent) {
      return new Response('Missing required fields', { status: 400 })
    }

    // Get client information for the document name
    const client = await prisma.client.findFirst({
      where: {
        id: clientId,
        userId,
      },
    })
    
    if (!client) {
      return new Response('Client not found', { status: 404 })
    }

    // Create document name: "ClientName Workout StartDate-EndDate"
    const startDateFormatted = new Date(startDate).toISOString().split('T')[0]
    const endDateFormatted = new Date(endDate).toISOString().split('T')[0]
    const documentName = `${client.name} Workout ${startDateFormatted} to ${endDateFormatted}`
    const fileName = `${documentName}.md`
    
    // Create the file path in Supabase: user_id/client_id/document_name.md
    const filePath = `${userId}/${clientId}/${fileName}`

    // Upload to Supabase storage
    const { data: uploadData, error: uploadError } = await supabaseServer.storage
      .from(STORAGE_CONFIG.DOCUMENTS_BUCKET)
      .upload(filePath, workoutContent, {
        contentType: 'text/markdown',
        upsert: true, // Allow overwriting if file exists
      })

    if (uploadError) {
      console.error('Supabase upload error:', uploadError)
      return new Response('Failed to save document to storage', { status: 500 })
    }

    // Save document record to database
    const document = await prisma.document.create({
      data: {
        userId,
        clientId,
        documentName,
        documentPath: filePath,
        documentType: 'workout',
        startDate: new Date(startDate),
        endDate: new Date(endDate),
      },
    })

    return Response.json({ 
      success: true, 
      document: {
        id: document.id,
        name: documentName,
        path: filePath,
        type: 'workout',
        startDate,
        endDate
      }
    })
  } catch (error) {
    console.error('Error saving workout:', error)
    return new Response('Internal Server Error', { status: 500 })
  }
} 