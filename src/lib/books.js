import booksJson from "../../data/books.json";
import overridesJson from "../../data/overrides.json";
import previewsJson from "../../data/previews.json";
import pagesJson from "../../data/pages.json";
import videosJson from "../../data/videos.json";
import { hash } from "./hash.js";

export const FALLBACK_COLLECTION = "Also on the shelf";

// Collections are derived from the data, never invented: an explicit `collection` field wins,
// then the Wimmelbook series, then the illustrator ("... illustrated by X"), then the lead author.
function collectionOf(b) {
  if (typeof b.collection === "string" && b.collection.trim()) return b.collection.trim();
  if (/^my (big|little) wimmelbook/i.test(b.title)) return "Wimmelbooks";
  const author = (b.author || "").trim();
  const illus = author.match(/illustrated by\s+(.+)$/i);
  if (illus) return illus[1].trim();
  return author.split(/\s+and\s+|,\s*/)[0] || FALLBACK_COLLECTION;
}

const isBlank = (v) =>
  v == null || (typeof v === "string" && v.trim() === "") || (Array.isArray(v) && v.length === 0);

// An override only wins when it actually says something. Blank values and
// "_note" keys are review scaffolding, not data.
function usable(patch) {
  const out = {};
  for (const [k, v] of Object.entries(patch || {})) {
    if (k.startsWith("_") || isBlank(v)) continue;
    out[k] = v;
  }
  return out;
}

function fallbackColor(seed) {
  const h = hash(seed);
  const hue = h % 360;
  const sat = 35 + ((h >>> 9) % 20);
  const light = 28 + ((h >>> 17) % 10);
  const a = (sat / 100) * Math.min(light / 100, 1 - light / 100);
  const f = (n) => {
    const k = (n + hue / 30) % 12;
    const c = light / 100 - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
    return Math.round(255 * c).toString(16).padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

function build() {
  // books.json mapped by id, then each override key Object.assign'd onto its book.
  const byId = new Map();
  for (const b of booksJson) byId.set(b.id, { ...b });
  for (const [id, patch] of Object.entries(overridesJson)) {
    const book = byId.get(id);
    if (book) Object.assign(book, usable(patch)); // unknown ids are ignored, never invented
  }

  const books = [];
  for (const b of byId.values()) {
    const title = (b.title || "").trim();
    // No title, no spine. These stay in data/ until overrides.json names them.
    if (!title) continue;
    books.push({
      id: b.id,
      title,
      author: (b.author || "").trim(),
      amazonUrl: b.amazonUrl || "",
      collection: collectionOf({ ...b, title }),
      oneLiner: (b.oneLiner || "").trim(),
      images: (Array.isArray(b.images) ? b.images : []).filter(Boolean),
      // Your own page photos (npm run pages), shown after the cover in the modal.
      pages: (Array.isArray(b.pages) ? b.pages : pagesJson[b.id] || []).map((u) =>
        /^(https?:)?\/\//.test(u) ? u : import.meta.env.BASE_URL + u.replace(/^\//, "")
      ),
      // YouTube flip-through video id (data/videos.json: { "<bookId>": "<videoId>" }).
      videoId: (b.videoId || videosJson[b.id] || "").trim(),
      // Google Books volume id with an embeddable preview (data/previews.json; override with `previewId`).
      previewId: (b.previewId || previewsJson[b.id]?.volumeId || "").trim(),
      spineColor: /^#[0-9a-f]{6}$/i.test(b.spineColor || "")
        ? b.spineColor
        : fallbackColor(title || b.id),
    });
  }
  return books;
}

export const books = build();

// One shelf, sectioned by collection. Biggest first; one-book collections share a closing row.
function group() {
  const map = new Map();
  for (const b of books) {
    if (!map.has(b.collection)) map.set(b.collection, []);
    map.get(b.collection).push(b);
  }
  const rest = [];
  const out = [];
  for (const [name, list] of map) {
    if (list.length < 2 || name === FALLBACK_COLLECTION) rest.push(...list);
    else out.push({ name, books: list });
  }
  out.sort((x, y) => y.books.length - x.books.length || x.name.localeCompare(y.name));
  if (rest.length) out.push({ name: FALLBACK_COLLECTION, books: rest });
  return out;
}

export const collections = group();
