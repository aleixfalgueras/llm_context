import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card'
import {TrendingUp, Users} from 'lucide-react'
import {useTranslations} from '@/lib/translations/context'
import {CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis} from 'recharts'
import {AdminDashboardData} from '@/lib/types/admin-types'

interface AdminDashboardStatsProps {
  data: AdminDashboardData
}

export default function AdminDashboardStats({ data }: AdminDashboardStatsProps) {
  const t = useTranslations('admin')

  return (
    <div className="space-y-6">
      {/* Monthly Spending Graph */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
            <TrendingUp className="h-5 w-5" />
            {t('dashboard.metrics.monthlyUsage')}
          </CardTitle>
          <CardDescription>
            {t('admin.dashboard.descriptions.monthlyUsageDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={data.monthlySpendingHistory}
                margin={{ top: 5, right: 30, left: 20, bottom: 25 }}
              >
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="month" 
                  className="text-xs"
                  tick={{ fill: 'currentColor' }}
                />
                <YAxis 
                  className="text-xs"
                  tick={{ fill: 'currentColor' }}
                  tickFormatter={(value) => `$${value.toFixed(0)}`}
                />
                <Tooltip 
                  formatter={(value: number, name: string) => [
                    `$${value.toFixed(2)}`, 
                    name === 'spending' ? t('admin.dashboard.spending.tooltip.actualSpending') : t('admin.dashboard.spending.tooltip.maxCapacity')
                  ]}
                  contentStyle={{
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="spending" 
                  stroke="hsl(217, 91%, 60%)" 
                  strokeWidth={2}
                  dot={{ fill: 'hsl(217, 91%, 60%)', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6 }}
                  name="spending"
                />
                <Line 
                  type="monotone" 
                  dataKey="maxPossible" 
                  stroke="hsl(142, 71%, 45%)" 
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={{ fill: 'hsl(142, 71%, 45%)', strokeWidth: 2, r: 3 }}
                  activeDot={{ r: 5 }}
                  name="maxPossible"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-6 mt-4">
            <div className="flex items-center gap-2">
              <div className="h-3 w-8 bg-blue-500 rounded" />
              <span className="text-sm text-muted-foreground">{t('admin.dashboard.spending.legend.actualSpending')}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-8 bg-green-600 rounded border-2 border-dashed border-green-600 bg-opacity-50" />
              <span className="text-sm text-muted-foreground">{t('admin.dashboard.spending.legend.maximumCapacity')}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Monthly Subscription History Graph */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
            <Users className="h-5 w-5" />
            {t('dashboard.metrics.monthlySubscriptions')}
          </CardTitle>
          <CardDescription>
            {t('admin.dashboard.descriptions.monthlySubscriptionsDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={data.monthlySubscriptionHistory}
                margin={{ top: 5, right: 30, left: 20, bottom: 25 }}
              >
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="month" 
                  className="text-xs"
                  tick={{ fill: 'currentColor' }}
                />
                <YAxis 
                  className="text-xs"
                  tick={{ fill: 'currentColor' }}
                  tickFormatter={(value) => value.toString()}
                />
                <Tooltip 
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const dataPoint = data.monthlySubscriptionHistory.find(d => d.month === label)
                      if (!dataPoint) return null
                      
                      return (
                        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
                          <p className="font-medium mb-2">{label}</p>
                          <div className="space-y-1 text-sm">
                            <p className="flex justify-between gap-4">
                              <span>{t('admin.dashboard.tooltip.users')}</span>
                              <span className="font-medium">{dataPoint.totalUsers}</span>
                            </p>
                            <p className="flex justify-between gap-4">
                              <span>{t('admin.dashboard.tooltip.activeUsers')}</span>
                              <span className="font-medium">{dataPoint.activeUsers}</span>
                            </p>
                            {dataPoint.activeUsers > 0 && (
                              <>
                                <div className="border-t pt-1 mt-1">
                                  <p className="text-xs text-muted-foreground mb-1">{t('admin.dashboard.tooltip.activeSubscriptions')}</p>
                                  <p className="flex justify-between gap-4">
                                    <span className="text-xs">{t('admin.dashboard.plans.apprentice')}</span>
                                    <span className="font-medium text-xs">{dataPoint.subscriptionBreakdown.apprentice}</span>
                                  </p>
                                  <p className="flex justify-between gap-4">
                                    <span className="text-xs">{t('admin.dashboard.plans.knight')}</span>
                                    <span className="font-medium text-xs">{dataPoint.subscriptionBreakdown.knight}</span>
                                  </p>
                                  <p className="flex justify-between gap-4">
                                    <span className="text-xs">{t('admin.dashboard.plans.master')}</span>
                                    <span className="font-medium text-xs">{dataPoint.subscriptionBreakdown.master}</span>
                                  </p>
                                  <p className="flex justify-between gap-4">
                                    <span className="text-xs">{t('admin.dashboard.plans.jedi')}</span>
                                    <span className="font-medium text-xs">{dataPoint.subscriptionBreakdown.jedi}</span>
                                  </p>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      )
                    }
                    return null
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="totalUsers" 
                  stroke="hsl(217, 91%, 60%)" 
                  strokeWidth={2}
                  dot={{ fill: 'hsl(217, 91%, 60%)', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6 }}
                  name="totalUsers"
                />
                <Line 
                  type="monotone" 
                  dataKey="activeUsers" 
                  stroke="hsl(142, 71%, 45%)" 
                  strokeWidth={2}
                  dot={{ fill: 'hsl(142, 71%, 45%)', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6 }}
                  name="activeUsers"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-6 mt-4">
            <div className="flex items-center gap-2">
              <div className="h-3 w-8 bg-blue-500 rounded" />
              <span className="text-sm text-muted-foreground">{t('admin.dashboard.legend.totalUsers')}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-8 bg-green-600 rounded" />
              <span className="text-sm text-muted-foreground">{t('admin.dashboard.legend.activeUsers')}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}