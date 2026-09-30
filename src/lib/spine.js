import { hash } from "./hash.js";

// Everything here is derived from the id/title, so a spine looks identical on every load.
const PAD_Y = 20;
const AUTHOR_FS = 10;
const CHAR_EM = 0.58; // average glyph advance in em, rotated serif text
const TITLE_SIZES = [17, 15, 13.5, 12, 11, 10];

function ink(hex) {
  const n = parseInt(hex.slice(1), 16);
  const lum = (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
  return lum > 0.52 ? "#17130d" : "#f1e7d0";
}

const clip = (s, max) => (s.length > max ? s.slice(0, Math.max(1, max - 1)).trimEnd() + "…" : s);

// Shorten what goes on the spine. Full text stays in the tooltip, aria-label and modal.
function spineTitle(title, author) {
  // "Stephen Biesty's Cross-Sections" -> "Cross-Sections" when the author is already on the spine.
  const own = title.match(/^(.{3,40}?)['’]s\s+(.+)$/);
  if (own && author.toLowerCase().includes(own[1].toLowerCase())) title = own[2];
  const [main, ...rest] = title.split(/:\s|\s[—–]\s/);
  // Only drop a subtitle when it is a real subtitle, not "Cross-Sections: Castle".
  return main.length >= 6 && rest.join(" ").length > 14 ? main : title;
}
function spineAuthor(author) {
  return author.split(/,\s*illustrated by/i)[0];
}

export function spineModel(book) {
  const width = 40 + (hash(book.id + "w") % 25); // 40–64
  const height = 220 + (hash(book.id + "h") % 100); // 220–319
  const lean = ((hash(book.id + "l") % 2401) - 1200) / 1000; // -1.2–1.2 deg
  const band = hash(book.id + "b") % 3;

  const inner = height - PAD_Y * 2;
  const author = clip(spineAuthor(book.author), Math.floor(inner / (AUTHOR_FS * CHAR_EM)));
  const authorCol = author ? AUTHOR_FS * 1.25 + 4 : 0;
  const avail = width - 10 - authorCol;

  let title = spineTitle(book.title, book.author);
  let fontSize = TITLE_SIZES[TITLE_SIZES.length - 1];
  for (const fs of TITLE_SIZES) {
    const cols = Math.floor(avail / (fs * 1.2));
    const perCol = Math.floor(inner / (fs * CHAR_EM));
    if (cols >= 1 && Math.ceil((title.length * 1.1) / perCol) <= cols) {
      fontSize = fs;
      break;
    }
  }
  const cols = Math.max(1, Math.floor(avail / (fontSize * 1.2)));
  title = clip(title, Math.floor((inner / (fontSize * CHAR_EM)) * cols * 0.9));

  return {
    width,
    height,
    lean,
    band,
    title,
    author,
    fontSize,
    ink: ink(book.spineColor),
  };
}
