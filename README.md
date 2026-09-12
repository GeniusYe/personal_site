# JiaJie — A little of everything

A small, responsive personal link page. Plain HTML, CSS, and JavaScript. No build step, framework, package installation, backend, database, or API key.

## Preview

Extract the ZIP, then open `index.html` in your browser. Internet access is needed for the existing photo/artwork URLs and SoundCloud. You can also run `python -m http.server 8000` in this folder and visit `http://localhost:8000`.

A separate, single-file `jiajie-preview.html` is supplied alongside the ZIP for a quick look. That file is a snapshot; edit the ZIP's source files for ongoing changes.

## Publish on Cloudflare Pages

In Cloudflare, open **Workers & Pages → Create application → Get started → Drag and drop your files**. Choose Pages if the interface first asks for an application type. Name the project, upload the ZIP (or the extracted site folder), and choose **Deploy site**. `index.html` is already at the ZIP root. No build is required.

For subsequent changes, use **Create a new deployment** in the same project.

CLI alternative, from this folder:

```sh
npx wrangler pages deploy .
```

Direct Upload projects cannot later be switched to Git integration; create a Git-integrated project from the outset when automatic repository deployments are important.

Official references:
- https://developers.cloudflare.com/pages/get-started/direct-upload/
- https://developers.cloudflare.com/pages/how-to/use-direct-upload-with-continuous-integration/

## Change your content

Edit `site-config.js`. It contains your name, bio, image URLs, personal website, Instagram, email, and songs.

To change the visual design, edit `styles.css`. The palette is in `:root`; all fonts are system fonts. To change the greeting, caption, section headings, or no-JavaScript fallback, edit `index.html`.

After publishing, you may set `siteUrl` to your final public URL for consistent sharing. Left blank, it uses the page's current public URL. Local previews do not share local filesystem paths. Update the static Open Graph title, description, and image in `index.html` when changing the site's branding; social crawlers may not execute JavaScript.

## Music: what is wired up

The featured song is **Arise O’ Compatriots — JiaJie**. The SoundCloud embed uses track **2333675186**, the same ID linked from the personal website. The dialog loads the iframe only on opening, never autoplays, and removes it on closing so no audio continues invisibly. The native dialog supports Escape, backdrop dismissal, focus containment, and focus return.

The SoundCloud player itself and the link beneath it provide SoundCloud access. Amazon Music and Anghami have direct release destinations. **Apple Music, Spotify, YouTube, and YouTube Music currently open clearly labeled searches**, because their exact release URLs were not recoverable from the publicly readable source pages. Search buttons do not imply that the recording is available on those services.

To replace a search button, paste the exact release URL into its `url` field:

```js
{ id: "spotify", label: "Spotify", url: "PASTE_THE_ACTUAL_RELEASE_URL_HERE" }
```

Use a full `https://…` URL. The button automatically changes from **Search** to **Listen**, and an all-direct set of links hides the search notice. Delete a platform object to hide its button. Unsupported platforms without a configured URL are omitted, not rendered as dead buttons.

To add a song, duplicate the song object in the `songs` array and use a unique lowercase, hyphenated `id`. Supply the title, artist, artwork, public SoundCloud track URL (or the API track URL used by its official embed), and platform URLs. Duration and year are optional display metadata. The new song automatically gets a card and its own dialog content.

Shared links can include `?song=arise-o-compatriots` to open the song dialog. Copying a song link does not start playback.

SoundCloud's official widget documentation:
https://developers.soundcloud.com/docs/api/html5-widget

## Photos and artwork

The default page references the existing images on their original public hosts:
- Portrait: the image currently used on the supplied Linktree page.
- Website thumbnail: a designed miniature website card using the homepage's actual hero photograph. It is **not a screenshot capture** of the website.
- Release artwork: the artwork displayed by Anghami for this recording.

These images could stop loading if removed from their original hosts. Graceful initials/music-note placeholders appear when an image cannot load. No alternate person's photo or fabricated album artwork is substituted.

### Optional: host the images on Pages too

With Python 3.9+ and internet access, run:

```sh
python tools/localize_images.py
```

This standard-library-only helper downloads the configured images into `assets/` and updates their references in `site-config.js` and `index.html`. It does not publish anything or change the configuration unless all downloads succeed. Then upload the updated folder. Use an absolute URL to the local portrait in the `og:image` meta tag once your final domain is known. The standalone preview snapshot is not updated by this helper.

Alternatively, use your own files in `assets/` and update the corresponding image paths. Do not include private images or other sensitive files in the folder you upload: static files are publicly retrievable.

## Privacy and loading behavior

The page contains no analytics script or advertising SDK. Image hosts receive normal image requests; opening the music dialog creates a third-party SoundCloud iframe. SoundCloud controls its own player, availability, and any third-party behavior inside it. Playback needs internet access and may be affected by browser privacy settings or content blockers. A direct player link is always available as a fallback.

`_headers` contains a restrictive page content-security policy and basic security headers for Cloudflare Pages. Adding new iframe providers or external scripts requires updating that policy. The optional image downloader is a local Python utility, not a server function.

## Validation

The responsive layout and dialog were exercised in offline Chromium at 320, 390, 768, 1280, and 1920 pixels wide. Checks covered horizontal overflow, thumbnail/text overlap, modal size, correct player URL, no initial iframe, no autoplay setting, Escape/backdrop closing, iframe removal, restored focus/scrolling, explicit search labels, adding another song, and the no-JavaScript fallback. No JavaScript exceptions were observed in those UI tests.

External network access was unavailable in the test browser. **Live SoundCloud playback, image delivery, deployment, browser-history deep-link integration, and Safari/Firefox behavior were not tested.** The image downloader was syntax-checked but could not be exercised against the live image hosts here. Confirm the live player and your destination links after publishing.

## Source provenance

Public source pages used to populate this site:

- https://linktr.ee/everything.jiajie
- https://www.geniusye.com/
- https://play.anghami.com/song/1281914505
- https://www.amazon.com/Arise-Compatriots-JiaJie/dp/B0H4P1LQ5R

These are content references, not dependencies on the original Linktree page's layout or scripts. Image rights remain with their respective owners.

## Files

```text
index.html                 Page markup, metadata, dialog, fallback content
styles.css                 Responsive design and interaction styles
site-config.js             Editable profile, website, and song data
app.js                     Dialog, iframe lifecycle, sharing, safe link rendering
_headers                   Cloudflare Pages response headers
assets/favicon.svg         Small site icon; local images can also go here
tools/localize_images.py   Optional local image-copy helper
README.md                  This guide
```
