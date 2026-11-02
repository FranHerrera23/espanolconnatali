# Español con Natali — approved Russian website

`site/` contains the approved Russian home, Free Resources library and three draft readings, with owned photo assets and the approved typography/motion. `scripts/build.mjs` creates full HTML and JSON-LD in `dist/`. Node built-ins only; no framework install is required.

## Preview

```
npm run build
npm run check:seo
npm run preview
```

Preview includes the draft readings and keeps every page noindex; the sitemap is empty. Set `SITE_URL` to the preview origin when testing canonical/OG URLs. On Vercel, its supplied `VERCEL_URL` is used when no confirmed origin is provided.

## Production

```
SITE_URL=https://YOUR-CONFIRMED-DOMAIN npm run build:production
python3 scripts/check-seo.py dist production
```

The command requires an HTTPS origin. Alternatively configure `productionSiteUrl` in `site.config.json`. No production domain is assumed.

On Vercel: import the chosen GitHub repository, use `vercel.json` (build `npm run build`, output `dist`). Leave `DEPLOY_MODE` unset for review. Only set `DEPLOY_MODE=production` and the confirmed `SITE_URL` in the production environment when ready to publish. Check the deployment's metadata before promotion; the first deployment may be Production even if intended as review. No deployment has been made by this preparation.

Production excludes draft readings and their links. With no approved published articles, the library displays a short coming-soon message and remains noindex. To publish an article, supply real author name/role/photo, reviewer, sources with titles, publication/update dates, `status: published`, and `approvalRequired: false` in `site/resources-content.json`; keep the corresponding full HTML in `site/resources/` synchronized. The checker verifies schema/visible answer and FAQ parity. Current copy remains pedagogical draft, despite approval of the design.

## Verification

```
python3 scripts/test-publication.py
```

Uses clearly named test fixtures in `work/`; they are never deployed. Checks publication selection, metadata, draft exclusion, required editorial approval and required production domain. `scripts/check-seo.py` verifies local destinations/fragments, one H1, Russian language, canonical, JSON-LD syntax and graph identities, visible FAQ/answer consistency, sitemap and indexability.

## Technical SEO and AEO

- Home: EducationalOrganization, Person, WebSite, WebPage, Course.
- Library: CollectionPage, ItemList, BreadcrumbList.
- Readings: Article, author/reviewer and dates when approved, BreadcrumbList, FAQPage matching visible questions/answers.
- Unique titles/descriptions, canonical URLs, Russian OG metadata, social preview image, full prose in initial HTML, robots.txt, sitemap, local photos and 404.
- No guessed price, rating, certificates, native-speaker status, review attribution or publication dates.
- Only Instagram is a contact channel.

Pending after domain/repository setup: canonical verification against live URLs, migration redirects from actual existing URLs, Search Console verification/sitemap submission, external Schema.org/Rich Results validation and live performance/accessibility checks. These require the actual deployment. Structured data does not guarantee indexing or AI citations. FAQ schema remains descriptive; Google retired FAQ rich results in May 2026.

