import { NavbarWrapper } from '@/components/global/navbar-wrapper'
import { PromptsManagement } from '@/components/prompts/prompts-management'

export default async function PromptsPage() {

  return (
    <div className="h-screen bg-background overflow-hidden flex flex-col">
      <NavbarWrapper />
      <div className="flex-1 overflow-auto">
        <PromptsManagement />
      </div>
    </div>
  )
} 