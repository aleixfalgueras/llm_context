'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Zap } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useTranslations } from '@/lib/translations/context'

interface UpgradePromptProps {
  title: string
  description: string
}

export function UpgradePrompt({ title, description }: UpgradePromptProps) {
  const router = useRouter()
  const t = useTranslations('subscription')

  return (
    <div className="h-full flex items-center justify-center p-6">
      <Card className="max-w-md border-blue-200 dark:border-blue-800 bg-blue-50/30 dark:bg-blue-950/10">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mb-4">
            <Zap className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          </div>
          <CardTitle className="text-xl text-blue-900 dark:text-blue-100">{title}</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-blue-700 dark:text-blue-300">{description}</p>
          <Button
            variant="blue"
            onClick={() => router.push('/subscription')}
            className="w-full"
          >
            {t('upgradePrompt.upgradeButton')}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
