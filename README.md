# SubTrack

An offline-first subscription and recurring-payment tracker with local-only financial records. Record subscriptions and offline obligations such as broadband, rent, insurance, and mobile plans; see upcoming renewals and estimated recurring spend.

> **Privacy:** Records live in this browser's IndexedDB. There is no bank integration, payment initiation, credential collection, analytics, or remote database. Export backups regularly; clearing site data or changing devices can remove local records.

## Features

- Add, edit, archive, pause, cancel, reactivate, mark paid, and delete recurring records.
- Weekly, monthly, quarterly, half-yearly, yearly, and custom day intervals.
- Renewal overview with 7/30/90-day windows and trial conversion warnings.
- Monthly/yearly estimates and category breakdowns grouped by currency; currencies are never added together.
- Six-month payment trend based only on renewal payments marked as paid in SubTrack.
- Search and status filtering; category and billing details on each record.
- Versioned JSON export and validated import preview with merge/replace choices, relationship checks, and a safety backup before replacement.
- Price-change records with effective dates and a visible price history.
- Installable PWA shell with offline caching after first load.
- INR default and common Indian recurring payment categories.

## Stack

React, TypeScript, Vite, Tailwind-ready design tokens/CSS, Dexie + IndexedDB, Zod, date-fns, lucide-react, Vitest, Playwright, and vite-plugin-pwa.

## Run locally

```bash
npm install
npm run dev
```

## Quality checks

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

## Calculation assumptions

Amounts are stored as integer minor units (paise/cents; zero-decimal currencies are handled separately). Monthly equivalents use 12 months/year and 52 weeks/year: weekly = amount × 52 ÷ 12; monthly = amount; quarterly = amount ÷ 3; half-yearly = amount ÷ 6; yearly = amount ÷ 12. Yearly equivalents use 52, 12, 4, 2, and 1 billing occurrences respectively. These are estimates, rounded to the nearest minor unit. Category estimates use the same monthly-equivalent formulas and remain grouped by currency. Payment trends use recorded payment events only and do not project future charges. Custom day intervals use estimates based on 365.2425 days/year when a positive day interval is supplied. The first recorded price change preserves the starting price at the subscription start date, so the history can show a baseline and subsequent changes. Calendar frequencies retain the original billing-day anchor (for example, a 31st renews on the last day of February and returns to the 31st when possible).

## Reminders and limits

Configured reminder windows are shown on matching upcoming renewals and trial-conversion warnings in the dashboard. In-app reminders are visible while the app is open. Browser notifications are not promised in the background. There is no push service. Data is local to this browser profile; export before clearing browser data or switching devices.

## Cloudflare Pages

Connect the public GitHub repository to Cloudflare Pages. Use production branch `main`, build command `npm run build`, and output directory `dist`. No environment variables are required. SPA navigation falls back to `index.html`.

## License

MIT.

## Publish to GitHub

The project owner can publish this checkout with GitHub CLI after authenticating as `koushik4475`:

```bash
bash scripts/publish.sh
```

The script refuses to overwrite an existing repository and verifies the resulting repository metadata.

If you create the empty public repository yourself in GitHub first (leave README, license, and .gitignore unchecked), authenticate with `gh auth login` and run:

```bash
bash scripts/push-existing.sh
```

This checks that the target is public, refuses an unexpected `origin`, uses a normal non-force push, and verifies the repository afterwards.
