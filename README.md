# Autopay Guard

A local mandates dashboard for people juggling subscriptions, bills and SIPs. See what is due, catch costly surprises and keep a saved payment plan on your device.

## Features

- Monthly average, next-seven-day charges and category breakdown.
- Five rule-based insights: trial ending within three days, price increase of at least 10%, annual charge of ₹1,000+ within 30 days, limit of at least five times the debit, and possible overlapping subscriptions.
- Searchable mandates with active, paused and cancelled states. Add your own mandate or load 12 fictional examples.
- Pause for one to three billing cycles, resume, cancel, save a 1/3/7-day reminder preference or lower a fixed payment limit. Each change has 12-second undo, including after refresh.
- Automatic first-visit, skippable four-step walkthrough; reopen it with **How it works**.
- Local persistence, input validation, recovery from invalid saved data and visible storage errors.
- Separate [research workspace](research.html): five state-checked tasks, button counts, wrong detail opens, elapsed time, ease ratings and CSV export. Its dashboard and results are isolated from the main dashboard.

## Run and test

No framework, dependencies, API key or build step. Use a static server so local storage and the research iframe share an origin:

```sh
python -m http.server 4173
```

Open `http://localhost:4173`. The research page is at `/research.html`.

Node 18+:

```sh
node test/logic.test.mjs
node --check app.js
node --check research.js
```

Tests cover totals, all five insights and their thresholds, invalid actions, immutable changes, repeated weekly charges, pause/resume and saved-date advancement. Pure rules in `logic.js` also run directly in Node.

For browser verification, check 375px and 1280px widths, complete/skip/reopen the tour, load an example, test each action and undo, refresh, add a mandate, search/filter and reset. On `/research.html`, complete all five tasks and export CSV. Automated visual/browser verification was unavailable in the authoring environment: the browser connector was offline and policy blocked a custom headless launch. No browser pass is claimed.

## Deploy on Cloudflare Pages

1. Connect this repository to a Pages project.
2. Select framework preset **None**, build command `exit 0`, and output directory `/` (repository root).
3. Deploy and open the generated Pages URL. There are no environment variables to configure.

All application assets are local. The app makes no AI requests and continues to work without an AI service. No `functions/api/gemini.js` existed in this project.

## What is real and what is not

- Rules, calculations, editing, saved state, undo, tour, research measurements and CSV export work locally.
- Example merchants and amounts are fictional. Manually entered data stays in this browser’s localStorage; there is no account, bank connection or server sync.
- Pause, cancel, resume and limit changes update the local plan. They do **not** alter a UPI mandate or merchant subscription. Action dialogs explain when the user must finish in their UPI app.
- Reminders are saved preferences, not delivered notifications. Use a calendar or payment app for actual alerts.
- Duplicate insights indicate a shared category, not proof of duplicate services or lack of use.
- Month/quarter/year scheduling uses approximate 30/91/365-day cycles. Weekly payments use seven days. Monthly averages use 52 weeks per year; variable bills use the last debit amount. Dates advance on page load; pauses expire when their saved date arrives.
- Thresholds are hypotheses, not validated recommendations. No participant results, users or success metrics are claimed. Research task timing includes time away from the tab and tab reloads.

See [PRD.md](PRD.md) for the product rationale and research plan.
