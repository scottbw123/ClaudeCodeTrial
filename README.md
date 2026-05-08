# GSC Ranking Drop Analyzer

A Next.js app that:

1. Pulls page-level data from your **Google Search Console** property for two
   periods (e.g. last 28 days vs. the prior 28 days).
2. Identifies pages whose **average position has dropped**, ranked by impact
   (`previous impressions × position delta`).
3. For any declining page, runs a **DataForSEO SERP lookup** on the page's
   top query, scrapes the competitors ranking above you, and asks **Claude**
   to identify content gaps and recommendations grounded in SEO best
   practices (intent match, topical depth, structure, metadata, E-E-A-T,
   freshness, etc.).

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Copy `.env.local.example` to `.env.local` and fill in:

| Variable | Notes |
| --- | --- |
| `ANTHROPIC_API_KEY` | https://console.anthropic.com |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | OAuth client at https://console.cloud.google.com/apis/credentials. Add `http://localhost:3000/api/auth/google/callback` as an authorized redirect URI. Enable the **Search Console API** for the project. |
| `GOOGLE_REDIRECT_URI` | Must match the redirect URI registered above. |
| `DATAFORSEO_LOGIN` / `DATAFORSEO_PASSWORD` | https://app.dataforseo.com/api-access |
| `SESSION_SECRET` | Random 32+ character string. Generate with `openssl rand -base64 48`. |

The required Google OAuth scope is
`https://www.googleapis.com/auth/webmasters.readonly` (read-only access to
Search Console). The app requests this automatically.

### 3. Run

```bash
npm run dev
```

Open <http://localhost:3000>, sign in with the Google account that owns your
GSC properties, pick a property, and click **Find ranking drops**.

## How it works

- `app/api/auth/google` &rarr; starts OAuth, sets a CSRF state cookie.
- `app/api/auth/google/callback` &rarr; exchanges the code, stores
  access/refresh tokens in an **AES-256-GCM encrypted** httpOnly session
  cookie. Tokens auto-refresh on use.
- `app/api/gsc/sites` &rarr; lists the user's verified GSC properties.
- `app/api/gsc/compare` &rarr; queries
  `searchAnalytics` for both periods (dimension: `page`), aligns by URL,
  computes per-page deltas, ranks declining pages by impact, and enriches
  each row with the page's **top query** in the current period.
- `app/api/analyze-page` &rarr; for a `{ pageUrl, keyword }` pair: hits
  DataForSEO's `serp/google/organic/live/advanced` endpoint, takes the
  competitors ranking above the user (up to 5), scrapes them with cheerio,
  scrapes the user's page, and sends a structured comparison to Claude
  Sonnet 4.6 with adaptive thinking. Returns `summary`, `gaps[]`
  (categorized + severity-rated), and `quickWins[]`.

## Tuning

In the UI:

- **Min position drop** &mdash; how many positions worse a page must be to be
  flagged (default `1`).
- **Min prior impressions** &mdash; filters out low-volume noise (default `10`).
- **Date ranges** &mdash; defaults to last 28 days vs. the prior 28 days,
  ending yesterday (GSC has a 2-3 day data lag).

In code:

- `lib/dataforseo.ts` &mdash; SERP location/language/device defaults
  (US/en/desktop).
- `app/api/analyze-page/route.ts` &mdash; competitor scrape cap (default 5),
  Claude model, prompt.

## Notes on cost

- DataForSEO live SERP calls are billed per request (~$0.001-$0.002 each).
  The compare step does not call DataForSEO; only on-demand "Analyze gaps"
  clicks do.
- Each gap analysis sends ~25-30k tokens to Claude (5 competitor pages plus
  your page). Budget accordingly.
