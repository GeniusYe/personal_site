# Content provenance — owner reference, not a displayed page

Site paths in this document are relative to `public/`, the deployment folder.

Home biography, dated travel map, and travel-image captions were carried over from the existing build and the owner's website:
https://www.geniusye.com/

The separate photography collection was copied from the public image links and available photo-session credits at:
https://www.geniusye.com/bodypositive

All previously remote photographs, the travel map, and music artwork are now bundled in `assets/profile/`, `assets/postcards/`, `assets/music/`, and `assets/bodypositive/`. Production photographs and their thumbnails are in `assets/movie/`. These source links record provenance; the site does not load images from the former hosts.

The nine photographs under “Call me cultural connoisseur” on the original homepage were copied into `assets/culture/cultural-appreciation-01.jpg` through `cultural-appreciation-09.jpg` in source order. The section is now titled “Dressed for the journey.” The owner supplied the garment names, makers, and places, including a West African caftan made in Kigali and a Latvian veste photographed in Estonia, and approved the nine one-sentence captions about cultural significance. Accessible image descriptions use those identifications alongside visible clothing and settings. No photo dates or photographer credits were supplied. The original image responses are preserved without recompression; the page and photo viewer load only these local copies.

Photo groups: opening portrait (no explicit photographer attribution recovered); three photographs credited to @reaux_woods; Baltimore, July 2022, @unix.jpg; Miami Beach, May 2022, @kearnyrivero; Greensboro, September 2021, @lostfilmsphotography_llc; Miami, May 2021, @kearnyrivero; Atlanta, March and July 2020, @derrick_lejermon. A source caption does not establish any other personal characteristic.

The three original Boys Like Us Season 2 images were provided directly by the owner in this conversation. Group labels follow the owner's descriptions: principal cast; above-the-line/creative team; crew. The owner corrected the third label from “Cast & crew” to “Crew”; its legacy `blu-cast-and-crew.webp` and `blu-cast-and-crew-small.webp` filenames are retained. No individual has been identified from a photograph and no cast/crew member's sexuality is inferred.

The owner also supplied four behind-the-scenes photographs and one production video. They are bundled in `assets/movie/` as `blu-bts-on-set-02.webp`, `blu-bts-on-set-01.webp`, `blu-bts-selfie-01.webp`, `blu-bts-selfie-02.webp`, and `blu-bts-slate-100.mp4`, in that display order. Each photograph has a small thumbnail; the video has a local poster and small poster thumbnail. Captions describe the supplied media without adding participant names or shoot dates.

