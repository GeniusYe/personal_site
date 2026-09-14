/* Body-positive media renderer. Requested only after explicit viewing consent. */
(() => {
  'use strict';
  const config = window.JIAJIE_BODY_PHOTOS;
  if (!config || !Array.isArray(config.photos)) throw new Error('Gallery configuration is unavailable.');
  const $ = id => document.getElementById(id);
  const groups = Array.isArray(config.groups) ? config.groups : [];
  const approved = () => document.body.dataset.galleryApproved === 'true';
  const validURL = (value, local = false) => {
    if (typeof value !== 'string' || !value.trim()) return null;
    try {
      const url = new URL(value, location.href);
      return ['https:', 'http:', ...(local ? ['file:'] : [])].includes(url.protocol) ? url.href : null;
    } catch { return null; }
  };
  const photos = config.photos.filter(p => p && validURL(p.src, true));
  const isVideo = photo => photo.type === 'video';
  const dialog = $('body-photo-dialog');
  const image = $('body-lightbox-image');
  const video = $('body-lightbox-video');
  let rendered = false;
  let selected = 0;
  let opener = null;
  let savedY = 0;
  function el(tag, cls = '', text) {
    const node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text !== undefined) node.textContent = text;
    return node;
  }
  function photoGroup(photo) { return groups.find(g => g.id === photo.group) || {}; }
  function clearMedia() {
    image.hidden = true;
    image.removeAttribute('src');
    video.pause();
    video.hidden = true;
    const hadSource = video.hasAttribute('src');
    video.removeAttribute('src');
    video.removeAttribute('poster');
    // Reset the resource selection and stop any in-flight video download.
    if (hadSource) video.load();
  }
  function renderLightbox() {
    if (!approved() || !photos.length) return;
    const photo = photos[selected];
    const group = photoGroup(photo);
    clearMedia();
    $('body-lightbox-error').hidden = true;
    $('body-lightbox-error').textContent = `This ${isVideo(photo) ? 'video' : 'photograph'} couldn’t load. Please try again later.`;
    if (isVideo(photo)) {
      video.hidden = false;
      video.setAttribute('aria-label', photo.alt || photo.title || 'Body-positive video');
      const poster = validURL(photo.poster, true);
      if (poster) video.poster = poster;
      video.src = validURL(photo.src, true);
    } else {
      image.hidden = false;
      image.alt = photo.alt || 'Body-positive photograph';
      image.src = validURL(photo.src, true);
    }
    $('body-lightbox-title').textContent = group.title || photo.title;
    $('body-lightbox-date').textContent = group.date || '';
    $('body-lightbox-count').textContent = `${selected + 1} / ${photos.length}${isVideo(photo) ? ' · Video' : ''}`;
    const credit = $('body-lightbox-credit');
    credit.hidden = !group.credit;
    credit.textContent = group.credit ? `${isVideo(photo) ? 'Video' : 'Photo'}: @${group.credit}` : '';
    const url = validURL(group.creditUrl);
    if (url) credit.href = url;
    else credit.removeAttribute('href');
  }
  function openPhoto(index, source) {
    if (!approved()) return;
    // Very old browsers get the full media only after the gallery-level consent.
    if (typeof dialog.showModal !== 'function') {
      window.open(validURL(photos[index].src, true), '_blank', 'noopener,noreferrer');
      return;
    }
    selected = index;
    opener = source;
    renderLightbox();
    savedY = window.scrollY;
    document.body.style.setProperty('--scroll-offset', `${-savedY}px`);
    document.body.classList.add('modal-open');
    dialog.showModal();
    $('body-lightbox-close').focus({ preventScroll: true });
  }
  function move(offset) {
    if (!approved() || !dialog.open || !photos.length) return;
    selected = (selected + offset + photos.length) % photos.length;
    renderLightbox();
  }
  function makePhoto(photo, index) {
    const figure = el('figure', 'body-portrait');
    const button = el('button', 'body-portrait-button');
    button.type = 'button';
    button.setAttribute('aria-haspopup', 'dialog');
    button.setAttribute('aria-controls', 'body-photo-dialog');
    button.setAttribute('aria-label', `${isVideo(photo) ? 'Play video' : 'Open photograph'}: ${photo.title || photo.alt || 'Body Positive'}`);
    const img = el('img');
    img.width = photo.width || 667;
    img.height = photo.height || 1000;
    img.alt = photo.alt || (isVideo(photo) ? 'Body-positive video preview' : 'Body-positive photograph');
    img.loading = 'lazy';
    img.decoding = 'async';
    const error = el('span', 'body-photo-error', isVideo(photo) ? 'This video preview couldn’t load. Select to open the video.' : 'This photograph couldn’t load. Please try again later.');
    error.hidden = true;
    img.addEventListener('error', () => { img.classList.add('image-failed'); error.hidden = false; });
    img.addEventListener('load', () => {
      img.classList.remove('image-failed'); error.hidden = true;
      // Natural proportions; no cropping or changes to the original image.
      img.width = img.naturalWidth; img.height = img.naturalHeight;
    });
    const preview = validURL(isVideo(photo) ? photo.poster : photo.src, true);
    if (preview) img.src = preview;
    else error.hidden = false;
    const expand = el('span', isVideo(photo) ? 'body-video-play' : 'photo-expand', isVideo(photo) ? '▶ Play video' : '↗'); expand.setAttribute('aria-hidden', 'true');
    button.append(img, error, expand);
    button.addEventListener('click', () => openPhoto(index, button));
    figure.append(button, el('figcaption', '', `${String(index + 1).padStart(2,'0')} / ${String(photos.length).padStart(2,'0')}${isVideo(photo) ? ' · Video' : ''}`));
    return figure;
  }
  function render() {
    if (!approved() || rendered) return;
    const host = $('body-photo-groups');
    const nav = $('body-shoot-nav');
    host.replaceChildren(); nav.replaceChildren();
    $('body-gallery-intro-copy').textContent = config.intro || '';
    const videos = photos.filter(isVideo).length;
    const photographs = photos.length - videos;
    const totals = [];
    if (photographs) totals.push(`${photographs} photograph${photographs === 1 ? '' : 's'}`);
    if (videos) totals.push(`${videos} video${videos === 1 ? '' : 's'}`);
    $('body-photo-count').textContent = `${totals.join(' · ')} · A personal collection`;
    $('body-year').textContent = String(new Date().getFullYear());
    groups.forEach((group, groupIndex) => {
      const items = photos.map((p,i) => ({p,i})).filter(({p}) => p.group === group.id);
      if (!items.length) return;
      const section = el('section', 'body-shoot');
      // Configured ids are never inserted as HTML.
      section.id = `shoot-${groupIndex}`;
      const header = el('header', 'body-shoot-header');
      header.append(el('h2', '', group.title || 'Collection'));
      const caption = el('p', '', group.date || '');
      if (group.credit) {
        if (group.date) caption.append(el('br'));
        const hasVideos = items.some(({p}) => isVideo(p));
        const hasPhotos = items.some(({p}) => !isVideo(p));
        caption.append(document.createTextNode(hasVideos ? (hasPhotos ? 'Photos and video by ' : 'Video by ') : 'Photography by '));
        const url = validURL(group.creditUrl);
        const credit = el(url ? 'a' : 'span', '', `@${group.credit}`);
        if (url) { credit.href = url; credit.target = '_blank'; credit.rel = 'noopener noreferrer'; }
        caption.append(credit);
      }
      header.append(caption);
      const grid = el('div', `body-photo-grid${items.length === 1 ? ' has-one' : ''}`);
      items.forEach(({p,i}) => grid.append(makePhoto(p,i)));
      section.append(header,grid); host.append(section);
      if (groupIndex !== 0) {
        const link = el('a', '', (group.title || 'Session').replace(/\.$/,''));
        link.href = `#${section.id}`; nav.append(link);
      }
    });
    rendered = true;
    $('body-collection').hidden = false;
    $('body-gallery-title').focus({preventScroll:true});
  }
  $('body-lightbox-close').addEventListener('click', () => dialog.close());
  $('body-lightbox-prev').addEventListener('click', () => move(-1));
  $('body-lightbox-next').addEventListener('click', () => move(1));
  image.addEventListener('error', () => { if (!image.hidden && image.hasAttribute('src')) $('body-lightbox-error').hidden = false; });
  image.addEventListener('load', () => { if (!image.hidden) $('body-lightbox-error').hidden = true; });
  video.addEventListener('error', () => { if (!video.hidden && video.hasAttribute('src')) $('body-lightbox-error').hidden = false; });
  video.addEventListener('loadeddata', () => { if (!video.hidden) $('body-lightbox-error').hidden = true; });
  dialog.addEventListener('close', () => {
    clearMedia();
    document.body.classList.remove('modal-open');
    document.body.style.removeProperty('--scroll-offset');
    const root = document.documentElement, old = root.style.scrollBehavior;
    root.style.scrollBehavior = 'auto'; window.scrollTo(0,savedY); root.style.scrollBehavior = old;
    if (approved()) opener?.focus?.({preventScroll:true});
  });
  dialog.addEventListener('keydown', e => {
    // Preserve seeking, volume, and fullscreen keys for native video controls.
    if (e.defaultPrevented || e.target === video || e.composedPath().includes(video)) return;
    if (e.key === 'Escape') { e.preventDefault(); dialog.close(); return; }
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    if (e.key === 'ArrowLeft') { e.preventDefault(); move(-1); }
    if (e.key === 'ArrowRight') { e.preventDefault(); move(1); }
  });
  let beganOutside = false;
  const outside = e => {
    const r = dialog.getBoundingClientRect();
    return e.target === dialog && (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom);
  };
  dialog.addEventListener('pointerdown', e => { beganOutside = outside(e); });
  dialog.addEventListener('click', e => { if (beganOutside && outside(e)) dialog.close(); beganOutside = false; });
  let touch = null;
  $('body-lightbox-stage').addEventListener('touchstart', e => { touch = video.hidden && e.touches.length === 1 ? [e.touches[0].clientX,e.touches[0].clientY] : null; }, {passive:true});
  $('body-lightbox-stage').addEventListener('touchend', e => {
    if (!video.hidden || !touch || !e.changedTouches.length) { touch = null; return; }
    const dx=e.changedTouches[0].clientX-touch[0], dy=e.changedTouches[0].clientY-touch[1];
    if (Math.abs(dx)>60 && Math.abs(dx)>Math.abs(dy)*1.7) move(dx<0?1:-1);
    touch=null;
  },{passive:true});
  $('body-lightbox-stage').addEventListener('touchcancel',()=>{touch=null;},{passive:true});
  window.addEventListener('body-gallery-approved',render);
  window.addEventListener('body-gallery-hidden',()=>{
    if(dialog.open) dialog.close();
    clearMedia();
    $('body-photo-groups').replaceChildren();
    $('body-collection').hidden=true;
    rendered=false;
  });
  render();
})();
