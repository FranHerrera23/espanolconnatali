# Español con Natali — Russian production library

Approved launch: ten Russian guides in `content/launch/`, manifest with Fran approval and immutable source hashes. Institutional editorial authorship with AI disclosure; no attributed Natali review. Source files are rendered completely at build time by the constrained Markdown renderer (headings, paragraphs, lists, tables, quotes, links, emphasis).

## Commands

- `npm run build`: local/preview noindex; Vercel Production uses production mode automatically.
- `npm run build:production`: explicit local production build.
- `python3 scripts/check-seo.py dist production`: metadata, graph parity, local links and anchors, sitemap.
- `python3 scripts/test-publication.py`: launch content/hash coverage, sources, absence of commercial blocks and fake review, PDF and sitemap checks.

Production origin: `site.config.json`, currently https://espanolconnatali.vercel.app. On acquiring a domain, update it and SITE_URL if configured, rebuild, redirect the old preferred origin, verify live canonical/OG/schema/sitemap and submit the new sitemap in Search Console. Never use per-deployment Vercel URLs as production canonicals. Preview builds remain noindex.

Only the clarification guide has a PDF. Reader printing/copying and direct download require no registration. Resources contain no commercial offers. The home uses the approved system with C1 bio and current offer corrections.

No English routes, email capture or future series are generated. Actual search-engine indexing is external to deployment.
