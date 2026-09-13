# JiaJie — A life beyond one label

A static, two-page personal website. No framework, package install, backend, or build step.

## This revision

- The outbound “my website” card has been removed. This is the main website.
- Music and Boys Like Us Season 2 sit together in the welcome section, side by side on desktop and stacked on mobile.
- The film still opens a dialog with project details, linked creator/director/producer credits, and the show's Instagram account. The gallery includes the three supplied production photographs, four behind-the-scenes photographs, and one behind-the-scenes video. The third original group portrait is labeled “Crew,” following the owner's correction.
- The story timeline, travel map, progressively loaded travel gallery, music player, and contact links remain.
- “Dressed for the journey.” appears directly above the postcards with garment names, places, and the owner-approved captions about cultural significance, preserving all nine photographs from the original “Call me cultural connoisseur” section in their original order and adding the Mexico City Charro Suit portrait from the postcards. The landscape sarong and Charro Suit photographs span two columns; all photographs open in the shared viewer and have local HTML fallbacks.
- Top navigation links to Home, My story, The world, Dressed for the journey, Postcards, and NSFW, with the current section highlighted while scrolling.
- A small, image-free “Not safe for work photos” card appears after the travel section. The NSFW navigation item leads to it.
- The card opens an explicit 18+ content warning. Approval navigates to `bodypositive.html` on the same website, not back to the former website.
- The separate gallery contains 29 photographs: six in Chicago, five in the second section (Atlanta, Georgia), six in Baltimore, and 12 across the remaining sessions. The Chicago section is dated September 2025 and credited to @photorsh. Eight owner-supplied photographs were appended to their existing sessions in the supplied order, without recompression. The opening portrait remains excluded. Unknown shoot dates remain blank.
- The owner's selected Instagram additions bring Dressed for the journey to 11 photographs and Postcards to 13. The seven homepage additions and three Chicago portraits are bundled locally; exact post and slide references are recorded in `PHOTO-CREDITS-AUDIT.md`. Square postcards retain their full framing.

## Deploy / preview

All published site files live in `public/`. Repository documentation, screenshots in `docs/`, and development scripts in `tools/` stay outside that folder.

The existing Cloudflare project uses Workers Builds. Run Wrangler from the repository root with these settings:

- **Root directory:** repository root (leave the field blank).
- **Build command:** leave blank; no build step is required.
- **Production deploy command:** `npx wrangler deploy`.
- **Preview version command:** `npx wrangler versions upload`.

The committed root `wrangler.jsonc` identifies the `personal-site` Worker and sets `assets.directory` to `./public`. Wrangler uses that configuration for both commands; no Worker script is required. The configuration itself is not a public asset. Files such as `README.md`, `SOURCES.md`, and `PHOTO-CREDITS-AUDIT.md` remain outside the published directory.

For a local preview, open `public/index.html` in a browser, or run from the repository root:

```sh
python -m http.server 8080 --directory public
```

Then open `http://localhost:8080/`. Keep the files and folders together. All photographs, music artwork, the travel map, scripts, styles, and icons are bundled locally. Both pages and their photo galleries work without access to third-party hosts. SoundCloud playback and outbound links still require internet access.

The home page sharing helper uses its current URL by default. `siteUrl` in `public/site-config.js` can optionally hold your final, absolute home URL. The body gallery has generic sharing metadata; no NSFW photograph is used as a social thumbnail.

## Local assets

All images and the behind-the-scenes video are bundled locally and organized by the part of the site that uses them:

```text
public/assets/
  bodypositive/  Gallery photographs, named by session and photo number
  culture/       Eleven clothing photographs in “Dressed for the journey.”
  postcards/     Travel photographs named by destination, plus travel-map.png
  movie/         Boys Like Us production/BTS photographs, thumbnails, and video
  music/         Release artwork
  profile/       Homepage portrait
  favicon.svg    Outlined 葉 site icon; no font dependency
  favicon.ico    Small-size browser fallbacks
  apple-touch-icon.png  Home-screen icon
```

All 39 previously remote images have been copied into these folders alongside the six existing production images and thumbnails. Both configuration files and the homepage HTML fallbacks use local paths, including image links and the sharing thumbnail. No image depends on Squarespace or Anghami's CDN.

Check local asset references before deployment with Python 3.10+ (no packages or network required):

```sh
python tools/check_local_assets.py
```

Deploy `public/` as a unit: both HTML pages, all JavaScript/CSS files, `_headers`, and the entire `assets/` folder inside it. The host's content security policy allows images only from the site itself or embedded data.

For future imports, `python tools/localize_images.py` downloads configured remote images into the matching content folders under `public/assets/`, updates configuration and HTML references in `public/`, and keeps ignored backups in `tools/backups/` outside the deployment folder. Failed downloads retain their original URL and return a nonzero exit status; the asset check will also flag them. Prefer adding new files directly to the matching asset folder with descriptive filenames and referencing their local paths.

