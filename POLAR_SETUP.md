# Polar.sh Integration Setup

Miami.ai uses Polar.sh for payment processing and subscription management. This guide will help you set up the required environment variables and configure webhooks.

## Required Environment Variables

Add these environment variables to your Vercel project or `.env.local` file:

\`\`\`bash
# Polar.sh API Access Token
# Get this from: https://polar.sh/settings/api
POLAR_ACCESS_TOKEN=your_polar_access_token

# Polar.sh Product IDs
# Get these from your Polar dashboard after creating products
POLAR_PRO_PRODUCT_ID=your_pro_product_id

# Polar.sh Webhook Secret
# Get this when setting up webhooks in Polar dashboard
POLAR_WEBHOOK_SECRET=your_webhook_secret
\`\`\`

## Setting Up Polar Products

1. Go to [Polar.sh Dashboard](https://polar.sh/dashboard)
2. Create a new product for "Miami.ai Pro"
   - Name: Miami.ai Pro
   - Price: $9.99/month (recurring)
   - Description: Unlimited AI searches with Deep Research mode
3. Copy the Product ID and add it to `POLAR_PRO_PRODUCT_ID`

## Setting Up Webhooks

1. Go to your Polar organization settings
2. Navigate to Webhooks section
3. Add a new webhook endpoint:
   - URL: `https://your-domain.com/api/webhooks/polar`
   - Format: Raw (JSON)
   - Events to subscribe to:
     - `checkout.created`
     - `checkout.updated`
     - `subscription.created`
     - `subscription.updated`
     - `subscription.canceled`
     - `customer.created`
     - `customer.updated`
4. Copy the webhook secret and add it to `POLAR_WEBHOOK_SECRET`

## Testing Locally

For local development, you can use Polar's sandbox environment:

1. Use ngrok or similar tool to expose your local server:
   \`\`\`bash
   ngrok http 3000
   \`\`\`

2. Update your webhook URL in Polar dashboard to point to your ngrok URL:
   \`\`\`
   https://your-ngrok-url.ngrok.io/api/webhooks/polar
   \`\`\`

3. Test checkout flow with Polar's test mode

## Database Migration

After setting up Polar, run the migration script to update your database schema:

\`\`\`bash
# This will rename stripe_* columns to polar_*
# Run this script from your database management tool or Neon dashboard
\`\`\`

The migration script is located at `scripts/002-migrate-to-polar.sql`

## Pricing

Polar.sh charges 4% + 40¢ per transaction with no monthly minimums, which is 20% lower than traditional Merchant of Record solutions.

## Support

For issues with Polar integration, refer to:
- [Polar Documentation](https://polar.sh/docs)
- [Polar API Reference](https://polar.sh/docs/api-reference)
- [Polar Webhooks Guide](https://polar.sh/docs/integrate/webhooks)
