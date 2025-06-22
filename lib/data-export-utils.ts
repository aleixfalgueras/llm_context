import { prisma } from './prisma'
import { generatePdfFromMarkdown } from './pdf-generator'
import fs from 'fs/promises'
import path from 'path'

export interface UserDataExport {
  exportId: string
  userId: string
  generatedAt: string
  summary: {
    totalRecords: number
    dataTypes: string[]
  }
  data: {
    clients: any[]
    documents: any[]
    chats: any[]
    messages: any[]
    prompts: any[]
    feedbacks: any[]
    consent: any[]
    auditLogs: any[]
  }
}

export async function compileUserDataExport(userId: string, exportId: string): Promise<UserDataExport> {
  try {
    // Get basic counts first
    const [
      clientCount,
      documentCount,
      chatCount,
      messageCount,
      promptCount,
      feedbackCount,
      consentCount,
      auditLogCount
    ] = await Promise.all([
      prisma.client.count({ where: { userId } }),
      prisma.document.count({ where: { userId } }),
      prisma.chat.count({ where: { userId } }),
      prisma.message.count({ where: { chat: { userId } } }),
      prisma.prompt.count({ where: { userId } }),
      prisma.feedback.count({ where: { userId } }),
      prisma.userConsent.count({ where: { userId } }),
      prisma.consentAuditLog.count({ where: { userId } })
    ])

    // Get actual data (simplified for now)
    const clients = await prisma.client.findMany({ where: { userId } })
    const documents = await prisma.document.findMany({ where: { userId } })
    const chats = await prisma.chat.findMany({ where: { userId } })
    const messages = await prisma.message.findMany({ where: { chat: { userId } } })
    const prompts = await prisma.prompt.findMany({ where: { userId } })
    const feedbacks = await prisma.feedback.findMany({ where: { userId } })
    const consent = await prisma.userConsent.findMany({ where: { userId } })
    const auditLogs = await prisma.consentAuditLog.findMany({ where: { userId } })

    const exportData: UserDataExport = {
      exportId,
      userId,
      generatedAt: new Date().toISOString(),
      summary: {
        totalRecords: clientCount + documentCount + chatCount + messageCount + promptCount + feedbackCount + consentCount + auditLogCount,
        dataTypes: ['clients', 'documents', 'chats', 'messages', 'prompts', 'feedbacks', 'consent', 'auditLogs']
      },
      data: {
        clients: clients.map(c => ({
          ...c,
          createdAt: c.createdAt.toISOString(),
          updatedAt: c.updatedAt.toISOString()
        })),
        documents: documents.map(d => ({
          ...d,
          createdAt: d.createdAt.toISOString(),
          updatedAt: d.updatedAt.toISOString(),
          startDate: d.startDate?.toISOString(),
          endDate: d.endDate?.toISOString()
        })),
        chats: chats.map(c => ({
          ...c,
          createdAt: c.createdAt.toISOString(),
          updatedAt: c.updatedAt.toISOString()
        })),
        messages: messages.map(m => ({
          ...m,
          createdAt: m.createdAt.toISOString()
        })),
        prompts: prompts.map(p => ({
          ...p,
          createdAt: p.createdAt.toISOString(),
          updatedAt: p.updatedAt.toISOString()
        })),
        feedbacks: feedbacks.map(f => ({
          ...f,
          createdAt: f.createdAt.toISOString()
        })),
        consent: consent.map(c => ({
          ...c,
          consentGivenAt: c.consentGivenAt.toISOString(),
          lastUpdatedAt: c.lastUpdatedAt.toISOString(),
          withdrawnAt: c.withdrawnAt?.toISOString()
        })),
        auditLogs: auditLogs.map(a => ({
          ...a,
          createdAt: a.createdAt.toISOString()
        }))
      }
    }

    return exportData
  } catch (error) {
    console.error('Error compiling user data export:', error)
    throw new Error('Failed to compile user data export')
  }
}

export async function generateDataExportFiles(userId: string, exportId: string): Promise<{
  jsonPath: string
  pdfPath: string
}> {
  try {
    // Compile the data
    const exportData = await compileUserDataExport(userId, exportId)

    // Create export directory
    const exportDir = path.join(process.cwd(), 'temp', 'exports')
    await fs.mkdir(exportDir, { recursive: true })

    // Generate JSON file
    const jsonPath = path.join(exportDir, `${exportId}.json`)
    await fs.writeFile(jsonPath, JSON.stringify(exportData, null, 2))

    // Generate PDF file
    const pdfContent = generateExportPdfContent(exportData)
    const pdfPath = path.join(exportDir, `${exportId}.pdf`)
    const pdfBuffer = await generatePdfFromMarkdown(pdfContent)
    await fs.writeFile(pdfPath, pdfBuffer)

    return { jsonPath, pdfPath }
  } catch (error) {
    console.error('Error generating export files:', error)
    throw new Error('Failed to generate export files')
  }
}

function generateExportPdfContent(exportData: UserDataExport): string {
  return `# Data Export Report

**Generated:** ${new Date(exportData.generatedAt).toLocaleString()}  
**Export ID:** ${exportData.exportId}  
**User ID:** ${exportData.userId}

## Data Summary

**Total Records:** ${exportData.summary.totalRecords}

- **Clients:** ${exportData.data.clients.length} records
- **Documents:** ${exportData.data.documents.length} records  
- **Chat Sessions:** ${exportData.data.chats.length} records
- **Messages:** ${exportData.data.messages.length} records
- **Custom Prompts:** ${exportData.data.prompts.length} records
- **Feedback Submitted:** ${exportData.data.feedbacks.length} records
- **Consent Records:** ${exportData.data.consent.length} records
- **Audit Log Entries:** ${exportData.data.auditLogs.length} records

## Data Rights Information

Under GDPR and other privacy laws, you have the right to:

- **Access** your personal data (this export)
- **Rectify** incorrect or incomplete data
- **Erase** your data ("right to be forgotten")
- **Restrict** processing of your data
- **Data portability** (export in machine-readable format)
- **Object** to processing of your data

## Contact Information

For questions about your data or to exercise your rights:

- **Privacy Email:** falguerasaleix@gmail.com
- **Data Protection Officer:** falguerasaleix@gmail.com
- **Support Portal:** Contact through your account settings

---

*This is a summary of your data export. The complete data is available in the JSON file: ${exportData.exportId}.json*

*For detailed document content or specific questions about your data, please contact our support team.*
`
}

export async function cleanupExportFiles(exportId: string) {
  try {
    const exportDir = path.join(process.cwd(), 'temp', 'exports')
    const jsonPath = path.join(exportDir, `${exportId}.json`)
    const pdfPath = path.join(exportDir, `${exportId}.pdf`)

    await Promise.allSettled([
      fs.unlink(jsonPath),
      fs.unlink(pdfPath)
    ])
  } catch (error) {
    console.error('Error cleaning up export files:', error)
    // Don't throw - cleanup is best effort
  }
} 