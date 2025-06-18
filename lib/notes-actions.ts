'use server'

import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_KEY!

// Create a server-side Supabase client with service role key for file operations
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

export interface UserNote {
  name: string
  content: string
  size: number
  lastModified: string
  type: 'markdown' | 'text'
}

export async function uploadNote(formData: FormData, clientId?: string) {
  const { userId } = await auth()
  
  if (!userId) {
    throw new Error('Unauthorized')
  }

  const file = formData.get('file') as File
  
  if (!file) {
    throw new Error('No file provided')
  }

  // Validate file type
  const allowedTypes = ['.md', '.txt']
  const fileExtension = file.name.toLowerCase().slice(file.name.lastIndexOf('.'))
  
  if (!allowedTypes.includes(fileExtension)) {
    throw new Error('Only .md and .txt files are allowed')
  }

  // Create file path: user-notes/{userId}/{clientId}/{filename} or user-notes/{userId}/{filename}
  const filePath = clientId 
    ? `${userId}/${clientId}/${file.name}`
    : `${userId}/${file.name}`

  try {
    // Upload file to Supabase storage
    const { error } = await supabaseAdmin.storage
      .from('user-notes')
      .upload(filePath, file, {
        upsert: true // Allow overwriting files with the same name
      })

    if (error) {
      throw new Error(`Upload failed: ${error.message}`)
    }

    // If clientId is provided, also save note metadata to database
    if (clientId) {
      const { prisma } = await import('./prisma')
      
      await prisma.note.create({
        data: {
          userId,
          clientId,
          fileName: file.name,
          filePath,
          type: fileExtension === '.md' ? 'markdown' : 'text',
          size: file.size,
        }
      })
    }

    revalidatePath('/chat')
    return { success: true, message: 'Note uploaded successfully' }
  } catch (error) {
    console.error('Upload error:', error)
    throw error
  }
}

export async function getUserNotes(clientId?: string | null): Promise<UserNote[]> {
  const { userId } = await auth()
  
  if (!userId) {
    throw new Error('Unauthorized')
  }

  try {
    const { prisma } = await import('./prisma')

    if (clientId) {
      // Get notes for specific client
      const clientNotes = await prisma.note.findMany({
        where: { userId, clientId },
        include: { client: true },
        orderBy: { createdAt: 'desc' }
      })

      const notes: UserNote[] = []

      for (const noteRecord of clientNotes) {
        try {
          const { data: fileData, error: downloadError } = await supabaseAdmin.storage
            .from('user-notes')
            .download(noteRecord.filePath)

          if (downloadError) {
            console.error(`Failed to download ${noteRecord.fileName}:`, downloadError)
            continue
          }

          const content = await fileData.text()
          
          notes.push({
            name: noteRecord.fileName,
            content,
            size: noteRecord.size,
            lastModified: noteRecord.updatedAt.toISOString(),
            type: noteRecord.type as 'markdown' | 'text'
          })
        } catch (error) {
          console.error(`Error processing note ${noteRecord.fileName}:`, error)
        }
      }

      return notes
    } else {
      // Get all client notes across all clients
      const clientNotes = await prisma.note.findMany({
        where: { userId },
        include: { client: true },
        orderBy: { createdAt: 'desc' }
      })

      const notes: UserNote[] = []

      for (const noteRecord of clientNotes) {
        try {
          const { data: fileData, error: downloadError } = await supabaseAdmin.storage
            .from('user-notes')
            .download(noteRecord.filePath)

          if (downloadError) {
            console.error(`Failed to download ${noteRecord.fileName}:`, downloadError)
            continue
          }

          const content = await fileData.text()
          
          notes.push({
            name: `${noteRecord.client.name} - ${noteRecord.fileName}`,
            content,
            size: noteRecord.size,
            lastModified: noteRecord.updatedAt.toISOString(),
            type: noteRecord.type as 'markdown' | 'text'
          })
        } catch (error) {
          console.error(`Error processing note ${noteRecord.fileName}:`, error)
        }
      }

      return notes
    }
  } catch (error) {
    console.error('Error fetching notes:', error)
    throw error
  }
}

export async function deleteNote(fileName: string, clientId?: string) {
  const { userId } = await auth()
  
  if (!userId) {
    throw new Error('Unauthorized')
  }

  try {
    let filePath: string
    
    if (clientId) {
      filePath = `${userId}/${clientId}/${fileName}`
      
      // Also delete from database if it's a client note
      try {
        const { prisma } = await import('./prisma')
        await prisma.note.deleteMany({
          where: {
            userId,
            clientId,
            fileName
          }
        })
      } catch (dbError) {
        console.error('Failed to delete note from database:', dbError)
        // Continue with file deletion even if DB deletion fails
      }
    } else {
      filePath = `${userId}/${fileName}`
    }
    
    const { error } = await supabaseAdmin.storage
      .from('user-notes')
      .remove([filePath])

    if (error) {
      throw new Error(`Failed to delete note: ${error.message}`)
    }

    revalidatePath('/chat')
    return { success: true, message: 'Note deleted successfully' }
  } catch (error) {
    console.error('Delete error:', error)
    throw error
  }
} 