For the most reliable social preview, set the homepage `og:image` to the absolute URL of its bundled portrait on your final domain. Never use a body-positive photo as the homepage sharing thumbnail.

## Content warning behavior

The homepage contains no body-positive thumbnails, blurred previews, photo requests, or body-gallery data script. Only explicit approval follows the gallery link. Cancel, Escape, or clicking the backdrop leaves the visitor on the main page.

A one-use timestamp in same-tab `sessionStorage` (valid for one minute) carries that approval to the gallery. The gallery immediately consumes it, so arriving by a direct link in a fresh tab still presents the warning. Approval is not permanently remembered. Browsers blocking session storage may ask again after navigation; they fail closed rather than reveal photos automatically.

On direct entry the page has no image `src` values. The photo configuration and renderer are loaded after approval, and then images are lazy-loaded. With JavaScript disabled no photos are displayed. Navigating away hides and clears the collection before a browser back/forward-cache snapshot; a restored gallery asks again.

This is a **viewing-consent warning, not password protection or verified age checking**. Static image URLs remain public. `noindex` and `noimageindex` are indexing requests, not access control. Do not use this mechanism to protect confidential photographs.

## Editing

The site filenames below are relative to `public/`; `PHOTO-CREDITS-AUDIT.md` remains at the repository root. Keep image URLs relative to the site (for example, `assets/profile/portrait.jpg`), without a `public/` prefix.

- `site-config.js`: profile, songs/platform links, timeline, clothing and travel collections, film details, and contact information.
- Clothing captions use double asterisks around garment names and local spellings (for example, `**Kente**`) to show bold text on cards and in the viewer. Keep the corresponding `index.html` fallback in sync using `<strong>Kente</strong>`; titles and accessible image descriptions stay plain text in the configuration. Brand entries use `isBrand: true` so Charles&M and Thread King titles and descriptions stay in regular type. Local spellings appear inline for Sarong, Gho, and Charro Suit; names already in their local form are not repeated. The Latvian outfit is labeled Tautastērps, as confirmed by the owner.
- Each song's `credits` entries use `role`, `name`, and `url` fields and appear in the music dialog. “Arise O’ Compatriots” credits music production to @realpaulallison.
- `project.credits` stores linked creator, director, and producer credits. `project.photos` contains both production and behind-the-scenes media; BTS entries use `group: "bts"`. Video entries also use `type: "video"`, a local `src`, a `poster`, and a small `thumbnail`. Keep the displayed dimensions matched to the local asset and retain the legacy `blu-cast-and-crew` filenames for the photograph now labeled “Crew.”
- Photo `credits` lists can contain separate `{ "role": "Photographer", "name": "@handle", "url": "https://www.instagram.com/handle/" }` entries for each contributor. All displayed credit names use one leading `@`, including names without a verified account; omit `url` when no account is verified. `creditSources` records the supporting Instagram posts. Credits appear on collection cards and in the photo viewer; keep the matching `index.html` fallback captions in sync when editing. See `PHOTO-CREDITS-AUDIT.md` for the review and unresolved cases.
- `bodypositive-data.js`: the separate photography collection, groups, dates, photographer credits, and accessible image descriptions.
- `index.html`: homepage markup and content-warning text.
- `bodypositive.html`: gallery entry page and the matching warning text. Keep the two warnings consistent when editing.
- `styles.css`, `scroll.css`, `revision.css`: shared visual design and homepage additions.
- `bodypositive.css`: photography-page layout.
- `app.js`: homepage interactions.
- `consent.js`: the shared warning and navigation behavior.
- `bodypositive.js`: the consent-only gallery renderer, keyboard navigation, and photo dialog.

“Arise O’ Compatriots” links directly to its verified Spotify, Apple Music, YouTube, and YouTube Music pages. For future releases, blank URLs on platforms with search support remain labeled as search links. Trailer and series-watch links stay hidden until real URLs are configured.

## Verification

The migration was verified in headless Chromium against a local HTTP server using the site's content security policy, with all requests to other origins blocked. The homepage images, travel map, all eight travel lightbox photos, all 19 separate gallery photos and their lightbox, warning accept/cancel, one-use consent navigation, and fresh-entry gating passed. No gallery data or photographs were requested before consent. The homepage HTML image fallbacks also loaded with JavaScript disabled. There were no script errors or failed local HTTP responses. Opening the music dialog requested only its expected external SoundCloud player; its artwork loaded locally.

The photo migrations downloaded all 39 remote images successfully. All 45 photograph, map, and artwork files, including the existing production photographs and thumbnails, were checked for valid image data. The asset checker verifies local file references. SoundCloud playback must be checked with internet access.

The cultural-appreciation section was checked at 320, 390, 768, and 1440 pixels with external requests blocked: all nine photos loaded in source order above the postcards, the grid used two columns on mobile and three on larger screens without horizontal overflow, and all full-size photographs opened in the viewer. Keyboard navigation, wraparound, Escape/focus return, switching between cultural, movie, and map views, and HTML fallbacks with JavaScript disabled passed. No script errors or local HTTP failures were found.
