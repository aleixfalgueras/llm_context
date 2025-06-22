'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Shield, FileText, Mail, BarChart3, AlertCircle } from 'lucide-react'
import Link from 'next/link'

interface ConsentData {
  dataProcessing: boolean
  analytics: boolean
  marketing: boolean
  agreedToTerms: boolean
  agreedToPrivacy: boolean
  timestamp: string
}

export function ConsentManager() {
  const [isVisible, setIsVisible] = useState(false)
  const [consent, setConsent] = useState<ConsentData>({
    dataProcessing: false,
    analytics: false,
    marketing: false,
    agreedToTerms: false,
    agreedToPrivacy: false,
    timestamp: ''
  })

  useEffect(() => {
    // Check if user needs to provide consent
    const savedConsent = localStorage.getItem('user-consent')
    const hasValidConsent = savedConsent && JSON.parse(savedConsent).dataProcessing && JSON.parse(savedConsent).agreedToTerms

    if (!hasValidConsent) {
      const timer = setTimeout(() => setIsVisible(true), 2000)
      return () => clearTimeout(timer)
    }
  }, [])

  const saveConsent = async () => {
    if (!consent.dataProcessing || !consent.agreedToTerms || !consent.agreedToPrivacy) {
      return // Don't save incomplete consent
    }

    try {
      const response = await fetch('/api/consent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dataProcessing: consent.dataProcessing,
          analytics: consent.analytics,
          marketing: consent.marketing,
          agreedToTerms: consent.agreedToTerms,
          agreedToPrivacy: consent.agreedToPrivacy,
          cookiesAnalytics: consent.analytics, // Map to cookies for consistency
          cookiesMarketing: consent.marketing,
          cookiesFunctional: false, // Default for now
          termsVersion: '1.0',
          privacyVersion: '1.0'
        }),
      })

      if (response.ok) {
        // Also save to localStorage for immediate UI updates
        localStorage.setItem('user-consent', JSON.stringify({
          ...consent,
          timestamp: new Date().toISOString()
        }))
        setIsVisible(false)
      } else {
        const error = await response.json()
        console.error('Error saving consent:', error)
        alert('Error saving consent preferences. Please try again.')
      }
    } catch (error) {
      console.error('Error saving consent:', error)
      alert('Error saving consent preferences. Please try again.')
    }
  }

  const isFormValid = consent.dataProcessing && consent.agreedToTerms && consent.agreedToPrivacy

  if (!isVisible) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Data Processing Consent
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-blue-800 dark:text-blue-200 font-medium mb-2">GDPR Compliance Required</p>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  We need your explicit consent to process your personal data and provide our AI marketing services. 
                  You can withdraw consent at any time through your account settings.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-start gap-3 p-4 border rounded-lg">
              <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <FileText className="w-4 h-4 text-green-600 dark:text-green-400" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">Data Processing for Service Provision</h4>
                  <Checkbox
                    checked={consent.dataProcessing}
                    onChange={(e) => setConsent(prev => ({ ...prev, dataProcessing: e.target.checked }))}
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  <strong>Required:</strong> Process your account information, client data, and generated content to provide AI marketing services. 
                  This includes secure storage, AI content generation, and document management.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 border rounded-lg">
              <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <BarChart3 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">Analytics and Performance</h4>
                  <Checkbox
                    checked={consent.analytics}
                    onChange={(e) => setConsent(prev => ({ ...prev, analytics: e.target.checked }))}
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  <strong>Optional:</strong> Analyze usage patterns to improve our service, fix bugs, and optimize performance. 
                  Data is anonymized and aggregated.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 border rounded-lg">
              <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <Mail className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">Marketing Communications</h4>
                  <Checkbox
                    checked={consent.marketing}
                    onChange={(e) => setConsent(prev => ({ ...prev, marketing: e.target.checked }))}
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  <strong>Optional:</strong> Receive updates about new features, tips, and relevant marketing insights. 
                  You can unsubscribe at any time.
                </p>
              </div>
            </div>
          </div>

          <div className="border-t pt-4 space-y-3">
            <div className="flex items-center gap-2">
              <Checkbox
                checked={consent.agreedToTerms}
                onChange={(e) => setConsent(prev => ({ ...prev, agreedToTerms: e.target.checked }))}
              />
              <label className="text-sm">
                I agree to the{' '}
                <Link href="/terms" className="text-blue-600 dark:text-blue-400 hover:underline">
                  Terms of Service
                </Link>
                <span className="text-red-500 ml-1">*</span>
              </label>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                checked={consent.agreedToPrivacy}
                onChange={(e) => setConsent(prev => ({ ...prev, agreedToPrivacy: e.target.checked }))}
              />
              <label className="text-sm">
                I have read and understood the{' '}
                <Link href="/privacy" className="text-blue-600 dark:text-blue-400 hover:underline">
                  Privacy Policy
                </Link>
                <span className="text-red-500 ml-1">*</span>
              </label>
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 text-sm text-muted-foreground">
            <p className="mb-2"><strong>Your Rights:</strong></p>
            <ul className="list-disc list-inside space-y-1">
              <li>Access and export your data at any time</li>
              <li>Correct or update your information</li>
              <li>Delete your account and data</li>
              <li>Withdraw consent (may limit service functionality)</li>
              <li>Data portability to another service</li>
            </ul>
          </div>

          <div className="flex gap-3 pt-4">
            <Button 
              onClick={saveConsent} 
              disabled={!isFormValid}
              className="flex-1"
            >
              Accept and Continue
            </Button>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" className="flex-1">
                  Decline
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Cannot Use Service Without Consent</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <p className="text-muted-foreground">
                    We require explicit consent for data processing to provide our AI marketing services. 
                    Without this consent, we cannot create your account or provide the service.
                  </p>
                  <p className="text-muted-foreground">
                    You can change your preferences later in your account settings, but basic data processing 
                    consent is required for the service to function.
                  </p>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setIsVisible(false)}>
                      Review Again
                    </Button>
                    <Button onClick={() => window.history.back()}>
                      Leave Site
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 