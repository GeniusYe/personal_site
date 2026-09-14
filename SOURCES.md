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

The owner subsequently reviewed and approved bold, capitalized garment names, the spelling Kaftan, and regular type for the brands Charles&M and Thread King. The Latvian outfit is now named Tautastērps at the owner's correction, with the caption “The Tautastērps connects regional craftsmanship with a shared sense of Latvian national identity.” Existing local names stay without duplicate translations. Three approved inline local spellings also appear in bold:

- Sarong — සරම in Sinhala: [Madura English-Sinhala Dictionary](https://www.maduraonline.com/?find=%E0%B7%83%E0%B6%BB%E0%B6%B8).
- Gho — གོ in Dzongkha: [Dzongkha Development Commission pictorial vocabulary](https://www.dzongkha.gov.bt/uploads/files/publications/Pictorial_vocabulary_3b368f7320660fd45a378c5453ee55bc.pdf).
- Charro Suit — Traje de Charro in Spanish: [Mexico's education portal](https://nemd.aprende.gob.mx/contenido/coleccion/trajes-regionales-de-mexico/).

## Instagram credit review — September 12, 2026

The owner requested a caption-based review of all 17 photographs in “Dressed for the journey” and “Postcards from the road.” The review started from master at `a5f2b29`. Public post captions were read through the owner's signed-in Instagram session and relevant images were compared with the bundled originals. No Instagram media or account data is loaded by the website.

The initial review established structured `credits` for nine photographs in `site-config.js`, with the evidence links recorded in each photograph's `creditSources`. The subsequent owner-selected additions and owner-confirmed Banja koto designer attribution bring this to 14 credited homepage photographs. Designer, photographer, stylist, textile, scarf, clothing, and editing roles remain distinct. The existing Paris, Prague, and Mexico photographer credits were retained. Charles&M links to the owner's previously supplied Facebook page; the caption's photographer name `78studio` stays unlinked because no account handle was verified. Cairo's credit uses matching photographs across two posts from the same Giza shoot, documented in the audit.

The owner directly identified **Claire Kropie** as the Banja koto designer and supplied [her Facebook profile](https://www.facebook.com/claire.kropie.5). This designer credit comes from the owner's confirmation, not from an Instagram caption. The Banja koto photographer remains unknown.

See [PHOTO-CREDITS-AUDIT.md](PHOTO-CREDITS-AUDIT.md) for the evidence for every photo, unresolved credits, and credited Instagram photographs not represented on the site. A matching location alone, a commenter, a friend mention, or a tag on a different outfit was not treated as a photographer attribution. Original photographs, captions, dates, and locations remain as supplied by the owner.

The Mexico City portrait was moved from postcards to “Dressed for the journey.” as the tenth photograph at the owner's request, identifying the outfit as a Charro Suit. The original image bytes are preserved at `assets/culture/charro-suit-mexico.jpg`; the December 2024 date and photographer credit @fotografia_beauty_art (https://www.instagram.com/fotografia_beauty_art/) were retained from the existing postcard metadata. No clothing designer was supplied for this photograph. The caption summarizes the relationship between charrería, community identity, and local craftsmanship documented by UNESCO: https://ich.unesco.org/en/RL/charreria-equestrian-tradition-in-mexico-01108 .

## Owner-selected Instagram additions

The owner initially selected ten images from eight Instagram posts, then selected nine more postcards on September 13, 2026. The exact carousel selections, local asset names, and credits are recorded in [PHOTO-CREDITS-AUDIT.md](PHOTO-CREDITS-AUDIT.md). The image bytes were exported from the rendered Instagram pages without recompression and copied into the existing asset folders. The site loads these local files, not Instagram image URLs.

The Agbada caption paraphrases the owner's post about the garment's association with Yoruba culture and its use for celebrations and formal occasions. Following the owner's correction, its clothing credit is @threadking_studios and its photographer remains @willens__; @chidi_sunday1 was removed from this photograph's displayed clothing credits. Both selected Rio photos credit @soumarianamonteiro, and the patchwork jacket also credits @hip_hop_cargo. The selected Hawaii image tags @hawaii_daytour; a second post from the same pink-shirt coastal shoot explicitly credits that account as photographer. Copenhagen, Lisbon, and Madrid had no caption credit. Publication dates were not used as shoot dates.

The three original Chicago portraits are credited to @photorsh and replace the opening section in Body Positive. Eight later owner-supplied photographs expand Chicago to six images, the second section to five, and Baltimore to six, bringing the visible collection to 29 photographs. The owner confirmed September 2025 for Chicago and renamed the second section “Atlanta, Georgia.” The new images retain the existing session credits and are copied without recompression; their exact file mapping is in `PHOTO-CREDITS-AUDIT.md`. The removed opening portrait remains as an unused original asset; it is no longer referenced by the gallery configuration.

The nine additional postcards show Santiago, Panama City, Marrakech, Tokyo, Salvador, Johannesburg, Taipei, Barcelona, and Amsterdam in the owner's supplied configuration order. The exact selected carousel images were inspected in the owner's signed-in Instagram session; the two links without a carousel index each contain one image. All nine locally bundled images are 1440 × 1440 and retain their square framing. Tokyo's caption explicitly dates the photograph to April 2024; the other new date fields remain blank because publication dates do not establish shoot dates.

The new captions credit @lola_photo_art for Santiago, @nkandayatu for the Marrakech clothing, @tyme.media for Johannesburg, and @whosyourbrad for Barcelona photography. Barcelona also preserves the explicit barber credit @max_classic_22. Taipei's caption names `mason.tpe.photographer` without a link, so the displayed photographer credit is @mason.tpe.photographer without a guessed profile URL. Panama City, Tokyo, Salvador, and Amsterdam had no caption credits. The selected Salvador photograph shows a black graphic T-shirt; the credits from the separately reviewed white-robe shoot were not transferred to it.

The owner directly supplied `C:\Users\JiaJie Ye\OneDrive\2024\Photoshoot\0524 at Shanghai\selected\DSC02858.JPG` and identified the location as Shanghai. Its original bytes are preserved at `assets/postcards/shanghai.jpg`. EXIF `DateTimeOriginal` records May 24, 2024 at 11:00:26 with offset +08:00, supporting the displayed date May 2024. The stored image is 6000 × 4000 with EXIF orientation 8; configuration and HTML use the upright display dimensions, 4000 × 6000. No photographer credit was supplied.

The postcard configuration and static HTML fallback retain editorial/source order. At the owner's request, the live postcard collection shuffles once per page load, with the photo viewer using that same shuffled order. Other photo collections retain their existing order.

## Owner-supplied Bali, bath and Dubai media

The owner supplied four Bali photographs, a Bali pool video, a bath photograph, and a Dubai beach portrait. The Dubai image also arrived as a clipboard attachment with identical bytes; it is included once in Postcards. The remaining media are in the separate NSFW collection, loaded only after viewing consent.

| Supplied filename | Local asset under `public/` |
| --- | --- |
| `dji_mimo_20241001_084904_0_1727743798551_video~2.mp4` | `assets/bodypositive/bali-2024-video.mp4` |
| `dji_mimo_20240930_183858_0_1727693398597_photo.jpg` | `assets/bodypositive/bali-2024-1.jpg` |
| `dji_mimo_20241001_081206_0_1727741596485_photo~2.jpg` | `assets/bodypositive/bali-2024-2.jpg` |
| `dji_mimo_20241001_110130_0_1727751716515_photo.jpg` | `assets/bodypositive/bali-2024-3.jpg` |
| `dji_mimo_20241001_105932_0_1727751718322_photo.jpg` | `assets/bodypositive/bali-2024-4.jpg` |
| `dji_mimo_20241012_205326_0_1728760709328_photo.jpg` | `assets/bodypositive/bath-2024-1.jpg` |
| `snapedit_1728905892157.jpg` (also supplied as `codex-clipboard-30bcd6cd-6e1e-40e1-bcd3-b219ef18ab6f.png`) | `assets/postcards/dubai.png` |

All six unique photographs preserve the original file bytes, verified by SHA-256 comparison. The Dubai original has PNG file data despite its `.jpg` source filename, so the bundled file uses `.png`. The SnapEdit watermark is preserved. Bali photo capture dates span September 30–October 1, 2024; the bath photograph records October 12, 2024. The Bali and Dubai locations come from the owner's supplied folder names. Dubai's October 2024 date comes from its `2024/Photoshoot/1004 at Dubai` folder, not from EXIF. The bath location is unknown and its group is labeled “In the bath.” No photographer credits were supplied for these additions.

The 13.25-second source video uses HEVC with rotation metadata. Its web copy uses H.264 video and AAC audio in an MP4, keeps the upright 1080 × 1920 framing, and places the MP4 metadata at the start for playback. It is 24,129,962 bytes, compared with the 48,817,491-byte source. The 720 × 1280 poster at `assets/bodypositive/bali-2024-video-poster.jpg` is extracted at 0.5 seconds from the web copy. The original video file is unchanged.
