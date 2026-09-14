/* Explicit viewing consent, not authentication. No photo request is made here.
 * A one-use, short-lived same-tab ticket avoids asking twice during navigation.
 * No permanent acceptance, tracking, or consent-in-a-URL bypass is stored.
 */
(() => {
  'use strict';
  const dialog = document.getElementById('body-consent-dialog');
  if (!dialog) return;
  const onGallery = document.body.dataset.bodyGallery === 'true';
  const entry = document.getElementById('body-positive-link');
  const approve = document.getElementById('consent-approve');
  const cancel = document.getElementById('consent-cancel');
  const ticketKey = 'jiajie-body-gallery-one-use-v1';
  const homeURL = new URL(document.body.dataset.homeUrl || 'index.html#body-positive', location.href);
  let savedY = 0;
  let opener = null;
  let leaving = false;
  let loading = null;
  let controllerReady = false;

  function takeTicket() {
    try {
      const raw = sessionStorage.getItem(ticketKey);
      sessionStorage.removeItem(ticketKey);
      const created = Number(raw);
      return !!raw && Number.isFinite(created) && Date.now() >= created && Date.now() - created < 60000;
    } catch { return false; }
  }
  function unlock() {
    if (!document.body.classList.contains('consent-open')) return;
    document.body.classList.remove('consent-open');
    document.body.style.removeProperty('--consent-scroll-offset');
    const root = document.documentElement;
    const before = root.style.scrollBehavior;
    root.style.scrollBehavior = 'auto';
    window.scrollTo(0, savedY);
    root.style.scrollBehavior = before;
  }
  function hideDialog() {
    if (typeof dialog.close === 'function') dialog.close();
    else { dialog.removeAttribute('open'); unlock(); }
  }
  function showWarning(source) {
    if (dialog.open) return;
    leaving = false;
    approve.disabled = false;
    opener = source || document.activeElement;
    savedY = window.scrollY;
    document.body.style.setProperty('--consent-scroll-offset', `${-savedY}px`);
    document.body.classList.add('consent-open');
    if (typeof dialog.showModal === 'function') dialog.showModal();
    else {
      dialog.setAttribute('open', '');
      dialog.classList.add('consent-fallback');
    }
    dialog.scrollTop = 0;
    cancel.focus({ preventScroll: true });
  }
  function cancelWarning() {
    hideDialog();
    if (onGallery) location.assign(homeURL.href);
  }
  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      const timer = setTimeout(() => { script.remove(); reject(new Error('Gallery script timed out')); }, 15000);
      script.onload = () => { clearTimeout(timer); resolve(); };
      script.onerror = () => { clearTimeout(timer); script.remove(); reject(new Error('Gallery script could not load')); };
      document.head.append(script);
    });
  }
  async function revealGallery() {
    // The photo configuration and renderer are loaded only AFTER consent.
    document.body.dataset.galleryApproved = 'true';
    const loadingNote = document.getElementById('body-gallery-loading');
    loadingNote.hidden = false;
    loadingNote.textContent = 'Opening the collection…';
    const gate = document.getElementById('gallery-safe-entry');
    gate.hidden = true;
    try {
      if (!controllerReady) {
        loading ||= (async () => {
          if (!window.JIAJIE_BODY_PHOTOS) await loadScript('bodypositive-data.js');
          await loadScript('bodypositive.js');
          controllerReady = true;
        })();
        await loading;
      }
      if (document.body.dataset.galleryApproved !== 'true') return;
      window.dispatchEvent(new Event('body-gallery-approved'));
      loadingNote.hidden = true;
    } catch {
      loading = null;
      loadingNote.textContent = 'The gallery could not load. Please check your connection and try again.';
      gate.hidden = false;
      document.body.dataset.galleryApproved = 'false';
    }
  }
  function hideCollection() {
    document.body.dataset.galleryApproved = 'false';
    const collection = document.getElementById('body-collection');
    if (collection) collection.hidden = true;
    window.dispatchEvent(new Event('body-gallery-hidden'));
  }

  dialog.addEventListener('close', () => {
    unlock();
    if (!leaving) opener?.focus?.({ preventScroll: true });
  });
  dialog.addEventListener('cancel', event => { event.preventDefault(); cancelWarning(); });
  document.getElementById('consent-close').addEventListener('click', cancelWarning);
  cancel.addEventListener('click', cancelWarning);
  // Clicking the backdrop cancels; it never implies consent.
  let outsideStart = false;
  const outside = e => {
    const r = dialog.getBoundingClientRect();
    return e.target === dialog && (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom);
  };
  dialog.addEventListener('pointerdown', e => { outsideStart = outside(e); });
  dialog.addEventListener('click', e => {
    if (outsideStart && outside(e)) cancelWarning();
    outsideStart = false;
  });
  // Focus containment for the old-browser dialog fallback.
  dialog.addEventListener('keydown', e => {
    if (e.key === 'Escape') { e.preventDefault(); cancelWarning(); return; }
    if (!dialog.classList.contains('consent-fallback')) return;
    if (e.key !== 'Tab') return;
    const buttons = [...dialog.querySelectorAll('button:not([disabled])')];
    if (e.shiftKey && document.activeElement === buttons[0]) { e.preventDefault(); buttons.at(-1)?.focus(); }
    else if (!e.shiftKey && document.activeElement === buttons.at(-1)) { e.preventDefault(); buttons[0]?.focus(); }
  });
  approve.addEventListener('click', () => {
    approve.disabled = true;
    leaving = true;
    if (onGallery) {
      hideDialog();
      void revealGallery();
      return;
    }
    const target = new URL(entry?.getAttribute('href') || 'bodypositive.html', location.href);
    // Keep this gateway local; never redirect to an unverified external site.
    if (target.origin !== location.origin || !['https:', 'http:', 'file:'].includes(target.protocol)) {
      approve.disabled = false;
      leaving = false;
      return;
    }
    try { sessionStorage.setItem(ticketKey, String(Date.now())); }
    catch { /* Fail closed: the gallery will ask again if storage is blocked. */ }
    hideDialog();
    location.assign(target.href);
  });
  if (entry) entry.addEventListener('click', event => {
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    showWarning(entry);
  });
  if (onGallery) {
    cancel.textContent = 'Back to the main page';
    document.getElementById('consent-privacy').textContent = 'No photographs or videos load until you choose to continue.';
    document.getElementById('gallery-read-warning').addEventListener('click', e => showWarning(e.currentTarget));
    if (takeTicket()) void revealGallery();
    else showWarning(document.getElementById('gallery-read-warning'));
    window.addEventListener('pagehide', () => { hideCollection(); });
    window.addEventListener('pageshow', event => {
      if (event.persisted) {
        hideCollection();
        document.getElementById('gallery-safe-entry').hidden = false;
        showWarning(document.getElementById('gallery-read-warning'));
      }
    });
  }
})();
