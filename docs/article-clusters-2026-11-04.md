# Articles: clusters and CRUDA reference

Reference inspected live: https://www.thecruda.com/thinking, 4 November 2026. The live t2 layout differs from the older local t-hero/card-grid implementation: featured lead, restrained list, single anchor per row, 36px vertical padding, approximately 28px row titles, muted metadata and accent hover. Applied these proportions using Natali's own colors/type and no subscription gate.

Primary clusters follow editorial/topic-clusters.md: start 2; conversation 4; grammar 3; autonomous practice 1. Culture has no published pieces and is not exposed as an empty filter. Mapping centralized in content/article-clusters.json; build rejects missing/ambiguous assignments.

Filters preserve full static HTML and the canonical /resources/ URL. Query selection supports reload and back/forward, counts, aria-pressed, live result count, reduced motion, and a single selected topic. Article return link retains the originating cluster. All ten unique articles remain available without JavaScript.

Browser checks: all five filter states and counts, grammar reload, article/back preservation, mobile interaction, five widths 375/768/1024/1440/1920 without horizontal overflow. Existing publication/SEO/PDF checks retained.
