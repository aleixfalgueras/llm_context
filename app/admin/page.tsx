import { auth, currentUser } from '@clerk/nextjs/server'
import { redirect, notFound } from 'next/navigation'
import { adminPrisma } from '@/lib/prisma'
import { Navbar } from '@/components/global/navbar'
import AdminDashboardClient from '@/components/admin/admin-dashboard-client'
import { AdminDashboardData } from '@/types/admin-types'

const ADMIN_EMAIL = 'feina.aleix@gmail.com'

async function getAdminDashboardData(): Promise<AdminDashboardData> {
  try {
    // Get comprehensive system statistics using admin client with direct connection
    const [
      totalUsers,
      totalClients,
      totalDocuments,
      totalChats,
      totalMessages,
      totalFeedback,
      totalPrompts,
      recentFeedback,
      userSubscriptions,
      monthlyUsage,
      recentUsers
    ] = await Promise.all([
    // User counts
    adminPrisma.userSubscription.count(),
    
    // Client counts
    adminPrisma.client.count(),
    
    // Document counts
    adminPrisma.document.count(),
    
    // Chat counts
    adminPrisma.chat.count(),
    
    // Message counts
    adminPrisma.message.count(),
    
    // Feedback counts
    adminPrisma.feedback.count(),
    
    // Prompt counts
    adminPrisma.prompt.count(),
    
    // All feedback for admin filtering
    adminPrisma.feedback.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        type: true,
        title: true,
        priority: true,
        state: true,
        userEmail: true,
        userName: true,
        description: true,
        createdAt: true
      }
    }),
    
    // Subscription data
    adminPrisma.userSubscription.groupBy({
      by: ['plan'],
      _count: true
    }),
    
    // Current billing period usage data
    adminPrisma.userUsage.findMany({
      where: {
        billingPeriodStart: { lte: new Date() },
        billingPeriodEnd: { gte: new Date() }
      },
      select: {
        tokensUsed: true
      }
    }),
    
    // Recent users (last 30 days)
    adminPrisma.userSubscription.count({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        }
      }
    })
  ])

  // Calculate current billing period totals
  const monthlyStats = monthlyUsage.reduce(
    (acc, usage) => ({
      tokens: acc.tokens + usage.tokensUsed
    }),
    { tokens: 0 }
  )

    return {
      totalUsers,
      totalClients,
      totalDocuments,
      totalChats,
      totalMessages,
      totalPrompts,
      totalFeedback,
      recentUsers,
      allFeedback: recentFeedback,
      userSubscriptions,
      monthlyStats
    }
  } catch (error: any) {
    console.error('Admin dashboard database error:', error)
    
    // Check for connection timeout specifically
    if (error.code === 'P1017' || error.message?.includes('connection pool') || error.message?.includes('Timed out')) {
      throw new Error('Database connection timeout. Admin dashboard requires direct database access for complex queries. Please check your database configuration.')
    }
    
    // Re-throw with more context
    throw new Error(`Failed to load admin dashboard data: ${error.message || 'Unknown database error'}`)
  }
}

export default async function AdminDashboard() {
  const { userId } = await auth()
  
  if (!userId) {
    redirect('/sign-in')
  }

  // Get current user to check email
  const user = await currentUser()
  const userEmail = user?.emailAddresses[0]?.emailAddress

  // Check if user is admin
  if (userEmail !== ADMIN_EMAIL) {
    notFound()
  }

  const data = await getAdminDashboardData()

  return (
    <div className="h-screen bg-background overflow-hidden flex flex-col">
      <Navbar />
      <div className="flex-1 overflow-auto">
        <AdminDashboardClient data={data} />
      </div>
    </div>
  )
} 