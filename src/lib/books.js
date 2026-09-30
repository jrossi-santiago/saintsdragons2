import booksJson from "../../data/books.json";
import overridesJson from "../../data/overrides.json";
import { hash } from "./hash.js";

export const FALLBACK_SHELF = "The shelf";

// Display order. Anything not listed here lands under FALLBACK_SHELF.
const SHELF_ORDER = [
  "Start here",
  "Buildings & machines",
  "Ships, cities & bodies",
  "Nature & how it’s made",
  "Search & stare",
  FALLBACK_SHELF,
];

const norm = (s) => String(s ?? "").replace(/[’‘]/g, "'").trim().toLowerCase();
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
    const shelfKey = SHELF_ORDER.find((s) => norm(s) === norm(b.shelf));
    books.push({
      id: b.id,
      title,
      author: (b.author || "").trim(),
      amazonUrl: b.amazonUrl || "",
      shelf: shelfKey || FALLBACK_SHELF,
      oneLiner: (b.oneLiner || "").trim(),
      images: (Array.isArray(b.images) ? b.images : []).filter(Boolean),
      spineColor: /^#[0-9a-f]{6}$/i.test(b.spineColor || "")
        ? b.spineColor
        : fallbackColor(title || b.id),
    });
  }
  return books;
}

export const books = build();

export const shelves = SHELF_ORDER.map((name) => ({
  name,
  books: books.filter((b) => b.shelf === name),
})).filter((s) => s.books.length > 0);
