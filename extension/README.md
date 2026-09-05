# CyberLens — Browser Extension

Manifest V3 extension that scrapes the active page and reports it to
Express for scoring. Never talks to the Python ML service directly.

## Load it (unpacked, for development)

1. `cd extension` — no build step, no `npm install` needed, it's plain JS.
2. Open `chrome://extensions` (or `edge://extensions`).
3. Enable **Developer mode** (top right).
4. Click **Load unpacked** and select the `extension/` folder.
5. Make sure the Express backend is running at the URL set in
   `background.js` (`API_BASE_URL`, defaults to `http://localhost:5000`).

## How it works

- **`content.js`** — runs on every page, scrapes `{url, domHtml, forms,
  scripts}` once the page finishes loading, and forwards it to the
  background worker. It has no auth or API knowledge.
- **`background.js`** — the only file that knows about the CyberLens API.
  Holds the JWT (`chrome.storage.local`), POSTs to `/api/scan`, caches
  the latest result per tab (`chrome.storage.session`), and sets the
  toolbar badge color/text from the verdict (green/teal/amber/red).
- **`popup/`** — reads the cached result for the active tab and renders
  it: risk score, verdict, and the SHAP-derived reasons list. Shows a
  login form if no JWT is stored yet, and re-triggers a scan on the
  active tab immediately after login.

## Updating the backend URL

Change `API_BASE_URL` at the top of `background.js` before packaging for
your deployed Express instance (Render/Railway per the plan) — nothing
else needs to change.

## Known limitations (fine for a capstone demo, worth noting in your report)

- `host_permissions` includes `https://*/*` for broad scanning; a
  production version should scope this down or ask for permission
  per-site.
- The DOM snapshot sent to Express is capped at 50,000 characters
  (`MAX_DOM_CHARS` in `content.js`) to keep payloads small — adjust if
  your feature extraction needs more of the page.
- No icons beyond simple placeholders in `icons/` — swap in your own
  branding before a public release.
