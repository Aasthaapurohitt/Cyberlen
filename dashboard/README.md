# CyberLens — React Dashboard

Team/admin view of scan history, risk trends, and per-scan SHAP
explanations. Talks only to the Express backend (`VITE_API_BASE_URL`) —
never to the Python ML service directly, per the architecture doc.

## Setup

```bash
cd dashboard
npm install
cp .env.example .env    # point VITE_API_BASE_URL at your Express server
npm run dev              # http://localhost:5173
```

## Structure

- `src/api/client.js` — axios instance, auto-attaches the JWT from
  localStorage, redirects to `/login` on a 401
- `src/context/AuthContext.jsx` — login/register/logout + session restore
- `src/pages/Dashboard.jsx` — stat cards, risk trend chart, 5 most recent scans
- `src/pages/History.jsx` — full paginated scan history
- `src/components/ScanRow.jsx` — expandable row showing the SHAP-derived
  "reasons" array returned by `/api/history`

## Design tokens

Defined in `tailwind.config.js` — dark, flat, hairline-bordered panels
(no drop shadows) with IBM Plex Mono for data (URLs, scores, timestamps)
and IBM Plex Sans for UI text. Verdicts are shown as a colored left-border
strip on each scan row rather than a badge:
`safe` #3FBF8B · `low risk` #4FB8C4 · `medium risk` #E3A73E · `high risk` #E5484D.

## Responsive layout

Below the `md` breakpoint, the sidebar becomes an off-canvas drawer
(`Sidebar.jsx`) triggered by a hamburger button in a mobile top bar
(`App.jsx`'s `Layout`) — tap it to open, tap the backdrop or a nav link
to close. Scan rows (`ScanRow.jsx`) stack their URL and score/verdict
vertically below the `sm` breakpoint instead of squeezing everything
into one row. Page padding scales down on small screens too
(`p-4 sm:p-6 md:p-8`).

## Notes

- Register a test account from the login screen (hits
  `POST /api/auth/register` on the Express backend) — there's no seed data.
- The trend chart and stat cards compute client-side from whatever
  `/api/history` returns, so they work immediately once a few scans exist,
  no separate analytics endpoint needed.
