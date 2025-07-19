# Subscription Flows Documentation

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

## Key Components

### API Routes
- `create-checkout/route.ts` - Handles subscription creation/upgrade/downgrade initiation
- `cancel-downgrade/route.ts` - Handles canceling pending downgrades
- `customer-portal/route.ts` - Provides access to Stripe customer portal
- `preview-upgrade-downgrade/route.ts` - Provides pricing previews
- `webhook/route.ts` - Processes Stripe webhook events

### Core Functions
- `createCheckoutSession` (stripe-utils.ts) - Creates Stripe checkout sessions
- `scheduleSubscriptionDowngrade` (stripe-subscription.ts) - Schedules downgrades
- `handleUpgradeProcess` (webhook-handle.ts) - Processes subscription upgrades
- `synchronizeSubscriptionWithStripe` (stripe-subscription.ts) - Syncs subscription data
- `checkEventIdempotency` (webhook-event.ts) - Prevents duplicate webhook processing

### Database Operations
- `SubscriptionOperations.findByUserId` - Get user subscription
- `SubscriptionOperations.updateSubscription` - Update subscription data
- `SubscriptionOperations.clearScheduleFields` - Clear pending schedule data