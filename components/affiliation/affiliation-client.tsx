'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AffiliationTree } from '@/components/affiliation/affiliation-tree'
import { createUserAffiliation } from '@/app/actions/affiliation-action'
import { Affiliation } from '@prisma/client'
import { Copy, Link, AlertCircle, HelpCircle } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import { AffiliationStatusEmoji, AffiliationStatusComissions } from '@/lib/types/affiliation-types'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { StatusGuideDialog } from '@/components/affiliation/status-guide-dialog'

interface AffiliationClientProps {
  userAffiliation: Affiliation | null
  affiliationChildren: Affiliation[]
}

export function AffiliationClient({ userAffiliation, affiliationChildren }: AffiliationClientProps) {
  const [parentCode, setParentCode] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleCreateAffiliation = async () => {
    if (!parentCode.trim()) {
      setError('Please enter a parent affiliation code')
      return
    }

    setIsCreating(true)
    setError(null)

    try {
      const result = await createUserAffiliation(parentCode)
      
      toast({
        title: 'Success',
        description: `Your affiliation code ${result.affiliationCode} has been created`,
      })
      
      // Reload the page to show the new affiliation
      window.location.reload()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create affiliation')
    } finally {
      setIsCreating(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: 'Copied',
      description: 'Affiliation code copied to clipboard',
    })
  }

  // If user doesn't have an affiliation, show creation form
  if (!userAffiliation) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card className="max-w-lg mx-auto mt-14">
          <CardHeader>
            <CardTitle>Create Your Affiliation Code</CardTitle>
            <CardDescription>
              To get started, you need to enter an existing user's affiliation code
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                You need an affiliation code from an existing user to join the network. 
                This code will become your parent affiliation, and you'll receive your own unique code to share with others.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label htmlFor="parentCode">Parent Affiliation Code</Label>
              <Input
                id="parentCode"
                type="text"
                placeholder="Enter code (e.g., ABC123)"
                value={parentCode}
                onChange={(e) => setParentCode(e.target.value.toUpperCase())}
                disabled={isCreating}
                maxLength={6}
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button 
              onClick={handleCreateAffiliation}
              disabled={isCreating || !parentCode.trim()}
              className="w-full"
            >
              {isCreating ? 'Creating...' : 'Create My Affiliation Code'}
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // User has affiliation, show details and tree
  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <Link className="h-8 w-8 text-blue-600" />
          <h1 className="text-3xl font-bold">Affiliation Network</h1>
        </div>
        <p className="text-muted-foreground">
          Manage your affiliation network and track your referrals
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Affiliation Code Card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Your Affiliation Code</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <span className="text-xl font-mono font-bold">
                {userAffiliation.affiliationCode}
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => copyToClipboard(userAffiliation.affiliationCode)}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Parent Code Card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Parent Affiliation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <span className="text-xl font-mono">
                {userAffiliation.parentAffiliationCode}
              </span>
              {userAffiliation.parentAffiliationCode !== 'SYSTEM' && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => copyToClipboard(userAffiliation.parentAffiliationCode)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Status Card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Status</CardTitle>
          </CardHeader>
          <CardContent>
            <TooltipProvider>
              <div className="flex items-center gap-2 mt-2">
                <Badge className="text-base px-3 py-1" variant="default">
                  {AffiliationStatusEmoji[userAffiliation.status]}
                </Badge>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-sm">
                    <p className="text-sm">
                      <strong>Benefits:</strong><br />
                      {AffiliationStatusComissions[userAffiliation.status]}
                    </p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </TooltipProvider>
            
            <div className="mt-4">
              <StatusGuideDialog currentStatus={userAffiliation.status} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Affiliation Tree */}
      <Card>
        <CardHeader>
          <CardTitle>Your Affiliation Network</CardTitle>
          <CardDescription>
            View your referral tree and track your network growth
          </CardDescription>
        </CardHeader>
        <CardContent>
          {affiliationChildren.length === 0 ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                You don't have any referrals yet. Share your affiliation code <strong>{userAffiliation.affiliationCode}</strong> with others to grow your network.
              </AlertDescription>
            </Alert>
          ) : (
            <AffiliationTree
              userAffiliation={userAffiliation}
              children={affiliationChildren}
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}