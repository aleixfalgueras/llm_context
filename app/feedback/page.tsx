import { Navbar } from '@/components/global/navbar'
import { FeedbackForm } from '@/components/feedback-form'
import { getTranslations } from '@/lib/translations'
import { getLocaleFromCookies } from '@/lib/utils/locale-cookie-server'

export default async function FeedbackPage() {
  const locale = await getLocaleFromCookies()
  const t = await getTranslations('feedback', locale)

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              {t('pageTitle')}
            </h1>
            <p className="text-muted-foreground">
              {t('pageDescription')}
            </p>
          </div>
          <FeedbackForm />
        </div>
      </div>
    </div>
  )
} 