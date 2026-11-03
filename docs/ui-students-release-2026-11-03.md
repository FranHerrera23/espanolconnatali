# Onest, student voices and production domain — 2026-11-03

- Replaced Literata/Manrope with locally hosted Onest 400–700 throughout web typography; Cyrillic and Spanish glyphs checked with fontTools. OFL license included. Original structure, colors, articles and PDF retained.
- Home: approved two student excerpts with original-image disclosures and link to /students/. Added archive navigation.
- /students/: 25 unique messages transcribed from 29 supplied captures. Inventory records two duplicates and two promotional slides excluded from testimonial count. Full image evidence, historical format context, anonymous authors where name absent and explicit incomplete-message notice. Phone-bearing screenshot rendered without contact header; unredacted source not published.
- CollectionPage + ItemList + existing breadcrumb graph, visible Russian text, canonical and OG. No fabricated ratings, authorship or dates. Sitemap now 13 routes.
- Fixed resources.js global lexical declaration collision with reader.js, which previously prevented home navigation/motion initialization. Lenis desktop duration 1.1, wheel .9, reversible ScrollTrigger display/quote motion. Body reading remains stable; touch native; reduced motion skips initialization. Refresh on disclosure/image/font changes; lifecycle cleanup.
- Production origin is www.espanolconnatali.com. Build rejects contradictory SITE_URL. Vercel alias permanently redirects preserving route. Apex already configured 308 to www in Vercel.
- Checks: production build; SEO/link/schema checks; ten editorial content hashes and text coverage; PDF preservation; 20 responsive page-width checks at 375/768/1024/1440/1920 via actual iframe viewports (outer browser resize override was ineffective); disclosures/menu; zero JS console errors in local home; reduced-motion initialization harness. No automated Lighthouse or Search Console run.
- Pre-release public verification: all ten article URLs + home/library/robots/sitemap/PDF HTTP 200; all ten also read in browser with correct canonical/OG/JSON-LD origin. Firewall overview: no custom firewall configured, attack mode off, system mitigations active, no bypass IPs. No protection changed.


## Final rollout
- Ten approved, unchanged PDFs: direct download above and below every article; hashes verified during build.
- Desktop line-masked scrub and Lenis, restrained mobile motion, reduced-motion fallback. Verified reversible progress 1.000 → 0.570 when scrolling upward.
- Corrected invalid screenshot dimensions that caused extreme page height; build now rejects implausible dimensions.
- Bounded testimonial previews (360px maximum), full originals accessible; footer spacing restored.
- Home, students and article checked at 375, 768, 1024, 1440 and 1920px: no horizontal overflow.

## Navigation and motion correction
- Replaced independent line masks and delayed scrubs with shared, early-finishing block reveals; no text clipping in the reading zone.
- One Lenis clock; removed CSS smooth-scroll competition and duplicate anchor handling.
- Sticky navigation on desktop/mobile, 112/104px anchor clearance, mobile menu closes on navigation.
- Same-document back/forward uses smooth navigation; cross-document return restores saved position after font layout. CSS cross-document fades where supported.
- Browser verified: desktop anchor top112px; mobile top104px; menu closes; back/forward; actual pointer click into Resources and Back restores scroll6520px exactly. Five widths without overflow.

## Editorial resources
- Numbered editorial library, clickable titles, row hover/focus, refined headline scale and reading measure.
- Article contents navigation (sticky desktop, collapsible mobile), separated sections, dialogue/table treatment and coordinated PDF panels.
- Estimated reading time in library, home previews and article header: source word count at 180 words/minute, rounded up; exercises excluded from the stated reading estimate. Structured Article.timeRequired matches the estimate.
- Build/SEO/publication checks passed; article and library verified at five widths without overflow; contents destination clears sticky navigation.
