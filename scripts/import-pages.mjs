// Turns your own page photos into site-ready images.
//   1. Put photos in photos/<bookId>/ (any names; sorted by filename): photos/0395329205/1.jpg, 2.jpg ...
//   2. npm run pages
// Resizes to 1600px max, writes public/pages/<bookId>/N.webp and data/pages.json. Re-running rebuilds each
// folder it finds. The modal shows these after the cover, with arrows, swipe and keyboard.
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";

const SRC = "photos";
const OUT = "public/pages";
const INDEX = "data/pages.json";
const ids = new Set(JSON.parse(readFileSync("data/books.json", "utf8")).map((b) => b.id));
const index = existsSync(INDEX) ? JSON.parse(readFileSync(INDEX, "utf8")) : {};

if (!existsSync(SRC)) {
  console.log(`No ${SRC}/ folder. Create ${SRC}/<bookId>/ with photos first (book ids are in data/books.json).`);
  process.exit(0);
}

const natural = new Intl.Collator(undefined, { numeric: true }).compare;
let total = 0;
for (const id of readdirSync(SRC, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name)) {
  if (!ids.has(id)) {
    console.warn(`skip ${SRC}/${id}: not an id in data/books.json`);
    continue;
  }
  const files = readdirSync(join(SRC, id)).filter((f) => /\.(jpe?g|png|webp|tiff?|avif)$/i.test(f)).sort(natural);
  if (!files.length) continue;
  rmSync(join(OUT, id), { recursive: true, force: true });
  mkdirSync(join(OUT, id), { recursive: true });
  index[id] = [];
  for (const [i, f] of files.entries()) {
    const name = `${i + 1}.webp`;
    await sharp(join(SRC, id, f))
      .rotate() // honor the phone's EXIF orientation
      .resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 80 })
      .toFile(join(OUT, id, name));
    index[id].push(`pages/${id}/${name}`);
    total++;
  }
  console.log(`${id}: ${files.length} page${files.length === 1 ? "" : "s"}`);
}
writeFileSync(INDEX, JSON.stringify(index, null, 2) + "\n");
console.log(`\n${total} images written. ${Object.keys(index).length} books have pages. Commit public/pages and data/pages.json.`);
