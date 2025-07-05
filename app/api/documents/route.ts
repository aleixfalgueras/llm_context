import { NextRequest, NextResponse } from 'next/server'
import { DocumentService } from '@/lib/documents/service'

// GET /api/documents - List user's documents
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const clientId = searchParams.get('clientId')
    
    if (!clientId) {
      return NextResponse.json(
        { error: 'Client ID is required' },
        { status: 400 }
      )
    }

    const options = {
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined
    }

    const documents = await DocumentService.getClientDocuments(clientId, options)
    return NextResponse.json(documents)
  } catch (error) {
    console.error('Failed to fetch documents:', error)
    return NextResponse.json(
      { error: 'Failed to fetch documents' },
      { status: 500 }
    )
  }
}

// POST /api/documents - Create new document
export async function POST(request: NextRequest) {
  try {
    const { clientId, documentName, documentType, content, metadata } = await request.json()

    if (!clientId || !documentName || !documentType || !content) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const result = await DocumentService.createDocument(
      clientId,
      documentName,
      documentType,
      content,
      metadata
    )

    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    console.error('Failed to create document:', error)
    return NextResponse.json(
      { error: 'Failed to create document' },
      { status: 500 }
    )
  }
}