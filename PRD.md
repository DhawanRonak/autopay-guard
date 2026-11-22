# PRD: Autopay Guard — a heads-up before money leaves

Author: Ronak Dhawan · Status: concept, pre-research · Last updated: 16 Nov 2026
Product area this maps to: UPI payment apps (for example Google Pay). Independent concept, fictional merchants, no company branding.

## 1. Problem
UPI AutoPay made subscriptions, SIPs and bills one tap to start and easy to forget. Seeing your mandates is no longer the gap: an NPCI circular of 7 October 2025 requires every UPI app to show all of a user's mandates, including those created in other apps, with pause, revoke and porting, and NPCI runs a central portal for the same purpose. Complaints about unintended debits were still reported to be rising in 2026.

So the list exists. What is missing is **timing and judgment**: a list is something you must remember to open. Money leaves at moments the list does not flag: a free trial converting, a price going up, a yearly renewal you forgot, two apps doing the same job, a mandate that can take far more than it ever has.

Sources: https://www.newsbytesapp.com/news/business/npci-launches-portal-to-manage-upi-autopay-subscriptions/story · https://www.freepressjournal.in/tech/big-news-all-autopay-mandates-to-be-viewable-manageable-across-any-upi-app-from-december-31-what-this-means-for-the-end-user · https://mediabrief.com/bhim-launches-myupi-conversational-assistant/

## 2. Who it is for
- Primary: students and young earners with 4–10 small mandates across two or more UPI apps.
- Secondary: people who set up autopay for a parent.

## 3. Hypotheses (to be tested)
- H1. Most people cannot state their monthly autopay total within 20%.
- H2. People act on a specific, timed nudge ("trial ends in 2 days, first charge ₹999") far more than on a generic reminder.
- H3. Cancelling is harder to find than it should be; pause is an unknown option.
- H4. People want different handling for "essential" payments (SIP, insurance, bills) and should be warned, never blocked.

## 4. Principles
1. **Only use data the app already has**: mandate terms and past debits. No guessing whether someone "uses" a service.
2. **No dark patterns in either direction**: cancelling takes the same number of taps as keeping, and nothing nags the user to cancel either.
3. **Everything can be undone** for a few seconds.

## 5. Features (local dashboard)
- **One number**: autopay in a typical month, and how much leaves in the next 7 days. Tap for a category breakdown.
- **"Needs a look"** cards, in priority order:
  1. Trial ending: first full charge within 3 days.
  2. Price went up: next debit at least 10% above the last.
  3. Big yearly renewal within 30 days (₹1,000+).
  4. High ceiling: the mandate allows 5× or more of what is actually charged. One tap lowers the limit.
  5. Duplicate: two active subscriptions in the same category.
- **Per mandate**: pause for 1–3 cycles, cancel (two taps, plain consequences), reminder 1/3/7 days before.
- **Badges** for mandates set up in another UPI app.

## 6. Requirements
P0: monthly total and 7-day view; five insight types; pause, cancel, reminder; Undo; analytics events for every step.
P1: notification 1–7 days before debit with "Skip this one"; monthly summary; "essential" tag.
P2: shared view for a family member; port a mandate in from another app.

## 7. Success metrics
- North star: share of weekly active users who act on a "Needs a look" card (pause, cancel, lower limit, or dismiss as "fine").
- Activation: users who open the monthly breakdown in their first week.
- Guardrail 1: cancel-then-recreate within 7 days (a sign of accidental cancels).
- Guardrail 2: failed essential payments after a pause or cancel.
- Counter-metric: merchant-side complaints; the feature must not look like the app is pushing cancellations.

## 8. Analytics events (the prototype logs these)
`open_breakdown`, `insight_tap{kind}`, `open_mandate`, `pause_start`, `pause{cycles}`, `cancel_start`, `cancel`, `cancel_abandon`, `reminder_set{days}`, `ceiling_lowered`, `resume`, `undo`.
Funnel to watch: `insight_tap` → `cancel_start` → `cancel` versus `cancel_abandon`.

## 9. Usability test plan (separate research.html workspace)
Five scripted tasks, 5–8 participants. The tool records success (checked from state, not self-report), seconds, taps, wrong screens opened, and a 1–7 ease rating, and exports CSV.
- T1 find the monthly total by category · T2 cancel the service that raised its price · T3 pause the gym for a month · T4 set a 3-day reminder for insurance · T5 stop the cheaper of two music apps.
Pass bar to set before testing: for example 4 of 5 participants complete each task unaided. Then fix the worst task and re-test.

## 10. Risks and open questions
- NPCI rules limit what an app may do with another app's mandates. Open: is pausing a ported-in mandate allowed without porting?
- Merchant pushback on duplicate and price-rise nudges.
- Is a 10% threshold right for price rises? Is 5× right for ceilings? Both are settings to tune with data.
- Variable bills (electricity) need a different "unusual amount" rule; out of scope here.

## 11. Research script (10 minutes before the tasks)
1. Roughly how much goes out of your account on autopay each month? (Write it down, compare later with their app.)
2. Tell me about the last charge that surprised you.
3. Have you ever tried to cancel one? Show me how you would do it now.

## 12. Implemented dashboard behaviour (22 Nov 2026)

- The main page opens empty with a primary example action and manual mandate entry. It has no concept banner or research controls. Loading sample data over existing work requires confirmation and supports undo.
- A skippable four-step tour opens on first visit, remembers dismissal locally, and reopens from the header.
- Insight cards offer actions directly. Cancellation confirms consequences; pause offers 1–3 billing cycles; reminders offer 1/3/7 days. Essential payments have contextual warnings. Fixed limits can be lowered to the debit amount.
- All plan changes, example loading, manual additions and reset have 12-second undo, including after refresh. Cancelled mandates remain visible. Search and status filters cover the entire list.
- Lists and relative dates persist on this device. Dates advance on reload; elapsed pauses resume. Monthly/quarterly/yearly schedules use 30/91/365-day approximations. Early resume preserves the original upcoming debit, or today if it passed. Seven-day totals include repeated weekly debits and exclude stale negative dates.
- Price-rise annualisation covers every frequency. Variable bills are excluded from price-rise and high-ceiling rules. A shared category indicates possible overlap, not proof that a service is unused.
- No bank integration or delivered notifications are implemented. Actions affect a local plan; reminders save a preference. Contextual dialogs explain that actual debits must be changed in the UPI app. No AI endpoint exists or is required.
- Invalid saved lists recover to an empty dashboard with a notice. Storage failures leave a usable session and show a warning.
- Research uses a separate sample dashboard and saves sessions and results. It checks success against state, counts button clicks and unrelated mandate details opened, records elapsed time and ease ratings, and exports escaped CSV. Timing includes time away from the tab. Task 3 requires exactly one paused cycle. No participants or results are claimed.
- Analytics remain local records bounded to 500 events. Product metrics above remain proposed metrics, not measured outcomes.
