import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { NextRequest } from 'next/server'
import { logger, withTiming } from '@/lib/logger'

// Force dynamic rendering since we use auth() which accesses headers
export const dynamic = 'force-dynamic'

// GET /api/prompts - List user's prompts
export async function GET(request: NextRequest) {
  const endTiming = logger.startTiming('Get Prompts API');
  
  try {
    const { userId } = await auth()
    logger.apiRequest('GET', '/api/prompts');
    
    if (!userId) {
      logger.warn('Unauthorized access to prompts API');
      return new Response('Unauthorized', { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const activeOnly = searchParams.get('active') === 'true'



    // Add pagination support
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '50', 10)
    const skip = (page - 1) * limit

    logger.dbQuery('findMany', 'prompt', { userId });
    const prompts = await withTiming(
      'Fetch prompts from DB',
      () => prisma.prompt.findMany({
      where: {
        userId,
        ...(category && { category }),
        ...(activeOnly && { isActive: true }),
      },
      select: {
        id: true,
        name: true,
        description: true,
        category: true,
        isActive: true,
        usageCount: true,
        createdAt: true,
        updatedAt: true,
        // Exclude large content field for listing
        ...(searchParams.get('includeContent') === 'true' && { content: true })
      },
      orderBy: [
        { usageCount: 'desc' }, // Most used first
        { updatedAt: 'desc' }, // Then by recent updates
      ],
      take: Math.min(limit, 100), // Cap at 100 items per page
      skip: skip,
      }),
      { userId }
    );



    logger.apiResponse('GET', '/api/prompts', 200, { userId });
    endTiming();
    return Response.json(prompts)
  } catch (error) {
    logger.error('Error fetching prompts', error as Error, { userId: 'unknown' });
    logger.apiResponse('GET', '/api/prompts', 500);
    endTiming();
    return new Response('Internal Server Error', { status: 500 })
  }
}

// POST /api/prompts - Create new prompt
export async function POST(request: Request) {
  const endTiming = logger.startTiming('Create Prompt API');
  
  try {
    const { userId } = await auth()
    logger.apiRequest('POST', '/api/prompts');
    
    if (!userId) {
      logger.warn('Unauthorized access to create prompt');
      return new Response('Unauthorized', { status: 401 })
    }

    const { name, description, content, category } = await request.json()

    // Validate required fields
    if (!name || !content) {
      logger.warn('Missing required fields for prompt creation', { 
        userId,
        metadata: { hasName: !!name, hasContent: !!content }
      });
      return new Response('Name and content are required', { status: 400 })
    }

    logger.dbQuery('create', 'prompt', { userId });
    const prompt = await withTiming(
      'Create prompt in DB',
      () => prisma.prompt.create({
      data: {
        userId,
        name,
        description,
        content,
        category: category || 'general',
      },
      }),
      { userId }
    );

    logger.apiResponse('POST', '/api/prompts', 201, { userId });
    endTiming();
    return Response.json(prompt, { status: 201 })
  } catch (error) {
    logger.error('Error creating prompt', error as Error, { userId: 'unknown' });
    logger.apiResponse('POST', '/api/prompts', 500);
    endTiming();
    return new Response('Internal Server Error', { status: 500 })
  }
} 