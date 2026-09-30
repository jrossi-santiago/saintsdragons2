// One-off lookup, run by hand: finds a Google Books edition with an embeddable preview for each book
// in data/books.json and writes data/previews.json. Not part of the build; nothing runs at runtime.
//   node scripts/find-previews.mjs        (Node 22+; behind a proxy: NODE_USE_ENV_PROXY=1)
// Review the output: each entry records the title/authors Google matched so bad matches are easy to spot.
import { readFileSync, writeFileSync } from "node:fs";

const books = JSON.parse(readFileSync("data/books.json", "utf8"));
const overrides = JSON.parse(readFileSync("data/overrides.json", "utf8"));
const norm = (s) => s.toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, " ").trim();
const decode = (s) => s.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'");
const tag = (xml, name) => [...xml.matchAll(new RegExp(`<${name}[^>]*>([^<]*)</${name}>`, "g"))].map((m) => decode(m[1]));

function merged(b) {
  const o = overrides[b.id] || {};
  const pick = (k) => (typeof o[k] === "string" && o[k].trim() ? o[k] : b[k]) || "";
  return { id: b.id, title: pick("title").trim(), author: pick("author").trim() };
}

function parse(xml) {
  return [...xml.matchAll(/<entry>[\s\S]*?<\/entry>/g)].map(([e]) => ({
    id: e.match(/volumes\/([^<]+)<\/id>/)?.[1],
    title: tag(e, "dc:title").join(" "),
    authors: tag(e, "dc:creator"),
    isbns: tag(e, "dc:identifier").filter((x) => x.startsWith("ISBN:")).map((x) => x.slice(5)),
    view: e.match(/viewability value='[^']*#view_(\w+)'/)?.[1],
    embeddable: /embeddability value='[^']*#embeddable'/.test(e),
  }));
}

const isbn13 = (i) => {
  if (!/^\d{9}[\dX]$/.test(i)) return null;
  const core = "978" + i.slice(0, 9);
  const sum = [...core].reduce((s, c, k) => s + +c * (k % 2 ? 3 : 1), 0);
  return core + ((10 - (sum % 10)) % 10);
};

async function search(q) {
  const url = `https://www.google.com/books/feeds/volumes?max-results=20&q=${encodeURIComponent(q)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} for ${q}`);
  await new Promise((r) => setTimeout(r, 400));
  return parse(await res.text());
}

const out = {};
const report = [];
for (const raw of books) {
  const b = merged(raw);
  if (!b.title) continue;
  const illus = b.author.match(/illustrated by\s+(.+)$/i)?.[1];
  const lead = b.author.split(/,\s*illustrated by/i)[0].split(/\s+and\s+/)[0];
  const surnames = [lead, illus].filter(Boolean).map((n) => norm(n).split(" ").pop());
  const strip = (t) => t.replace(/^.{3,40}?['’]s\s+/, (m) => (b.author.toLowerCase().includes(norm(m.replace(/['’]s\s+$/, ""))) ? "" : m));
  const full = norm(strip(b.title));
  const main = norm(strip(b.title.split(/:\s/)[0]));
  // The full title must match. A bare main title only counts when it isn't a series name
  // (every "My Big Wimmelbook: X" shares one).
  const titleOk = (t) => norm(t).includes(full) || (!/wimmelbook/.test(main) && norm(t).includes(main));
  const mine = new Set([b.id, isbn13(b.id)].filter(Boolean));

  let found = [];
  try {
    const qs = [`isbn:${b.id}`, `intitle:"${b.title.split(/:\s/)[0]}" inauthor:${surnames[0]}`, `intitle:"${b.title.split(/:\s/)[0]}"`];
    for (const q of qs) {
      found = (await search(q)).filter(
        (c) =>
          c.embeddable &&
          (c.view === "partial" || c.view === "all_pages") &&
          (c.isbns.some((i) => mine.has(i)) ||
            (titleOk(c.title) && surnames.some((s) => c.authors.some((a) => norm(a).includes(s)))))
      );
      if (found.length) break;
    }
  } catch (e) {
    report.push(`ERROR  ${b.id} ${e.message}`);
    continue;
  }
  const best = found.find((c) => c.isbns.some((i) => mine.has(i))) || found[0];
  if (best) {
    out[b.id] = {
      volumeId: best.id,
      viewability: best.view,
      sameIsbn: best.isbns.some((i) => mine.has(i)),
      matchedTitle: best.title,
      matchedAuthors: best.authors,
    };
    report.push(`PREVIEW ${b.id} ${b.title.slice(0, 40)}  ->  ${best.title.slice(0, 40)} [${best.authors.join(", ")}] ${best.view}${out[b.id].sameIsbn ? "" : " (other edition)"}`);
  } else report.push(`none    ${b.id} ${b.title.slice(0, 40)}`);
}
writeFileSync("data/previews.json", JSON.stringify(out, null, 2) + "\n");
console.log(report.join("\n"));
console.log(`\n${Object.keys(out).length} of ${report.length} books have an embeddable preview -> data/previews.json`);
