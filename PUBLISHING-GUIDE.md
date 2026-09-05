# ClickBaitPays GitHub Pages Publishing Guide

**Domain:** `clickbaitpaysus.com`  
**Website package:** `ClickBaitPays_GitHub_Pages_Website.zip`  
**Prepared:** 5 September 2026

## 1. What Is Ready

The website package contains the complete static site:

- `index.html` and 26 additional HTML pages, including a non-indexable custom 404 page
- A focused public landing page plus a separate professional learning dashboard
- Shared CSS and JavaScript
- Logo and favicon
- 26 unique page-specific social-preview images
- Eleven lesson quizzes
- Device-local progress tracking
- Flashcards, glossary search, FAQ accordions, and milestone messages
- `CNAME` for `clickbaitpaysus.com`
- `.nojekyll` for direct static-file publishing
- `sitemap.xml`, `robots.txt`, and `manifest.webmanifest`
- Legal and disclosure pages

No database, account system, authentication, server, or build service is required.

## 2. Create the GitHub Repository

1. Sign in to GitHub.
2. Create a new repository. A clear name is `clickbaitpaysus`.
3. Use a public repository if you are publishing with GitHub Free.
4. Extract `ClickBaitPays_GitHub_Pages_Website.zip` on your computer.
5. Upload everything inside the extracted folder to the root of the repository.
6. Confirm that `index.html`, `CNAME`, `.nojekyll`, and the `assets` folder are visible at the repository root.

Important: upload the contents of the website folder, not an extra outer folder containing them.

## 3. Enable GitHub Pages

1. Open the repository on GitHub.
2. Select **Settings**.
3. Select **Pages** under **Code, planning, and automation**.
4. Under **Build and deployment**, choose **Deploy from a branch**.
5. Select the `main` branch and the root folder `/`.
6. Save the setting.

GitHub supports publishing a branch from either the repository root or a `/docs` folder. This package is already arranged for the root option. See the official [publishing-source guide](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site).

## 4. Add the Custom Domain in GitHub First

Before changing GoDaddy DNS:

1. Return to **Settings** and **Pages**.
2. Under **Custom domain**, enter `clickbaitpaysus.com`.
3. Save it.
4. Keep the included `CNAME` file in the repository root.

GitHub recommends adding and verifying the custom domain before pointing DNS to it. This reduces the risk of a domain takeover. See GitHub's official [custom-domain instructions](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site).

## 5. Configure GoDaddy DNS

Open the DNS management area for `clickbaitpaysus.com` and create or update these apex records:

| Type | Name | Value | TTL |
|---|---|---|---|
| A | `@` | `185.199.108.153` | Default |
| A | `@` | `185.199.109.153` | Default |
| A | `@` | `185.199.110.153` | Default |
| A | `@` | `185.199.111.153` | Default |

For the `www` version, add:

| Type | Name | Value | TTL |
|---|---|---|---|
| CNAME | `www` | `YOUR-GITHUB-USERNAME.github.io` | Default |

Replace `YOUR-GITHUB-USERNAME` with the account or organization that owns the repository. Do not include the repository name in this CNAME value.

Remove conflicting `A`, `AAAA`, forwarding, or parked-domain records only when you have confirmed that they currently control the same website hostname. Do not remove email-related MX or TXT records.

DNS changes can take time to spread. GitHub says propagation can take up to 24 hours.

## 6. Turn On HTTPS

After GitHub confirms the DNS:

1. Return to **Settings** and **Pages**.
2. Wait for the DNS check and certificate process to finish.
3. Enable **Enforce HTTPS** when the option becomes available.

GitHub automatically requests the certificate after the DNS configuration passes. See GitHub's [HTTPS guidance](https://docs.github.com/en/pages/getting-started-with-github-pages/securing-your-github-pages-site-with-https).

## 7. Add Google Analytics Later

Analytics is intentionally inactive.

To activate it after you have a real GA4 property:

1. Open `assets/config.js`.
2. Replace `G-XXXXXXXXXX` with the real GA4 Measurement ID.
3. Save and upload the updated file to GitHub.

The site will load analytics only after a visitor chooses **Allow analytics**. Essential theme and learning-progress features do not require analytics permission.

