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
import { Copy, Link, AlertCircle, HelpCircle, Share2, UserPlus } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import { AffiliationStatusEmoji, AffiliationStatusComissions, AffiliationWithValid } from '@/lib/types/affiliation-types'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { StatusGuideDialog } from '@/components/affiliation/status-guide-dialog'
import { CommissionsGuideDialog } from '@/components/affiliation/commissions-guide-dialog'

interface AffiliationClientProps {
  userAffiliation: Affiliation | null
  affiliationChildren: AffiliationWithValid[]
}

export function AffiliationClient({ userAffiliation, affiliationChildren }: AffiliationClientProps) {
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [parentCode, setParentCode] = useState('')
  
  // Get the current host for referral link
  const getReferralLink = () => {
    if (typeof window === 'undefined' || !userAffiliation) return ''
    return `${window.location.origin}/sign-up?ref=${userAffiliation.affiliationCode}`
  }

  const handleCreateAffiliation = async () => {
    if (!parentCode.trim()) {
      setError('Parent affiliation code is required')
      return
    }

    setIsCreating(true)
    setError(null)

    try {
      // Call the server action to create affiliation with parent code
      const result = await createUserAffiliation(parentCode.trim().toUpperCase())
      
      toast({
        title: 'Success',
        description: `Your affiliation code ${result.affiliationCode} has been created`,
      })
      
      // No need to reload - revalidatePath in server action handles the update
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create affiliation')
    } finally {
      setIsCreating(false)
    }
  }

  const copyToClipboard = (text: string, type: string = 'code') => {
    navigator.clipboard.writeText(text)
    toast({
      title: 'Copied',
      description: type === 'link' ? 'Referral link copied to clipboard' : 'Affiliation code copied to clipboard',
    })
  }

  // If user doesn't have an affiliation, show creation form (for existing users before this feature)
  if (!userAffiliation) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card className="max-w-lg mx-auto mt-14">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Generate Your Referral Link
            </CardTitle>
            <CardDescription>
              It looks like you signed up before our referral system was launched. Generate your code now!
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                To generate your affiliation code, you need to provide a parent affiliation code from someone who referred you to join our network.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label htmlFor="parentCode">Parent Affiliation Code</Label>
              <Input
                id="parentCode"
                value={parentCode}
                onChange={(e) => {
                  setParentCode(e.target.value.toUpperCase())
                  if (error) setError(null)
                }}
                placeholder="e.g. ABC123"
                className="font-mono"
                maxLength={6}
              />
              <p className="text-sm text-muted-foreground">
                Ask the person who introduced you to the platform for their affiliation code.
              </p>
            </div>

            {error && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="pt-1">{error}</AlertDescription>
              </Alert>
            )}

            <Button 
              onClick={handleCreateAffiliation}
              disabled={isCreating || !parentCode.trim()}
              className="w-full"
              size="lg"
            >
              {isCreating ? 'Generating...' : 'Generate My Referral Link'}
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
              <span className="text-xl font-mono">
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
                {userAffiliation.parentAffiliationCode || 'None'}
              </span>
              {userAffiliation.parentAffiliationCode && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => copyToClipboard(userAffiliation.parentAffiliationCode!)}
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
                      Only users with a valid Stripe subscription are considered for status calculation.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </TooltipProvider>
            
            <div className="mt-4 flex flex-wrap gap-2">
              <StatusGuideDialog currentStatus={userAffiliation.status} />
              <CommissionsGuideDialog />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Referral Link Card */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Your Referral Link
          </CardTitle>
          <CardDescription>
            Share this link with others to grow your network
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Input
              value={getReferralLink()}
              readOnly
              className="font-mono text-sm"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={() => copyToClipboard(getReferralLink(), 'link')}
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            When someone signs up using this link, they'll automatically be added to your network.
          </p>
        </CardContent>
      </Card>

      {/* Affiliation Tree */}
      <Card>
        <CardHeader>
          <CardTitle>Your Affiliation Network</CardTitle>
          <CardDescription>
            View your referral tree and track your network growth. Green icons indicate users with active subscriptions, red icons show users without active subscriptions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {affiliationChildren.length === 0 ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                You don't have any referrals yet. Share your referral link with others to grow your network.
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