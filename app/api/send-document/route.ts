import { NextRequest, NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs/server'
import { Resend } from 'resend'
import { prisma } from '@/lib/prisma'
import { getDocumentContent } from '@/lib/document-actions'
import { generatePdfFromMarkdown } from '@/lib/pdf-generator'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get the current user (coach) information
    const user = await currentUser()
    const coachName = user?.firstName && user?.lastName 
      ? `${user.firstName} ${user.lastName}`
      : user?.firstName || user?.emailAddresses[0]?.emailAddress || 'Your Coach'

    const { documentId, clientEmail, clientName } = await request.json()

    if (!documentId || !clientEmail || !clientName) {
      return NextResponse.json(
        { error: 'Missing required fields' }, 
        { status: 400 }
      )
    }

    // Get the document from database to verify ownership
    const document = await prisma.document.findFirst({
      where: { 
        id: documentId,
        userId 
      }
    })

    if (!document) {
      return NextResponse.json(
        { error: 'Document not found or unauthorized' }, 
        { status: 404 }
      )
    }

    // Get document content
    const documentContent = await getDocumentContent(document.documentPath)

    // Generate PDF using shared utility function
    const pdf = await generatePdfFromMarkdown(documentContent)

    // Send email with document as PDF attachment
    const emailResult = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'noreply@yourdomain.com',
      to: clientEmail,
      subject: `Your ${document.documentType}: ${document.documentName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <p>Hello ${clientName},</p>
          <p>Please find your <strong>${document.documentType}</strong> document attached.</p>
          
          <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin: 0 0 10px 0; color: #1e293b;">Document Details</h3>
            <p style="margin: 5px 0;"><strong>Name:</strong> ${document.documentName}</p>
            <p style="margin: 5px 0;"><strong>Type:</strong> ${document.documentType}</p>
            ${document.startDate ? `<p style="margin: 5px 0;"><strong>Start Date:</strong> ${new Date(document.startDate).toLocaleDateString()}</p>` : ''}
            ${document.endDate ? `<p style="margin: 5px 0;"><strong>End Date:</strong> ${new Date(document.endDate).toLocaleDateString()}</p>` : ''}
          </div>
          
          <p>If you have any questions about this document, please don't hesitate to reach out.</p>
          <p>Best regards,<br>${coachName}</p>
          
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e2e8f0;">
          <p style="font-size: 12px; color: #64748b;">
            This email was sent via HealthCoach AI.
          </p>
        </div>
      `,
      attachments: [
        {
          filename: `${document.documentName}.pdf`,
          content: pdf,
          contentType: 'application/pdf'
        }
      ]
    })

    if (emailResult.error) {
      console.error('Resend error:', emailResult.error)
      return NextResponse.json(
        { error: 'Failed to send email' }, 
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      success: true, 
      emailId: emailResult.data?.id,
      message: `Document sent successfully to ${clientEmail}`
    })

  } catch (error) {
    console.error('Email sending error:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
} 