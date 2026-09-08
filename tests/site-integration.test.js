"use strict";

const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..");
const htmlFiles = fs.readdirSync(root).filter(name => name.endsWith(".html")).sort();
const dashboardFiles = htmlFiles.filter(name => fs.readFileSync(path.join(root, name), "utf8").includes('class="dashboard-sidebar"'));
const read = name => fs.readFileSync(path.join(root, name), "utf8");
const pageMetadata = JSON.parse(read(path.join("assets", "page-metadata.json"))).pages;
const decodeAttribute = value => value.replaceAll("&amp;", "&").replaceAll("&quot;", '"').replaceAll("&#39;", "'");
const escapeRegex = value => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const metaContent = (html, attribute, value) => {
  const match = html.match(new RegExp(`<meta ${attribute}="${escapeRegex(value)}" content="([^"]*)">`));
  return match ? decodeAttribute(match[1]) : null;
};
const linkHref = (html, rel) => {
  const match = html.match(new RegExp(`<link rel="${escapeRegex(rel)}" href="([^"]*)">`));
  return match ? decodeAttribute(match[1]) : null;
};

const context = vm.createContext({});
vm.runInContext(read(path.join("assets", "campaign-data.js")), context);
const DATA = context.CBP_CAMPAIGN_DATA;

const tablePattern = /<table><thead><tr><th>Level<\/th>.*?<\/table>/s;
const homeTable = read("index.html").match(tablePattern)?.[0];
const lessonTable = read("campaign-levels.html").match(tablePattern)?.[0];
assert.ok(homeTable, "Home campaign table exists");
assert.equal(homeTable, lessonTable, "Home and Lesson 5 campaign tables match exactly");

const rows = [...homeTable.matchAll(/<tr><th scope="row">(\d)<\/th>((?:<td>.*?<\/td>){7})<\/tr>/g)].map(match => {
  const cells = [...match[2].matchAll(/<td>(.*?)<\/td>/g)].map(cell => cell[1]);
  const number = value => Number(value.replace(/,| USDT/g, ""));
  const cents = value => Math.round(number(value) * 100);
  return {
    level: Number(match[1]), firstTotalCents: cents(cells[0]), laterCostCents: cents(cells[1]),
    activationFeeCents: cents(cells[2]), adsDaily: Number(cells[3]), listedPerClickCents: cents(cells[4]),
    completionCents: cents(cells[5]), memberCents: cents(cells[6])
  };
});
assert.equal(rows.length, 7, "seven table rows were parsed");
assert.deepEqual(JSON.parse(JSON.stringify(DATA.levels)), rows, "calculator data matches both published tables");
DATA.levels.forEach(level => {
  assert.equal(level.firstTotalCents, level.laterCostCents + level.activationFeeCents, `Level ${level.level} first total is cost plus activation`);
  assert.equal(level.memberCents, Math.round(level.completionCents * 0.9), `Level ${level.level} member amount is the rounded listed 90%`);
});

dashboardFiles.forEach(name => {
  const html = read(name);
  const explainer = html.indexOf('href="videos.html"><span aria-hidden="true">▶</span><b>Explainer Videos</b>');
  const calculator = html.indexOf('href="profit-calculator.html"');
  assert.ok(explainer >= 0, `${name} contains Explainer Videos`);
  assert.ok(calculator > explainer, `${name} places Profit Calculator after Explainer Videos`);
  const between = html.slice(explainer, calculator);
  assert.equal((between.match(/dashboard-nav-link/g) || []).length, 1, `${name} places Profit Calculator immediately after Explainer Videos`);
  assert.equal((html.match(/class="dashboard-nav-link(?: active)?" href="profit-calculator\.html"/g) || []).length, 1, `${name} has one calculator navigation link`);
});