## 8. Test After Publishing

Check these items on desktop and mobile:

- Home page opens at `https://clickbaitpaysus.com`
- The landing headline reads `EARN WHILE YOU ADVERTISE` without clipping or awkward wrapping
- Advertiser and daily-viewing messages appear clearly at the selected landing, dashboard, lesson, action, and completion points
- Logo and favicon appear
- The first launch opens in dark mode and the optional light-theme switch works
- The main landing-page button opens the learning dashboard
- The desktop sidebar and mobile dashboard menu guide the full learning journey
- Dashboard navigation remains comfortably readable and touch-friendly on phones
- Circuit-board nodes pulse softly on the landing page, while reduced-motion preferences are respected
- Every video remains still until Play is pressed
- Every video opens in the shared responsive modal, closes by button, backdrop, or Escape, and closes automatically when playback finishes
- The learning path contains eleven lessons, including Platform Sustainability as Lesson 4
- Lesson 2 presents the full five-step flow through withdrawal
- The scroll-to-top control appears after the visitor moves down a page
- Learning progress updates after a correct quiz answer
- Incorrect quiz answers show the correction and retry button
- The next guided lesson unlocks after the correct answer
- Flashcards flip
- Glossary search filters terms
- WhatsApp community links open the correct group
- Direct MTG WhatsApp links open the direct conversation
- `Official Website` opens `https://clickbaitpays.me/?ref=mtgtraffic`
- `Create Free Account` opens `https://clickbaitpays.me/join.php?ref=mtgtraffic`
- `Official Login` opens `https://clickbaitpays.me/login.php`
- Affiliate routes are visibly disclosed and use sponsored-link semantics
- Every indexable URL displays its own matching title, description, and social-preview image
- Social images load from absolute `https://clickbaitpaysus.com/assets/social/...` URLs after deployment
- `404.html` is excluded from indexing and from the sitemap
- Video 4 loads from the supplied `5SLBAgVdtXw` YouTube presentation link
- The FAQ video loads from `8rftor87kKQ`
- The landing page includes the income-and-compensation video and dashboard walkthrough in their approved sections
- Resources includes the featured ClickBaitPays Presentation Slides link
- HTTPS is active

## 9. Important Publishing Safety

- Never upload passwords, wallet keys, seed phrases, private PINs, or GitHub access tokens.
- Keep the website's affiliate disclosure and risk pages published.
- Confirm changing platform rules and figures before updating factual content.
- Keep `CNAME` and `.nojekyll` in the repository root.
- Do not replace the approved social-preview image with earnings screenshots or unverified payment claims.

## 10. Updating the Website

Use the supplied source-and-builder package for content changes. Update the page content in `build-static.mjs`, review the matching search and social intent in `page-metadata.mjs`, regenerate the website with `node build-static.mjs`, run `node verify-static.mjs`, and upload the complete refreshed `dist` output while preserving `CNAME`.

Do not routinely hand-edit generated HTML. Search metadata, social previews, schema, internal links, and sitemap inclusion are treated as a synchronized system. The verifier detects output pages changed after the metadata manifest was built.

See `SEO_SOCIAL_SYSTEM.md` in the source package for the complete page-by-page intent map, maintenance rule, and validation coverage.

## 11. Voice and Source Check

- Keep the dashboard and About page clear that MTG is an active member and affiliate who uses ClickBaitPays every day.
- Teach platform concepts directly. Do not reintroduce repetitive report-style phrases such as `according to the supplied materials` or `based on the source`.
- Keep the compact `Keep this lesson current` links and Resources page available so visitors can check changing platform information whenever they choose.
- Preserve the independent affiliate disclosure, earnings disclaimer, and risk disclaimer.

## 12. Social and Resource Link Check

- Confirm the WhatsApp community buttons use the current `G1LOlTWae3OKCF3mVcD6J0` invite.
- Confirm the Videos page, Contact page, and footers link to `https://www.youtube.com/@clickbaitpaysus`.
- Confirm Growth Roadmap and Sustainability Story both open their supplied Google Drive resources.
- Keep these placements restrained. Do not add floating social controls or duplicate buttons inside lesson content.
