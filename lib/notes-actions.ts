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

export async function uploadNote(formData: FormData) {
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

  // Create file path: user-notes/{userId}/{filename}
  const filePath = `${userId}/${file.name}`

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

    revalidatePath('/chat')
    return { success: true, message: 'Note uploaded successfully' }
  } catch (error) {
    console.error('Upload error:', error)
    throw error
  }
}

export async function getUserNotes(): Promise<UserNote[]> {
  const { userId } = await auth()
  
  if (!userId) {
    throw new Error('Unauthorized')
  }

  try {
    // List files in user's folder
    const { data: files, error: listError } = await supabaseAdmin.storage
      .from('user-notes')
      .list(userId)

    if (listError) {
      throw new Error(`Failed to list notes: ${listError.message}`)
    }

    if (!files || files.length === 0) {
      return []
    }

    // Get content for each file
    const notes: UserNote[] = []
    
    for (const file of files) {
      try {
        const { data: fileData, error: downloadError } = await supabaseAdmin.storage
          .from('user-notes')
          .download(`${userId}/${file.name}`)

        if (downloadError) {
          console.error(`Failed to download ${file.name}:`, downloadError)
          continue
        }

        const content = await fileData.text()
        const fileExtension = file.name.toLowerCase().slice(file.name.lastIndexOf('.'))
        
        notes.push({
          name: file.name,
          content,
          size: file.metadata?.size || 0,
          lastModified: file.updated_at || file.created_at || new Date().toISOString(),
          type: fileExtension === '.md' ? 'markdown' : 'text'
        })
      } catch (error) {
        console.error(`Error processing file ${file.name}:`, error)
      }
    }

    return notes.sort((a, b) => new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime())
  } catch (error) {
    console.error('Error fetching notes:', error)
    throw error
  }
}

export async function deleteNote(fileName: string) {
  const { userId } = await auth()
  
  if (!userId) {
    throw new Error('Unauthorized')
  }

  try {
    const filePath = `${userId}/${fileName}`
    
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