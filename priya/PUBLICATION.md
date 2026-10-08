# Publishing Priya’s portfolio

The public website is a static showcase. The gallery studio runs locally on your computer; it is not an online CMS. Visitors cannot upload or delete images on the public site.

## Repository and hosting

Source repository: [kanumuri9593/portifolio](https://github.com/kanumuri9593/portifolio), folder `priya/`.

Cloudflare Pages configuration:

- Project: `priya-portfolio`
- Production branch: `main`
- Build root: repository root
- Build command: `python3 priya/build_public.py --out priya-public`
- Build output directory: `priya-public`
- Intended custom domain: `https://priya.oneenergytogether.com/`

Live availability and domain activation are verified separately from this document. Priya uses a separate Pages project; Yeswanth’s existing `dist/` and deployment remain separate.

## Update the collection

1. From the repository root, run `cd priya` and `python3 server.py --port 4180`. Open `http://localhost:4180/studio.html`.
2. Add or remove images in the local studio. Photography can optionally be grouped into People, Places or Little things.
3. Check the local portfolio, then stop the server before building a snapshot so edits cannot change midway through the build.
4. From the repository root, preview the production build using a fresh output folder:

   ```sh
   python3 priya/build_public.py --out priya-public
   python3 -m http.server 4181 --directory priya-public
   ```

   Open `http://localhost:4181/`. The builder requires an empty or nonexistent output directory; use a different fresh folder for a subsequent local preview. Building alone does not publish anything.

5. Commit `priya/data/gallery.json` and all matching additions or removals under `priya/assets/uploads/` together. Commit any other source changes required by the update. Push the changes to `main`; the connected Cloudflare Pages project builds and publishes the new snapshot. Confirm the deployment succeeds before expecting the public site to change.

Only commit images and descriptions intended to be public. The public GitHub repository exposes committed source metadata as well as images. The deployed build strips original upload filenames and non-public metadata fields, but that filtering does not make committed repository files private.

The builder starts with the homepage and gallery metadata, follows explicitly referenced scripts, styles and assets, and snapshots local uploads into the public gallery. Duplicate gallery IDs are included once, with the uploaded record taking precedence. Referenced companion scripts/styles are picked up automatically when linked from the page. Unreferenced drafts are excluded from the build. The repository retains used WebPs; intermediate generated PNGs and private reference photographs are not guaranteed to be present. Prompt provenance remains in `ASSET-PROMPTS.txt`.

The public output excludes the Python server, builder, local studio interface and source documentation. It replaces the studio link with the GitHub source link. The frontend reads a static empty upload endpoint; all published entries already live in the generated `gallery-seed.json`. The build adds the canonical URL, Open Graph URL, robots file, sitemap and basic response headers.

Back up `data/gallery.json` and `assets/uploads/` together. Deleting a local image does not remove a previously deployed copy until the updated snapshot is published; earlier copies may remain in Git history.

Enquiry controls prepare an email or Instagram message for visitors to send themselves. This site does not provide server-side message delivery or cloud gallery editing.
