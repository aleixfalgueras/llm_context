import { NextRequest, NextResponse } from 'next/server'
import { DocumentService } from '@/lib/documents/service'

export async function POST(request: NextRequest) {
  try {
    const { clientId, options } = await request.json()

    if (!clientId) {
      return NextResponse.json(
        { error: 'Client ID is required' },
        { status: 400 }
      )
    }

    const documents = await DocumentService.getClientDocuments(clientId, options)

    return NextResponse.json(documents)
  } catch (error) {
    console.error('Failed to fetch client documents:', error)
    return NextResponse.json(
      { error: 'Failed to fetch client documents' },
      { status: 500 }
    )
  }
}