// Finds candidate YouTube flip-through videos for each book, for YOU to pick from. Run by hand, needs a free
// YouTube Data API key (Google Cloud console -> enable "YouTube Data API v3" -> create an API key).
//   YOUTUBE_API_KEY=xxxx node scripts/find-videos.mjs [bookId ...]
// Writes data/video-candidates.json (top 4 per book, with title + channel + link). Watch them, then put the
// winner in data/videos.json as { "<bookId>": "<videoId>" }. Nothing is chosen automatically: a wrong video
// on a product page is worse than none. Search costs 100 quota units; the free daily quota (10,000) covers ~100 books.
import { readFileSync, writeFileSync } from "node:fs";

const key = process.env.YOUTUBE_API_KEY;
if (!key) {
  console.error("Set YOUTUBE_API_KEY first.");
  process.exit(1);
}
const books = JSON.parse(readFileSync("data/books.json", "utf8"));
const overrides = JSON.parse(readFileSync("data/overrides.json", "utf8"));
const only = new Set(process.argv.slice(2));
const out = {};

for (const raw of books) {
  if (only.size && !only.has(raw.id)) continue;
  const o = overrides[raw.id] || {};
  const title = (o.title || raw.title || "").trim();
  const author = (o.author || raw.author || "").split(/,\s*illustrated by/i)[0].trim();
  if (!title) continue;
  const q = `${title} ${author} flip through`;
  const url =
    "https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&videoEmbeddable=true&maxResults=4" +
    `&q=${encodeURIComponent(q)}&key=${key}`;
  const res = await fetch(url);
  if (!res.ok) {
    console.error(`${raw.id}: ${res.status} ${(await res.text()).slice(0, 160)}`);
    if (res.status === 403) break; // quota or key problem; stop rather than burn retries
    continue;
  }
  const data = await res.json();
  out[raw.id] = {
    book: title,
    candidates: (data.items || []).map((i) => ({
      videoId: i.id.videoId,
      title: i.snippet.title,
      channel: i.snippet.channelTitle,
      watch: `https://www.youtube.com/watch?v=${i.id.videoId}`,
    })),
  };
  console.log(`${raw.id} ${title.slice(0, 40)}: ${out[raw.id].candidates.length} candidates`);
}
writeFileSync("data/video-candidates.json", JSON.stringify(out, null, 2) + "\n");
console.log("\nWrote data/video-candidates.json. Pick winners into data/videos.json.");
