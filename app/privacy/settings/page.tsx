'use client'

import { Navbar } from '@/components/global/navbar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { ArrowLeft, Shield, Trash2, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useState } from 'react'
import { handleClientApiError } from '@/lib/api/api-toast'
import { useRouter } from 'next/navigation'

export default function PrivacySettingsPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [confirmationText, setConfirmationText] = useState('')
  const [deletionReason, setDeletionReason] = useState('user_request')
  const router = useRouter()

  const handleAccountDeletion = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/account/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          confirmationText,
          reason: deletionReason
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to delete account' }))
        throw new Error(errorData.error)
      }

      const result = await response.json()
      
      // Show success message and redirect to home page
      alert(`Account deleted successfully. Deletion ID: ${result.deletionId}`)
      
      // Clear form and close dialog
      setShowDeleteConfirm(false)
      setConfirmationText('')
      
      // Redirect to home page since user is now deleted
      router.push('/')
    } catch (error) {
      console.error('Error deleting account:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete account'
      handleClientApiError(errorMessage, 'Failed to delete account')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <Button variant="ghost" asChild className="mb-4">
              <Link href="/privacy">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Privacy Policy
              </Link>
            </Button>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                <Settings className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground">Privacy Settings</h1>
                <p className="text-muted-foreground">Manage your data and privacy preferences</p>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Privacy Controls
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  Manage your data processing consent and account settings.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="border rounded-lg p-4">
                    <h4 className="font-medium mb-2">Data Processing</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      Required for core service functionality
                    </p>
                    <Button size="sm" disabled>
                      Always Required
                    </Button>
                  </div>
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Trash2 className="w-4 h-4" />
                      <h4 className="font-medium">Delete My Account</h4>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      Permanently and immediately delete your account and all data
                    </p>
                    <Button 
                      size="sm" 
                      variant="destructive"
                      onClick={() => setShowDeleteConfirm(true)}
                    >
                      Delete Account
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Contact Privacy Team</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Have questions about your privacy or need assistance with your data rights?
                </p>
                <div className="space-y-2 text-sm">
                  <p><strong>Privacy Email:</strong> falguerasaleix@gmail.com</p>
                  <p><strong>Data Protection Officer:</strong> falguerasaleix@gmail.com</p>
                  <p><strong>Support:</strong> <Link href="/feedback" className="text-blue-600 dark:text-blue-400 hover:underline">Submit a request</Link></p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Account Deletion Confirmation Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-900">Delete Account</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-red-50 dark:bg-red-950 rounded-lg border border-red-200 dark:border-red-800">
              <p className="text-sm text-red-800 dark:text-red-200 font-medium mb-2">
                ⚠️ This action cannot be undone
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confirmationText">
                Type "DELETE MY ACCOUNT" to confirm:
              </Label>
              <Input
                id="confirmationText"
                value={confirmationText}
                onChange={(e) => setConfirmationText(e.target.value)}
                placeholder="DELETE MY ACCOUNT"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="deletionReason">
                Reason for deletion (optional):
              </Label>
              <select
                id="deletionReason"
                value={deletionReason}
                onChange={(e) => setDeletionReason(e.target.value)}
                className="w-full p-2 border rounded-md"
              >
                <option value="user_request">I no longer need the service</option>
                <option value="privacy_concerns">Privacy concerns</option>
                <option value="service_issues">Service issues</option>
                <option value="other">Other</option>
              </select>
            </div>
            
            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowDeleteConfirm(false)
                  setConfirmationText('')
                }}
                className="flex-1"
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleAccountDeletion}
                disabled={confirmationText !== 'DELETE MY ACCOUNT' || isLoading}
                className="flex-1"
              >
                {isLoading ? 'Deleting...' : 'Delete Account'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}