const calculatorHtml = read("profit-calculator.html");
assert.match(calculatorHtml, /dashboard-nav-link active" href="profit-calculator\.html" aria-current="page"/, "calculator navigation state is active");
assert.ok(calculatorHtml.indexOf("assets/campaign-data.js") < calculatorHtml.indexOf("assets/profit-calculator.js"), "campaign data loads before calculator logic");
assert.match(calculatorHtml, /Clear all calculator entries and start over\?/, "reset confirmation copy is present");
assert.match(calculatorHtml, /Yes, Clear Everything/, "reset confirmation action is present");
assert.match(calculatorHtml, /aria-live="polite" aria-atomic="true" data-results-announcement/, "calculated results have a screen-reader announcement");
for (const id of ["quick-level", "quick-count", "quick-purchase-status", "quick-schedule", "quick-start-date"]) {
  assert.match(calculatorHtml, new RegExp(`<label for="${id}">|<label for="${id}" class=`), `${id} has an explicit label`);
}
assert.doesNotMatch(calculatorHtml, /<button(?![^>]*\stype="(?:button|submit)")[^>]*>/, "calculator buttons have explicit types");

const indexHtml = read("index.html");
assert.equal((indexHtml.match(/href="profit-calculator\.html"/g) || []).length, 1, "Home has one calculator CTA");
assert.match(indexHtml, /class="button primary" href="profit-calculator\.html">Calculate Campaign Earnings<\/a>/, "Home CTA uses the existing primary CTA design");

const recommendedCtas = {
  "campaign-levels.html": "Calculate Campaign Earnings",
  "staggered-campaign-strategy.html": "Plan a Staggered Schedule",
  "action-plan.html": "Build Your Campaign Plan"
};
Object.entries(recommendedCtas).forEach(([name, label]) => {
  const html = read(name);
  assert.equal((html.match(/data-calculator-cta/g) || []).length, 1, `${name} has one contextual calculator CTA`);
  assert.match(html, new RegExp(`class="button primary" href="profit-calculator\\.html" data-calculator-cta>${label}<\\/a>`), `${name} calculator CTA uses the existing primary design and correct wording`);
});
assert.equal(htmlFiles.reduce((total, name) => total + (read(name).match(/data-calculator-cta/g) || []).length, 0), 3, "only the three recommended lesson pages have contextual calculator CTAs");

const allLocalReferences = [];
htmlFiles.forEach(name => {
  const html = read(name);
  assert.doesNotMatch(html, /lkj|capital capital|<\/hl|\? no/, `${name} has no accidental placeholder text`);
  const stack = [];
  const voidTags = new Set(["area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "param", "source", "track", "wbr"]);
  const structuralHtml = html.replace(/<script\b[^>]*>.*?<\/script>/gs, "").replace(/<!--.*?-->/gs, "");
  for (const tagMatch of structuralHtml.matchAll(/<\/?([a-z][a-z0-9-]*)\b[^>]*>/gi)) {
    const token = tagMatch[0];
    const tag = tagMatch[1].toLowerCase();
    if (voidTags.has(tag) || token.endsWith("/>")) continue;
    if (!token.startsWith("</")) stack.push(tag);
    else assert.equal(stack.pop(), tag, `${name} closes <${tag}> in the correct order`);
  }
  assert.deepEqual(stack, [], `${name} closes all non-void HTML elements`);
  const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map(match => match[1]);
  assert.equal(new Set(ids).size, ids.length, `${name} has no duplicate IDs`);
  [...html.matchAll(/<(?:a|link|script|img)[^>]+(?:href|src)="([^"]+)"/g)].forEach(match => {
    const reference = match[1];
    if (/^(?:https?:|mailto:|tel:|#|data:)/.test(reference)) return;
    allLocalReferences.push([name, reference.split("#")[0].split("?")[0]]);
  });
  [...html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gs)].forEach(match => {
    assert.doesNotThrow(() => JSON.parse(match[1]), `${name} has valid JSON-LD`);
  });
});

allLocalReferences.forEach(([name, reference]) => {
  if (!reference) return;
  assert.ok(fs.existsSync(path.join(root, reference)), `${name} local reference exists: ${reference}`);
});

const sitemap = read("sitemap.xml");
const indexableEntries = Object.entries(pageMetadata).filter(([, metadata]) => metadata.indexable);
const nonIndexableEntries = Object.entries(pageMetadata).filter(([, metadata]) => !metadata.indexable);
const uniqueSeoTitles = new Set();
const uniqueDescriptions = new Set();
const uniqueCanonicals = new Set();
const uniqueSocialTitles = new Set();
const uniqueSocialImages = new Set();

indexableEntries.forEach(([name, metadata]) => {
  const html = read(name);
  const title = decodeAttribute(html.match(/<title>(.*?)<\/title>/s)?.[1] || "");
  const description = metaContent(html, "name", "description");
  const canonical = linkHref(html, "canonical");
  const socialImage = metadata.socialImage.startsWith("http")
    ? metadata.socialImage
    : `https://clickbaitpaysus.com/${metadata.socialImage}`;

  assert.equal(crypto.createHash("sha256").update(html).digest("hex"), metadata.htmlSha256, `${name} HTML fingerprint matches centralized metadata`);
  assert.equal(title, metadata.seoTitle, `${name} title matches centralized metadata`);
  assert.equal(description, metadata.description, `${name} description matches centralized metadata`);
  assert.equal(canonical, metadata.canonical, `${name} has its self-referencing canonical URL`);
  assert.equal(metaContent(html, "name", "robots"), "index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1", `${name} allows rich search previews`);
  assert.ok(["website", "article"].includes(metaContent(html, "property", "og:type")), `${name} has an appropriate Open Graph type`);
  assert.equal(metaContent(html, "property", "og:site_name"), "ClickBaitPaysUs Learning", `${name} has the Open Graph site name`);
  assert.equal(metaContent(html, "property", "og:locale"), "en_US", `${name} has the Open Graph locale`);
  assert.equal(metaContent(html, "property", "og:title"), metadata.socialTitle, `${name} Open Graph title matches metadata`);
  assert.equal(metaContent(html, "property", "og:description"), metadata.socialDescription, `${name} Open Graph description matches metadata`);
  assert.equal(metaContent(html, "property", "og:url"), metadata.canonical, `${name} Open Graph URL matches its canonical`);
  assert.equal(metaContent(html, "property", "og:image"), socialImage, `${name} has its page-specific Open Graph image`);
  assert.equal(metaContent(html, "property", "og:image:secure_url"), socialImage, `${name} has its secure Open Graph image URL`);
  assert.equal(metaContent(html, "property", "og:image:type"), "image/png", `${name} identifies its social image format`);
  assert.equal(metaContent(html, "property", "og:image:width"), "1200", `${name} declares a 1200-pixel social image width`);
  assert.equal(metaContent(html, "property", "og:image:height"), "630", `${name} declares a 630-pixel social image height`);
  assert.equal(metaContent(html, "property", "og:image:alt"), metadata.socialImageAlt, `${name} has descriptive Open Graph image text`);
  assert.equal(metaContent(html, "name", "twitter:card"), "summary_large_image", `${name} uses a large social card`);
  assert.equal(metaContent(html, "name", "twitter:title"), metadata.socialTitle, `${name} X title matches metadata`);
  assert.equal(metaContent(html, "name", "twitter:description"), metadata.socialDescription, `${name} X description matches metadata`);
  assert.equal(metaContent(html, "name", "twitter:image"), socialImage, `${name} X image matches Open Graph`);
  assert.equal(metaContent(html, "name", "twitter:image:alt"), metadata.socialImageAlt, `${name} has descriptive X image text`);
  const structuredData = [...html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gs)].map(match => JSON.parse(match[1]));
  assert.ok(structuredData.some(block => JSON.stringify(block).includes(socialImage)), `${name} structured data identifies its page image`);

  const imageUrl = new URL(socialImage);
  const imagePath = path.join(root, imageUrl.pathname.replace(/^\//, ""));
  assert.ok(fs.existsSync(imagePath), `${name} social image exists`);
  const png = fs.readFileSync(imagePath);
  assert.equal(png.subarray(1, 4).toString("ascii"), "PNG", `${name} social image is a PNG`);
  assert.equal(png.readUInt32BE(16), 1200, `${name} social image is 1200 pixels wide`);
  assert.equal(png.readUInt32BE(20), 630, `${name} social image is 630 pixels high`);

  assert.ok(!uniqueSeoTitles.has(title), `${name} SEO title is unique`);
  assert.ok(!uniqueDescriptions.has(description), `${name} description is unique`);
  assert.ok(!uniqueCanonicals.has(canonical), `${name} canonical is unique`);
  assert.ok(!uniqueSocialTitles.has(metadata.socialTitle), `${name} social title is unique`);
  assert.ok(!uniqueSocialImages.has(socialImage), `${name} social image is unique`);
  uniqueSeoTitles.add(title);
  uniqueDescriptions.add(description);
  uniqueCanonicals.add(canonical);
  uniqueSocialTitles.add(metadata.socialTitle);
  uniqueSocialImages.add(socialImage);

  const sitemapEntry = `<loc>${metadata.canonical}</loc><lastmod>2026-09-08</lastmod><image:image><image:loc>${socialImage}</image:loc></image:image>`;
  assert.ok(sitemap.includes(sitemapEntry), `${name} sitemap entry includes its social image`);
});

assert.equal(indexableEntries.length, 28, "all 28 content pages are indexable");
assert.equal((sitemap.match(/<url>/g) || []).length, indexableEntries.length, "sitemap includes every indexable page exactly once");
assert.match(sitemap, /xmlns:image="http:\/\/www\.google\.com\/schemas\/sitemap-image\/1\.1"/, "sitemap declares the image namespace");
nonIndexableEntries.forEach(([name]) => {
  const html = read(name);
  assert.equal(crypto.createHash("sha256").update(html).digest("hex"), pageMetadata[name].htmlSha256, `${name} HTML fingerprint matches centralized metadata`);
  assert.equal(metaContent(html, "name", "robots"), "noindex,follow", `${name} remains excluded from search results`);
  assert.equal(linkHref(html, "canonical"), null, `${name} has no canonical URL`);
  assert.equal(metaContent(html, "property", "og:image"), null, `${name} has no social preview image`);
  assert.ok(!sitemap.includes(`/${name}`), `${name} is excluded from the sitemap`);
});

const robots = read("robots.txt");
assert.match(robots, /User-agent: OAI-SearchBot\nAllow: \//, "robots.txt explicitly allows OpenAI search discovery");
assert.match(robots, /User-agent: ChatGPT-User\nAllow: \//, "robots.txt allows user-requested ChatGPT visits");
assert.match(robots, /Sitemap: https:\/\/clickbaitpaysus\.com\/sitemap\.xml/, "robots.txt exposes the sitemap");
const llms = read("llms.txt");
assert.match(llms, /https:\/\/clickbaitpaysus\.com\/profit-calculator\.html/, "llms.txt identifies the Profit Calculator");
assert.match(llms, /maximum of three active campaigns total per account/, "llms.txt records the calculator's key rule");
assert.doesNotMatch(llms, /\.com\.com/, "llms.txt contains no malformed domain");

const css = read(path.join("assets", "styles.css"));
const structuralCss = css.replace(/\/\*[\s\S]*?\*\//g, "").replace(/"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'/g, "");
let braceDepth = 0;
for (const character of structuralCss) {
  if (character === "{") braceDepth += 1;
  if (character === "}") braceDepth -= 1;
  assert.ok(braceDepth >= 0, "CSS never closes a block before opening it");
}
assert.equal(braceDepth, 0, "CSS braces are balanced");
assert.match(css, /@media \(max-width: 480px\)[\s\S]*?\.calculator-metrics \{ grid-template-columns: 1fr; \}/, "small phones receive a single-column results layout");
assert.match(css, /\.calculator-main \{ width: calc\(100% - 1\.25rem\); \}/, "small-phone calculator width stays inside the viewport");
assert.match(css, /@media \(prefers-reduced-motion: no-preference\)/, "animation remains opt-in when reduced motion is not requested");

console.log(`Site integration tests passed: ${htmlFiles.length} HTML pages, ${dashboardFiles.length} dashboard menus, ${indexableEntries.length} complete SEO/social records, matching campaign tables, valid local paths, JSON-LD, sitemap images, CTA placement, and calculator metadata.`);
