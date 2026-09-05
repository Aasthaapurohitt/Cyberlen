# CyberLens — Public Landing Page

A static, no-build-step marketing/info page for the project — separate
from the login-gated `dashboard/` app. Explains what CyberLens is, how
it works, and what it's built with.

## Run it

No install needed — it's plain HTML/CSS/JS:

```bash
cd website
python3 -m http.server 8080
# then open http://localhost:8080
```

Or just open `index.html` directly in a browser (the Google Fonts link
needs internet; everything else works offline).

## Structure

- `index.html` — hero, features, how-it-works steps, tech stack chips, CTA
- `style.css` — all styling, blue color palette, mobile-first responsive
  (breakpoints at 1024px / 900px / 768px / 640px — see the `@media`
  rules at the bottom of the file)
- `script.js` — mobile nav toggle, scroll-reveal animation on section
  entry, footer year

## Design tokens

Defined as CSS custom properties at the top of `style.css`:

| Token | Value | Use |
|---|---|---|
| `--blue-600` | `#2F6FED` | primary buttons, links, accents |
| `--blue-700` | `#1E4FBE` | hover states |
| `--blue-100` | `#E8F0FE` | light backgrounds, icon chips |
| `--navy-900` | `#0B1220` | hero mockup, CTA/footer-adjacent dark sections |
| `--text` / `--muted` | `#101828` / `#5B6472` | body copy |

Headings use IBM Plex Mono (matches the dashboard's data styling); body
text uses IBM Plex Sans — same type pairing as `dashboard/`, so the
public page and the app feel like one product.

## Editing content

Everything is in `index.html` — no templating, no build step. The
hero's "mock browser" panel (`.mock-browser`) is hand-built with plain
HTML/CSS to preview what the extension popup looks like, so there's no
dependency on a real screenshot; swap it for an actual screenshot once
you have one from the extension.
