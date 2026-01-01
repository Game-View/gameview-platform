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
### BUG-004: internal error at onboarding process
- **Priority:**  🟠 High 
- **Reporter:** james
- **Date:** 2026-01-01
- **Status:** Open 
- **Steps:**
  1. signs up using google account
  2. Starts and complets onboarding questions clicking continue for each question
  3. clicks "complete setup"
  4. "set up complete"
  5. can create first project or engage spark
- **Expected:** process should flow without error, pofile built for new user, who can now can user service
- **Actual:** WUser see's "internal error", if they log out they can then log back in and their profile is saved, but they aren't recognized as full user, but can create. 
- **Screenshot:** screenshot is available 
- **Notes:** No payment was asked for or promo code used at signup or setup. 
## Fixed Bugs (Verified)

_None yet - awaiting verification after deployment_

---
### BUG-005: projects not saved, anywhere
- **Priority:**  🟠 High 
- **Reporter:** james
- **Date:** 2026-01-01
- **Status:** Open 
- **Steps:**
  1. start new project
  2. follow modal to name project & add videos & submit
  3. files upload
  4. submit for processing & rendering
  5. project created 
- **Expected:** process should flow without error, new project created, 3D scene should render in background with a progress bar showing progress, should be available in "drafts" after being named and/or files loaded step, should be available in "in progress" while processing and rendreing, should be available with notification when ready in "ready" folder (1,2,3, ready notification above "ready" tab), should be available archived if archived. should also be available in "open project" after completion
- **Actual:** user can name, load videos, and submit through modal process, process bar shows it is processing, but it doesn't process, it does not show it in supabase anywhere, it is not shown in any folder, the project just completely disappears
- **Screenshot:**  
- **Notes:** No payment was asked for or promo code used at signup or setup. 
## Fixed Bugs (Verified)
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
