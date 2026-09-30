# The Get-Lost Shelf

Email gate, then one dark bookshelf of front covers, sectioned by author/collection. Vite + React, fully static.

```
npm install
npm run dev        # local preview
npm run build      # static site in dist/
```

Routes: `/` (landing + email gate), `/shelf`, `/print`. Anything else redirects to `/`.
Static hosts need an SPA fallback to `index.html`; `public/_redirects` covers Netlify/Cloudflare Pages.

## Books: drop new data in `/data`

| File | Used by the app? |
| --- | --- |
| `data/books.json` | Yes. Source of truth for the shelf. |
| `data/overrides.json` | Yes. Object keyed by book `id`. |
| `data/amazon-urls.txt`, `data/report.md` | No. Archive only. |

Nothing is scraped and nothing is fetched from Amazon at build time. To update the shelf, replace the JSON
files and rebuild. (The browser does load the image URLs in `images[]`, but only inside the modal.)

Merge (`src/lib/books.js`): `books.json` is mapped by `id`, then each key in `overrides.json` is
`Object.assign`ed onto its book. Two deliberate details:

- **Blank override values are ignored**, and so are `_note`-style keys. The shipped `overrides.json` has
  `"oneLiner": ""` and `"spineColor": ""` on several books that have real values in `books.json`; a literal
  assign would wipe them. To let blanks win, remove the `usable()` filter.
- **Books with no title are hidden** (currently `B0B18JKWCL` and `0440840600`). Fill `title` and `author` for
  them in `overrides.json` and they appear. Override ids that aren't in `books.json` are ignored.

Missing fields: no working `images` gives a typographic cover (title + author on `spineColor`); no `spineColor`
gives a stable color from the title hash; empty `oneLiner` is simply omitted. The old `shelf` field is no longer used.
`amazonUrl` is used exactly as written, affiliate `tag=` params included.

### Shelf sections

There is one shelf, sectioned by collection (`src/lib/books.js`). A book's collection is, in order: an explicit
`collection` field (set it in `overrides.json` to move a book), the Wimmelbook series, the illustrator from
"illustrated by X", or the lead author. Biggest collections come first; one-book collections share a closing
"Also on the shelf" row. The print list uses the same sections.

## Email: `EMAIL_ENDPOINT` (Formspree)

The form collects first name and email and POSTs JSON `{ "name", "email", "_gotcha" }` to `EMAIL_ENDPOINT`
(`_gotcha` is Formspree's honeypot field). Any 2xx counts as success.

- `.env.production` (committed) points at the Formspree form, so `npm run build` just works anywhere.
- `npm run dev` does not read it. With no `EMAIL_ENDPOINT`, the name and email are `console.log`ged and the shelf
  unlocks, so local testing never hits Formspree. Copy `.env.example` to `.env` to test against the real form.
- The value is baked into the client bundle at build time. A Formspree endpoint is public by design.

On a failed POST the visitor sees an error and stays on the landing page.

## The gate and "remember me"

- Successful submit sets `localStorage.getLostShelf = "1"` and a 1-year first-party cookie `getLostShelf=1`, then
  routes to `/shelf`. If either one survives, the visitor is let back in (and the other is restored).
- `/` redirects to `/shelf` if unlocked. `/shelf` and `/print` redirect to `/` if not.
- `/?back=1` unlocks and opens the shelf. Put that link in a confirmation email so people can get back in on a new
  device or after clearing their browser.
- This is a lead-magnet gate, not auth. Anyone can set the key in dev tools. To re-test the landing page, clear
  site data or run `localStorage.removeItem("getLostShelf")` and delete the cookie.
- Safari deletes script-set storage and cookies after about 7 days without a visit to the site.

## Showing inside pages

The modal can show three kinds of "inside the book", each a tab that only appears when a book has it. None of
this touches Amazon's Look Inside pages (Amazon's terms and the publishers' copyright both rule that out).

| Source | Coverage today | How |
| --- | --- | --- |
| **Your own page photos** | none yet | `photos/<bookId>/*.jpg`, then `npm run pages` |
| **Google Books preview** | 13 of 60 | `node scripts/find-previews.mjs` |
| **YouTube flip-through video** | none yet | `YOUTUBE_API_KEY=... node scripts/find-videos.mjs`, then pick |

### Your own photos (works for every book)

Snap 3-6 spreads of a book you own, phone camera is fine. Drop them in `photos/<bookId>/` (ids are in
`data/books.json`; `photos/` is gitignored), then run `npm run pages`. It fixes rotation, resizes to 1600px,
writes `public/pages/<bookId>/N.webp` and `data/pages.json`. Commit those two. The modal shows them after the
cover with arrows, swipe and keyboard. Export photos as JPEG or PNG (iPhone HEIC isn't read).

### Google Books preview

Books with an embeddable Google Books preview get a **Flip through it** tab: Google's own page viewer in an
iframe (next/previous, zoom, search), loaded only when tapped, straight from the visitor's browser to Google.
Previews are partial samples with Google's branding.

`data/previews.json` maps book id to a Google Books volume id. Regenerate it by hand when the book list changes:

```
node scripts/find-previews.mjs     # Node 22+; searches Google Books, writes data/previews.json
```

It records what it matched (`matchedTitle`, `matchedAuthors`, `sameIsbn`) so you can eyeball it. Most matches are
a different edition of the same title, which is fine for a sample. Fix a bad entry by hand, or set `previewId`
in `overrides.json`. Covered today: Macaulay's Castle and Cathedral, and 11 My Big Wimmelbook titles. Esc doesn't
close the modal while focus is inside the viewer; the X and a click outside always work.

### YouTube flip-through videos

Flip-through videos exist for most dense illustrated books. `scripts/find-videos.mjs` searches YouTube for each
book and writes the top 4 candidates to `data/video-candidates.json` (title, channel, link). It needs a free
YouTube Data API key and was not run or tested against the live API. You watch and choose; put winners in
`data/videos.json` as `{ "<bookId>": "<videoId>" }`. Videos play in a privacy-enhanced embed
(youtube-nocookie.com).

## Covers

Covers sit in rows of 5 (4, 3 or 2 on smaller screens), each row on its own shelf line; scroll down for more. Each
cover box is a fixed 3:4 from first paint so nothing jumps. Images load as you scroll near them. The first
`images[]` entry that loads is the cover (Amazon's 1x1 "no image" placeholder counts as a miss); if none do,
the typographic cover stays. Clicking a cover opens the modal with all images.

The landing page's dim background still uses generated spines (`src/lib/spine.js`).
