'use client'

import {useState} from 'react'
import {Button} from '@/components/ui/button'
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs'
import {
  BarChart3,
  Loader2,
  MessageSquare,
  RotateCcw,
  Settings
} from 'lucide-react'
import {AdminDashboardData} from '@/lib/types/admin-types'
import {useToast} from '@/hooks/use-toast'
import {handleClientApiError} from '@/lib/api/api-toast'
import {useTranslations} from '@/lib/translations/context'
import AdminDashboardStats from './AdminDashboardStats'
import AdminFeedbackTab from './AdminFeedbackTab'
import AdminCustomizationTab from './AdminCustomizationTab'

interface AdminDashboardClientProps {
  data: AdminDashboardData
}

export default function AdminDashboardClient({ data }: AdminDashboardClientProps) {
  const t = useTranslations('admin')
  const { toast } = useToast()
  const [clearingCaches, setClearingCaches] = useState<boolean>(false)

  const handleClearCaches = async () => {
    setClearingCaches(true)
    try {
      const response = await fetch('/api/admin/clear-caches', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: t('errors.admin.clearCaches') }))
        throw new Error(errorData.error)
      }

      const result = await response.json()
      
      toast({
        title: 'Success',
        description: result.message || t('dashboard.success.cachesCleared')
      })
    } catch (error) {
      console.error('Error clearing caches:', error)
      const errorMessage = error instanceof Error ? error.message : t('errors.admin.clearCaches')
      handleClientApiError(errorMessage, t('errors.admin.clearCaches'))
    } finally {
      setClearingCaches(false)
    }
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <Tabs defaultValue="stats" className="w-full">
        <div className="flex justify-between items-center mb-6">
          <TabsList className="grid max-w-md grid-cols-3">
            <TabsTrigger value="stats" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              {t('admin.dashboard.tabs.stats')}
            </TabsTrigger>
            <TabsTrigger value="feedback" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              {t('admin.dashboard.tabs.feedback')}
            </TabsTrigger>
            <TabsTrigger value="customization" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              {t('admin.dashboard.tabs.customization')}
            </TabsTrigger>
          </TabsList>
          
          <Button
            variant="outline"
            onClick={handleClearCaches}
            disabled={clearingCaches}
            className="flex items-center gap-2"
          >
            {clearingCaches ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {t('dashboard.buttons.clearingCaches')}
              </>
            ) : (
              <>
                <RotateCcw className="h-4 w-4" />
                {t('dashboard.buttons.clearCaches')}
              </>
            )}
          </Button>
        </div>

        <TabsContent value="stats" className="mt-6">
          <AdminDashboardStats data={data} />
        </TabsContent>

        <TabsContent value="feedback" className="mt-6">
          <AdminFeedbackTab initialFeedback={data.allFeedback} />
        </TabsContent>

        <TabsContent value="customization" className="mt-6">
          <AdminCustomizationTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}