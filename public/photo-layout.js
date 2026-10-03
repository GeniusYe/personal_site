/* Shared by the browser and Node tests; no dependencies. */
((root, factory) => {
  const layout = factory();
  if (typeof module === "object" && module.exports) module.exports = layout;
  else root.JIAJIE_PHOTO_LAYOUT = layout;
})(globalThis, () => {
  "use strict";

  function shuffled(items, random) {
    const result = [...items];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }

  function shuffledPhotoRows(photos, random = Math.random) {
    const wide = shuffled(photos.filter(photo => photo.wide), random);
    const single = shuffled(photos.filter(photo => !photo.wide), random);
    const rows = [];
    while (wide.length && single.length) {
      rows.push(shuffled([wide.pop(), single.pop()], random));
    }
    while (single.length >= 3) rows.push(single.splice(0, 3));
    // Avoid an oversized lone portrait: turn a final 3 + 1 into 2 + 2.
    if (single.length === 1) {
      const donor = rows.find(row => row.length === 3);
      if (donor) single.unshift(donor.pop());
    }
    const remainingWideRows = [];
    while (wide.length) remainingWideRows.push(wide.splice(0, 2));
    return shuffled(rows, random).concat(remainingWideRows, single.length ? [single] : []);
  }

  function photoRowSpans(rows) {
    // Six grid tracks allow thirds, two-thirds, and halves without empty slots.
    return rows.flatMap(row => {
      const total = row.reduce((sum, photo) => sum + (photo.wide ? 2 : 1), 0);
      return row.map(photo => 6 * (photo.wide ? 2 : 1) / total);
    });
  }

  function photoRowEnds(rows) {
    let end = 0;
    return rows.map(row => (end += row.length));
  }

  function photoBatchEnd(rowEnds, rendered, size) {
    const count = Math.max(1, Math.min(Number(size) || 3, 100));
    const total = rowEnds[rowEnds.length - 1] || 0;
    const requestedEnd = Math.min(total, rendered + count);
    return rowEnds.find(rowEnd => rowEnd >= requestedEnd) ?? total;
  }

  return { shuffledPhotoRows, photoRowSpans, photoRowEnds, photoBatchEnd };
});
