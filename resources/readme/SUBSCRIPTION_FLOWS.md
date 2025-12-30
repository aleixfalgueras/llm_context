# Subscription Flows Documentation

## Plan Structure

- **Apprentice (Free)**: Default plan for all users, never expires, $5.80/month spending limit
- **Knight**: Paid plan ($50/month)
- **Master**: Paid plan ($200/month)
- **Jedi**: Paid plan ($500/month)

**Free Plan Detection**: `plan === 'apprentice' && stripeSubscriptionId === null`

## Overview: Billing Period Usage Integration

**⚠️ IMPORTANT**: The application uses **billing period-based usage tracking** that aligns with Stripe subscription billing cycles. This means:

- **Usage tracking periods** match your exact Stripe billing periods (e.g., 15th to 15th if subscribed on the 15th)
- **Usage resets** occur exactly when Stripe charges the customer, not on calendar month boundaries
- **Subscription changes** automatically handle usage period transitions
- **Accurate usage reporting** aligned with actual billing cycles

## Usage Tracking During Subscription Changes

### Usage Behavior During Upgrades
- **Immediate effect**: New token limits apply instantly upon successful upgrade
- **Usage preservation**: Current billing period usage carries over to new plan
- **Billing period continuity**: Usage period remains aligned with original subscription start date

### Usage Behavior During Downgrades  
- **Scheduled effect**: New limits apply at next billing period (when downgrade takes effect)
- **Usage monitoring**: Current period tracked under existing limits until transition
- **Clean transition**: Usage resets with new billing period when downgrade activates

### Usage Behavior During Renewals
- **Automatic reset**: Usage resets to 0 when billing period renews
- **Exact timing**: Reset occurs at Stripe subscription renewal timestamp
- **Consistent periods**: Each billing period duration matches subscription settings

## 1. New Subscription Creation Flow

**User initiates subscription creation from UI**

- API call to create checkout (create-checkout/route.ts)
- Check if plan is valid and get price ID
- Get user email from Clerk
- Create checkout session (createCheckoutSession in stripe-utils.ts)
  - Create or retrieve customer (createOrRetrieveCustomer in stripe-utils.ts)
  - Configure checkout session for new subscription
  - Set metadata with userId and planId
- Return checkout URL to frontend
- **User completes payment on Stripe Checkout**
- Stripe webhook: customer.subscription.created (webhook/route.ts)
  - Check idempotency (checkEventIdempotency in webhook-event.ts)
  - Process webhook event (processWebhookEvent in webhook-event.ts)
  - Handle subscription event (handleSubscriptionEvent in webhook-handle.ts)
  - Regular subscription processing (not upgrade)
  - Synchronize subscription with database (synchronizeSubscriptionWithStripe in stripe-subscription.ts)
  - Update plan limits and subscription data
  - Invalidate user caches
  - Mark event as processed (markEventProcessed in webhook-event.ts)

## 2. Subscription Upgrade Flow

**User initiates upgrade from current plan to higher plan**

- API call to create checkout (create-checkout/route.ts)
- Check existing subscription (SubscriptionOperations.findByUserId)
- Detect it's NOT a downgrade (upgrade or new subscription path)
- Create checkout session (createCheckoutSession in stripe-utils.ts)
  - Create or retrieve customer (createOrRetrieveCustomer in stripe-utils.ts)
  - Configure checkout session for upgrade
  - Set metadata with userId, planId, isUpgrade: 'true', previousSubscriptionId
- Return checkout URL to frontend
- **User completes payment on Stripe Checkout**
- Stripe webhook: customer.subscription.created (webhook/route.ts)
  - Check idempotency (checkEventIdempotency in webhook-event.ts)
  - Process webhook event (processWebhookEvent in webhook-event.ts)
  - Handle subscription event (handleSubscriptionEvent in webhook-handle.ts)
  - Detect upgrade scenario (isUpgrade === 'true' and eventType === 'created')
  - Handle upgrade process (handleUpgradeProcess in webhook-handle.ts)
    - Validate upgrade state (validateUpgradeState in webhook-handle.ts)
    - Cancel old subscription immediately (cancelSubscriptionImmediately in stripe-subscription.ts)
    - Synchronize new subscription (synchronizeSubscriptionWithStripe in stripe-subscription.ts)
    - Clear upgrade metadata from Stripe subscription
  - Mark event as processed (markEventProcessed in webhook-event.ts)

## 3. Subscription Downgrade Flow

**User initiates downgrade from current plan to lower plan**

