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

    // Get actual data with optimized includes to prevent N+1 queries
    const [clients, documents, chats, prompts, feedbacks, consent, auditLogs] = await Promise.all([
      prisma.client.findMany({ 
        where: { userId },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          country: true,

          notes: true,
          documentsLanguage: true,
          createdAt: true,
          updatedAt: true
        }
      }),
      prisma.document.findMany({ 
        where: { userId },
        select: {
          id: true,
          documentName: true,
          documentType: true,
          createdAt: true,
          updatedAt: true,
          startDate: true,
          endDate: true,
          client: {
            select: {
              name: true
            }
          }
        }
      }),
      prisma.chat.findMany({ 
        where: { userId },
        include: {
          messages: {
            select: {
              id: true,
              content: true,
              role: true,
              model: true,
              createdAt: true
            }
          },
          client: {
            select: {
              name: true
            }
          }
        }
      }),
      prisma.prompt.findMany({ 
        where: { userId },
        select: {
          id: true,
          name: true,
          description: true,
          content: true,
          category: true,
          isActive: true,
          usageCount: true,
          createdAt: true,
          updatedAt: true
        }
      }),
      prisma.feedback.findMany({ 
        where: { userId },
        select: {
          id: true,
          userEmail: true,
          userName: true,
          type: true,
          title: true,
          description: true,
          priority: true,
          useCase: true,
          stepsToReproduce: true,
          createdAt: true
        }
      }),
      prisma.userConsent.findMany({ 
        where: { userId }
      }),
      prisma.consentAuditLog.findMany({ 
        where: { userId }
      })
    ])

    // Extract messages from chats to maintain original structure
    const messages = chats.flatMap(chat => 
      chat.messages.map(message => ({
        ...message,
        chatId: chat.id
      }))
    )

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