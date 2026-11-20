# Autopay Guard

**A heads-up before autopay money leaves.**

> Independent concept prototype for a product-management case study. Not affiliated with any company; all data is made up.

**Live demo:** _add your Vercel link here after deploying_  
**Product spec:** [PRD.md](PRD.md)

## The problem

UPI apps must now show all of a user's autopay mandates, so the list already exists. What is missing is timing: a list is something you must remember to open. Autopay Guard flags the moments money leaves unexpectedly (a trial converting, a price rise, a forgotten yearly renewal, two apps doing the same job, a mandate that can take far more than it ever has) and makes pause and cancel two taps, with undo.

## What the prototype does

- Monthly total and next-7-days view, with a category breakdown.
- Five "needs a look" insights, using only data a UPI app already has.
- Pause for 1–3 cycles, cancel with plain consequences, reminders 1, 3 or 7 days before, lower an oversized mandate limit.
- Built-in usability test: five scripted tasks, success checked from app state, timed, with a 1–7 ease rating and CSV export.
- Event log showing the analytics events a real product would send.

## Run it

No build step and no dependencies. Open `index.html` in a browser.

Tests need Node 18 or later:

```
node test/logic.test.mjs
```

## Deploy

1. On [vercel.com](https://vercel.com), choose **Add New → Project** and import this repository.
2. Framework preset **Other**, no build command, no root directory. Deploy.

Then paste the live link at the top of this README.

## Files

| File | What it is |
|---|---|
| `logic.js` | Mandates, insights and actions (pure functions; all merchants fictional) |
| `index.html` | The prototype and usability test |
| `test/logic.test.mjs` | Logic tests |
| `PRD.md` | Product requirements: problem, hypotheses, requirements, metrics, evaluation plan, risks |
| `base.css` | Shared styles |

## What is real and what is not

- All merchants and amounts are made up. No real payments app or data is involved.
- The insight thresholds (10% price rise, 5x mandate ceiling) are starting points to tune with data.

## Author

Ronak Dhawan · product management portfolio
