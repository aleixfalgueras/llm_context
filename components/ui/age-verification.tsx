'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AlertCircle, Calendar, Shield } from 'lucide-react'

interface AgeVerificationProps {
  onVerified: () => void
  onDeclined: () => void
}

export function AgeVerification({ onVerified, onDeclined }: AgeVerificationProps) {
  const [birthDate, setBirthDate] = useState('')
  const [error, setError] = useState('')

  const handleVerification = () => {
    if (!birthDate) {
      setError('Please enter your date of birth')
      return
    }

    const birth = new Date(birthDate)
    const today = new Date()
    const age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()
    
    // Adjust age if birthday hasn't occurred this year
    const actualAge = monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate()) 
      ? age - 1 
      : age

    if (actualAge < 18) {
      setError('You must be at least 18 years old to use this service')
      return
    }

    // Store verification (you might want to send this to your backend)
    localStorage.setItem('age-verified', JSON.stringify({
      verified: true,
      timestamp: new Date().toISOString()
    }))

    onVerified()
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Age Verification Required
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-blue-800 dark:text-blue-200 font-medium mb-2">18+ Service</p>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  This service is intended for users 18 years and older. 
                  Please verify your age to continue.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="birthdate" className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Date of Birth
              </Label>
              <Input
                id="birthdate"
                type="date"
                value={birthDate}
                onChange={(e) => {
                  setBirthDate(e.target.value)
                  setError('')
                }}
                max={new Date().toISOString().split('T')[0]}
                className={error ? 'border-red-500' : ''}
              />
              {error && (
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              )}
            </div>

            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 text-sm text-muted-foreground">
              <p className="font-medium mb-2">Privacy Notice:</p>
              <p>
                Your date of birth is used solely for age verification and is not stored or shared. 
                Only the verification status is retained locally.
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <Button onClick={handleVerification} className="flex-1">
              Verify Age
            </Button>
            <Button variant="outline" onClick={onDeclined} className="flex-1">
              I'm Under 18
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 