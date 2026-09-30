# Get-Lost Shelf catalog report

## Counts
- total URLs in: 62
- valid ASINs parsed: 62
- unique ASINs out: 62
- dupes dropped: 0
- rows emitted: 62
- rows with empty title (fetch failed): 2

## Source notes
Amazon product pages were blocked or returned no usable og:title. Metadata came from:
- Open Library ISBN records (primary)
- URL slugs on the source file
- Google / publisher confirmations for well-known titles (Macaulay, Scarry, Rothman, Wimmelbooks, Mitgutsch)

No affiliate `tag=` params were present on the source URLs. Clean URLs are `https://www.amazon.com/dp/{ASIN}` only.

Cover images use the Amazon CDN pattern:
`https://images-na.ssl-images-amazon.com/images/P/{ASIN}.01.LZZZZZZZ.jpg`
og:image and hiRes colorImages were not available because Amazon HTML was not readable.

## Titles fetched vs guessed

### Fetched (Open Library or confirmed catalog)
- All Stephen Biesty / Platt / Inside Vehicles ISBNs listed below
- 0553520598 Richard Scarry's What Do People Do All Day?
- Most Ali Mitgutsch German ISBNs that OL returned
- English My Big Wimmelbook ISBNs (The Experiment)
- 0007450168 The Complete Brambly Hedge
- 0395329205 Castle (David Macaulay)
- 0395316685 Cathedral (David Macaulay)
- 0544824385 The Way Things Work: Newly Revised Edition
- 1615195017 My Big Wimmelbook: On the Farm

### Slug + catalog (high confidence, not live Amazon og:title)
- German Mitgutsch titles taken from Amazon slugs and Ravensburger listings:
  - 3473438413 Mein großes Wimmelbuch
  - 3473417904 Auf dem Lande
  - 3473417882 Rundherum in meiner Stadt
  - 3473435996 Unsere große Stadt
  - 3473417874 Hier in den Bergen
  - 3473306959 Bei uns im Dorf
  - 3473433705 Mein großes Winter-Wimmelbuch
  - 3473417890 Komm mit ans Wasser
- Julia Rothman Anatomy Kindle ASINs taken from Amazon slugs (ebook editions of the print Anatomy series)
- Newer Wimmel ASINs from slugs: First 100 Words, Find Your Feelings, Happy Halloween

### Failed — title left blank
| ASIN | Why |
|---|---|
| B0B18JKWCL | Slugless `/dp/` URL. Amazon blocked. No Open Library / Google Books hit. |
| 0440840600 | Slugless `/dp/` URL. Dell-style ISBN. Open Library 404. No reliable public catalog title. Sits in the file next to Macaulay and *The Way Things Work*; do not guess. |

## Edition collisions to check
- 0863188079 (1992 DK Incredible Cross-Sections) and 1465483896 (later reprint) are the same core title.
- 3473306800 and 3473417882 are related Mitgutsch city books (older vs later packaging).
- Anatomy rows are Kindle ASINs (`B0…`). Print ISBNs exist if you want hardcover covers instead.

## Shelf assignment
Fixed set only: Start here / Buildings & machines / Search & stare / Nature & how it’s made / Ships, cities & bodies.

- **Start here** — Scarry, Knight's Book, Brambly Hedge, First 100 Words, plus the two unknown ASINs
- **Buildings & machines** — Biesty vehicles/buildings, Macaulay Castle/Cathedral/Way Things Work, construction/train/fire/digger wimmels
- **Search & stare** — Mitgutsch and most Wimmelbooks
- **Nature & how it’s made** — Rothman Anatomy series, dinosaurs, animals
- **Ships, cities & bodies** — Man-of-War, Rome, Egypt, Ancient World, Body Cross-Sections, explorers

## Spine colors
Inferred from typical cover palettes, not sampled from pixels. Treat as drafts. Empty on the two unknown rows.

## Not invented
No extra books were added. Every row is an ASIN from the source file.
