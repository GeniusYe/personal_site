# JiaJie — A life beyond one label

A static, two-page personal website. No framework, package install, backend, or build step.

## This revision

- The outbound “my website” card has been removed. This is the main website.
- Music and Boys Like Us Season 2 sit together in the welcome section, side by side on desktop and stacked on mobile.
- The film still opens a dialog with project details and the three supplied production photographs.
- The story timeline, travel map, progressively loaded travel gallery, music player, and contact links remain.
- A small, image-free “Not safe for work photos” card appears after the travel section. The Photos navigation item leads to it.
- The card opens an explicit 18+ content warning. Approval navigates to `bodypositive.html` on the same website, not back to the former website.
- The separate gallery references the 19 images on the original Body Positive page, preserving available shoot dates and photographer credits. No unprovided dates or photographer names were added.

## Deploy / preview

Upload all site files together to your Cloudflare Pages project. `index.html` and `bodypositive.html` are at the root. For a local preview, unzip and open `index.html` in a browser, or run:

```sh
python -m http.server 8080
```

Then open `http://localhost:8080/`. Keep the files and folders together. All photographs, music artwork, the travel map, scripts, styles, and icons are bundled locally. Both pages and their photo galleries work without access to third-party hosts. SoundCloud playback and outbound links still require internet access.

The home page sharing helper uses its current URL by default. `siteUrl` in `site-config.js` can optionally hold your final, absolute home URL. The body gallery has generic sharing metadata; no NSFW photograph is used as a social thumbnail.

## Local assets

All images are bundled locally and organized by the part of the site that uses them:

```text
assets/
  bodypositive/  Gallery photographs, named by session and photo number
  postcards/     Travel photographs named by destination, plus travel-map.png
  movie/         Boys Like Us production photographs and small thumbnails
  music/         Release artwork
  profile/       Homepage portrait
  favicon.svg    Site icon
```

All 30 previously remote images have been copied into these folders alongside the six existing production images and thumbnails. Both configuration files and the homepage HTML fallbacks use local paths, including image links and the sharing thumbnail. No image depends on Squarespace or Anghami's CDN.

Check local asset references before deployment with Python 3.10+ (no packages or network required):

```sh
python tools/check_local_assets.py
```

Upload both HTML pages, all root JavaScript/CSS files, `_headers`, and the entire `assets/` folder together. Development tools and `tools/backups/` are not needed in the deployed site. The host's content security policy allows images only from the site itself or embedded data.

For future imports, `python tools/localize_images.py` downloads configured remote images into the matching content folders above, updates configuration and HTML references, and keeps ignored backups in `tools/backups/`. Failed downloads retain their original URL and return a nonzero exit status; the asset check will also flag them. Prefer adding new files directly to the matching asset folder with descriptive filenames and referencing their local paths.

For the most reliable social preview, set the homepage `og:image` to the absolute URL of its bundled portrait on your final domain. Never use a body-positive photo as the homepage sharing thumbnail.

## Content warning behavior

The homepage contains no body-positive thumbnails, blurred previews, photo requests, or body-gallery data script. Only explicit approval follows the gallery link. Cancel, Escape, or clicking the backdrop leaves the visitor on the main page.

A one-use timestamp in same-tab `sessionStorage` (valid for one minute) carries that approval to the gallery. The gallery immediately consumes it, so arriving by a direct link in a fresh tab still presents the warning. Approval is not permanently remembered. Browsers blocking session storage may ask again after navigation; they fail closed rather than reveal photos automatically.

On direct entry the page has no image `src` values. The photo configuration and renderer are loaded after approval, and then images are lazy-loaded. With JavaScript disabled no photos are displayed. Navigating away hides and clears the collection before a browser back/forward-cache snapshot; a restored gallery asks again.

This is a **viewing-consent warning, not password protection or verified age checking**. Static image URLs remain public. `noindex` and `noimageindex` are indexing requests, not access control. Do not use this mechanism to protect confidential photographs.

## Editing

- `site-config.js`: profile, songs/platform links, timeline, travel collection, film details, and contact information.
- `bodypositive-data.js`: the separate photography collection, groups, dates, photographer credits, and accessible image descriptions.
- `index.html`: homepage markup and content-warning text.
- `bodypositive.html`: gallery entry page and the matching warning text. Keep the two warnings consistent when editing.
- `styles.css`, `scroll.css`, `revision.css`: shared visual design and homepage additions.
- `bodypositive.css`: photography-page layout.
- `app.js`: homepage interactions.
- `consent.js`: the shared warning and navigation behavior.
- `bodypositive.js`: the consent-only gallery renderer, keyboard navigation, and photo dialog.

Blank Spotify/Apple Music/YouTube links remain clearly labeled search links from the earlier version. Replace the empty URLs in `site-config.js` with verified release URLs to make those direct listening links. Trailer and series-watch links stay hidden until real URLs are configured.

## Verification

The migration was verified in headless Chromium against a local HTTP server using the site's content security policy, with all requests to other origins blocked. The homepage images, travel map, all eight travel lightbox photos, all 19 separate gallery photos and their lightbox, warning accept/cancel, one-use consent navigation, and fresh-entry gating passed. No gallery data or photographs were requested before consent. The homepage HTML image fallbacks also loaded with JavaScript disabled. There were no script errors or failed local HTTP responses. Opening the music dialog requested only its expected external SoundCloud player; its artwork loaded locally.

The asset migration downloaded all 30 remote images successfully. All 36 raster files, including the existing production photographs and thumbnails, were checked for valid image data. The asset checker verifies local file references. SoundCloud playback must be checked with internet access.
