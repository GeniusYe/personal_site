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
      // The CSS initials/music-note placeholder remains visible underneath.
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
    window.scrollTo(0, savedScroll);
  }
  function notify(message) {
    clearTimeout(toastTimer);
    const host = shareDialog.open ? shareDialog : musicDialog.open ? musicDialog : document.body;
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
  setText("#profile-handle", profile.handle);
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

  const website = config.website || {};
  const websiteURL = webURL(website.url);
  if (websiteURL) {
    $("#website-link").href = websiteURL;
    setText("#website-title", website.title);
    setText("#website-description", website.description);
    setText("#website-domain", website.label || new URL(websiteURL).hostname);
    setText(".browser-bar span", website.label || new URL(websiteURL).hostname);
    setImage($("#website-image"), website.thumbnail);
  } else $(".website-section").hidden = true;

  const songs = config.songs.filter(song => song && /^[a-z0-9-]+$/.test(song.id) && song.title && song.artist);
  const songList = $("#song-list");
  for (const song of songs) {
    const card = $("#song-card-template").content.firstElementChild.cloneNode(true);
    card.dataset.song = song.id;
    card.setAttribute("aria-label", `Listen to ${song.title} by ${song.artist} — opens music player`);
    setText(".song-title", song.title, card);
    setText(".song-eyebrow", song.eyebrow || "Single", card);
    setText(".song-meta", [song.artist, song.duration].filter(Boolean).join(" · "), card);
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
  window.addEventListener("popstate", openSharedSong);
  openSharedSong();
})();
