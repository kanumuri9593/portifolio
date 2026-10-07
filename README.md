# Yeswanth — In motion

Personal portfolio for Yeswanth Varma Kanumuri: principal mobile engineer, independent builder, One Energy Together co-founder, and endurance athlete.

**Live site:** https://yeswanth.oneenergytogether.com/

## Run locally

No installation or build step is required.

```sh
python3 -m http.server 4173 --directory dist
```

Open http://localhost:4173 for the current site, or http://localhost:4173/v1/ for the original.

## Versions

- `dist/index.html` (live at `/`): v2, a single-page scroll film. The name stays clean and still, Yeshu walks visitors through each section, and every professional and social link sits in the header and the Connect section. Uses GSAP 3.13 + ScrollTrigger from jsDelivr; everything else is hand-written Canvas, WebGL and CSS. Images live in `dist/img`.
- `dist/v1/` (live at `/v1/`): the original seasons portfolio, kept intact.

## v1 project files

- `dist/v1/index.html`: portfolio content, projects, career, writing, and contact links.
- `dist/v1/journey.js`, `places.js`, `weather.js`: five activity scenes, original NYC/upstate-inspired scenery, and seasonal atmosphere.
- `dist/v1/identity.js`: portrait depth and lighting interaction.
- `dist/v1/guide.js`: miniature chapter companion with hide/restore controls.
- `dist/v1/baton.js`: interactive Baton demonstration, explicitly simulated.
- `dist/v1/site.js`, `motion.js`, `journal.js`: film dialog, section reveals, and photo journal.
- Stylesheets alongside each feature; `polish.css` is the final responsive typography layer.
- `dist/v1/assets`: photography, product screens, character sequences, and portrait.
- `CHARACTER-PROMPTS.txt`: image-generation and editing provenance.

## v1 interaction and accessibility

Activity buttons and scrolling change the scene and navigation. The shared pause control freezes the character and atmosphere; reduced-motion preferences are honored. The hero stops drawing offscreen and while the document is hidden. Weather and scenery use native Canvas with no animation framework or video dependency. Active character WebP sheets total approximately 1.7 MB. Each activity has a slower cadence (run 5.5, hike 3.5, bike 5, swim 3.5, snowboard 3.7 frames per second); atmosphere time runs at 65% speed.

The portrait uses an AI-assisted extraction from the supplied founders photograph. Its background and second person were removed; obscured clothing was reconstructed. Illustrative character loops use the supplied portrait as reference. Snowboarding is an adventure scene, not a claimed competition result. NYC and upstate scenery is original illustration, not surveyed geography.

Instagram embeds load only when a film is selected. Google Fonts have local system fallbacks. Download buttons link to verified store listings: Core Run on Apple's App Store, and the existing Mista Eats client apps on Apple and Google stores. TagVault retains a project link because no attributable released store listing was verified.

## Content and attribution

Personal images, project names, and product screens belong to their respective owners. Third-party brands remain their owners' property. The IRONMAN mark identifies the athlete's finish and is not an endorsement or sponsorship claim. Its vector source is the official 2019 corporate brand guidelines, page 4.

No license to reuse personal identity, photographs, or third-party brands is granted by making this source visible. No client application source code or private résumé file is included.

Public source: https://github.com/kanumuri9593/portifolio
