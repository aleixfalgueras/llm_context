'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Cookie, Settings, Shield, BarChart3, Target } from 'lucide-react'
import Link from 'next/link'

interface CookieConsent {
  necessary: boolean
  analytics: boolean
  marketing: boolean
  functional: boolean
}

export function CookieBanner() {
  const [isVisible, setIsVisible] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [consent, setConsent] = useState<CookieConsent>({
    necessary: true, // Always required
    analytics: false,
    marketing: false,
    functional: false
  })

  useEffect(() => {
    // Check if user has already made a choice
    const savedConsent = localStorage.getItem('cookie-consent')
    if (!savedConsent) {
      // Show banner after a short delay
      const timer = setTimeout(() => setIsVisible(true), 1000)
      return () => clearTimeout(timer)
    }
  }, [])

  const saveConsent = async (consentData: CookieConsent) => {
    try {
      // Save to backend if user is authenticated
      const response = await fetch('/api/consent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dataProcessing: true, // Assumed true if they're setting cookies
          analytics: consentData.analytics,
          marketing: consentData.marketing,
          agreedToTerms: true, // Assumed if setting cookies
          agreedToPrivacy: true, // Assumed if setting cookies
          cookiesAnalytics: consentData.analytics,
          cookiesMarketing: consentData.marketing,
          cookiesFunctional: consentData.functional,
          termsVersion: '1.0',
          privacyVersion: '1.0'
        }),
      })

      // Always save to localStorage for immediate UI response
      localStorage.setItem('cookie-consent', JSON.stringify({
        ...consentData,
        timestamp: new Date().toISOString()
      }))
      
      // Set cookies based on consent
      if (typeof window !== 'undefined') {
        // Analytics cookies
        if (consentData.analytics) {
          console.log('Analytics cookies enabled')
        } else {
          console.log('Analytics cookies disabled')
        }
        
        // Marketing cookies
        if (consentData.marketing) {
          console.log('Marketing cookies enabled')
        } else {
          console.log('Marketing cookies disabled')
        }
        
        // Functional cookies
        if (consentData.functional) {
          console.log('Functional cookies enabled')
        } else {
          console.log('Functional cookies disabled')
        }
      }
      
      setIsVisible(false)
      setShowSettings(false)
    } catch (error) {
      console.log('Failed to save to backend, using localStorage only:', error)
      // Continue with localStorage storage even if backend fails
      localStorage.setItem('cookie-consent', JSON.stringify({
        ...consentData,
        timestamp: new Date().toISOString()
      }))
      
      setIsVisible(false)
      setShowSettings(false)
    }
  }

  const acceptAll = () => {
    const allConsent = {
      necessary: true,
      analytics: true,
      marketing: true,
      functional: true
    }
    saveConsent(allConsent)
  }

  const acceptEssential = () => {
    const essentialOnly = {
      necessary: true,
      analytics: false,
      marketing: false,
      functional: false
    }
    saveConsent(essentialOnly)
  }

  const handleCustomSave = () => {
    saveConsent(consent)
  }

  if (!isVisible) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-t border-gray-200 dark:border-gray-700 shadow-lg">
      <div className="max-w-6xl mx-auto">
        <Card className="border-0 shadow-none bg-transparent">
          <CardContent className="p-0">
            <div className="flex flex-col lg:flex-row lg:items-center gap-4">
              <div className="flex items-start gap-3 flex-1">
                <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                  <Cookie className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-sm mb-1">We value your privacy</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    We use cookies to enhance your experience, provide personalized content, and analyze our traffic. 
                    By clicking "Accept All", you consent to our use of cookies. 
                    <Link href="/privacy/cookies" className="text-blue-600 dark:text-blue-400 hover:underline ml-1">
                      Learn more
                    </Link>
                  </p>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-2 lg:flex-shrink-0">
                <Dialog open={showSettings} onOpenChange={setShowSettings}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="text-xs">
                      <Settings className="w-3 h-3 mr-1" />
                      Customize
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <Cookie className="w-5 h-5" />
                        Cookie Preferences
                      </DialogTitle>
                    </DialogHeader>
                    
                    <div className="space-y-6">
                      <div className="space-y-4">
                        <div className="flex items-start gap-3 p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                          <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Shield className="w-4 h-4 text-green-600 dark:text-green-400" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-medium text-green-800 dark:text-green-200">Necessary Cookies</h4>
                              <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                Always Active
                              </Badge>
                            </div>
                            <p className="text-sm text-green-700 dark:text-green-300">
                              Essential for website functionality, security, and user authentication. Cannot be disabled.
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start gap-3 p-4 border rounded-lg">
                          <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center flex-shrink-0">
                            <BarChart3 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-medium">Analytics Cookies</h4>
                                                             <Checkbox
                                 checked={consent.analytics}
                                 onChange={(e) => 
                                   setConsent(prev => ({ ...prev, analytics: e.target.checked }))
                                 }
                               />
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Help us understand how you use our website to improve performance and user experience.
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start gap-3 p-4 border rounded-lg">
                          <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Target className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-medium">Marketing Cookies</h4>
                                                             <Checkbox
                                 checked={consent.marketing}
                                 onChange={(e) => 
                                   setConsent(prev => ({ ...prev, marketing: e.target.checked }))
                                 }
                               />
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Used to deliver personalized content and relevant advertisements based on your interests.
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start gap-3 p-4 border rounded-lg">
                          <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Settings className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-medium">Functional Cookies</h4>
                                                             <Checkbox
                                 checked={consent.functional}
                                 onChange={(e) => 
                                   setConsent(prev => ({ ...prev, functional: e.target.checked }))
                                 }
                               />
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Enable enhanced features like chat preferences, theme settings, and user interface customizations.
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2 pt-4 border-t">
                        <Button onClick={handleCustomSave} className="flex-1">
                          Save Preferences
                        </Button>
                        <Button variant="outline" onClick={acceptAll} className="flex-1">
                          Accept All
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
                
                <Button variant="outline" size="sm" onClick={acceptEssential} className="text-xs">
                  Essential Only
                </Button>
                <Button size="sm" onClick={acceptAll} className="text-xs">
                  Accept All
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 