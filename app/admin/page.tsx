import { auth, currentUser } from '@clerk/nextjs/server'
import { redirect, notFound } from 'next/navigation'
import { adminPrisma } from '@/lib/prisma'
import { Navbar } from '@/components/global/navbar'
import AdminDashboardClient from '@/components/admin/admin-dashboard-client'
import { AdminDashboardData } from '@/lib/types/admin-types'

const ADMIN_EMAIL = 'feina.aleix@gmail.com'

async function getAdminDashboardData(): Promise<AdminDashboardData> {
  try {
    // Get comprehensive system statistics using admin client with direct connection
    const [
      totalUsers,
      recentFeedback,
      userSubscriptions,
      historicalUsage,
      recentUsers,
      allSubscriptions
    ] = await Promise.all([
    // User counts
    adminPrisma.userSubscription.count(),
    
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
    
    // Get usage data for the last 12 months
    adminPrisma.userUsage.findMany({
      where: {
        billingPeriodStart: {
          gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) // Last 12 months
        }
      },
      select: {
        billingPeriodStart: true,
        cost_usd: true
      }
    }),
    
    // Recent users (last 30 days)
    adminPrisma.userSubscription.count({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        }
      }
    }),
    
    // Get all subscriptions to calculate max possible usage
    adminPrisma.userSubscription.findMany({
      select: {
        createdAt: true,
        canceledAt: true,
        currentPeriodStart: true,
        currentPeriodEnd: true,
        spending_limit_usd: true,
        custom_spending_limit_usd: true,
        status: true
      }
    })
  ])

  // Process historical usage data into monthly buckets
  const monthlySpendingMap = new Map<string, number>()
  const monthlyMaxPossibleMap = new Map<string, number>()
  
  // Initialize last 12 months with 0 values
  const now = new Date()
  const monthKeys: string[] = []
  for (let i = 11; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    monthKeys.push(monthKey)
    monthlySpendingMap.set(monthKey, 0)
    monthlyMaxPossibleMap.set(monthKey, 0)
  }
  
  // Aggregate spending by month
  historicalUsage.forEach(usage => {
    const date = new Date(usage.billingPeriodStart)
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    const currentTotal = monthlySpendingMap.get(monthKey) || 0
    monthlySpendingMap.set(monthKey, currentTotal + usage.cost_usd)
  })
  
  // Calculate max possible usage for each month
  monthKeys.forEach(monthKey => {
    const [year, month] = monthKey.split('-')
    const monthStart = new Date(parseInt(year), parseInt(month) - 1, 1)
    const monthEnd = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59)
    
    // Count active subscriptions for this month
    let maxPossible = 0
    allSubscriptions.forEach(sub => {
      const subStart = new Date(sub.createdAt)
      const subEnd = sub.canceledAt ? new Date(sub.canceledAt) : new Date()
      
      // Check if subscription was active during this month
      if (subStart <= monthEnd && subEnd >= monthStart) {
        // Use custom limit if available, otherwise use default
        const limit = sub.custom_spending_limit_usd ?? sub.spending_limit_usd
        maxPossible += limit
      }
    })
    
    monthlyMaxPossibleMap.set(monthKey, maxPossible)
  })
  
  // Convert to array format for chart
  const monthlySpendingHistory = monthKeys.map(monthKey => {
    const [year, month] = monthKey.split('-')
    const date = new Date(parseInt(year), parseInt(month) - 1)
    const monthName = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    return { 
      month: monthName, 
      spending: monthlySpendingMap.get(monthKey) || 0,
      maxPossible: monthlyMaxPossibleMap.get(monthKey) || 0
    }
  })

    return {
      totalUsers,
      recentUsers,
      allFeedback: recentFeedback,
      userSubscriptions,
      monthlySpendingHistory
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