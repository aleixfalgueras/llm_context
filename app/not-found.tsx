import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { MessageSquare } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <MessageSquare className="w-16 h-16 mx-auto mb-4 text-gray-400" />
        <h1 className="text-4xl font-bold mb-2">404</h1>
        <h2 className="text-xl mb-4">Chat Not Found</h2>
        <p className="text-gray-600 mb-6">
          The chat you're looking for doesn't exist or you don't have permission to view it.
        </p>
        <Button asChild>
          <Link href="/">
            Go Back Home
          </Link>
        </Button>
      </div>
    </div>
  )
} 