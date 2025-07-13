import { auth, currentUser } from '@clerk/nextjs/server'
import { redirect, notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { Navbar } from '@/components/global/navbar'
import AdminDashboardClient from '@/components/admin/admin-dashboard-client'
import { AdminDashboardData } from '@/types/admin-types'

const ADMIN_EMAIL = 'feina.aleix@gmail.com'

async function getAdminDashboardData(): Promise<AdminDashboardData> {
  // Get comprehensive system statistics
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
    prisma.userSubscription.count(),
    
    // Client counts
    prisma.client.count(),
    
    // Document counts
    prisma.document.count(),
    
    // Chat counts
    prisma.chat.count(),
    
    // Message counts
    prisma.message.count(),
    
    // Feedback counts
    prisma.feedback.count(),
    
    // Prompt counts
    prisma.prompt.count(),
    
    // All feedback for admin filtering
    prisma.feedback.findMany({
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
    prisma.userSubscription.groupBy({
      by: ['plan'],
      _count: true
    }),
    
    // Monthly usage data
    prisma.userUsage.findMany({
      where: {
        year: new Date().getFullYear(),
        month: new Date().getMonth() + 1
      },
      select: {
        tokensUsed: true
      }
    }),
    
    // Recent users (last 30 days)
    prisma.userSubscription.count({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        }
      }
    })
  ])

  // Calculate monthly totals
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