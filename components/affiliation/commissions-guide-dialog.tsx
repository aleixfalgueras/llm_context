'use client'

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DollarSign, Calendar, Users, CheckCircle2, AlertCircle } from 'lucide-react'
import { SUBSCRIPTION_PLAN_DETAIL } from '@/lib/types/subscription-types'
import { useTranslations } from '@/lib/translations/context'

export function CommissionsGuideDialog() {
  const t = useTranslations('affiliation')
  
  const subscriptionLimits = Object.values(SUBSCRIPTION_PLAN_DETAIL).map((plan) => ({
    plan: plan.name,
    limit: plan.commissionLimit,
    color: 'bg-blue-100 text-blue-800' // You can customize colors per plan if needed
  }))

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <DollarSign className="h-4 w-4" />
          {t('commissionsGuide.buttonLabel')}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            {t('commissionsGuide.title')}
          </DialogTitle>
          <DialogDescription>
            {t('commissionsGuide.description')}
          </DialogDescription>
        </DialogHeader>
        
        <div className="mt-6 space-y-6">
          {/* Payment Rules Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              {t('commissionsGuide.paymentProcessing')}
            </h3>
            
            <div className="grid gap-4 md:grid-cols-1">
              <div className="p-4 border rounded-lg bg-muted/50">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <p className="font-medium">{t('commissionsGuide.monthlyPaymentTitle')}</p>
                      <p className="text-sm text-muted-foreground">
                        {t('commissionsGuide.monthlyPaymentDescription')}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <p className="font-medium">{t('commissionsGuide.activeSubscriptionTitle')}</p>
                      <p className="text-sm text-muted-foreground">
                        {t('commissionsGuide.activeSubscriptionDescription')}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                    <div>
                      <p className="font-medium">{t('commissionsGuide.validPaymentTitle')}</p>
                      <p className="text-sm text-muted-foreground">
                        {t('commissionsGuide.validPaymentDescription')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Subscription Limits Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              {t('commissionsGuide.calculationLimits')}
            </h3>
            
            <p className="text-sm text-muted-foreground mb-4">
              {t('commissionsGuide.calculationLimitsDescription')}
            </p>

            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full border-collapse border rounded-lg">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-4 font-semibold">{t('commissionsGuide.subscriptionPlan')}</th>
                    <th className="text-left p-4 font-semibold">{t('commissionsGuide.commissionLimit')}</th>
                    <th className="text-left p-4 font-semibold">{t('commissionsGuide.description')}</th>
                  </tr>
                </thead>
                <tbody>
                  {subscriptionLimits.map((item) => (
                    <tr key={item.plan} className="border-b hover:bg-muted/50 transition-colors">
                      <td className="p-4">
                        <Badge variant="secondary" className="text-sm">
                          {item.plan}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <div className="font-medium">
                          {t('commissionsGuide.usersCount', { count: item.limit })}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="text-sm text-muted-foreground">
                          {t('commissionsGuide.topPerformingReferrals', { count: item.limit })}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-3">
              {subscriptionLimits.map((item) => (
                <div key={item.plan} className="p-4 border rounded-lg bg-card">
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="secondary" className="text-sm">
                      {item.plan}
                    </Badge>
                    <div className="font-medium text-sm">
                      {t('commissionsGuide.usersCount', { count: item.limit })}
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {t('commissionsGuide.topPerformingReferrals', { count: item.limit })}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Important Notes */}
          <div className="mt-6 p-4 bg-amber-50 border border-amber-300 dark:bg-amber-100 dark:border-amber-500 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-amber-800 mb-1">{t('commissionsGuide.importantNotesTitle')}</h4>
                <ul className="text-sm text-amber-700 space-y-1">
                  <li>• {t('commissionsGuide.note1')}</li>
                  <li>• {t('commissionsGuide.note2')}</li>
                  <li>• {t('commissionsGuide.note3')}</li>
                  <li>• {t('commissionsGuide.note4')}</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}