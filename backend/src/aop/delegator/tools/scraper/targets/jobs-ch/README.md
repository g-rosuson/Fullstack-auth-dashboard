# jobs.ch scraper

## Overview

jobs.ch is an SPA: search results are loaded from a JSON API, not from static HTML alone. This target uses that API to discover vacancies, then Playwright to scrape each detail page.

```
keywords → semantic search API (paginated) → detail URLs → Playwright detail scrape → listings
```

## Current approach

1. **Discover** — `GET https://job-search-api.jobs.ch/search/semantic?query={keywords}&rows=20&page={N}` via `page.request`, with `Origin` / `Referer` headers matching www.jobs.ch.
2. **Map IDs** — each `documents[].id` becomes `https://www.jobs.ch/en/vacancies/detail/{id}`.
3. **Scrape** — one browser tab visits each detail URL; title, description, and metadata are read from the DOM (`constants/index.ts` selectors).

`maxPages` limits how many API pages to fetch. `0` means fetch until `currentPage >= numPages` or a page returns no documents.

Implementation: [`index.ts`](index.ts). Types: [`types/index.ts`](types/index.ts).

---

## Previous approach (DOM listing pagination)

The scraper loaded listing pages directly:

```
https://www.jobs.ch/en/vacancies/?term={keywords}&page={N}
```

For each page it waited for `[aria-label="Job list"]`, collected `[data-cy="job-link"]` hrefs, and stopped when jobs.ch dropped the `page=` query param from the URL (no more pages in that session).

Detail scraping was identical to today.

---

## Why the previous approach failed

The loop logic was correct for the data it received. The problem was **which data headless received**.

### Manual browser vs headless Playwright

| | Manual browser | Headless Playwright (old) |
| --- | --- | --- |
| Listing source | `/search/semantic` JSON | SSR HTML + `?page=N` navigation |
| Example `?term=react` | ~204 hits, 11 API pages | ~100 hits, ~6 DOM pages |
| `/search/semantic` called? | Yes — drives the job list | **No** |
| Other API traffic | — | `/aggregations` only (filter facets, not listings) |

In a real browser, JavaScript hydrates the search UI and fetches `/search/semantic` with `totalHits`, `numPages`, and `documents`. Pagination follows that API.

In headless Playwright, full `page.goto()` navigations to listing URLs did **not** trigger `/search/semantic`. Observed behaviour:

- **Page 1** — no jobs.ch API calls; ~20 links from SSR HTML embedded in the initial response.
- **Pages 2–6** — only `/aggregations?query=…`; ~20 DOM links per page (page 6 had 1).
- **Page 7** — URL lost `page=` → url-break stop (correct signal for *that* session, but the session only ever had ~6 pages of data).

So the scraper walked every page headless was given (~100 jobs) while the site’s canonical source had ~204.

### Root cause

**Data-source mismatch.** Manual browsing lists jobs via the semantic search API; headless DOM pagination only saw a truncated SSR/partial listing path that never exposed the full catalog.

This was not caused by:

- **Dedupe** — one duplicate across all pages (`setSkipped=1`).
- **URL prefix filtering** — no links dropped (`prefixFiltered=0`).
- **Premature url-break** — six full listing pages before stop on page 7.
- **Caching** — fresh `chromium.launch()` and server restart each run.
- **Misleading UI counts** — manual verification confirmed more than 100 real listings exist.

---

## Why the API approach works

`/search/semantic` is the same endpoint the website uses for full result sets. It returns structured pagination (`numPages`, `totalHits`, `documents`) independent of whether headless renders the listing UI.

- No auth required — standard `Origin` / `Referer` / `Accept: application/json` headers suffice.
- Requests use Playwright `page.request` so listing discovery and detail navigation share one browser context.
- Detail pages still use DOM scraping — only **discovery** moved off listing-page HTML.

---

## File layout

| File | Role |
| --- | --- |
| `index.ts` | API pagination, detail navigation, extraction |
| `constants/index.ts` | API URLs, detail prefix, DOM selectors |
| `types/index.ts` | `SemanticSearchResponse` shape |
| `jobs-ch.test.ts` | Unit tests (API mocked via `page.request.get`) |
