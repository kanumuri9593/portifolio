# Priya — a little world of wonder

A responsive personal portfolio for Padmapriya Jampana, with original photography, recipes, illustrated storytelling, a filterable collection and a local gallery studio.

## Run locally

Requires Python 3; no package installation or build step.

```sh
cd priya
python3 server.py --port 4180
```

Open [the portfolio](http://localhost:4180/) or [the gallery studio](http://localhost:4180/studio.html). Stop the server with Ctrl+C. If you have already opened the project folder, run only the Python command.

The server binds only to this computer. Open through localhost, rather than opening HTML files directly, to use uploads.

## Edit the collection

Use the studio to add JPEG, PNG or WebP images to Photography, Art or Table: up to 10 images per upload, 12 MB per image. These are real local uploads: metadata is saved in `data/gallery.json`, and image files in `assets/uploads/`. For photographs, optionally choose People, Places or Little things. Uncategorised uploads appear under All the light. Back up both together. Removing an uploaded entry in the studio also removes its image file.

The initial curated collection is in `gallery-seed.json`. Layout and writing are in `index.html`; styling and interaction are in the adjacent CSS and JavaScript files. The studio manages uploaded entries, not the initial curated collection.

## Enquiries and publication

The enquiry form prepares a message. It does not send or store leads automatically. Visitors choose their email app or copy the message and send it on Instagram themselves.

The source lives in `priya/` in [kanumuri9593/portifolio](https://github.com/kanumuri9593/portifolio/tree/main/priya). The intended public address is [priya.oneenergytogether.com](https://priya.oneenergytogether.com/); live availability is verified separately from this documentation.

Cloudflare Pages project `priya-portfolio` builds branch `main` from the repository root with `python3 priya/build_public.py --out priya-public` and publishes output directory `priya-public`. Yeswanth’s existing `dist/` remains a separate site.

The public portfolio is a static showcase. The gallery studio and Python server run locally and are excluded from the public build. After local gallery edits, commit `priya/data/gallery.json` and the matching changes under `priya/assets/uploads/` together, then push to `main` to trigger a new Pages build. Uploaded images and captions included in that snapshot become public; the public repository also exposes the committed source metadata. Local changes alone do not change the live site. See `PUBLICATION.md` for the full workflow.

Original photography and recipe sources are recorded in `ASSET-SOURCES.md`. Illustrated characters and place scenes were generated for this design; they are not photographs or documented paintings by Priya. No verified painting photographs have been supplied yet. Generation prompts are preserved in `ASSET-PROMPTS.txt`. The repository retains the WebP assets used by the site; intermediate generated PNGs and private reference photographs are not guaranteed to be included.

## Four-place opening journey

Scroll through the opening scene to travel from Kandavalli to New York, Oneonta and home. The attire, backdrop, headline, description and call to action change together. Place buttons jump directly to that chapter. The motion control pauses atmospheric animation without preventing chapter navigation. Reduced-motion preferences and short viewports use a compact, manually switchable layout so every control stays reachable.
