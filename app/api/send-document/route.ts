import { NextRequest, NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs/server'
import { Resend } from 'resend'
import { prisma } from '@/lib/prisma'
import { getDocumentContent } from '@/lib/document-actions'
import { marked } from 'marked'
import puppeteer from 'puppeteer'
import chromium from '@sparticuz/chromium'

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

    // Convert markdown to HTML
    const html = marked(documentContent)

    // Create PDF with environment-specific puppeteer configuration
    const browser = process.env.NODE_ENV === 'production'
      ? await puppeteer.launch({
          args: chromium.args,
          defaultViewport: { width: 1280, height: 720 },
          executablePath: await chromium.executablePath(),
          headless: true,
        })
      : await puppeteer.launch({ headless: true })

    const page = await browser.newPage()
    await page.setContent(`
      <html>
        <head>
          <style>
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 800px;
              margin: 0 auto;
              padding: 20px;
            }
            h1, h2, h3, h4, h5, h6 {
              color: #2563eb;
              margin-top: 24px;
              margin-bottom: 16px;
            }
            h1 { 
              font-size: 2em; 
              border-bottom: 2px solid #2563eb; 
              padding-bottom: 8px; 
            }
            h2 { font-size: 1.5em; }
            h3 { font-size: 1.3em; }
            p { margin-bottom: 16px; }
            ul, ol { 
              margin-bottom: 16px; 
              padding-left: 30px; 
            }
            li { margin-bottom: 8px; }
            blockquote {
              border-left: 4px solid #2563eb;
              padding-left: 16px;
              margin: 16px 0;
              font-style: italic;
              background: #f8fafc;
              padding: 12px 16px;
            }
            code {
              background: #f1f5f9;
              padding: 2px 6px;
              border-radius: 4px;
              font-family: 'Courier New', monospace;
            }
            pre {
              background: #f1f5f9;
              padding: 16px;
              border-radius: 8px;
              overflow-x: auto;
              margin: 16px 0;
            }
            pre code {
              background: none;
              padding: 0;
            }
            table {
              border-collapse: collapse;
              width: 100%;
              margin: 16px 0;
            }
            th, td {
              border: 1px solid #ddd;
              padding: 12px;
              text-align: left;
            }
            th {
              background-color: #f8fafc;
              font-weight: bold;
            }
          </style>
        </head>
        <body>
          ${html}
        </body>
      </html>
    `)

    const pdf = await page.pdf({
      format: 'A4',
      margin: { 
        top: '20mm', 
        right: '20mm', 
        bottom: '20mm', 
        left: '20mm' 
      },
      printBackground: true,
    })

    await browser.close()

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
          content: Buffer.from(pdf),
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