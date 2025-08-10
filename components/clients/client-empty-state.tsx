'use client'

import {Button} from '@/components/ui/button'
import {Card, CardContent} from '@/components/ui/card'
import {User} from 'lucide-react'

interface ClientEmptyStateProps {
  searchTerm: string
  onAddClient: () => void
}

export function ClientEmptyState({ searchTerm, onAddClient }: ClientEmptyStateProps) {
  return (
    <Card className="border-blue-200 dark:border-blue-800 bg-blue-50/30 dark:bg-blue-950/10">
      <CardContent className="flex flex-col items-center justify-center py-12">
        <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mb-4">
          <User className="h-8 w-8 text-blue-600 dark:text-blue-400" />
        </div>
        <h3 className="text-lg font-semibold mb-2 text-blue-900 dark:text-blue-100">
          {searchTerm ? 'No clients found' : 'No clients yet'}
        </h3>
        <p className="text-gray-900 dark:text-gray-100 text-center max-w-md">
          {searchTerm 
            ? 'Try adjusting your search terms'
            : 'Start by adding your first client to begin creating marketing content'
          }
        </p>
        {!searchTerm && (
          <Button 
            onClick={onAddClient} 
            className="mt-4"
            variant="blue"
            title="Add your first client"
          >
            Add Your First Client
          </Button>
        )}
      </CardContent>
    </Card>
  )
} 