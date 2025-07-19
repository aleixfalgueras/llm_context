import {Card, CardContent} from '@/components/ui/card'

export function SubscriptionFAQ() {
  return (
    <div className="mt-16 max-w-3xl mx-auto">
      <h2 className="text-3xl font-bold text-center mb-8">Frequently Asked Questions</h2>
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6">
            <h3 className="font-semibold mb-2">Can I change plans anytime?</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Yes! You can upgrade or downgrade your plan at any time. Upgrades take effect immediately at full price. 
              Downgrades take effect at the end of your current billing period.
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <h3 className="font-semibold mb-2">What happens if I exceed my limits?</h3>
            <p className="text-gray-600 dark:text-gray-400">
              You'll be notified when approaching your limits and prompted to upgrade. 
              We won't charge extra - your usage will be paused until the next billing cycle or until you upgrade.
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <h3 className="font-semibold mb-2">Is my data secure?</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Absolutely. We're fully GDPR compliant with enterprise-grade security. 
              Your client data is encrypted and never shared with third parties.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}