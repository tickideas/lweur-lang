# Campaign Expiry System

This document explains how the one-time language adoption expiry system works.

## Overview

When someone makes a one-time payment to adopt a language, the language should become available again after their month expires. This system automates that process.

## How It Works

### 1. Payment Creation (`/api/payments/create-intent`)

When creating a one-time language adoption campaign:
- `nextBillingDate` is set to **30 days from payment date** (instead of current date)
- `stripeSubscriptionId` remains `null` (indicates one-time payment)
- Language `adoptionStatus` is set to `'ADOPTED'`

### 2. Expiry Processing (`/api/admin/campaigns/expire-adoptions`)

The system provides two endpoints:

#### POST - Process Expirations
- Finds all one-time language adoption campaigns where `nextBillingDate <= now`
- Marks expired campaigns as `'COMPLETED'` with an `endDate`
- If no other active campaigns exist for the language, sets `adoptionStatus` to `'AVAILABLE'`
- Returns a report of processed campaigns

#### GET - Check Upcoming Expirations  
- Returns campaigns expiring in the next 24 hours
- Returns campaigns expiring in the next 7 days
- Useful for monitoring and notifications

### 3. Admin Interface (`/admin/campaign-expiry`)

Provides a user-friendly interface to:
- View campaigns expiring soon (24 hours) and this week
- Manually trigger expiry processing
- See results of the last processing run
- Monitor system health

## Usage

### Manual Processing
1. Go to `/admin/campaign-expiry` in the admin dashboard
2. Click "Process Expirations" to manually run the expiry check
3. View results and upcoming expirations

### Automated Processing (Recommended)
Set up a cron job or scheduled task to call the API endpoint daily:

```bash
# Example cron job (runs daily at 2 AM)
0 2 * * * curl -X POST https://yourdomain.com/api/admin/campaigns/expire-adoptions -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

## Database Schema Impact

### Campaign Model
- `nextBillingDate`: For one-time adoptions, set to 30 days from payment
- `stripeSubscriptionId`: `null` for one-time payments  
- `status`: Changed to `'COMPLETED'` when expired
- `endDate`: Set when campaign expires

### Language Model
- `adoptionStatus`: Changed back to `'AVAILABLE'` when no active campaigns remain

## Business Logic

1. **One-time Language Adoption**: Expires after 30 days
2. **One-time Translation Sponsorship**: No automatic expiry
3. **Recurring Campaigns**: Managed by Stripe webhooks (not affected by this system)

## Edge Cases Handled

- **Multiple Campaigns**: If multiple campaigns exist for the same language, it only becomes available when ALL are expired/cancelled
- **Error Handling**: Individual campaign processing errors don't stop the entire batch
- **Authentication**: Requires admin permissions (SUPER_ADMIN or CAMPAIGN_MANAGER)

## Testing

Run the test suite:
```bash
npm test -- --testPathPatterns=expire-adoptions
```

Tests cover:
- Authentication and authorization
- Expired campaign processing
- Language release logic  
- Multiple campaign scenarios
- Error handling

## Monitoring

The system provides detailed logging and reports for:
- Number of campaigns processed
- Which languages were released
- Any errors encountered
- Processing timestamps

This ensures full visibility into the expiry process and helps with debugging if needed.