- API call to create checkout (create-checkout/route.ts)
- Check existing subscription (SubscriptionOperations.findByUserId)
- Detect downgrade (isDowngrade function from subscription-plan-utils)
- Schedule subscription downgrade (scheduleSubscriptionDowngrade in stripe-subscription.ts)
  - Get current subscription from Stripe
  - Release existing schedule if present (releaseSubscriptionSchedule in stripe-subscription.ts)
  - Create subscription schedule from existing subscription
  - Update schedule with two phases:
    - Current phase until period end
    - New phase with target plan from period end
  - Update database with pendingPlanChange and stripeScheduleId
  - Invalidate user caches
- Return success response with effective date
- **At end of billing period, Stripe automatically applies schedule**
- Stripe webhook: customer.subscription.updated (webhook/route.ts)
  - Check idempotency (checkEventIdempotency in webhook-event.ts)
  - Process webhook event (processWebhookEvent in webhook-event.ts)
  - Handle subscription event (handleSubscriptionEvent in webhook-handle.ts)
  - Regular subscription processing
  - Check if pending plan change matches new plan
  - Clear pendingPlanChange and stripeScheduleId if match
  - Synchronize subscription (synchronizeSubscriptionWithStripe in stripe-subscription.ts)
  - Mark event as processed (markEventProcessed in webhook-event.ts)

## 3b. Downgrade to Free Apprentice Flow

**User initiates downgrade from paid plan to free Apprentice**

Since Apprentice is free and has no Stripe price, this flow is different from paid plan downgrades:

- API call to create checkout (create-checkout/route.ts)
- Check existing subscription (SubscriptionOperations.findByUserId)
- Detect downgrade to Apprentice (targetPlan === SubscriptionPlan.apprentice)
- Call cancelDowngradeToApprentice (stripe-subscription.ts)
  - Retrieve subscription to get period end date
  - Mark subscription for cancellation at period end (cancel_at_period_end: true)
  - Update database with cancelAtPeriodEnd and pendingPlanChange = 'apprentice'
  - Invalidate user caches
- Return success response with effective date
- **At end of billing period, Stripe subscription is deleted**
- Stripe webhook: customer.subscription.deleted (webhook/route.ts)
  - handleSubscriptionDeleted detects pendingPlanChange === 'apprentice'
  - Call resetToFreeApprentice (stripe-subscription.ts)
    - Set plan to apprentice, status to active
    - Clear stripeSubscriptionId, stripePriceId, etc.
    - Set currentPeriodEnd to far future (2099)
    - Set spending_limit_usd to Apprentice limit
  - User is now on free Apprentice plan

## 4. Cancel Downgrade Flow

**User cancels a pending downgrade**

- API call to cancel downgrade (cancel-downgrade/route.ts)
- Get current subscription with schedule info
- Validate subscription has pending downgrade
- Release subscription schedule (releaseSubscriptionSchedule in stripe-subscription.ts)
- Clear schedule fields in database (SubscriptionOperations.clearScheduleFields)
- Invalidate user caches (invalidateAllUserCaches)
- Return success response

## 5. Customer Portal Flow

**User requests access to Stripe customer portal**

- API call to customer portal (customer-portal/route.ts)
- Create customer portal session (createCustomerPortalSession in stripe-utils.ts)
  - Get subscription for customer ID
  - Create Stripe billing portal session
- Return portal URL to frontend
- **User manages subscription in Stripe portal**
- Any changes trigger webhooks processed through normal webhook pipeline

## 6. Webhook Processing Pipeline

**Stripe sends webhook events for all subscription changes**

- Webhook endpoint receives event (webhook/route.ts)
- Verify webhook signature
- Check event idempotency (checkEventIdempotency in webhook-event.ts)
  - Check if event already processed
  - Create new webhook event record if not exists
- Process webhook event (processWebhookEvent in webhook-event.ts)
  - Route to appropriate handler based on event type:
    - customer.subscription.created/updated - handleSubscriptionEvent
    - customer.subscription.deleted - handleSubscriptionDeleted
    - invoice.payment_succeeded - handleInvoicePaymentSucceeded
    - invoice.payment_failed - handleInvoicePaymentFailed
- Mark event as processed (markEventProcessed in webhook-event.ts)
- Return success response to Stripe

## 7. Preview Pricing Flow

**User requests preview of upgrade/downgrade pricing**

- API call to preview pricing (preview-upgrade-downgrade/route.ts)
- Validate plan ID
- Get existing subscription (SubscriptionOperations.findByUserId)
- Validate user has active Stripe subscription
- Get target price ID from STRIPE_PRICE_IDS
- Retrieve current and target prices from Stripe
- Calculate pricing information
- Return preview data with current/new prices and next billing date

## 8. Payment Failure Flow

**Stripe attempts monthly subscription charge but payment fails**

