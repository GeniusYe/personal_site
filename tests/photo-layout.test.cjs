const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { shuffledPhotoRows, photoRowSpans, photoRowEnds, photoBatchEnd } = require("../public/photo-layout.js");

function photos(wide, single) {
  return Array.from({ length: wide + single }, (_, id) => ({ id, wide: id < wide }));
}

function seededRandom(seed) {
  return () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 2 ** 32;
  };
}

function assertFullRows(rows) {
  const spans = photoRowSpans(rows);
  let offset = 0;
  for (const row of rows) {
    const rowSpans = spans.slice(offset, offset + row.length);
    assert.equal(rowSpans.reduce((sum, span) => sum + span, 0), 6);
    assert(rowSpans.every(span => Number.isInteger(span) && span >= 1 && span <= 6));
    offset += row.length;
  }
}

test("a landscape and portrait receive two-thirds and one-third of a row", () => {
  const rows = shuffledPhotoRows(photos(1, 1), seededRandom(1));
  assert.equal(rows.length, 1);
  rows[0].forEach((photo, index) => assert.equal(photoRowSpans(rows)[index], photo.wide ? 4 : 2));
});

test("three portraits fill one row", () => {
  const rows = shuffledPhotoRows(photos(0, 3), seededRandom(2));
  assert.deepEqual(photoRowSpans(rows), [2, 2, 2]);
});

test("two remaining portraits fill the final row equally", () => {
  const rows = shuffledPhotoRows(photos(2, 7), seededRandom(3));
  assert.equal(rows.at(-1).length, 2);
  assert(rows.at(-1).every(photo => !photo.wide));
  assert.deepEqual(photoRowSpans([rows.at(-1)]), [3, 3]);
  assertFullRows(rows);
});

test("three plus one remaining portraits become two full pairs", () => {
  const rows = shuffledPhotoRows(photos(2, 6), seededRandom(4));
  const portraitRows = rows.filter(row => row.every(photo => !photo.wide));
  assert.deepEqual(portraitRows.map(row => row.length), [2, 2]);
  portraitRows.forEach(row => assert.deepEqual(photoRowSpans([row]), [3, 3]));
  assertFullRows(rows);
});

test("empty, lone-photo, and excess-landscape collections remain valid", () => {
  assert.deepEqual(shuffledPhotoRows([]), []);
  assert.deepEqual(photoRowSpans([]), []);
  for (const input of [photos(0, 1), photos(1, 0), photos(5, 0), photos(5, 1)]) {
    const rows = shuffledPhotoRows(input, seededRandom(5));
    assert.equal(rows.flat().length, input.length);
    assertFullRows(rows);
  }
});

test("4,200 seeded layouts fill rows and preserve every original photo exactly once", () => {
  for (let wide = 0; wide < 12; wide++) for (let single = 0; single < 35; single++) for (let seed = 0; seed < 10; seed++) {
    const input = photos(wide, single);
    const original = JSON.stringify(input);
    const rows = shuffledPhotoRows(input, seededRandom(seed));
    assert.equal(JSON.stringify(input), original);
    assert.deepEqual(rows.flat().map(photo => photo.id).sort((a, b) => a - b), input.map(photo => photo.id));
    assertFullRows(rows);
    if (single >= wide) for (const row of rows) if (row.some(photo => photo.wide)) {
      assert.equal(row.length, 2);
      assert.equal(row.filter(photo => photo.wide).length, 1);
    }
  }
});

test("real clothing and postcard collections have full rows across repeated shuffles", () => {
  const context = { window: {} };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, "../public/site-config.js"), "utf8"), context);
  for (const collection of [context.window.JIAJIE_SITE.culture, context.window.JIAJIE_SITE.travel]) {
    for (let seed = 0; seed < 50; seed++) {
      const rows = shuffledPhotoRows(collection.photos, seededRandom(seed));
      assertFullRows(rows);
      assert.equal(new Set(rows.flat().map(photo => photo.id)).size, collection.photos.length);
      assert(rows.every(row => row.length >= 2));
    }
  }
});

test("each initial or subsequent batch ends at a complete row", () => {
  for (let seed = 0; seed < 20; seed++) {
    const rows = shuffledPhotoRows(photos(6, 26), seededRandom(seed));
    const ends = photoRowEnds(rows);
    for (const size of [1, 2, 3, 5, 100, 200, 0, -1, undefined, "3"]) {
      let rendered = 0;
      while (rendered < 32) {
        const end = photoBatchEnd(ends, rendered, size);
        assert(ends.includes(end));
        assert(end > rendered && end <= 32);
        rendered = end;
      }
      assert.equal(rendered, 32);
      assert.equal(photoBatchEnd(ends, rendered, size), 32);
    }
  }
  assert.equal(photoBatchEnd([], 0, 5), 0);
});