The Boys Like Us project credits and Instagram update link were supplied directly by the owner: created by [@carmseea](https://www.instagram.com/carmseea/), directed by [@bobothedirector](https://www.instagram.com/bobothedirector/), produced by [@preshyharry1](https://www.instagram.com/preshyharry1/), and the series account [@boyslikeustheseries](https://www.instagram.com/boyslikeustheseries/). The personal note reflects the owner's existing executive producer and actor roles for Season 2.

The content-warning page is new copy; the gallery introduction is a light rewrite of the owner's expressed idea of learning to love his own body. The old page's mock menu/pricing copy is not reproduced.

Cloudflare deployment reference:
https://developers.cloudflare.com/pages/get-started/direct-upload/

## Music release links and credit

The direct platform links were verified against the official pages for “Arise O’ Compatriots” by JiaJie, released June 26, 2026: [Spotify](https://open.spotify.com/track/4LkmD5IaiM5hZSLY1Nyqbo), [Apple Music](https://music.apple.com/us/song/arise-o-compatriots/6788196829), [YouTube](https://www.youtube.com/watch?v=OQnRSwWDuuI), and [YouTube Music](https://music.youtube.com/watch?v=OQnRSwWDuuI).

The owner supplied the music production credit [@realpaulallison](https://www.instagram.com/realpaulallison/). It is stored in the song's `credits` list with the role “Music production” and displayed in the music dialog.

## Clothing caption references

The owner reviewed and approved the exact caption wording before publication. Charles&M and Thread King captions are editorial appreciations of contemporary Ivorian and Nigerian design, based on the owner's maker identifications; the caftan caption reflects the owner-provided West African style and Kigali provenance. These do not assign historic ceremonial symbolism to the individual designs.

- Áo dài: Vietnam National Authority of Tourism — https://vietnam.travel/node/1216
- Latvian veste: Latvian Cultural Canon, folk costume — https://kulturaskanons.lv/archive/tautasterps/ (the cultural significance applies to the wider folk-dress tradition); dictionary name — https://tezaurs.lv/veste%3A1
- Charles&M: owner-supplied designer page — https://www.facebook.com/CharlesEtMode
- Sarong: Sri Lankan clothing retailer Lakpura — https://www.lakpura.com/pages/sarongs
- Banja koto: Nieuwe Instituut, Maroon clothing traditions — https://nieuweinstituut.nl/en/projects/soengoe-kondre/amoiloeloe-aseisente-pangi/ ; the exact garment name appears in the Guyaba section, printed page 52, of the community consultation report — https://www.nikos.sr/wp-content/uploads/2021/02/Draft-Report-on-Community-Planning-and-Consultation-SSDI.pdf
- Kente: UNESCO, craftsmanship of traditional woven textile Kente — https://ich.unesco.org/en/Decisions/19.COM/7.b.38 (documents the Ghanaian tradition; Côte d’Ivoire is the owner's identification for this photograph, not a claim about the location of UNESCO's inscription).
- Gho: Bhutan Department of Tourism — https://bhutan.travel/journal/editorial/cultural-fabric

These links document the writing; no third-party resource is downloaded by the gallery.

## Instagram credit review — September 12, 2026

The owner requested a caption-based review of all 17 photographs in “Dressed for the journey” and “Postcards from the road.” The review started from master at `a5f2b29`. Public post captions were read through the owner's signed-in Instagram session and relevant images were compared with the bundled originals. No Instagram media or account data is loaded by the website.

The initial review established structured `credits` for nine photographs in `site-config.js`, with the evidence links recorded in each photograph's `creditSources`. The subsequent owner-selected additions and owner-confirmed Banja koto designer attribution bring this to 14 credited homepage photographs. Designer, photographer, stylist, textile, scarf, clothing, and editing roles remain distinct. The existing Paris, Prague, and Mexico photographer credits were retained. Charles&M links to the owner's previously supplied Facebook page; the caption's photographer name `78studio` stays unlinked because no account handle was verified. Cairo's credit uses matching photographs across two posts from the same Giza shoot, documented in the audit.

The owner directly identified **Claire Kropie** as the Banja koto designer and supplied [her Facebook profile](https://www.facebook.com/claire.kropie.5). This designer credit comes from the owner's confirmation, not from an Instagram caption. The Banja koto photographer remains unknown.

See [PHOTO-CREDITS-AUDIT.md](PHOTO-CREDITS-AUDIT.md) for the evidence for every photo, unresolved credits, and credited Instagram photographs not represented on the site. A matching location alone, a commenter, a friend mention, or a tag on a different outfit was not treated as a photographer attribution. Original photographs, captions, dates, and locations remain as supplied by the owner.

The Mexico City portrait was moved from postcards to “Dressed for the journey.” as the tenth photograph at the owner's request, identifying the outfit as a Charro suit. The original image bytes are preserved at `assets/culture/charro-suit-mexico.jpg`; the December 2024 date and photographer credit @fotografia_beauty_art (https://www.instagram.com/fotografia_beauty_art/) were retained from the existing postcard metadata. No clothing designer was supplied for this photograph. The caption summarizes the relationship between charrería, community identity, and local craftsmanship documented by UNESCO: https://ich.unesco.org/en/RL/charreria-equestrian-tradition-in-mexico-01108 .

## Owner-selected Instagram additions

The owner explicitly selected ten images from eight Instagram posts. The exact carousel selections, local asset names, and credits are recorded in [PHOTO-CREDITS-AUDIT.md](PHOTO-CREDITS-AUDIT.md). The image bytes were exported from the rendered Instagram pages without recompression and copied into the existing asset folders. The site loads these local files, not Instagram image URLs.

The Agbada caption paraphrases the owner's post about the garment's association with Yoruba culture and its use for celebrations and formal occasions. Its clothing credits are @chidi_sunday1 and @threadking_studios; its photographer is @willens__. Both selected Rio photos credit @soumarianamonteiro, and the patchwork jacket also credits @hip_hop_cargo. The selected Hawaii image tags @hawaii_daytour; a second post from the same pink-shirt coastal shoot explicitly credits that account as photographer. Copenhagen, Lisbon, and Madrid had no caption credit. Publication dates were not used as shoot dates.

The three Chicago portraits are credited to @photorsh. They replace the opening section in Body Positive, bringing the visible collection to 21 photographs. The removed opening portrait remains as an unused original asset; it is no longer referenced by the gallery configuration.
