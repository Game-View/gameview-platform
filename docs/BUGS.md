# Game View Platform - Bug Tracker

## Open Bugs

### BUG-001: Onboarding fails at step 4 with "Internal server error"
- **Priority:** 🔴 Critical
- **Reporter:** CEO
- **Date:** 2025-12-31
- **Status:** Investigating
- **Steps:**
  1. Sign up with new email
  2. Complete steps 1-3 of onboarding
  3. Select footage option on step 4
  4. Click "Complete Setup"
- **Expected:** Profile created, redirect to dashboard
- **Actual:** "Internal server error" displayed
- **Notes:** Need to check Vercel function logs for actual error. Likely database connection or schema issue.

---

### BUG-002: Production shows "ready" instantly then disappears
- **Priority:** 🔴 Critical
- **Reporter:** James
- **Date:** 2025-12-31
- **Status:** Fixed (pending verification)
- **Steps:**
  1. Upload 4 videos (~400MB total)
  2. Start production
  3. See progress tracker
- **Expected:** Production processes over 15-60 minutes, saved to database
- **Actual:** Shows "ready" in <1 minute, then disappears from all lists
- **Root Cause:** Creator record was not being created during onboarding, causing tRPC production.create to fail silently and fall back to simulation mode
- **Fix:** Added Creator record creation in profile.ts and tRPC fallback

---

### BUG-003: Spark says "let me get someone to build it"
- **Priority:** 🟠 High
- **Reporter:** James
- **Date:** 2025-12-31
- **Status:** Fixed (pending verification)
- **Steps:**
  1. Chat with Spark
  2. Say "yes" when asked if ready to build
- **Expected:** Spark generates brief and starts production flow
- **Actual:** Spark says "let me get someone who can build it for you"
- **Fix:** Updated spark-prompt.ts with explicit instructions not to hand off

---

## Fixed Bugs (Verified)

_None yet - awaiting verification after deployment_

---

## How to Add a Bug

Copy this template:

```
### BUG-XXX: [Short title]
- **Priority:** 🔴 Critical / 🟠 High / 🟡 Medium / 🟢 Low
- **Reporter:** [Name]
- **Date:** YYYY-MM-DD
- **Status:** Open / Investigating / Fixed / Verified
- **Steps:**
  1. Step one
  2. Step two
- **Expected:** What should happen
- **Actual:** What actually happened
- **Screenshot:** [If available]
- **Notes:** Any additional context
```
