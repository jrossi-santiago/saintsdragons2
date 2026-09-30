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

## Covers

Covers sit in rows of 5 (4, 3 or 2 on smaller screens), each row on its own shelf line; scroll down for more. Each
cover box is a fixed 3:4 from first paint so nothing jumps. Images load as you scroll near them. The first
`images[]` entry that loads is the cover (Amazon's 1x1 "no image" placeholder counts as a miss); if none do,
the typographic cover stays. Clicking a cover opens the modal with all images.

The landing page's dim background still uses generated spines (`src/lib/spine.js`).
