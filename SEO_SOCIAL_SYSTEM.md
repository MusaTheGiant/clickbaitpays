# ClickBaitPaysUs Page-Specific SEO, AEO, and Social Preview System

**Domain:** `https://clickbaitpaysus.com`  
**Implemented:** 5 September 2026  
**Last audited:** 8 September 2026

## Outcome

Every one of the 28 indexable pages has a unique search title, search description, canonical URL, social title, social description, 1200 x 630 PNG preview, image alt text, and accurate structured-data type. The custom 404 page is deliberately excluded from indexing and sharing metadata.

The existing website design, lesson order, interactions, navigation, responsive behavior, and conversion paths remain unchanged.

## Page-by-Page Intent Map

| URL | Primary search or sharing intent | Unique preview focus |
|---|---|---|
| `/` | Understand the ClickBaitPays model before starting | Earn While You Advertise |
| `/dashboard.html` | Find the complete learning workspace | 11-lesson dashboard |
| `/start-here.html` | Begin the guided course | Start the learning journey |
| `/what-is-clickbaitpays.html` | Define ClickBaitPays and its participants | Lesson 1: What Is ClickBaitPays? |
| `/how-clickbaitpays-works.html` | Understand the five-stage process | Lesson 2: How It Works |
| `/advertiser-viewer-benefits.html` | Understand traffic and both participant roles | Lesson 3: Traffic, Advertisers & Viewers |
| `/platform-sustainability.html` | Understand revenue, activity, controls, and risk | Lesson 4: Platform Sustainability |
| `/campaign-levels.html` | Compare campaign Levels 1 through 7 | Lesson 5: Campaign Levels |
| `/daily-clicks-earnings.html` | Understand the daily activity lifecycle | Lesson 6: Daily Clicks & Earnings |
| `/referral-rewards.html` | Understand the optional direct referral structure | Lesson 7: Direct Referral Rewards |
| `/staggered-campaign-strategy.html` | Plan campaign timing responsibly | Lesson 8: Staggered Strategy |
| `/crypto-deposits-withdrawals.html` | Use careful crypto transaction checks | Lesson 9: Deposits & Withdrawals |
| `/back-office-walkthrough.html` | Find tools in the platform back office | Lesson 10: Back Office Walkthrough |
| `/account-rules-safety.html` | Understand account rules and security | Lesson 11: Rules & Safety |
| `/completion.html` | Review and celebrate course completion | Learning journey completion |
| `/glossary.html` | Define advertising, traffic, crypto, and platform terms | ClickBaitPays glossary |
| `/faq.html` | Resolve common questions and objections | ClickBaitPays questions answered |
| `/action-plan.html` | Move from learning to careful action | Seven-step action plan |
| `/tutorials.html` | Follow seven practical platform walkthroughs | ClickBaitPays tutorial videos |
| `/videos.html` | Find the explainer video library | ClickBaitPays explainer videos |
| `/profit-calculator.html` | Plan up to three campaigns and estimate figures | ClickBaitPays Profit Calculator |
| `/resources.html` | Find guides, slides, and roadmaps | Learning resources |
| `/about.html` | Understand the site and its creator | About ClickBaitPaysUs |
| `/contact.html` | Connect with MTG and the community | Connect with MTG |
| `/earnings-disclaimer.html` | Understand variable results and no guarantees | Earnings disclaimer |
| `/risk-disclaimer.html` | Understand participation and crypto risks | Risk disclaimer |
| `/affiliate-disclosure.html` | Understand MTG's affiliate relationship | Affiliate disclosure |
| `/privacy.html` | Understand device-local progress and the minimal data footprint | Privacy at ClickBaitPaysUs |
| `/404.html` | Recover from an invalid URL | Noindex, no social preview |

## Metadata and Structured Data

Each indexable page includes:

- A unique HTML title and meta description
- A self-referencing canonical URL
- `index,follow` directives with large-image preview support
- Page-specific Open Graph title, description, URL, type, site name, image, dimensions, format, and image alt text
- Page-specific X summary-large-image metadata and image alt text
- A JSON-LD graph connecting the page, website, MTG authorship, and breadcrumbs
- More specific schema only where visible content supports it, including `LearningResource`, `Course`, `FAQPage`, `HowTo`, `AboutPage`, `ContactPage`, and `CollectionPage`

The sitemap contains all 28 indexable URLs, associates each URL with its social image, and excludes the 404 page. `robots.txt` allows public crawling, explicitly allows `OAI-SearchBot` and `ChatGPT-User`, and points to the sitemap. `llms.txt` supplies a concise, plain-text map of the site's purpose, key pages, authorship, and important accuracy notes for AI systems that choose to read it.

## Social Preview Design System

One image per indexable page is maintained in `assets/social/`.

- Exact dimensions: 1200 x 630 PNG
- Optimized for web delivery while retaining crisp typography
- Dark circuit-board visual language matching the live website
- Cyan, violet, and pink brand accents
- ClickBaitPays logo and ClickBaitPaysUs.com identity
- Page or lesson category, unique title, one short supporting line, and a compact page marker
- Wide edge padding and controlled line counts for mobile-thumbnail readability and common crop behavior

Each image path and description is recorded in `assets/page-metadata.json` and must match the metadata in the corresponding page head. The integration test rejects missing, reused, incorrectly sized, or inconsistent social images.

## Permanent Synchronization Rule

Treat page content, search metadata, social metadata, social artwork, structured data, internal links, and sitemap inclusion as one system.

Whenever a page's title, lesson number, purpose, main topic, major section, important media, URL, or primary CTA changes:

1. Update the page content and its HTML metadata together.
2. Update the matching record in `assets/page-metadata.json`.
3. Refresh the corresponding 1200 x 630 image in `assets/social/` if its topic or title changed.
4. Update the page entry and image URL in `sitemap.xml`.
5. Refresh the page's SHA-256 fingerprint in the metadata manifest.
6. Run `node tests/site-integration.test.js` before publishing the complete website folder.

The integration test fails when:

- A built page has no metadata record
- A metadata record has no built page
- An indexable page lacks any required search or social field
- Two indexable pages reuse the same social image path or social title
- A social title or description exceeds the established visual safe zone

## Verification Coverage

`tests/site-integration.test.js` checks:

- All required pages and assets exist
- Every indexable page matches its centralized metadata record
- Every canonical points to the exact page URL
- Every page-specific social image exists and is a 1200 x 630 PNG
- Search descriptions, social titles, and image paths are unique
- JSON-LD parses and contains the intended page type and breadcrumbs
- FAQ schema contains the visible FAQ questions and answers
- The 404 page is `noindex,follow` and has no canonical or share metadata
- The sitemap includes every indexable URL and excludes the 404 page
- The image sitemap associates every indexable URL with its page-specific preview
- `robots.txt` exposes the sitemap and allows the public and AI search crawlers used by this package
- `llms.txt` exposes the site's purpose, key pages, and accuracy notes without replacing standard SEO controls
- Every page has exactly one H1, valid heading progression, and alt attributes on images
- Internal links and asset references resolve inside the package
- Existing functional, brand, compliance, video, navigation, and responsive safeguards still pass

Absolute social image URLs will become publicly fetchable as soon as the refreshed static package is deployed to `clickbaitpaysus.com`. Social platforms may cache an older preview, so use their refresh or re-scrape tools after publishing when an old card remains visible. Search and AI systems decide when to crawl, index, cite, or rank a page, so these measures improve technical discoverability but cannot guarantee placement.
