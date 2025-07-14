import { Navbar } from '@/components/global/navbar'
import { PromptsManagement } from '@/components/prompts/prompts-management'

export default async function PromptsPage() {

  return (
    <div className="h-screen bg-background overflow-hidden flex flex-col">
      <Navbar />
      <div className="flex-1 overflow-auto">
        <PromptsManagement />
      </div>
    </div>
  )
} 