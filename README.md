# CyberLens

A browser extension that flags phishing pages in real time, with a
Random Forest / SHAP model for scoring and an explanation layer that
tells you *why* a page looks risky.

```
Browser Extension (JS) → Express + MongoDB → Python ML service (FastAPI + SHAP) → back through Express → React Dashboard
```

The Python service is internal-only — the extension and dashboard only
ever talk to Express (see `CyberLens_MERN_Plan.pdf` for the full
architecture writeup this was scaffolded from).

## Project layout

```
cyberlens/
├── extension/    # Manifest V3 browser extension (JS, no build step)
├── server/       # Express + Mongoose — auth, scan storage, orchestration
├── ml-service/   # FastAPI + scikit-learn + SHAP — feature extraction, scoring, explanations
├── dashboard/    # React + Tailwind + Recharts — scan history, trends, explanations (responsive, login-gated)
├── website/      # Static HTML/CSS/JS public landing page (no login, no build step)
└── docs/         # Literature review tracker + report outline (Phase 1 / Phase 5)
```

`dashboard/` is the logged-in app your team uses day to day; `website/`
is a public page explaining the project — useful for the report/demo
video, not required to run the actual tool.

Each folder has its own README with setup steps. Quick start, in order:

1. **`ml-service/`** — `pip install -r requirements.txt`, `python main.py` (port 8000)
2. **`server/`** — `npm install`, copy `.env.example` → `.env` (Mongo URI + JWT secret), `npm run dev` (port 5000)
3. **`dashboard/`** — `npm install`, copy `.env.example` → `.env`, `npm run dev` (port 5173)
4. **`extension/`** — load unpacked in `chrome://extensions` (Developer mode on)
5. **`website/`** *(optional)* — `cd website && python3 -m http.server 8080`, no install needed

Register an account from the dashboard login screen, log into the
extension popup with the same credentials, then browse to any page —
the extension scans it, Express relays it through the ML service, and
the result shows up in both the popup and the dashboard.

## Status

Scaffolded end-to-end and smoke-tested (Express boots, FastAPI `/predict`
returns real scored responses, dashboard builds clean with `npm run
build`, extension manifest + JS all pass validation). The ML model
itself is currently a **rule-based heuristic** — see "Must-do next
steps" below for what turns this into an actual trained classifier.

## Must-do next steps before this is submission-ready

Most of these are now addressed in code — what's left for a few of them
is a manual step only you can do (signing up for a service, collecting
real data).

1. **Collect the real dataset and train the real model.** ✅ *Pipeline
   built and tested* — `ml-service/data/generate_sample_dataset.py`
   generates a synthetic CSV so `model/train.py` runs end to end today
   (verified: trains, evaluates, and `model/predict.py` loads the
   result and produces real SHAP explanations). ⚠️ *Still on you*: the
   sample data is fabricated — swap it for real PhishTank + UCI
   Phishing Websites + Tranco data (Phase 1 in the plan) before
   training the model you actually submit. Don't report the synthetic
   dataset's metrics in your write-up.
2. **Add a MongoDB Atlas cluster** and fill in `server/.env`. ⚠️ *Still
   on you* — this needs your own Atlas account; `.env.example` now has
   step-by-step instructions inline.
3. **Tighten extension permissions.** ✅ *Done* —
   `manifest.json`'s `host_permissions` no longer duplicates a blanket
   `https://*/*` grant (content-script `matches` already handle page
   injection; `host_permissions` now only covers the API host
   `background.js` actually fetches). Also dropped the unused `tabs`
   permission.
4. **De-duplicate scans.** ✅ *Done* — `background.js` now caches
   results per URL for 10 minutes (`SCAN_COOLDOWN_MS`) and reuses a
   cached result instead of re-hitting Express/the ML service on every
   reload or repeat visit.
5. **Handle the pending → complete race in the dashboard.** ✅ *Done* —
   `dashboard/src/hooks/usePolledHistory.js` polls `/api/history` every
   4s while any scan is `pending`, and stops automatically once nothing
   is. Both the Overview and History pages show a small "N still
   scoring…" indicator while this is happening.
6. **Secrets before pushing to GitHub.** ✅ *Verified* — no real `.env`
   file exists anywhere in this project (only `.env.example` files),
   and `.gitignore` covers `.env` at both the root and inside
   `server/`/`dashboard/`. Still worth a manual double-check before
   your first commit — it's the most common way student teams
   accidentally leak a Mongo URI or JWT secret.
7. **CORS lockdown.** ✅ *Done* — `server/server.js` now checks
   incoming `Origin` against an `ALLOWED_ORIGINS` env var (comma-
   separated) instead of the wide-open `cors()` default; add your
   deployed dashboard URL and extension ID there. `ml-service/main.py`
   dropped its CORS middleware entirely — Express calls it
   server-to-server, so browser CORS doesn't apply, and a permissive
   `"*"` policy was pure unnecessary attack surface.
8. **Write the literature review + report sections.** ⚠️ *Still on
   you* — `docs/literature-review.md` and `docs/report-outline.md` are
   scaffolded so you're filling in a table and following an outline
   instead of starting from a blank page, but the actual reading and
   writing is real work only your team can do. Don't leave it to week 12.

## Pushing to GitHub from VS Code

1. Unzip the project, open the resulting `cyberlens/` folder in VS Code
   (`File → Open Folder…`).
2. Open a terminal in VS Code (`` Ctrl+` ``) and run:
   ```bash
   git init
   git add .
   git commit -m "Initial CyberLens scaffold"
   ```
3. Create an empty repo on GitHub (no README/license, so it stays
   empty), then copy the URL it gives you, e.g.
   `https://github.com/<you>/cyberlens.git`.
4. Back in the terminal:
   ```bash
   git branch -M main
   git remote add origin https://github.com/<you>/cyberlens.git
   git push -u origin main
   ```
5. Alternatively, use VS Code's built-in **Source Control** panel (left
   sidebar, branch icon): it will prompt you to initialize a repo,
   stage/commit, and "Publish to GitHub" in a couple of clicks if
   you're signed into GitHub in VS Code — same result as step 2–4
   without typing git commands.
6. For teammates: they `git clone` the repo, then each runs the
   per-folder setup above. Only `.env` files (gitignored) need to be
   shared separately, e.g. over Slack/WhatsApp — never commit them.

## One-paragraph project summary (for your report/resume)

CyberLens is a browser-extension-based phishing detector built on a
MERN-first architecture with an isolated Python microservice for ML
inference. The extension scrapes URL, DOM, form, and script signals
from the active tab and forwards them to an Express + MongoDB backend,
which orchestrates auth, scan storage, and an internal call to a
FastAPI service running a scikit-learn classifier. SHAP explains each
prediction in plain English (e.g. "domain registered 4 days ago"), and
those explanations flow back through Express to both the extension
popup (instant feedback) and a React + Recharts dashboard (historical
trends, team-wide scan review). The split keeps the team's ML surface
area small — one Python service, one endpoint — while the rest of the
stack stays in JavaScript.
