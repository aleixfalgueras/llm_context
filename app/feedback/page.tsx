import { Navbar } from '@/components/global/navbar'
import { FeedbackForm } from '@/components/global/feedback-form'

export default async function FeedbackPage() {

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/30 via-white to-blue-50/20 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <Navbar />
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Provide Feedback
            </h1>
            <p className="text-muted-foreground">
              Help us improve by sharing your feature requests, reporting bugs, or providing general feedback.
            </p>
          </div>
          <FeedbackForm />
        </div>
      </div>
    </div>
  )
} 