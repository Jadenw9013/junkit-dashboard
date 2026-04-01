# Automation Setup Guide

All automation keys are currently set to **placeholder** values. The dashboard works fully without them — automations simply run in "dry mode" and log what they would do. When real keys are dropped in, everything fires with no additional code changes.

---

## Required Accounts and Keys

### 1. Anthropic (AI)
- Already configured if you have `ANTHROPIC_API_KEY` set
- Used for: AI-generated responses, follow-up messages, monthly report summaries
- Get your key at: [console.anthropic.com](https://console.anthropic.com)

### 2. Telnyx (SMS)
1. Create account at [telnyx.com](https://telnyx.com)
2. Purchase a US phone number (~$1/mo)
3. **Complete A2P 10DLC registration** (REQUIRED for business SMS)
   - Takes 2-3 weeks to approve
   - Without this, automated SMS will be filtered/blocked by carriers
4. Copy API key to `TELNYX_API_KEY`
5. Set `TELNYX_PHONE_NUMBER` to your Telnyx number (`+1XXXXXXXXXX`)
6. Set `OWNER_PHONE_NUMBER` to the owner's real cell number
7. Configure webhook in Telnyx portal:
   - URL: `https://your-dashboard.vercel.app/api/sms-webhook`
   - Events: `message.received`

### 3. Supabase (Database)
1. Create account at [supabase.com](https://supabase.com)
2. Create new project "junkit-dashboard"
3. Run the SQL in `/supabase/schema.sql` in the SQL editor
4. Copy project URL to `NEXT_PUBLIC_SUPABASE_URL`
5. Copy anon key to `NEXT_PUBLIC_SUPABASE_ANON_KEY`
6. Copy connection string to `DATABASE_URL`

> **Note:** Until Supabase is connected, the app uses Redis/KV storage as a fallback. All queries work with both backends.

### 4. Resend (Email)
- Already installed — set `RESEND_API_KEY` if not done
- Used for: monthly reports, recovery emails, developer alerts

---

## Environment Variables

Add all of these to **Vercel → Settings → Environment Variables**:

```env
ANTHROPIC_API_KEY=sk-ant-...
TELNYX_API_KEY=KEY_...
TELNYX_PHONE_NUMBER=+1XXXXXXXXXX
OWNER_PHONE_NUMBER=+1XXXXXXXXXX
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
DATABASE_URL=postgresql://...
RESEND_API_KEY=re_...
CRON_SECRET=<same as WEBHOOK_SECRET>
```

---

## Automation Summary

| Automation | Trigger | What It Does |
|---|---|---|
| **New Lead Auto-Response** | New webhook lead | Sends acknowledgment SMS + AI quote within 60s |
| **Job Complete Thank You** | Job marked complete | Sends thank-you SMS to customer |
| **Weekly Follow-Up** | Cron (Monday 8am PT) | Generates follow-ups for stale leads → queued for owner approval |
| **Monthly Re-engagement** | Cron (1st of month) | Win-back messages for dormant customers → queued for approval |
| **Monthly Report** | Cron (1st of month) | AI-summarized business report emailed to owner |
| **Daily Health Check** | Cron (daily 9am PT) | Alerts owner if no leads in 5+ days |

---

## Deployment Checklist

- [ ] All automation env vars added to Vercel
- [ ] Supabase schema created (`/supabase/schema.sql`)
- [ ] Telnyx webhook URL configured
- [ ] A2P 10DLC registration submitted
- [ ] `CRON_SECRET` set (Vercel automatically sends `Bearer {CRON_SECRET}` header)
- [ ] Test webhook end-to-end
- [ ] Confirm `/admin` shows "6 of 6 active"

---

## Architecture Notes

- **No Trigger.dev SDK dependency at runtime** — all automations are plain async functions called directly or via Vercel Cron. Trigger.dev can be added later for long-delay jobs (e.g., 2-hour wait for review requests).
- **Placeholder safety** — every external API call checks for placeholder values before firing. The app never throws when keys are missing.
- **Fallback chain** — AI → template fallback, SMS → console log, Supabase → Redis KV → local files.
- **Owner approval required** — follow-up and re-engagement messages are never sent automatically. They're queued in `/approvals` for the owner to review first.
