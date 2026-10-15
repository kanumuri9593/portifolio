# Parkinson Consulting website

A static site: `index.html`, `pc.css`, `pc.js` and `img/`. No build step, no framework, no server code.
Upload the folder's contents to the web root of parkinsonconsultingllc.com (any static host works: Cloudflare Pages, Netlify, Azure Static Web Apps, S3, or the current host).

## Before going live
1. In `index.html`, delete the line `<meta name="robots" content="noindex, nofollow">` so search engines can index the site.
2. Swap in the official logo if you want it: the mark is the inline SVG inside `.brand` (header and footer) and `img/mark.svg` (browser tab icon).
3. Check the "Employee portal" link in the footer points at your real portal (currently `/employee`).
4. Leadership: there is a marked slot in the About section (`SLOT: leadership`) for names, photos and bios.

## Contact form
By default the form opens the visitor's email app addressed to contact@parkinsonconsultingllc.com with everything filled in.
To receive submissions directly instead, set `data-endpoint="https://..."` on the `<form id="form">` tag to any URL that accepts a JSON POST (Formspree, a Cloudflare Worker, Azure Function, etc.). Fields: name, email, company, interests[], message.

## Editing content
- Services and case studies live as plain data at the top of their blocks in `pc.js` (`SERVICES`, `CASES`).
- One Energy Studio demo businesses (sample names and prices) are in `BIZ` in `pc.js`. Plans and prices are in `index.html` under `id="plans"`.
- Colours are CSS variables at the top of `pc.css`.

Fonts load from Google Fonts (Geist, Geist Mono, Instrument Serif). Animations respect the visitor's reduced-motion setting and pause when off screen.
