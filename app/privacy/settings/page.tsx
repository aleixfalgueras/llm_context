'use client'

import { Navbar } from '@/components/global/navbar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { ArrowLeft, Shield, Download, Trash2, Edit, Eye, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useState } from 'react'

export default function PrivacySettingsPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showDeletionScheduled, setShowDeletionScheduled] = useState(false)
  const [confirmationText, setConfirmationText] = useState('')
  const [deletionReason, setDeletionReason] = useState('user_request')
  const [deletionInfo, setDeletionInfo] = useState<any>(null)

  const handleDataExport = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/data-export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const result = await response.json()
      
      if (response.ok) {
        alert(result.message || 'Data export request submitted successfully!')
      } else {
        alert(result.error || 'Failed to submit export request')
      }
    } catch (error) {
      console.error('Error requesting data export:', error)
      alert('Error submitting export request. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

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

      const result = await response.json()
      
      if (response.ok) {
        setDeletionInfo(result)
        setShowDeleteConfirm(false)
        setShowDeletionScheduled(true)
        setConfirmationText('')
      } else {
        alert(result.error || 'Failed to schedule account deletion')
      }
    } catch (error) {
      console.error('Error scheduling account deletion:', error)
      alert('Error scheduling account deletion. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancelDeletion = async () => {
    if (!deletionInfo?.deletionId) return
    
    setIsLoading(true)
    try {
      const response = await fetch('/api/account/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          deletionId: deletionInfo.deletionId
        })
      })

      const result = await response.json()
      
      if (response.ok) {
        alert(result.message || 'Account deletion cancelled successfully!')
        setShowDeletionScheduled(false)
        setDeletionInfo(null)
      } else {
        alert(result.error || 'Failed to cancel account deletion')
      }
    } catch (error) {
      console.error('Error cancelling account deletion:', error)
      alert('Error cancelling account deletion. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/30 via-white to-blue-50/20 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
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
                  <Shield className="w-5 h-5" />
                  Consent Management
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  Review and update your consent preferences for data processing and communications.
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
                    <h4 className="font-medium mb-2">Analytics</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      Help us improve our service
                    </p>
                    <Button size="sm" variant="outline">
                      Manage Preference
                    </Button>
                  </div>
                  <div className="border rounded-lg p-4">
                    <h4 className="font-medium mb-2">Marketing</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      Updates and marketing communications
                    </p>
                    <Button size="sm" variant="outline">
                      Manage Preference
                    </Button>
                  </div>
                  <div className="border rounded-lg p-4">
                    <h4 className="font-medium mb-2">Cookies</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      Website functionality and preferences
                    </p>
                    <Button size="sm" variant="outline">
                      Cookie Settings
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="w-5 h-5" />
                  Your Data Rights
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  Exercise your rights under GDPR and other privacy laws.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Download className="w-4 h-4" />
                      <h4 className="font-medium">Export My Data</h4>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      Download all your personal data and generated content
                    </p>
                    <Button size="sm" onClick={handleDataExport} disabled={isLoading}>
                      {isLoading ? 'Requesting...' : 'Request Export'}
                    </Button>
                  </div>
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Edit className="w-4 h-4" />
                      <h4 className="font-medium">Correct My Data</h4>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      Update or correct your personal information
                    </p>
                    <Button size="sm" variant="outline">
                      Edit Profile
                    </Button>
                  </div>
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Eye className="w-4 h-4" />
                      <h4 className="font-medium">Access My Data</h4>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      View what data we have about you
                    </p>
                    <Button size="sm" variant="outline">
                      View Data
                    </Button>
                  </div>
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Trash2 className="w-4 h-4" />
                      <h4 className="font-medium">Delete My Account</h4>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      Permanently delete your account and data
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
            <p className="text-sm text-gray-600">
              This action will permanently delete your account and all associated data. 
              You will have a 7-day grace period to cancel this request.
            </p>
            
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
              >
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleAccountDeletion}
                disabled={confirmationText !== 'DELETE MY ACCOUNT' || isLoading}
                className="flex-1"
              >
                {isLoading ? 'Processing...' : 'Delete Account'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Deletion Scheduled Dialog */}
      <Dialog open={showDeletionScheduled} onOpenChange={setShowDeletionScheduled}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-green-900">Account Deletion Scheduled</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Your account deletion has been scheduled. You have 7 days to cancel this request.
            </p>
            
            {deletionInfo && (
              <div className="space-y-2 text-sm">
                <p><strong>Deletion ID:</strong> {deletionInfo.deletionId}</p>
                <p><strong>Scheduled for:</strong> {new Date(deletionInfo.scheduledDeletion).toLocaleDateString()}</p>
                <p><strong>Data to be deleted:</strong></p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  {Object.entries(deletionInfo.dataToBeDeleted).map(([key, count]) => (
                    <li key={key}>{key}: {String(count)} records</li>
                  ))}
                </ul>
              </div>
            )}
            
            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                onClick={() => setShowDeletionScheduled(false)}
                className="flex-1"
              >
                OK
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleCancelDeletion}
                disabled={isLoading}
                className="flex-1"
              >
                {isLoading ? 'Cancelling...' : 'Cancel Deletion'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
} 