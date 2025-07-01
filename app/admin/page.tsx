import { auth, currentUser } from '@clerk/nextjs/server'
import { redirect, notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { Navbar } from '@/components/global/navbar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Users, 
  FileText, 
  MessageSquare, 
  TrendingUp, 
  DollarSign, 
  Calendar,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react'
import { FeedbackType, Priority, BadgeVariant } from '@/types/enums'

const ADMIN_EMAIL = 'feina.aleix@gmail.com'

async function getAdminDashboardData() {
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
    
    // Recent feedback
    prisma.feedback.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        type: true,
        title: true,
        priority: true,
        userEmail: true,
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
    recentFeedback,
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50/30 via-white to-blue-50/20 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <Navbar />
      <div className="container mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            System overview and metrics for LLM Context platform
          </p>
        </div>

        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.totalUsers}</div>
              <p className="text-xs text-muted-foreground">
                +{data.recentUsers} in last 30 days
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.totalClients}</div>
              <p className="text-xs text-muted-foreground">
                Across all users
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Documents</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.totalDocuments}</div>
              <p className="text-xs text-muted-foreground">
                Unlimited for all plans
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Chat Conversations</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.totalChats}</div>
              <p className="text-xs text-muted-foreground">
                {data.totalMessages} messages total
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Additional Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monthly Usage</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">Documents:</span>
                  <span className="font-medium">Unlimited</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Tokens:</span>
                  <span className="font-medium">{data.monthlyStats.tokens.toLocaleString()}</span>
                </div>
                <div className="text-xs text-muted-foreground mt-2">
                  OpenRouter handles billing automatically
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Subscription Plans</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {data.userSubscriptions.map((sub) => (
                  <div key={sub.plan} className="flex justify-between">
                    <span className="text-sm capitalize">{sub.plan}:</span>
                    <span className="font-medium">{sub._count}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Feedback & Prompts</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">Total Feedback:</span>
                  <span className="font-medium">{data.totalFeedback}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Custom Prompts:</span>
                  <span className="font-medium">{data.totalPrompts}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Feedback */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Feedback</CardTitle>
            <CardDescription>Latest user feedback and issues</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.recentFeedback.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No feedback yet</p>
              ) : (
                data.recentFeedback.map((feedback) => (
                  <div key={feedback.id} className="flex items-start justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant={
                          feedback.type === FeedbackType.BUG ? BadgeVariant.DESTRUCTIVE : 
                          feedback.type === FeedbackType.FEATURE ? BadgeVariant.DEFAULT : BadgeVariant.SECONDARY
                        }>
                          {feedback.type}
                        </Badge>
                        <Badge variant={
                          feedback.priority === Priority.HIGH ? BadgeVariant.DESTRUCTIVE :
                          feedback.priority === Priority.MEDIUM ? BadgeVariant.DEFAULT : BadgeVariant.SECONDARY
                        }>
                          {feedback.priority}
                        </Badge>
                      </div>
                      <h4 className="font-medium">{feedback.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        {feedback.userEmail || 'Anonymous'} • {new Date(feedback.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    {feedback.type === FeedbackType.BUG && <AlertTriangle className="h-4 w-4 text-orange-500" />}
                    {feedback.type === FeedbackType.FEATURE && <TrendingUp className="h-4 w-4 text-blue-500" />}
                    {feedback.type === FeedbackType.COMPLAINT && <XCircle className="h-4 w-4 text-red-500" />}
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 