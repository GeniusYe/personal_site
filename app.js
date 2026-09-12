/* Progressive enhancement; no framework, API key, analytics, or build tools. */
(() => {
  "use strict";

  const config = window.JIAJIE_SITE;
  if (!config || !config.profile || !Array.isArray(config.songs)) {
    console.error("JiaJie: site-config.js is missing or invalid.");
    return;
  }
  const $ = (selector, root = document) => root.querySelector(selector);
  const setText = (selector, text, root = document) => {
    const node = $(selector, root);
    if (node) node.textContent = String(text ?? "");
  };

  // Never insert editable content as HTML. Only these hard-coded icon paths use it.
  const ICONS = {
    spotify: '<circle cx="12" cy="12" r="10" fill="currentColor"/><g fill="none" stroke="white" stroke-width="1.6" stroke-linecap="round"><path d="M6.5 9c4-1.2 8-1 11 1"/><path d="M7 12.5c3.5-1 6.8-.7 9.5.8"/><path d="M7.8 16c2.7-.7 5.3-.4 7.8.7"/></g>',
    apple: '<path d="M10 5v12.1a3.1 3.1 0 1 1-2-2.9V6l12-3v12.1a3.1 3.1 0 1 1-2-2.9V6.7l-8 2Z" fill="currentColor"/>',
    youtube: '<rect x="2" y="5" width="20" height="14" rx="4" fill="currentColor"/><path d="m10 9 6 3-6 3Z" fill="white"/>',
    youtubeMusic: '<circle cx="12" cy="12" r="10" fill="currentColor"/><circle cx="12" cy="12" r="7" fill="none" stroke="white" stroke-width="1"/><path d="m10 8 6 4-6 4Z" fill="white"/>',
    amazon: '<path d="M11 3v11.5a3.2 3.2 0 1 1-2-2.9V4l10-2v10.5a3.2 3.2 0 1 1-2-2.9V5l-6 1.2Z" fill="currentColor"/><path d="M4 20c4.5 2 10 2 15-1M16 18l4 .5-1.2 3" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>',
    anghami: '<g fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M5 8a8 8 0 1 1 0 8M8 10a4.5 4.5 0 1 1 0 4M11 12a1.2 1.2 0 1 1 0 .1"/></g>',
    music: '<path d="M9 5v12M9 7l10-3v11" fill="none" stroke="currentColor" stroke-width="2"/><ellipse cx="6" cy="17" rx="3" ry="2.5" fill="currentColor"/><ellipse cx="16" cy="15" rx="3" ry="2.5" fill="currentColor"/>'
  };
  const SEARCH = {
    spotify: q => `https://open.spotify.com/search/${encodeURIComponent(q)}`,
    apple: q => `https://music.apple.com/us/search?term=${encodeURIComponent(q)}`,
    youtube: q => `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`,
    youtubeMusic: q => `https://music.youtube.com/search?q=${encodeURIComponent(q)}`,
    amazon: q => `https://music.amazon.com/search/${encodeURIComponent(q)}`
  };

  /** Accept only web URLs for outgoing navigation. */
  function webURL(value) {
    if (typeof value !== "string" || !value.trim()) return null;
    try {
      const url = new URL(value);
      return ["https:", "http:"].includes(url.protocol) ? url.href : null;
    } catch { return null; }
  }

  /** Accept local files/relative paths for images, but no executable schemes. */
  function imageURL(value) {
    if (typeof value !== "string" || !value.trim()) return null;
    if (/^data:image\/(?:webp|png|jpeg|gif|svg\+xml);base64,/i.test(value)) return value;
    try {
      const url = new URL(value, location.href);
      return ["https:", "http:", "file:"].includes(url.protocol) ? url.href : null;
    } catch { return null; }
  }

  function setImage(img, source, alt = "") {
    if (!img) return;
    img.alt = alt;
    img.onload = () => {
      img.classList.remove("image-unavailable");
      img.dataset.imageStatus = "loaded";
    };
    img.onerror = () => {
      // The CSS name/music-note placeholder remains visible underneath.
      img.classList.add("image-unavailable");
      img.dataset.imageStatus = "unavailable";
    };
    const url = imageURL(source);
    if (!url) {
      img.removeAttribute("src");
      img.onerror();
      return;
    }
    img.classList.remove("image-unavailable");
    img.src = url;
    if (img.complete) {
      if (img.naturalWidth) img.onload();
      else img.onerror();
    }
  }

  const musicDialog = $("#music-dialog");
  const shareDialog = $("#share-dialog");
  const slot = $("#soundcloud-slot");
  const toast = $("#toast");
  let activeSong = null;
  let lastOpener = null;
  let toastTimer;
  let scrollLocks = 0;
  let savedScroll = 0;

  function lockScroll() {
    if (scrollLocks++ !== 0) return;
    savedScroll = window.scrollY;
    document.body.style.setProperty("--scroll-offset", `${-savedScroll}px`);
    document.body.classList.add("modal-open");
  }
  function unlockScroll() {
    if (!scrollLocks || --scrollLocks !== 0) return;
    document.body.classList.remove("modal-open");
    document.body.style.removeProperty("--scroll-offset");
    const html = document.documentElement;
    const previousBehavior = html.style.scrollBehavior;
    html.style.scrollBehavior = "auto";
    window.scrollTo(0, savedScroll);
    html.style.scrollBehavior = previousBehavior;
  }
  function notify(message) {
    clearTimeout(toastTimer);
    const host = shareDialog.open ? shareDialog : document.querySelector("dialog[open]") || document.body;
    host.append(toast);
    toast.textContent = message;
    toast.classList.add("visible");
    toastTimer = setTimeout(() => toast.classList.remove("visible"), 3600);
  }

  /** No API key: use the same public iframe track as the original website. */
  function soundCloudURL(song, visual = false) {
    const source = webURL(song.soundcloudTrack);
    if (!source) return null;
    const host = new URL(source).hostname;
    if (!["soundcloud.com", "www.soundcloud.com", "api.soundcloud.com"].includes(host)) return null;
    const params = new URLSearchParams({
      url: source,
      color: "#314c3c",
      auto_play: "false",
      buying: "false",
      sharing: "false",
      download: "false",
      show_artwork: String(visual),
      show_playcount: "false",
      show_user: "true",
      single_active: "true",
      visual: String(visual)
    });
    return `https://w.soundcloud.com/player/?${params}`;
  }

  function publicShareURL(songId = null) {
    const explicit = webURL(config.siteUrl);
    const isLocal = ["localhost", "127.0.0.1", "[::1]"].includes(location.hostname);
    if (!explicit && (!["http:", "https:"].includes(location.protocol) || isLocal)) return null;
    const base = explicit || location.href;
    try {
      const url = new URL(base);
      url.search = "";
      url.hash = "";
      if (songId) url.searchParams.set("song", songId);
      return url.href;
    } catch { return null; }
  }

  function updateSongURL(id) {
    // replaceState avoids filling browser history with modal openings.
    if (!["http:", "https:"].includes(location.protocol)) return;
    try {
      const url = new URL(location.href);
      if (id) url.searchParams.set("song", id);
      else url.searchParams.delete("song");
      history.replaceState(history.state, "", url);
    } catch { /* The dialog still works in a restrictive embedded preview. */ }
  }

  function renderPlatforms(song) {
    const parent = $("#platform-links");
    parent.replaceChildren();
    let hasSearch = false;
    const platforms = Array.isArray(song.platforms) ? song.platforms : [];
    for (const platform of platforms) {
      const direct = webURL(platform.url);
      const searchBuilder = SEARCH[platform.id];
      const query = song.searchTerms || `${song.artist} ${song.title}`;
      const href = direct || (searchBuilder ? searchBuilder(query) : null);
      if (!href) continue; // Unknown + unconfigured platforms are not broken buttons.
      const isSearch = !direct;
      hasSearch ||= isSearch;
      const link = document.createElement("a");
      link.className = "platform-link";
      link.href = href;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.dataset.platform = platform.id;
      link.dataset.linkType = isSearch ? "search" : "direct";
      link.setAttribute("aria-label", isSearch
        ? `Search ${platform.label} for ${song.title} by ${song.artist} (opens in a new tab)`
        : `Open ${song.title} on ${platform.label} (opens in a new tab)`);
      const logo = document.createElement("span");
      logo.className = "platform-logo";
      logo.setAttribute("aria-hidden", "true");
      const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      svg.setAttribute("viewBox", "0 0 24 24");
      svg.innerHTML = ICONS[platform.id] || ICONS.music;
      logo.append(svg);
      const text = document.createElement("span");
      text.className = "platform-text";
      const name = document.createElement("span");
      name.className = "platform-name";
      name.textContent = platform.label;
      const action = document.createElement("span");
      action.className = "platform-action";
      action.textContent = isSearch ? "Search" : (platform.action || "Listen");
      text.append(name, action);
      const arrow = document.createElement("span");
      arrow.className = "small-arrow";
      arrow.setAttribute("aria-hidden", "true");
      arrow.textContent = "↗";
      link.append(logo, text, arrow);
      parent.append(link);
    }
    $("#search-notice").hidden = !hasSearch;
    $(".platform-heading").hidden = parent.childElementCount === 0;
  }

  function openSong(song, opener = null, syncURL = true) {
    const embedURL = soundCloudURL(song);
    // Very old browsers still get a usable SoundCloud page.
    if (typeof musicDialog.showModal !== "function") {
      if (embedURL) window.open(embedURL, "_blank", "noopener,noreferrer");
      else notify("No SoundCloud player has been configured for this release.");
      return;
    }
    if (!musicDialog.open) lastOpener = opener || document.activeElement;
    activeSong = song;
    setText("#dialog-title", song.title);
    setText("#dialog-eyebrow", song.eyebrow || "Single");
    setText("#dialog-byline", [song.artist, song.year, song.duration].filter(Boolean).join(" · "));
    setText("#dialog-description", song.description || `Listen to ${song.title} by ${song.artist}.`);
    setImage($("#dialog-artwork"), song.artwork);
    renderPlatforms(song);

    // Removing/replacing the iframe stops any previously active player.
    slot.replaceChildren();
    const external = $("#soundcloud-external");
    const externalURL = webURL(song.soundcloudPage) || soundCloudURL(song, true);
    $(".player-fallback").hidden = !externalURL;
    if (externalURL) external.href = externalURL;
    else external.removeAttribute("href");
    if (embedURL) {
      const iframe = document.createElement("iframe");
      iframe.title = `${song.title} by ${song.artist} — SoundCloud audio player`;
      iframe.src = embedURL;
      iframe.allow = "autoplay";
      iframe.setAttribute("scrolling", "no");
      iframe.referrerPolicy = "strict-origin-when-cross-origin";
      iframe.height = "166";
      iframe.loading = "eager";
      slot.append(iframe);
    } else {
      const note = document.createElement("p");
      note.className = "player-unavailable";
      note.textContent = "An on-page player is not available for this release. Use a platform below.";
      slot.append(note);
    }
    if (!musicDialog.open) {
      lockScroll();
      musicDialog.showModal();
    }
    musicDialog.scrollTop = 0;
    $("#close-dialog").focus({ preventScroll: true });
    if (syncURL) updateSongURL(song.id);
  }

  musicDialog.addEventListener("close", () => {
    slot.replaceChildren(); // No hidden audio after closing, including Escape.
    activeSong = null;
    toast.classList.remove("visible");
    document.body.append(toast);
    unlockScroll();
    updateSongURL(null);
    if (lastOpener && lastOpener.isConnected && typeof lastOpener.focus === "function") {
      lastOpener.focus({ preventScroll: true });
    }
  });
  $("#close-dialog").addEventListener("click", () => musicDialog.close());

  // Require both pointer-down and pointer-up outside, so dragging from inside
  // the dialog doesn't accidentally close it. Padding inside isn't a backdrop.
  function backdropClose(dialog) {
    dialog.addEventListener("keydown", e => {
      if (e.key === "Escape") { e.preventDefault(); dialog.close(); }
    });
    let beganOutside = false;
    const outside = event => {
      if (event.target !== dialog) return false;
      const r = dialog.getBoundingClientRect();
      return event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom;
    };
    dialog.addEventListener("pointerdown", e => { beganOutside = outside(e); });
    dialog.addEventListener("click", e => {
      if (beganOutside && outside(e)) dialog.close();
      beganOutside = false;
    });
  }
  backdropClose(musicDialog);
  backdropClose(shareDialog);

  function manualShare(url) {
    if (typeof shareDialog.showModal !== "function") {
      window.prompt("Copy this link:", url);
      return;
    }
    $("#share-url").value = url;
    lockScroll();
    shareDialog.showModal();
    $("#share-url").focus();
    $("#share-url").select();
  }
  shareDialog.addEventListener("close", () => unlockScroll());
  $("#close-share").addEventListener("click", () => shareDialog.close());

  async function copyLink(url) {
    if (!url) {
      notify("Publish this page first to share its public link.");
      return;
    }
    try {
      if (!navigator.clipboard || !window.isSecureContext) throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(url);
      notify("Link copied. Pass it on.");
    } catch {
      manualShare(url);
    }
  }
  $("#copy-song").addEventListener("click", () => {
    if (activeSong) void copyLink(publicShareURL(activeSong.id));
  });
  $("#share-page").hidden = false;
  $("#share-page").addEventListener("click", async () => {
    const url = publicShareURL();
    if (!url) { notify("Publish this page first to share its public link."); return; }
    if (navigator.share) {
      try {
        await navigator.share({ title: `${config.profile.name} — A little of everything`, url });
        return;
      } catch (error) {
        if (error && error.name === "AbortError") return;
      }
    }
    await copyLink(url);
  });

  // Render editable profile content; the HTML remains useful without JavaScript.
  const profile = config.profile;
  setText("#profile-name", profile.name);
  setText("#footer-name", profile.name);
  setText("#profile-wordmark", profile.name);
  setText("#profile-roles", profile.roles);
  setText("#profile-bio", profile.bio);
  setText("#instagram-handle", profile.instagramHandle);
  setText("#year", new Date().getFullYear());
  setImage($("#portrait"), profile.photo, profile.photoAlt || `Portrait of ${profile.name}`);
  const instagram = webURL(profile.instagram);
  if (instagram) $("#instagram-link").href = instagram;
  else $("#instagram-link").hidden = true;
  if (typeof profile.email === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email)) {
    $("#email-link").href = `mailto:${encodeURIComponent(profile.email).replace(/%40/g, "@")}`;
  } else $("#email-link").hidden = true;

  const songs = config.songs.filter(song => song && /^[a-z0-9-]+$/.test(song.id) && song.title && song.artist);
  const songList = $("#song-list");
  for (const song of songs) {
    const card = $("#song-card-template").content.firstElementChild.cloneNode(true);
    card.dataset.song = song.id;
    card.setAttribute("aria-label", `Listen to ${song.title} by ${song.artist} — opens music player`);
    setText(".song-title", song.title, card);
    setText(".song-eyebrow", song.eyebrow || "Single", card);
    setText(".song-meta", [song.artist, song.duration].filter(Boolean).join(" · "), card);
    setText(".song-card-description", song.description || "", card);
    setImage($(".song-artwork", card), song.artwork);
    card.addEventListener("click", () => openSong(song, card));
    songList.append(card);
  }
  if (!songs.length) $(".music-section").hidden = true;

  // Shared song links open the listening room without auto-playing audio.
  function openSharedSong() {
    const id = new URL(location.href).searchParams.get("song");
    const song = songs.find(item => item.id === id);
    if (song && (!musicDialog.open || activeSong?.id !== song.id)) {
      const opener = [...document.querySelectorAll(".music-card")].find(card => card.dataset.song === song.id);
      openSong(song, opener, false);
    } else if (!song && musicDialog.open) musicDialog.close();
  }
  // ---- The scrolling story, photo collections, and project gallery. ----
  const galleryDialog = $("#gallery-dialog");
  const project = config.project || {};
  const travel = config.travel || {};
  const culture = config.culture || {};
  const travelPhotos = (Array.isArray(travel.photos) ? travel.photos : []).filter(p => p && imageURL(p.src));
  const projectPhotos = (Array.isArray(project.photos) ? project.photos : []).filter(p => p && imageURL(p.src));
  const culturePhotos = (Array.isArray(culture.photos) ? culture.photos : []).filter(p => p && imageURL(p.src));
  let galleryState = { items: [], index: 0, mode: "travel", opener: null };
  let travelRendered = 0;
  let travelObserver = null;

  function element(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = String(text ?? "");
    return node;
  }
  function outgoingLink(href, text, className = "") {
    const a = element("a", className, text);
    a.href = href;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    return a;
  }
  function renderPhotoCredits(parent, photo, mode) {
    const credits = (Array.isArray(photo.credits) ? photo.credits : [])
      .filter(credit => credit && typeof credit.name === "string" && credit.name.trim());
    if (!credits.length && typeof photo.credit === "string" && photo.credit.trim()) {
      credits.push({ role: mode === "map" ? "" : "Photo", name: photo.credit, url: photo.creditUrl });
    }
    parent.replaceChildren();
    for (const credit of credits) {
      const url = webURL(credit.url);
      let name = credit.name.trim().replace(/^@+/, "@");
      // Instagram names use one @, whether the editable name included it or not.
      if (url && /(^|\.)instagram\.com$/i.test(new URL(url).hostname) && /^[\w.]+$/.test(name)) {
        name = `@${name}`;
      }
      const line = element("p", "photo-credit");
      const role = typeof credit.role === "string" ? credit.role.trim() : "";
      if (role) line.append(element("span", "photo-credit-role", `${role}: `));
      line.append(url ? outgoingLink(url, name) : element("span", "", name));
      parent.append(line);
    }
    parent.hidden = !credits.length;
    return credits.length > 0;
  }
  function updateProjectURL(id) {
    if (!["http:", "https:"].includes(location.protocol)) return;
    try {
      const url = new URL(location.href);
      if (id) { url.searchParams.set("project", id); url.searchParams.delete("song"); }
      else url.searchParams.delete("project");
      history.replaceState(history.state, "", url);
    } catch { /* File previews still have fully usable dialogs. */ }
  }
  function renderGalleryImage() {
    const { items, index, mode } = galleryState;
    const photo = items[index];
    if (!photo) return;
    $("#gallery-image-error").hidden = true;
    setImage($("#gallery-image"), photo.src, photo.alt || photo.title || "Photograph");
    setText("#gallery-photo-title", photo.title || "");
    setText("#gallery-photo-location", mode === "culture" ? photo.location : "");
    $("#gallery-photo-location").hidden = mode !== "culture" || !photo.location;
    setText("#gallery-photo-caption", photo.caption || photo.date || "");
    setText("#gallery-count", `${index + 1} / ${items.length}`);
    $("#gallery-count").hidden = items.length < 2;
    renderPhotoCredits($("#gallery-credit"), photo, mode);
    const fullSize = imageURL(photo.src);
    $("#gallery-original").hidden = !fullSize;
    if (fullSize) $("#gallery-original").href = fullSize;
    setText("#gallery-original", mode === "map" ? "Open the original map ↗" : "Open full-size photograph ↗");
    $(".gallery-controls", galleryDialog).hidden = items.length < 2;
    $("#gallery-key-hint").hidden = items.length < 2;
    for (const [i, thumb] of [...$("#gallery-thumbnails").children].entries()) {
      thumb.setAttribute("aria-pressed", String(i === index));
    }
  }
  $("#gallery-image").addEventListener("error", () => { $("#gallery-image-error").hidden = false; });
  $("#gallery-image").addEventListener("load", () => { $("#gallery-image-error").hidden = true; });

  function moveGallery(offset) {
    const n = galleryState.items.length;
    if (n < 2) return;
    galleryState.index = (galleryState.index + offset + n) % n;
    renderGalleryImage();
  }
  function openGallery(items, index, mode, opener = null, syncURL = true) {
    if (!items.length || typeof galleryDialog.showModal !== "function") return false;
    if (galleryState.mode === "project" && mode !== "project" && syncURL) updateProjectURL(null);
    galleryState = { items, index: Math.max(0, Math.min(index, items.length - 1)), mode,
      opener: opener || document.activeElement };
    galleryDialog.classList.toggle("is-project", mode === "project");
    galleryDialog.classList.toggle("is-map", mode === "map");
    galleryDialog.classList.toggle("is-culture", mode === "culture");
    const headings = {
      project: ["Behind the scenes", project.title, [project.season, project.format, project.location].filter(Boolean).join(" · ")],
      map: ["The places so far", travel.map?.title, `As of ${travel.asOf || ""} · ${travel.qualifier || ""}`],
      culture: [culture.eyebrow || "Clothes & culture", culture.title || "Dressed for the journey.", culture.description || ""],
      travel: ["The photo journal", "Postcards from the road", "A few moments, from a world of places."]
    };
    const [eyebrow, title, subtitle] = headings[mode] || headings.travel;
    setText("#gallery-eyebrow", eyebrow);
    setText("#gallery-title", title);
    setText("#gallery-subtitle", subtitle);
    $("#gallery-subtitle").hidden = !subtitle;
    $("#project-details").hidden = mode !== "project";
    const thumbnails = $("#gallery-thumbnails");
    thumbnails.replaceChildren();
    thumbnails.hidden = mode !== "project";
    if (mode === "project") {
      items.forEach((photo, i) => {
        const button = element("button", "gallery-thumbnail");
        button.type = "button";
        button.setAttribute("aria-label", `Show ${photo.title || `photograph ${i + 1}`}`);
        const img = element("img");
        img.width = 300; img.height = 200; img.loading = "lazy";
        setImage(img, photo.thumbnail || photo.src, "");
        button.append(img, element("span", "", photo.title || `Photograph ${i + 1}`));
        button.addEventListener("click", () => { galleryState.index = i; renderGalleryImage(); });
        thumbnails.append(button);
      });
    }
    renderGalleryImage();
    if (!galleryDialog.open) { lockScroll(); galleryDialog.showModal(); }
    galleryDialog.scrollTop = 0;
    $("#close-gallery").focus({ preventScroll: true });
    if (mode === "project" && syncURL) updateProjectURL(project.id);
    return true;
  }
  $("#close-gallery").addEventListener("click", () => galleryDialog.close());
  galleryDialog.addEventListener("close", () => {
    toast.classList.remove("visible");
    document.body.append(toast);
    unlockScroll();
    if (galleryState.mode === "project") updateProjectURL(null);
    galleryState.opener?.focus?.({ preventScroll: true });
  });
  backdropClose(galleryDialog);
  $("#gallery-prev").addEventListener("click", () => moveGallery(-1));
  $("#gallery-next").addEventListener("click", () => moveGallery(1));
  galleryDialog.addEventListener("keydown", event => {
    if (event.altKey || event.ctrlKey || event.metaKey || /INPUT|TEXTAREA|SELECT/.test(event.target.tagName)) return;
    if (event.key === "ArrowLeft") { event.preventDefault(); moveGallery(-1); }
    if (event.key === "ArrowRight") { event.preventDefault(); moveGallery(1); }
  });
  let touchStart = null;
  $("#gallery-stage").addEventListener("touchstart", event => {
    touchStart = event.touches.length === 1 ? { x: event.touches[0].clientX, y: event.touches[0].clientY } : null;
  }, { passive: true });
  $("#gallery-stage").addEventListener("touchend", event => {
    if (!touchStart || !event.changedTouches.length) return;
    const dx = event.changedTouches[0].clientX - touchStart.x;
    const dy = event.changedTouches[0].clientY - touchStart.y;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.7) moveGallery(dx < 0 ? 1 : -1);
    touchStart = null;
  }, { passive: true });
  $("#gallery-stage").addEventListener("touchcancel", () => { touchStart = null; }, { passive: true });

  // Render the editable timeline. Unspecified historical dates are not invented.
  if (Array.isArray(config.story?.timeline)) {
    const list = $("#story-timeline");
    list.replaceChildren();
    config.story.timeline.forEach(item => {
      const li = element("li", "timeline-item");
      const dot = element("span", "timeline-dot"); dot.setAttribute("aria-hidden", "true");
      const meta = element("div", "timeline-meta");
      meta.append(element("span", "", item.when), element("span", "", item.place));
      li.append(dot, meta, element("h3", "", item.title), element("p", "", item.text));
      list.append(li);
    });
  }
  setText("#travel-count", travel.count);
  setText("#travel-unit", travel.unit);
  setText("#travel-qualifier", travel.qualifier);
  setText("#travel-date", `As of ${travel.asOf || ""}`);
  setText("#latest-stops-date", travel.latestDate);
  const latest = $("#latest-stops-list"); latest.replaceChildren();
  (Array.isArray(travel.latest) ? travel.latest : []).forEach(place => latest.append(element("span", "", place)));
  $(".latest-stops").hidden = latest.childElementCount === 0;
  const map = travel.map;
  if (map && imageURL(map.src)) {
    setImage($("#travel-map"), map.src, map.alt);
    $("#open-map").href = imageURL(map.src);
    $("#open-map").addEventListener("click", event => {
      if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      if (openGallery([map], 0, "map", event.currentTarget)) event.preventDefault();
    });
    if (webURL(map.creditUrl)) $("#map-credit-link").href = webURL(map.creditUrl);
    setText("#map-credit-link", `${map.credit || "Map source"} ↗`);
  } else $(".world-map-card").hidden = true;
  if (instagram) {
    $("#travel-instagram").href = instagram;
  } else $("#travel-instagram").hidden = true;

  function makeCultureCard(photo, index) {
    const title = photo.title || `Photograph ${index + 1}`;
    const figure = element("figure", `culture-card${photo.wide ? " culture-card-wide" : ""}`);
    const link = outgoingLink(imageURL(photo.src), undefined, "culture-open");
    link.setAttribute("aria-haspopup", "dialog");
    link.setAttribute("aria-controls", "gallery-dialog");
    link.setAttribute("aria-label", `View ${[title, photo.location].filter(Boolean).join(" · ")} (${index + 1} of ${culturePhotos.length})`);
    const frame = element("span", "culture-image image-frame");
    const number = String(index + 1).padStart(2, "0");
    const placeholder = element("span", "image-placeholder", number);
    placeholder.setAttribute("aria-hidden", "true");
    const img = element("img");
    img.width = Number(photo.width) || 800; img.height = Number(photo.height) || 1000;
    img.loading = "lazy"; img.decoding = "async";
    setImage(img, photo.src, photo.alt || title);
    const expand = element("span", "photo-expand", "↗");
    expand.setAttribute("aria-hidden", "true");
    frame.append(placeholder, img, expand);
    const caption = element("span", "culture-caption");
    const indexLabel = element("span", "culture-index", number);
    indexLabel.setAttribute("aria-hidden", "true");
    caption.append(indexLabel, element("strong", "", title));
    link.append(frame, caption);
    link.addEventListener("click", event => {
      if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      if (openGallery(culturePhotos, index, "culture", link)) event.preventDefault();
    });
    figure.append(link);
    const details = element("figcaption", "culture-details");
    if (photo.location) details.append(element("p", "culture-location", photo.location));
    if (photo.caption) details.append(element("p", "culture-description", photo.caption));
    const credits = element("div", "photo-credits");
    if (renderPhotoCredits(credits, photo, "culture")) details.append(credits);
    if (details.hasChildNodes()) figure.append(details);
    return figure;
  }
  const cultureGrid = $("#culture-photos");
  if (cultureGrid && culturePhotos.length) {
    setText("#culture-eyebrow", culture.eyebrow || "Clothes & culture");
    setText("#culture-title", culture.title || "Dressed for the journey.");
    setText("#culture-description", culture.description || "");
    $("#culture-description").hidden = !culture.description;
    cultureGrid.replaceChildren(...culturePhotos.map(makeCultureCard));
  }

  function makePostcard(photo, index) {
    const figure = element("figure", `postcard${photo.wide ? " postcard-wide" : ""}${photo.square ? " postcard-square" : ""}`);
    const link = outgoingLink(imageURL(photo.src), undefined, "postcard-open");
    link.setAttribute("aria-haspopup", "dialog");
    link.setAttribute("aria-controls", "gallery-dialog");
    link.setAttribute("aria-label", `View ${photo.title} photograph and details`);
    const frame = element("span", "postcard-image image-frame");
    const placeholder = element("span", "image-placeholder", (photo.title || "Travel").split(",")[0]);
    placeholder.setAttribute("aria-hidden", "true");
    const img = element("img");
    img.width = Number(photo.width) || 800; img.height = Number(photo.height) || 1000;
    img.loading = "lazy"; img.decoding = "async";
    setImage(img, photo.src, photo.alt || photo.title);
    const expand = element("span", "photo-expand", "↗"); expand.setAttribute("aria-hidden", "true");
    frame.append(placeholder, img, expand);
    const caption = element("span", "postcard-caption");
    caption.append(element("strong", "", photo.title), element("span", "", photo.date));
    link.append(frame, caption);
    link.addEventListener("click", event => {
      if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      if (openGallery(travelPhotos, index, "travel", link)) event.preventDefault();
    });
    figure.append(link);
    const credits = element("figcaption", "photo-credits");
    if (renderPhotoCredits(credits, photo, "travel")) figure.append(credits);
    return figure;
  }
  // A finite, honest collection with infinite-scroll-style progressive loading.
  // Adding more travel.photos makes the feed longer; nothing is repeated.
  function addTravelBatch(size, announce = true) {
    const count = Math.max(1, Math.min(Number(size) || 3, 100));
    const end = Math.min(travelPhotos.length, travelRendered + count);
    const fragment = document.createDocumentFragment();
    for (let i = travelRendered; i < end; i++) fragment.append(makePostcard(travelPhotos[i], i));
    $("#travel-photos").append(fragment);
    const added = end - travelRendered;
    travelRendered = end;
    const more = travelRendered < travelPhotos.length;
    $("#travel-sentinel").hidden = !more;
    if (announce) setText("#travel-load-status", `${added} more photographs loaded. ${travelRendered} of ${travelPhotos.length} shown.`);
    if (!more) travelObserver?.disconnect();
    scheduleReadingUpdate();
  }
  $("#travel-photos").replaceChildren();
  $("#load-more-photos").addEventListener("click", () => {
    const firstNew = travelRendered;
    addTravelBatch(travel.batchSize);
    // Keep keyboard users in the collection after the load-more button disappears.
    const nextLink = $("#travel-photos").children[firstNew]?.querySelector("a");
    nextLink?.focus({ preventScroll: true });
  });
  addTravelBatch(travel.initialPhotos || 5, false);
  if ("IntersectionObserver" in window && travelRendered < travelPhotos.length) {
    travelObserver = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting) && !document.body.classList.contains("modal-open")) addTravelBatch(travel.batchSize);
    }, { rootMargin: "280px 0px" });
    travelObserver.observe($("#travel-sentinel"));
  }

  // The new series feature is one cover on the page, not a wall of photographs.
  const projectCard = $("#project-card");
  if (projectPhotos.length) {
    const cover = projectPhotos[0];
    setImage($("#project-cover"), cover.thumbnail || cover.src, cover.alt);
    $("#project-cover").width = Number(cover.width) || 1429;
    $("#project-cover").height = Number(cover.height) || 1056;
    projectCard.href = imageURL(cover.src);
    projectCard.setAttribute("aria-label", `Explore ${project.title} ${project.season}: details and ${projectPhotos.length} photographs`);
    projectCard.addEventListener("click", event => {
      if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      if (openGallery(projectPhotos, 0, "project", projectCard)) event.preventDefault();
    });
    setText("#project-photo-count", `${projectPhotos.length} photos`);
    setText("#project-card-title", project.title);
    setText("#project-season", project.season);
    setText("#project-status", `${project.status || "Upcoming"} series`);
    setText("#project-format", [project.format, project.location].filter(Boolean).join(" · "));
    setText("#project-tagline", project.tagline);
    setText("#project-role", project.role);
    setText("#project-release-note", project.releaseNote);
    setText("#project-details-title", [project.title, project.season].filter(Boolean).join(" · "));
    setText("#detail-status", project.status);
    setText("#project-description", project.description);
    setText("#project-personal-note", project.personalNote);
    setText("#detail-role", project.role);
    setText("#detail-format", project.format);
    setText("#detail-release", project.releaseNote);
    for (const [selector, value] of [["#project-trailer", project.trailerUrl], ["#project-watch", project.watchUrl], ["#project-updates", project.updatesUrl]]) {
      const url = webURL(value);
      $(selector).hidden = !url;
      if (url) $(selector).href = url;
    }
  } else $("#screen").hidden = true;
  $("#copy-project").addEventListener("click", () => {
    const base = publicShareURL();
    if (!base) { notify("Publish this page first to share its public link."); return; }
    const url = new URL(base);
    url.searchParams.set("project", project.id);
    url.hash = "screen";
    void copyLink(url.href);
  });
  const contact = config.contact || {};
  if (contact.title) setText("#closing-title", contact.title);
  if (contact.subtitle) setText("#closing-subtitle", contact.subtitle);
  const contactEmail = contact.email || profile.email;
  if (typeof contactEmail === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) {
    $("#closing-email").href = `mailto:${encodeURIComponent(contactEmail).replace(/%40/g, "@")}`;
  } else $("#closing-email").hidden = true;

  // Scrolling remains completely native: no scroll hijacking or fullscreen panels.
  // A thin progress line and a current-chapter indicator provide orientation.
  function updateReading() {
    if (document.body.classList.contains("modal-open") || document.body.classList.contains("consent-open")) return;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const progress = max > 0 ? Math.max(0, Math.min(1, window.scrollY / max)) : 0;
    $("#reading-progress").style.transform = `scaleX(${progress})`;
    let current = "home";
    const scrollPadding = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0;
    const threshold = Math.max($(".masthead").getBoundingClientRect().bottom, scrollPadding) + 32;
    for (const id of ["home", "story", "world", "culture", "postcards", "body-positive"]) {
      const node = document.getElementById(id);
      if (node && !node.hidden && node.getBoundingClientRect().top <= threshold) current = id;
    }
    if (max > 0 && max - window.scrollY <= 1) current = "body-positive";
    for (const link of document.querySelectorAll(".chapter-nav a")) {
      const active = link.hash === `#${current}`;
      link.classList.toggle("is-active", active);
      if (active) link.setAttribute("aria-current", "location");
      else link.removeAttribute("aria-current");
    }
  }
  function scheduleReadingUpdate() {
    // Function property avoids temporal-dead-zone issues during initial rendering.
    if (scheduleReadingUpdate.pending) return;
    scheduleReadingUpdate.pending = true;
    requestAnimationFrame(() => { scheduleReadingUpdate.pending = false; updateReading(); });
  }
  window.addEventListener("scroll", scheduleReadingUpdate, { passive: true });
  window.addEventListener("resize", scheduleReadingUpdate, { passive: true });
  if ("ResizeObserver" in window) new ResizeObserver(scheduleReadingUpdate).observe(document.body);
  scheduleReadingUpdate();

  function openSharedContent() {
    const id = new URL(location.href).searchParams.get("project");
    if (id && id === project.id && projectPhotos.length) {
      if (musicDialog.open) musicDialog.close();
      if (!galleryDialog.open || galleryState.mode !== "project") openGallery(projectPhotos, 0, "project", projectCard, false);
    } else {
      if (galleryDialog.open && galleryState.mode === "project") galleryDialog.close();
      openSharedSong();
    }
  }
  window.addEventListener("popstate", openSharedContent);
  openSharedContent();

})();
