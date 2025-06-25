import { prisma } from './prisma'

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

    return { jsonPath }
  } catch (error) {
    console.error('Error generating export files:', error)
    throw new Error('Failed to generate export files')
  }
}



export async function cleanupExportFiles(exportId: string) {
  try {
    const exportDir = path.join(process.cwd(), 'temp', 'exports')
    const jsonPath = path.join(exportDir, `${exportId}.json`)

    await fs.unlink(jsonPath)
  } catch (error) {
    console.error('Error cleaning up export files:', error)
    // Don't throw - cleanup is best effort
  }
} 