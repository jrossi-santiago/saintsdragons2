# The Get-Lost Shelf

Email gate, then a dark spine-only bookshelf of dense illustrated kids' books. Vite + React, fully static.

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

Missing fields: no `images` gives a typographic cover in the modal; no `spineColor` gives a stable color from
the title hash; unknown or empty `shelf` goes under "The shelf"; empty `oneLiner` is simply omitted.
`amazonUrl` is used exactly as written, affiliate `tag=` params included.

Shelf order is set in `SHELF_ORDER` in `src/lib/books.js`.

## Email: `EMAIL_ENDPOINT`

Copy `.env.example` to `.env` and set `EMAIL_ENDPOINT` to a URL that accepts a JSON POST:
`{ "email": "...", "source": "get-lost-shelf" }`. It must allow CORS from your site. Any 2xx counts as success.
It is read at build time and ends up in the client bundle, so use a write-only form endpoint, not a secret.

If `EMAIL_ENDPOINT` is empty, the email is `console.log`ged and the shelf unlocks anyway, so local preview works.
On a failed POST the visitor sees an error and stays on the landing page.

## The gate is localStorage

- Successful submit sets `localStorage.getLostShelf = "1"` and routes to `/shelf`.
- `/` redirects to `/shelf` if the key exists. `/shelf` and `/print` redirect to `/` if it doesn't.
- This is a lead-magnet gate, not auth. Anyone can set the key in dev tools. To re-test the landing page,
  run `localStorage.removeItem("getLostShelf")`.

## Spines

Width, height, lean (±1.2°) and title size come from a hash of the book `id` (`src/lib/spine.js`), so they're
stable across reloads, and all spine geometry is fixed up front so nothing shifts while images load. Spines
never load images; covers appear only in the modal, and an image that fails or comes back as Amazon's 1×1
placeholder is skipped.
