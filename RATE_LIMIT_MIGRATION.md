# Rate Limiting System Migration Guide

## Overview

The application now uses a unified rate limiting system with database-backed configuration. All rate limits can be managed through the admin panel at `/admin/rate-limits`.

## What Changed

### Before (Deprecated)
- **4 separate implementations** with hardcoded limits scattered across:
  - `lib/db.tsx` - Database-backed general rate limits
  - `lib/redis.ts` - Redis cache rate limits
  - `lib/rate-limiter.ts` - Model-specific rate limits
  - `lib/rate-limit.ts` - Attachment upload rate limits

### After (Current)
- **1 unified system** in `lib/unified-rate-limit.ts` with:
  - Database-backed configuration (`rate_limit_configs` table)
  - Redis for fast checking with database fallback
  - Admin UI for real-time adjustment
  - Support for global, model, and feature-specific limits

## Migration Guide

### 1. Global Rate Limits

**Old:**
\`\`\`typescript
import { checkRateLimit } from '@/lib/db'
const result = await checkRateLimit(userId, ipAddress)
\`\`\`

**New:**
\`\`\`typescript
import { checkGlobalRateLimit } from '@/lib/unified-rate-limit'
const result = await checkGlobalRateLimit(userId, ipAddress, userTier)
\`\`\`

### 2. Model-Specific Rate Limits

**Old:**
\`\`\`typescript
import { checkRateLimit } from '@/lib/rate-limiter'
const result = await checkRateLimit(userId, model, userTier)
\`\`\`

**New:**
\`\`\`typescript
import { checkModelRateLimit } from '@/lib/unified-rate-limit'
const result = await checkModelRateLimit(userId, model, userTier)
\`\`\`

### 3. Feature-Specific Rate Limits

**Old:**
\`\`\`typescript
import { checkAttachmentRateLimit } from '@/lib/rate-limit'
const result = await checkAttachmentRateLimit(userId, ipAddress)
\`\`\`

**New:**
\`\`\`typescript
import { checkFeatureRateLimit } from '@/lib/unified-rate-limit'
const result = await checkFeatureRateLimit(userId, 'attachment_upload', userTier)
\`\`\`

## Admin Panel Usage

1. Navigate to `/admin/rate-limits`
2. View all configured rate limits with real-time stats
3. Click "Edit" on any limit to adjust:
   - Limit values per tier (free/auth/pro)
   - Enable/disable specific limits
   - Change window periods
4. Changes take effect immediately

## Database Schema

Run the migration script to set up the new system:

\`\`\`bash
# The script is auto-run on first deployment
scripts/009_rate_limit_system.sql
\`\`\`

Creates:
- `rate_limit_configs` - Configuration storage
- `rate_limit_usage` - Usage tracking
- Pre-populated with sensible defaults matching old hardcoded limits

## Benefits

1. **No code changes needed** - Adjust limits without deploying
2. **Consistent behavior** - Single source of truth
3. **Better monitoring** - Track usage patterns per limit type
4. **Flexible configuration** - Different limits per tier/model/feature
5. **Production ready** - Handles errors gracefully with fallbacks

## Backward Compatibility

All old functions are deprecated but still work. They will be removed in a future version after all code is migrated.

## Support

For questions or issues, check the admin panel logs or contact the development team.
