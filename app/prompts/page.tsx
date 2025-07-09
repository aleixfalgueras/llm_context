import { Navbar } from '@/components/global/navbar'
import { PromptsManagement } from '@/components/prompts/prompts-management'

export default async function PromptsPage() {

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <PromptsManagement />
      </div>
    </div>
  )
} 