import { Navbar } from '@/components/global/navbar'
import { FeedbackForm } from '@/components/feedback-form'

export default async function FeedbackPage() {

  return (
    <div className="min-h-screen bg-background">
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