# Yeswanth — In motion

Personal portfolio for Yeswanth Varma Kanumuri: principal mobile engineer, independent builder, One Energy Together co-founder, and endurance athlete.

**Live site:** https://yeswanth-in-motion.kanumuri9593.chatgpt.site/

## Run locally

No installation or build step is required.

```sh
python3 -m http.server 4173 --directory dist
```

Open http://localhost:4173 in a browser.

## Project

- `dist/index.html`: portfolio content, projects, career, writing, and contact links.
- `dist/journey.js`, `places.js`, `weather.js`: five activity scenes, original NYC/upstate-inspired scenery, and seasonal atmosphere.
- `dist/identity.js`: portrait depth and lighting interaction.
- `dist/guide.js`: miniature chapter companion with hide/restore controls.
- `dist/baton.js`: interactive Baton demonstration, explicitly simulated.
- `dist/site.js`, `motion.js`, `journal.js`: film dialog, section reveals, and photo journal.
- Stylesheets alongside each feature; `polish.css` is the final responsive typography layer.
- `dist/assets`: photography, product screens, character sequences, and portrait.
- `CHARACTER-PROMPTS.txt`: image-generation and editing provenance.

## Interaction and accessibility

Activity buttons and scrolling change the scene and navigation. The shared pause control freezes the character and atmosphere; reduced-motion preferences are honored. The hero stops drawing offscreen and while the document is hidden. Weather and scenery use native Canvas with no animation framework or video dependency. Active character WebP sheets total approximately 1.7 MB. Each activity has a slower cadence (run 5.5, hike 3.5, bike 5, swim 3.5, snowboard 3.7 frames per second); atmosphere time runs at 65% speed.

The portrait uses an AI-assisted extraction from the supplied founders photograph. Its background and second person were removed; obscured clothing was reconstructed. Illustrative character loops use the supplied portrait as reference. Snowboarding is an adventure scene, not a claimed competition result. NYC and upstate scenery is original illustration, not surveyed geography.

Instagram embeds load only when a film is selected. Google Fonts have local system fallbacks. Download buttons link to verified store listings: Core Run on Apple's App Store, and the existing Mista Eats client apps on Apple and Google stores. TagVault retains a project link because no attributable released store listing was verified.

## Content and attribution

Personal images, project names, and product screens belong to their respective owners. Third-party brands remain their owners' property. The IRONMAN mark identifies the athlete's finish and is not an endorsement or sponsorship claim. Its vector source is the official 2019 corporate brand guidelines, page 4.

No license to reuse personal identity, photographs, or third-party brands is granted by making this source visible. No client application source code or private résumé file is included.

Public source: https://github.com/kanumuri9593/portifolio
