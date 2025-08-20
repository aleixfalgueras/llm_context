'use client'

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DollarSign, Calendar, Users, CheckCircle2, AlertCircle } from 'lucide-react'

export function CommissionsGuideDialog() {
  const subscriptionLimits = [
    { plan: 'Apprentice', limit: 50, color: 'bg-blue-100 text-blue-800' },
    { plan: 'Knight', limit: 100, color: 'bg-green-100 text-green-800' },
    { plan: 'Master', limit: 200, color: 'bg-purple-100 text-purple-800' },
    { plan: 'Jedi', limit: 'All', color: 'bg-gold-100 text-gold-800' }
  ]

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <DollarSign className="h-4 w-4" />
          Commissions Guide
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Commissions Guide
          </DialogTitle>
          <DialogDescription>
            Understanding how affiliate commissions work, payment schedules, and subscription limits
          </DialogDescription>
        </DialogHeader>
        
        <div className="mt-6 space-y-6">
          {/* Payment Rules Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Payment Processing
            </h3>
            
            <div className="grid gap-4 md:grid-cols-1">
              <div className="p-4 border rounded-lg bg-muted/50">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <p className="font-medium">Monthly Payment Schedule</p>
                      <p className="text-sm text-muted-foreground">
                        Commission payments are processed automatically on the 1st of each month for the previous month's earnings.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <p className="font-medium">Active Subscription Required</p>
                      <p className="text-sm text-muted-foreground">
                        You must maintain an active subscription to receive commission payments. Suspended or canceled subscriptions will pause commission payouts.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                    <div>
                      <p className="font-medium">Valid Payment Method Required</p>
                      <p className="text-sm text-muted-foreground">
                        Only affiliated users with valid Stripe subscriptions and payment methods are included in commission calculations.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Subscription Limits Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Commission Calculation Limits
            </h3>
            
            <p className="text-sm text-muted-foreground mb-4">
              Your subscription plan determines how many users from your referral network can be included in commission calculations.
            </p>

            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full border-collapse border rounded-lg">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-4 font-semibold">Subscription Plan</th>
                    <th className="text-left p-4 font-semibold">Commission Calculation Limit</th>
                    <th className="text-left p-4 font-semibold">Description</th>
                  </tr>
                </thead>
                <tbody>
                  {subscriptionLimits.map((item, index) => (
                    <tr key={item.plan} className="border-b hover:bg-muted/50 transition-colors">
                      <td className="p-4">
                        <Badge variant="secondary" className="text-sm">
                          {item.plan}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <div className="font-medium">
                          {typeof item.limit === 'number' ? `${item.limit} users` : 'Unlimited users'}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="text-sm text-muted-foreground">
                          {typeof item.limit === 'number' 
                            ? `Commissions calculated from your top ${item.limit} performing referrals`
                            : 'Commissions calculated from all referrals in your network'
                          }
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-3">
              {subscriptionLimits.map((item) => (
                <div key={item.plan} className="p-4 border rounded-lg bg-card">
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="secondary" className="text-sm">
                      {item.plan}
                    </Badge>
                    <div className="font-medium text-sm">
                      {typeof item.limit === 'number' ? `${item.limit} users` : 'Unlimited'}
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {typeof item.limit === 'number' 
                      ? `Commissions calculated from your top ${item.limit} performing referrals`
                      : 'Commissions calculated from all referrals in your network'
                    }
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Important Notes */}
          <div className="mt-6 p-4 bg-amber-50 border border-amber-300 dark:bg-amber-100 dark:border-amber-500 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-amber-800 mb-1">Important Notes</h4>
                <ul className="text-sm text-amber-700 space-y-1">
                  <li>• Commission rates depend on your affiliation status level</li>
                  <li>• Payments are processed via Stripe to your registered payment method</li>
                  <li>• Commission calculations exclude trial users and inactive subscriptions</li>
                  <li>• Upgrade your subscription to increase your earning potential</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}