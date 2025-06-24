# Policy Update Guide

## 🔄 How to Update Terms of Service or Privacy Policy

When you need to update your Terms of Service or Privacy Policy, follow these steps to ensure GDPR compliance:

### 📋 **Step-by-Step Process:**

1. **Update the Policy Content**
   - Edit the content in `app/terms/page.tsx` or `app/privacy/page.tsx`
   - Make your changes clear and understandable

2. **Update Version Numbers**
   - **In `lib/consent-utils.ts`:**
     ```typescript
     export const CURRENT_TERMS_VERSION = '1.1' // Increment version
     export const CURRENT_PRIVACY_VERSION = '1.0' // Or this one if changing privacy
     ```
   
   - **In `components/ui/consent-manager.tsx`:**
     ```typescript
     const hasCurrentTerms = consentData.agreedToTerms && consentData.termsVersion === '1.1'
     const hasCurrentPrivacy = consentData.agreedToPrivacy && consentData.privacyVersion === '1.0'
     ```
     
     ```typescript
     termsVersion: '1.1', // Update this when you change Terms of Service
     privacyVersion: '1.0' // Update this when you change Privacy Policy
     ```

3. **Deploy Changes**
   - All existing users will automatically see the consent dialog again
   - They must re-consent to continue using the service

### 🎯 **What Happens After Update:**

- **Existing Users**: Will see consent dialog on next login
- **New Users**: Will see the new version automatically
- **Audit Trail**: All consent changes are logged in the database
- **Compliance**: GDPR requirement for fresh consent is met

### ⚖️ **Legal Requirements:**

- **Material Changes**: Always require new consent
- **Minor Changes**: You can decide if new consent is needed
- **Notification**: Consider emailing users about significant changes
- **Grace Period**: Users may need time to review changes

### 🔍 **Version Tracking:**

The system tracks:
- Which version users consented to
- When they provided consent
- Full audit trail of all changes
- Withdrawal and re-consent events

### 📧 **Communication Strategy:**

Before updating policies:
1. **Email notification** to existing users (optional but recommended)
2. **Highlight key changes** in the consent dialog
3. **Provide effective date** for new terms
4. **Offer support** for questions about changes

### 🚨 **Important Notes:**

- **Version numbers must match** between `consent-utils.ts` and `consent-manager.tsx`
- **Test thoroughly** after version updates
- **Consider legal review** for significant changes
- **Document changes** for your records

This system ensures you stay GDPR compliant while managing policy updates effectively. 