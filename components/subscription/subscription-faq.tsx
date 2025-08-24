import {Card, CardContent} from '@/components/ui/card'
import {useTranslations} from '@/lib/translations/context'

export function SubscriptionFAQ() {
  const t = useTranslations('subscription')
  
  return (
    <div className="mt-16 max-w-3xl mx-auto">
      <h2 className="text-3xl font-bold text-center mb-8">{t('faq.title')}</h2>
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6">
            <h3 className="font-semibold mb-2">{t('faq.changeAnytime.question')}</h3>
            <p className="text-gray-600 dark:text-gray-400">
              {t('faq.changeAnytime.answer')}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <h3 className="font-semibold mb-2">{t('faq.exceedLimits.question')}</h3>
            <p className="text-gray-600 dark:text-gray-400">
              {t('faq.exceedLimits.answer')}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <h3 className="font-semibold mb-2">{t('faq.dataSecure.question')}</h3>
            <p className="text-gray-600 dark:text-gray-400">
              {t('faq.dataSecure.answer')}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}