- Stripe webhook: invoice.payment_failed (webhook/route.ts)
- Check idempotency (checkEventIdempotency in webhook-event.ts)
- Process webhook event (processWebhookEvent in webhook-event.ts)
- Handle invoice payment failed (handleInvoicePaymentFailed in webhook-handle.ts)
- Retrieve associated subscription from Stripe
- Handle subscription event with 'invoice.payment_failed' type (handleSubscriptionEvent in webhook-handle.ts)
- Synchronize subscription status (synchronizeSubscriptionWithStripe in stripe-subscription.ts)
- Map Stripe status to internal status (mapStripeStatusToSubscriptionStatus in stripe-subscription.ts)
  - First failure: Status may remain `active` during retry period
  - After retries: Status changes to `past_due` 
  - Final failure: Status changes to `unpaid` or `canceled`
- Update database with new status and timestamps
- Invalidate user caches
- Mark event as processed (markEventProcessed in webhook-event.ts)
- **Stripe automatically handles retry attempts and customer notifications**

### Status Progression
- `active` - `past_due` - `unpaid` - `canceled` (based on Stripe's dunning management)

## 9. Payment Retry Flow

**User with past_due/unpaid subscription manually retries payment**

- User sees warning banner "Payment Required - Subscription Suspended"
- User clicks "Pay Now" button (available in banner or status section)
- API call to retry payment (retry-payment/route.ts)
- Validate subscription is in past_due/unpaid status (SubscriptionOperations.findByUserId)
- Get unpaid invoices from Stripe (stripe.invoices.list with status: 'open')
- Find latest unpaid invoice for the subscription
- Attempt payment (stripe.invoices.pay with invoiceId)
- Handle payment result:
  - Success: Return success message and amount paid
  - Failure: Return specific error (insufficient funds, card declined, etc.)
- Frontend handles response:
  - Success: Show success toast and refresh subscription data (handleRetryPayment in use-subscription-actions.ts)
  - Failure: Show error toast with next steps
- **If payment succeeds, Stripe triggers invoice.payment_succeeded webhook**
- Webhook processing (existing pipeline):
  - Check idempotency (checkEventIdempotency in webhook-event.ts)
  - Process webhook event (processWebhookEvent in webhook-event.ts)
  - Handle invoice payment succeeded (handleInvoicePaymentSucceeded in webhook-handle.ts)
  - Update subscription status from past_due/unpaid to active
  - Mark event as processed (markEventProcessed in webhook-event.ts)
- Subscription page refreshes to show active status

## Key Components

### API Routes
- `create-checkout/route.ts` - Handles subscription creation/upgrade/downgrade initiation
- `cancel-downgrade/route.ts` - Handles canceling pending downgrades
- `customer-portal/route.ts` - Provides access to Stripe customer portal
- `preview-upgrade-downgrade/route.ts` - Provides pricing previews
- `retry-payment/route.ts` - Handles manual payment retry for past_due/unpaid subscriptions
- `webhook/route.ts` - Processes Stripe webhook events

### Core Functions
- `createCheckoutSession` (stripe-utils.ts) - Creates Stripe checkout sessions
- `scheduleSubscriptionDowngrade` (stripe-subscription.ts) - Schedules downgrades
- `handleUpgradeProcess` (webhook-handle.ts) - Processes subscription upgrades
- `handleRetryPayment` (use-subscription-actions.ts) - Handles manual payment retry
- `synchronizeSubscriptionWithStripe` (stripe-subscription.ts) - Syncs subscription data
- `checkEventIdempotency` (webhook-event.ts) - Prevents duplicate webhook processing

### Usage Tracking Functions
- `getCurrentBillingPeriod()` - Extracts billing period dates from subscription
- `getCurrentBillingPeriodUsage()` - Gets usage for active billing period
- `invalidateAllUserCaches()` - Clears usage and subscription caches during changes
- `trackUsage()` - Records token usage within current billing period

### Cache Management During Subscription Changes

**Cache Invalidation Strategy**:
All subscription changes trigger comprehensive cache clearing to ensure users see accurate usage data:

```typescript
// During any subscription change
await invalidateAllUserCaches(userId)

// This invalidates:
// - Subscription cache (plan, limits, status)  
// - Current billing period usage cache
// - Storage analytics cache
```

**Cache Key Format**:
Usage cache keys now include billing period dates:
```
{userId}_{billingPeriodStart}_{billingPeriodEnd}
```

### Database Operations
- `SubscriptionOperations.findByUserId` - Get user subscription
- `SubscriptionOperations.updateSubscription` - Update subscription data  
- `SubscriptionOperations.clearScheduleFields` - Clear pending schedule data
- `UserUsage.findUnique` - Get usage for specific billing period
- `UserUsage.upsert` - Create/update usage records for billing periods