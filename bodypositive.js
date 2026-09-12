/* Body-positive photo renderer. Requested only after explicit viewing consent. */
(() => {
  'use strict';
  const config = window.JIAJIE_BODY_PHOTOS;
  if (!config || !Array.isArray(config.photos)) throw new Error('Photo configuration is unavailable.');
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
  const dialog = $('body-photo-dialog');
  const image = $('body-lightbox-image');
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
  function renderLightbox() {
    if (!approved() || !photos.length) return;
    const photo = photos[selected];
    const group = photoGroup(photo);
    $('body-lightbox-error').hidden = true;
    image.alt = photo.alt || 'Body-positive photograph';
    image.src = validURL(photo.src, true);
    $('body-lightbox-title').textContent = group.title || photo.title;
    $('body-lightbox-date').textContent = group.date || '';
    $('body-lightbox-count').textContent = `${selected + 1} / ${photos.length}`;
    const credit = $('body-lightbox-credit');
    credit.hidden = !group.credit;
    credit.textContent = group.credit ? `Photo: @${group.credit}` : '';
    const url = validURL(group.creditUrl);
    if (url) credit.href = url;
    else credit.removeAttribute('href');
  }
  function openPhoto(index, source) {
    if (!approved()) return;
    // Very old browsers get the full image only after the gallery-level consent.
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
    selected = (selected + offset + photos.length) % photos.length;
    renderLightbox();
  }
  function makePhoto(photo, index) {
    const figure = el('figure', 'body-portrait');
    const button = el('button', 'body-portrait-button');
    button.type = 'button';
    button.setAttribute('aria-haspopup', 'dialog');
    button.setAttribute('aria-controls', 'body-photo-dialog');
    button.setAttribute('aria-label', `Open ${photo.title || 'photograph'}`);
    const img = el('img');
    img.width = photo.width || 667;
    img.height = photo.height || 1000;
    img.alt = photo.alt || 'Body-positive photograph';
    img.loading = 'lazy';
    img.decoding = 'async';
    const error = el('span', 'body-photo-error', 'This photograph couldn’t load. Please try again later.');
    error.hidden = true;
    img.addEventListener('error', () => { img.classList.add('image-failed'); error.hidden = false; });
    img.addEventListener('load', () => {
      img.classList.remove('image-failed'); error.hidden = true;
      // Natural proportions; no cropping or changes to the original photograph.
      img.width = img.naturalWidth; img.height = img.naturalHeight;
    });
    img.src = validURL(photo.src, true);
    const expand = el('span', 'photo-expand', '↗'); expand.setAttribute('aria-hidden', 'true');
    button.append(img, error, expand);
    button.addEventListener('click', () => openPhoto(index, button));
    figure.append(button, el('figcaption', '', `${String(index + 1).padStart(2,'0')} / ${String(photos.length).padStart(2,'0')}`));
    return figure;
  }
  function render() {
    if (!approved() || rendered) return;
    const host = $('body-photo-groups');
    const nav = $('body-shoot-nav');
    host.replaceChildren(); nav.replaceChildren();
    $('body-gallery-intro-copy').textContent = config.intro || '';
    $('body-photo-count').textContent = `${photos.length} photographs · A personal collection`;
    $('body-year').textContent = String(new Date().getFullYear());
    groups.forEach((group, groupIndex) => {
      const items = photos.map((p,i) => ({p,i})).filter(({p}) => p.group === group.id);
      if (!items.length) return;
      const section = el('section', 'body-shoot');
      // Configured ids are never inserted as HTML.
      section.id = `shoot-${groupIndex}`;
      const header = el('header', 'body-shoot-header');
      header.append(el('h2', '', group.title || 'Photographs'));
      const caption = el('p', '', group.date || '');
      if (group.credit) {
        if (group.date) caption.append(el('br'));
        caption.append(document.createTextNode('Photography by '));
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
  image.addEventListener('error', () => { $('body-lightbox-error').hidden = false; });
  image.addEventListener('load', () => { $('body-lightbox-error').hidden = true; });
  dialog.addEventListener('close', () => {
    image.removeAttribute('src');
    document.body.classList.remove('modal-open');
    document.body.style.removeProperty('--scroll-offset');
    const root = document.documentElement, old = root.style.scrollBehavior;
    root.style.scrollBehavior = 'auto'; window.scrollTo(0,savedY); root.style.scrollBehavior = old;
    if (approved()) opener?.focus?.({preventScroll:true});
  });
  dialog.addEventListener('keydown', e => {
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
  $('body-lightbox-stage').addEventListener('touchstart', e => { touch = e.touches.length === 1 ? [e.touches[0].clientX,e.touches[0].clientY] : null; }, {passive:true});
  $('body-lightbox-stage').addEventListener('touchend', e => {
    if (!touch || !e.changedTouches.length) return;
    const dx=e.changedTouches[0].clientX-touch[0], dy=e.changedTouches[0].clientY-touch[1];
    if (Math.abs(dx)>60 && Math.abs(dx)>Math.abs(dy)*1.7) move(dx<0?1:-1);
    touch=null;
  },{passive:true});
  $('body-lightbox-stage').addEventListener('touchcancel',()=>{touch=null;},{passive:true});
  window.addEventListener('body-gallery-approved',render);
  window.addEventListener('body-gallery-hidden',()=>{
    if(dialog.open) dialog.close();
    image.removeAttribute('src');
    $('body-photo-groups').replaceChildren();
    $('body-collection').hidden=true;
    rendered=false;
  });
  render();
})();
