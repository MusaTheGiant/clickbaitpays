"""Build the ClickBaitPays Quick Guide (/mtg) for busy people.

Run from anywhere:  python3 mtg/build.py
FAQ answers, glossary terms, videos, campaign figures and the calculator are read
from the main site at build time, so the quick guide stays in step with it.
To make a copy for another member, copy the generated mtg/ folder and edit
member-config.js.
"""
from pathlib import Path
import html
import json
import re

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'mtg'
SITE = 'https://clickbaitpaysus.com'
BASE = SITE + '/mtg/'
REG = 'https://clickbaitpays.me/join.php?ref=mtgtraffic'
OFFICIAL = 'https://clickbaitpays.me/?ref=mtgtraffic'
GROUP = 'https://chat.whatsapp.com/G1LOlTWae3OKCF3mVcD6J0?s=cl&amp;p=a&amp;mlu=4&amp;ilr=4'
YOUTUBE = 'https://www.youtube.com/@clickbaitpaysus'
BW_GUIDE = 'https://bitcoinwealthpays.com/mtg/'
V_ROOT = '20260925-static1'      # cache key for the shared site assets
V_MTG = '20261001-mtg1'           # cache key for the quick guide assets
UPDATED = '2026-10-01'

read = lambda name: (ROOT / name).read_text(encoding='utf-8')
esc = lambda s: html.escape(s, quote=True)
strip = lambda s: re.sub(r'\s+', ' ', html.unescape(re.sub(r'<[^>]+>', ' ', s))).strip()


def no_dash(text):
    """House style: no em or en dashes in published copy."""
    return text.replace(' — ', ', ').replace('—', ', ').replace('–', '-')


def absolute_links(fragment):
    """Root-relative page links become absolute so they work from /mtg/ and from copies."""
    return re.sub(r'href="(?!https?:|#|mailto:)([^"]+)"', lambda m: f'href="{SITE}/{m.group(1)}"', fragment)


# ---------------------------------------------------------------- source data
def campaign_levels():
    src = read('assets/campaign-data.js')
    rows = []
    for m in re.finditer(r'\{ level: (\d), firstTotalCents: (\d+), laterCostCents: (\d+), activationFeeCents: (\d+), adsDaily: (\d+), listedPerClickCents: (\d+), completionCents: (\d+), memberCents: (\d+) \}', src):
        lv, first, later, act, ads, _pc, comp, mem = map(int, m.groups())
        rows.append(dict(level=lv, first=first, later=later, activation=act, ads=ads, completion=comp, member=mem))
    assert len(rows) == 7, 'seven campaign levels expected'
    return rows


def usdt(cents, decimals=False):
    value = cents / 100
    return (f'{value:,.2f}' if decimals or cents % 100 else f'{value:,.0f}') + ' USDT'


def root_faq():
    out = {}
    for m in re.finditer(r'<details[^>]*><summary><span>(\d+)</span><strong>(.*?)</strong>.*?</summary><p>(.*?)</p></details>', read('faq.html'), re.S):
        out[int(m.group(1))] = (m.group(2), absolute_links(m.group(3)))
    assert len(out) >= 23, 'root FAQ changed shape'
    return out


def root_glossary():
    page = read('glossary.html')
    terms = re.findall(r'<article data-glossary-term="([^"]+)"><span>(.)</span><h2>(.*?)</h2><p>(.*?)</p></article>', page)
    callout = re.search(r'<div class="compare-callout">.*?</div>\s*(?=<div class="glossary-grid")', page, re.S).group(0)
    assert len(terms) >= 25, 'root glossary changed shape'
    return terms, callout


def root_calculator():
    page = read('profit-calculator.html')
    start = page.index('<section class="calculator-workspace">')
    end = page.index('<section class="calculator-explainers">')
    dialog = re.search(r'<dialog class="calculator-reset-dialog".*?</dialog>', page, re.S).group(0)
    hero_chip = re.search(r'<div class="calculator-rule-chip">.*?</div>', page, re.S).group(0)
    return absolute_links(page[start:end].rstrip()), dialog, hero_chip


def root_loop():
    page = read('index.html')
    loop = re.search(r'<div class="hero-cycle-stage">.*?</span></div></div>', page, re.S).group(0)
    svg = re.search(r'<svg class="circuit-backdrop".*?</svg>', page, re.S).group(0)
    return loop, svg


LEVELS = campaign_levels()
FAQ_SRC = root_faq()
TERMS, CALLOUT = root_glossary()
CALC, CALC_DIALOG, CALC_CHIP = root_calculator()
LOOP, CIRCUIT = root_loop()

VIDEOS = [
    ('gWkLEgBFVEY', 'ClickBaitPays Overview', 'START HERE', 'The big picture: what ClickBaitPays is, who it connects and how daily ad viewing fits in. If you only watch one video, make it this one.'),
    ('MiUja2RnWXY', 'Income and Commission Plan', 'THE NUMBERS', 'How campaign activity and the optional 10% direct referral reward fit together, with worked examples.'),
    ('EDnb9e03B0E', 'Back Office Walkthrough', 'HANDS ON', 'A guided look around the member back office, so you know where everything is before you log in.'),
    ('25wXab2hAB8', 'ClickBaitPays Presentation, 14 September 2026', 'LATEST', 'The full presentation from 14 September 2026. Ideal when you have more time, or to share with your team.'),
]

PAGES = [
    # slug, path, nav label, file depth
    ('home', '', 'Home'),
    ('video-tutorials', 'video-tutorials/', 'Videos'),
    ('profit-calculator', 'profit-calculator/', 'Calculator'),
    ('faq', 'faq/', 'FAQ'),
    ('glossary', 'glossary/', 'Glossary'),
    ('request-a-copy', 'request-a-copy/', 'Get a Copy'),
]


# ---------------------------------------------------------------- shared chrome
def header(up, current):
    links = ''.join(
        f'<a href="{up}{path}"' + (' aria-current="page"' if slug == current else '') + f'>{label}</a>'
        for slug, path, label in PAGES
    )
    return f'''<header class="landing-header mtg-header" data-member-nav>
    <a class="brand" href="{up}" data-guide-home aria-label="ClickBaitPays Quick Guide home"><img src="{up}../assets/logo.png" alt="ClickBaitPays logo" width="42" height="42"><span>ClickBait<span>Pays</span></span><small class="mtg-tag">QUICK GUIDE</small></a>
    <nav class="mtg-links" id="mtg-links" data-menu-links aria-label="Quick guide navigation">{links}</nav>
    <div class="header-actions"><button class="icon-button theme-toggle" type="button" aria-label="Switch to light theme"><span aria-hidden="true">☼</span></button><a class="button platform-register small" href="{REG}" data-register target="_blank" rel="sponsored noopener">Register Free</a><button class="mtg-menu-toggle" type="button" data-menu-toggle aria-expanded="false" aria-controls="mtg-links" aria-label="Open navigation menu"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg><span>Menu</span></button></div>
  </header>'''


VIDEO_MODAL = '''<div class="video-modal" id="video-modal" data-video-modal role="dialog" aria-modal="true" aria-labelledby="video-modal-title" hidden><button class="video-modal-backdrop" type="button" data-video-close aria-label="Close video"></button><div class="video-modal-panel"><div class="video-modal-head"><div><span data-video-modal-label>CLICKBAITPAYS VIDEO</span><h2 id="video-modal-title" data-video-modal-title>Watch and learn</h2></div><button class="video-close" type="button" data-video-close aria-label="Close video"><span aria-hidden="true">×</span></button></div><div class="video-modal-frame" data-video-player></div><p class="video-modal-note">The video loads only after you press Play and closes automatically when it finishes.</p></div></div>'''


def footer(up):
    return f'''<footer class="landing-footer mtg-footer"><div><a class="brand" href="{up}"><img src="{up}../assets/logo.png" alt="" width="42" height="42"><span>ClickBait<span>Pays</span></span></a><p>The ClickBaitPays Quick Guide by MTG. Independent education, not the official ClickBaitPays website.</p></div><nav aria-label="Footer"><a href="{SITE}/dashboard.html">Full 11-lesson course</a><a href="{SITE}/earnings-disclaimer.html">Earnings disclaimer</a><a href="{SITE}/risk-disclaimer.html">Risk</a><a href="{SITE}/affiliate-disclosure.html">Affiliate disclosure</a><a href="{SITE}/privacy.html">Privacy</a><a class="button secondary" href="{YOUTUBE}" data-youtube target="_blank" rel="noopener">YouTube</a><a class="button secondary" href="{OFFICIAL}" target="_blank" rel="sponsored noopener">Official Website</a></nav><p>Made with ❤️ by MTG 👑 | Your Digital Architect</p></footer>
  <button class="scroll-top" type="button" data-scroll-top aria-label="Scroll to the top"><span aria-hidden="true">↑</span></button><div class="toast" role="status" aria-live="polite" data-toast></div>'''


def register_panel(up, heading='Ready to start? Register free.', intro=None):
    intro = intro or 'Registration costs nothing. Log in, look around the back office and only choose a campaign level when the numbers make sense for your budget. Questions first? Message me on WhatsApp.'
    return f'''<section class="mtg-section" id="register" aria-labelledby="register-title"><div class="mtg-panel mtg-split">
    <div class="mtg-panel-copy">
      <div class="mtg-owner"><img data-profile-image data-fallback="{up}../assets/logo.png" src="{up}../assets/logo.png" alt="" width="56" height="56"><div><strong data-owner-name>MTG 👑</strong><span data-owner-role>ClickBaitPays member and team builder</span></div></div>
      <p class="eyebrow">YOUR NEXT STEP</p><h2 id="register-title">{heading}</h2><p>{intro}</p>
      <div class="mtg-ref"><code data-referral-url>{REG}</code><button type="button" data-copy-referral aria-label="Copy the ClickBaitPays registration link">Copy Link</button></div>
      <p class="mtg-status" data-copy-status role="status" aria-live="polite"></p>
      <div class="button-row"><a class="button platform-register" href="{REG}" data-register target="_blank" rel="sponsored noopener">Create My Free Account <span aria-hidden="true">→</span></a><a class="button whatsapp" href="https://wa.me/27721714626" data-whatsapp target="_blank" rel="noopener">Ask Me on WhatsApp</a></div>
      <p class="mtg-fine">This is a referral link. If you register through it, the person sharing this page may earn the 10% direct commission ClickBaitPays pays on a referred member's completed ad clicks. Earnings are not guaranteed and participation involves risk.</p>
    </div>
    <ul class="mtg-rules" aria-label="Before you register">
      <li><strong>Free to register</strong><span>Paid activity starts only when you buy an Ad Campaign.</span></li>
      <li><strong>Start small</strong><span>Level 1 is {usdt(LEVELS[0]['first'])} the first time.</span></li>
      <li><strong>Referrals optional</strong><span>Your own campaign activity works without recruiting.</span></li>
    </ul>
  </div></section>'''


def disclaimer():
    return f'''<aside class="mtg-disclaimer"><strong>Please read:</strong> ClickBaitPaysUs.com is an independent education website by MTG and is not the official ClickBaitPays website. Figures come from the published ClickBaitPays campaign table and current rules, which can change, so check the official platform before you act. Nothing here is financial advice, earnings are not guaranteed and crypto activity involves risk. See the <a href="{SITE}/earnings-disclaimer.html">earnings disclaimer</a>, <a href="{SITE}/risk-disclaimer.html">risk disclaimer</a> and <a href="{SITE}/affiliate-disclosure.html">affiliate disclosure</a>.</aside>'''


def next_step(text, href, label):
    return f'<section class="mtg-section tight"><div class="mtg-next"><span>{text}</span><a class="button primary" href="{href}">{label} <span aria-hidden="true">→</span></a></div></section>'


def video_button(vid, title, label):
    return f'''<div class="landing-video-card"><button type="button" data-video-open data-video-id="{vid}" data-video-title="{esc(title)}" data-video-label="{label}" data-video-url="https://www.youtube.com/watch?v={vid}" aria-haspopup="dialog" aria-controls="video-modal"><span class="video-thumbnail"><img src="https://i.ytimg.com/vi/{vid}/maxresdefault.jpg" width="1280" height="720" loading="lazy" alt=""><span class="video-thumbnail-shade"></span><span class="video-play" aria-hidden="true"><span>▶</span></span><span class="video-watch-label">{label}</span></span><span class="video-card-copy"><small>CLICK TO PLAY</small><strong>{html.escape(title)}</strong></span></button></div>'''


# ---------------------------------------------------------------- page shell
PERSON = {'@type': 'Person', '@id': SITE + '/#mtg', 'name': 'MTG', 'alternateName': 'Musa The Giant', 'url': SITE + '/about.html', 'description': 'ClickBaitPays member, affiliate educator and creator of ClickBaitPaysUs.'}
WEBSITE = {'@type': 'WebSite', '@id': SITE + '/#website', 'name': 'ClickBaitPaysUs Learning', 'url': SITE + '/', 'inLanguage': 'en', 'publisher': {'@id': SITE + '/#mtg'}}


def page(slug, path, title, description, og_title, og_description, image_alt, body, current, extra_schema=(), scripts='', body_class='mtg-site', crumb=None):
    up = '../' if path else ''
    url = BASE + path
    image = f'{BASE}share/{slug}.png'
    crumbs = [{'@type': 'ListItem', 'position': 1, 'name': 'ClickBaitPaysUs', 'item': SITE + '/'},
              {'@type': 'ListItem', 'position': 2, 'name': 'Quick Guide', 'item': BASE}]
    if crumb:
        crumbs.append({'@type': 'ListItem', 'position': 3, 'name': crumb, 'item': url})
    graph = [WEBSITE, PERSON,
             {'@type': 'WebPage', '@id': url + '#webpage', 'url': url, 'name': title, 'headline': og_title, 'description': description,
              'inLanguage': 'en', 'isPartOf': {'@id': SITE + '/#website'}, 'author': {'@id': SITE + '/#mtg'}, 'dateModified': UPDATED,
              'primaryImageOfPage': {'@type': 'ImageObject', 'url': image, 'width': 1200, 'height': 630},
              'breadcrumb': {'@id': url + '#breadcrumb'}, 'audience': {'@type': 'Audience', 'audienceType': 'Busy beginners and team builders'}},
             {'@type': 'BreadcrumbList', '@id': url + '#breadcrumb', 'itemListElement': crumbs}]
    graph += list(extra_schema)
    schema = json.dumps({'@context': 'https://schema.org', '@graph': graph}, ensure_ascii=False, separators=(',', ':')).replace('<', '\\u003c')
    a = up + '../assets/'
    doc = f'''<!doctype html>
<html lang="en" data-theme="dark">
<head>
  <meta charset="utf-8">
  <script>try {{ if (localStorage.getItem("cbp-theme-v2") === "light") document.documentElement.dataset.theme = "light"; }} catch (e) {{}}</script>
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <title>{html.escape(title)}</title>
  <meta name="description" content="{esc(description)}">
  <meta name="author" content="MTG">
  <meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1">
  <link rel="canonical" href="{url}">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="ClickBaitPaysUs Learning">
  <meta property="og:locale" content="en_US">
  <meta property="og:title" content="{esc(og_title)}">
  <meta property="og:description" content="{esc(og_description)}">
  <meta property="og:url" content="{url}">
  <meta property="og:image" content="{image}">
  <meta property="og:image:secure_url" content="{image}">
  <meta property="og:image:type" content="image/png">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:alt" content="{esc(image_alt)}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="{esc(og_title)}">
  <meta name="twitter:description" content="{esc(og_description)}">
  <meta name="twitter:image" content="{image}">
  <meta name="twitter:image:alt" content="{esc(image_alt)}">
  <meta name="theme-color" content="#080015">
  <link rel="icon" type="image/png" href="{a}favicon.png">
  <link rel="apple-touch-icon" href="{a}logo.png">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@600;700;800&family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="{a}styles.css?v={V_ROOT}"><link rel="stylesheet" href="{a}motion.css?v=20261001-motion2"><link rel="stylesheet" href="{up}style.css?v={V_MTG}">
  <script defer src="{a}config.js"></script>
  <script defer src="{a}app.js?v={V_ROOT}"></script><script defer src="{a}motion.js?v={V_MTG}"></script>
  <script defer src="{up}member-config.js?v={V_MTG}"></script><script defer src="{up}member.js?v={V_MTG}"></script>{scripts}
  <script type="application/ld+json">{schema}</script>
</head>
<body class="{body_class}" data-page-title="{esc(crumb or 'Quick Guide')}">
  <a class="skip-link" href="#main">Skip to main content</a>
  {CIRCUIT}
  {header(up, current)}
{body}
  {VIDEO_MODAL}
  {footer(up)}
</body>
</html>
'''
    doc = no_dash(doc)
    target = OUT / path / 'index.html'
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(doc, encoding='utf-8')
    return url


def crumbs_nav(up, name):
    return f'<nav class="breadcrumbs" aria-label="Breadcrumb"><a href="{SITE}/">ClickBaitPaysUs</a><span aria-hidden="true">/</span><a href="{up}">Quick Guide</a><span aria-hidden="true">/</span><span aria-current="page">{name}</span></nav>'


# ================================================================ HOME
level_rows = ''.join(
    f'<tr><th scope="row">Level {r["level"]}</th><td>{usdt(r["first"])}</td><td>{usdt(r["later"])}</td><td>{r["ads"]}</td><td>{usdt(r["completion"], True)}</td><td class="mtg-member">{usdt(r["member"], True)}</td></tr>'
    for r in LEVELS)

home_body = f'''<main id="main">
  <section class="hero hero-v2" aria-labelledby="home-title"><div class="hero-copy">
    <p class="eyebrow">THE CLICKBAITPAYS QUICK GUIDE</p>
    <h1 id="home-title"><span class="hero-white">Advertise.</span><span class="hero-gradient">View ads.</span><span class="hero-gradient hero-advertise">Earn USDT.</span></h1>
    <p class="lead">ClickBaitPays is a paid-to-click advertising platform. Advertisers buy Ad Campaigns to reach real, participating viewers, and members earn USDT rewards for completing a few daily ad views. <strong>Short on time?</strong> This guide gives you the essentials in about 10 minutes, so you can decide, start and help your team do the same.</p>
    <div class="button-row"><button class="button primary" type="button" data-video-open data-video-id="gWkLEgBFVEY" data-video-title="ClickBaitPays Overview" data-video-label="START HERE" data-video-url="https://www.youtube.com/watch?v=gWkLEgBFVEY" aria-haspopup="dialog" aria-controls="video-modal">▶ Watch the Overview</button><a class="button platform-register" href="profit-calculator/">Calculate My Plan <span aria-hidden="true">→</span></a></div>
    <ul class="trust-list"><li>Free registration</li><li>Campaigns from {usdt(LEVELS[0]['first'])}</li><li>Referrals optional</li></ul>
  </div>{LOOP.replace('src="assets/', 'src="../assets/')}</section>

  <section class="mtg-section" aria-labelledby="path-title">
    <div class="mtg-head"><p class="eyebrow">YOUR 10-MINUTE PATH</p><h2 id="path-title">Learn just enough to act with confidence.</h2><p>Four short stops. Each one answers a question busy people ask before they commit time or money.</p></div>
    <div class="mtg-grid four">
      <a class="mtg-card" href="video-tutorials/"><span class="mtg-icon" aria-hidden="true">▶</span><small>WATCH · 1</small><h3>What is it?</h3><p>Four videos, from a quick overview to the full presentation. Start with the first one.</p><span class="mtg-go">Video tutorials →</span></a>
      <a class="mtg-card" href="profit-calculator/"><span class="mtg-icon" aria-hidden="true">▦</span><small>CALCULATE · 2</small><h3>Do the numbers work for me?</h3><p>Pick up to three campaigns and see capital, listed returns, profit, ROI and dates.</p><span class="mtg-go">Profit calculator →</span></a>
      <a class="mtg-card" href="faq/"><span class="mtg-icon" aria-hidden="true">?</span><small>ASK · 3</small><h3>What is the catch?</h3><p>Straight answers on fees, timing, withdrawals, referrals, household rules and risk.</p><span class="mtg-go">Frequently asked questions →</span></a>
      <a class="mtg-card" href="glossary/"><span class="mtg-icon" aria-hidden="true">Aa</span><small>DECODE · 4</small><h3>What do the words mean?</h3><p>{len(TERMS)} terms in plain English, searchable in seconds.</p><span class="mtg-go">Glossary →</span></a>
    </div>
  </section>

  <section class="mtg-section" aria-labelledby="steps-title">
    <div class="mtg-head"><p class="eyebrow">HOW IT WORKS</p><h2 id="steps-title">Five steps from sign-up to withdrawal.</h2><p>The whole cycle for one Ad Campaign, in plain language.</p></div>
    <div class="mtg-grid five">
      <article class="mtg-card mtg-step"><b>1</b><h3>Register free</h3><p>Create your account on the official site. Looking around costs nothing.</p></article>
      <article class="mtg-card mtg-step"><b>2</b><h3>Choose a level</h3><p>Buy an Ad Campaign from Level 1 ({usdt(LEVELS[0]['first'])} the first time) up to Level 7.</p></article>
      <article class="mtg-card mtg-step"><b>3</b><h3>View daily ads</h3><p>Complete your level's daily ads, {LEVELS[0]['ads']} to {LEVELS[-1]['ads']} a day, across 12 click days.</p></article>
      <article class="mtg-card mtg-step"><b>4</b><h3>Wait out the hold</h3><p>A fixed seven-day hold follows, then funds move to your Available Balance.</p></article>
      <article class="mtg-card mtg-step"><b>5</b><h3>Withdraw or repeat</h3><p>Request a withdrawal (10% fee, once a week) or start your next campaign.</p></article>
    </div>
  </section>

  <section class="mtg-section" aria-labelledby="levels-title">
    <div class="mtg-head"><p class="eyebrow">THE NUMBERS AT A GLANCE</p><h2 id="levels-title">Seven campaign levels.</h2><p>The first campaign at a level includes a one-time activation fee, so repeat campaigns at that level cost less. The listed member amount is 90% of the completion value.</p></div>
    <div class="table-wrap" tabindex="0" aria-label="ClickBaitPays campaign levels"><table class="mtg-table"><thead><tr><th scope="col">Level</th><th scope="col">First campaign</th><th scope="col">Repeat campaign</th><th scope="col">Ads per day</th><th scope="col">Completion value</th><th scope="col">Listed member amount</th></tr></thead><tbody>{level_rows}</tbody></table></div>
    <p class="mtg-note">Figures from the published ClickBaitPays campaign table. Rules and figures can change, so confirm them on the official platform. <a href="profit-calculator/">Run your own plan in the calculator →</a></p>
  </section>

  <section class="mtg-section" aria-labelledby="rules-title">
    <div class="mtg-head"><p class="eyebrow">THE RULES THAT MATTER</p><h2 id="rules-title">Six things to know before you start.</h2></div>
    <ul class="mtg-rules">
      <li><strong>3 active campaigns</strong><span>The maximum per account at one time, in any level combination.</span></li>
      <li><strong>12 + 7 days</strong><span>Twelve click days, then a fixed seven-day hold before release.</span></li>
      <li><strong>10% withdrawal fee</strong><span>One request per week, fulfilled manually, stated as within 48 hours.</span></li>
      <li><strong>10% direct commission</strong><span>On the ad clicks your direct referrals complete. Referring is optional.</span></li>
      <li><strong>3 household accounts</strong><span>For different adults, all with the same original sponsor.</span></li>
      <li><strong>Manual participation</strong><span>You complete your own daily ads. Check every crypto address and network.</span></li>
    </ul>
  </section>

  <section class="mtg-section" aria-labelledby="money-title">
    <div class="mtg-head"><p class="eyebrow">WHERE THE MONEY COMES FROM</p><h2 id="money-title">An advertising business, not a promise.</h2><p>These revenue sources help explain how the platform can pay rewards. They strengthen the case for sustainability, but they cannot guarantee future payouts or unchanged rules.</p></div>
    <div class="mtg-grid four">
      <article class="mtg-card"><span class="mtg-icon" aria-hidden="true">◎</span><h3>Ad Campaigns</h3><p>Advertisers pay to put approved content in front of participating viewers.</p></article>
      <article class="mtg-card"><span class="mtg-icon" aria-hidden="true">⇥</span><h3>Login ads</h3><p>$20 for 30 days, non-commissionable, and advertisers can run several.</p></article>
      <article class="mtg-card"><span class="mtg-icon" aria-hidden="true">＋</span><h3>Activation fees</h3><p>A one-time fee on the first campaign at each level.</p></article>
      <article class="mtg-card"><span class="mtg-icon" aria-hidden="true">%</span><h3>Withdrawal fee</h3><p>A 10% fee on withdrawals, limited to one request a week.</p></article>
    </div>
  </section>

  <section class="mtg-section" id="team" aria-labelledby="team-title">
    <div class="mtg-head"><p class="eyebrow">FOR TEAM BUILDERS</p><h2 id="team-title">Let one link do the explaining.</h2><p>Busy people rarely have time for long calls. Send this guide first. New people can watch the overview, run their own numbers and clear common doubts before you talk, so your conversation starts with their real questions.</p></div>
    <div class="mtg-grid three">
      <article class="mtg-card"><span class="mtg-icon" aria-hidden="true">↗</span><h3>Share the guide</h3><p>One message gives a prospect videos, numbers and answers in one place.</p><div class="button-row"><a class="button whatsapp small" href="https://wa.me/?text={esc('Busy but curious about ClickBaitPays? This quick guide shows how it works in about 10 minutes: ' + BASE)}" data-share-whatsapp data-share-url="{BASE}" target="_blank" rel="noopener">Share on WhatsApp</a><button class="button secondary small" type="button" data-copy-page data-share-url="{BASE}">Copy Page Link</button></div><p class="mtg-status" data-copy-status role="status" aria-live="polite"></p></article>
      <article class="mtg-card"><span class="mtg-icon" aria-hidden="true">▦</span><h3>Plan together</h3><p>Use the calculator side by side with a new member. Compare starting levels, or stagger up to three campaigns seven days apart.</p><span class="mtg-go"><a href="profit-calculator/">Open the calculator →</a></span></article>
      <article class="mtg-card"><span class="mtg-icon" aria-hidden="true">?</span><h3>Answer doubts fast</h3><p>Send a direct link to one answer, such as the withdrawal rules, instead of typing it out again.</p><span class="mtg-go"><a href="faq/#withdrawal-fee">See an example →</a></span></article>
    </div>
  </section>

  {register_panel('')}

  <section class="mtg-section" aria-labelledby="copy-title"><div class="mtg-panel mtg-split">
    <div class="mtg-panel-copy"><p class="eyebrow">YOUR OWN COPY</p><h2 id="copy-title">Want this guide with your referral link?</h2><p>Get these same pages for yourself or your team: home, videos, calculator, FAQ and glossary, set up with your referral link, profile image and contact links. Every visitor you send lands on a page that explains ClickBaitPays for you.</p><div class="button-row"><a class="button primary" href="request-a-copy/">Request My Copy <span aria-hidden="true">→</span></a></div></div>
    <div class="mtg-price"><strong>32 USDT</strong><span>One-time setup, paid in USDT (TRC-20)</span><ul><li>Hosting on clickbaitpaysus.com included</li><li>Your link, photo and socials</li><li>Updates for the life of your page</li></ul></div>
  </div></section>

  <section class="mtg-section tight" aria-labelledby="bw-title"><div class="mtg-sister"><span class="mtg-coin" aria-hidden="true">₿</span><div><h2 id="bw-title">Building with Bitcoin Wealth too?</h2><p>The same quick-guide format, made for Bitcoin Wealth: short videos, wallet setup guides, FAQ and glossary in one place.</p></div><a class="button" href="{BW_GUIDE}" target="_blank" rel="noopener">Visit the Bitcoin Wealth Guide <span aria-hidden="true">→</span></a></div></section>

  {next_step('Want the full picture? The complete 11-lesson ClickBaitPays course, with quizzes and progress tracking, is free.', SITE + '/dashboard.html', 'Explore the Full Course')}
  {disclaimer()}
</main>'''

home_faq_schema = {'@type': 'ItemList', 'name': 'ClickBaitPays Quick Guide sections', 'itemListElement': [
    {'@type': 'ListItem', 'position': i + 1, 'name': label, 'url': BASE + path} for i, (_s, path, label) in enumerate(PAGES[1:])]}
howto = {'@type': 'HowTo', 'name': 'How a ClickBaitPays Ad Campaign works', 'description': 'The cycle for one ClickBaitPays Ad Campaign, from free registration to withdrawal.',
         'step': [{'@type': 'HowToStep', 'position': i + 1, 'name': n, 'text': t} for i, (n, t) in enumerate([
             ('Register free', 'Create an account on the official ClickBaitPays website. Registration is free.'),
             ('Choose a campaign level', f'Buy an Ad Campaign from Level 1 ({usdt(LEVELS[0]["first"])} for the first campaign) up to Level 7.'),
             ('View daily ads', f'Complete the daily ads for your level, {LEVELS[0]["ads"]} to {LEVELS[-1]["ads"]} per day, across 12 click days.'),
             ('Wait out the hold', 'A fixed seven-day hold follows the 12 click days before funds move to Available Balance.'),
             ('Withdraw or repeat', 'Request a withdrawal, with a 10% fee and one request per week, or start the next campaign.')])]}
page('home', '', 'ClickBaitPays Explained in 10 Minutes | Quick Guide by MTG',
     'New to ClickBaitPays? Learn how it works in about 10 minutes: free registration, campaign levels from 14 USDT, daily ad views, fees, withdrawals and a profit calculator.',
     'ClickBaitPays Explained in 10 Minutes',
     'Videos, campaign numbers, a profit calculator and straight answers for busy people who want to act, and help their team do the same.',
     'ClickBaitPays Quick Guide: advertise, view ads, earn USDT, explained in 10 minutes',
     home_body, 'home', extra_schema=[home_faq_schema, howto], body_class='mtg-site landing-page')

# ================================================================ VIDEOS
video_cards = ''.join(
    f'''<article class="mtg-video"><div class="mtg-video-meta"><span{' class="start"' if i == 0 else ''}>{tag}</span><span>VIDEO {i + 1}</span></div>{video_button(vid, title, 'WATCH VIDEO ' + str(i + 1))}<h2>{html.escape(title)}</h2><p>{desc}</p></article>'''
    for i, (vid, title, tag, desc) in enumerate(VIDEOS))
videos_body = f'''<main id="main">
  {crumbs_nav('../', 'Video Tutorials')}
  <section class="page-hero compact"><p class="eyebrow">WATCH AND UNDERSTAND</p><h1>See ClickBaitPays in action.</h1><p>Four videos, in the order that makes sense. Short on time? Watch Video 1 now and save the rest for later, or share them with your team.</p><ul class="mtg-quickfacts"><li><b>Start:</b> Video 1</li><li><b>Then:</b> the income plan</li><li><b>Before logging in:</b> the back office</li></ul></section>
  <section class="mtg-section"><div class="mtg-videos">{video_cards}</div></section>
  <section class="mtg-section tight"><div class="mtg-next"><span>More walkthroughs and new videos are on the ClickBaitPaysUs YouTube channel.</span><a class="button youtube" href="{YOUTUBE}" data-youtube target="_blank" rel="noopener">Visit the YouTube Channel</a></div></section>
  {next_step('Watched the overview? Now see what a campaign could look like for your budget.', '../profit-calculator/', 'Open the Profit Calculator')}
  {register_panel('../')}
  {disclaimer()}
</main>'''
video_schema = {'@type': 'ItemList', 'name': 'ClickBaitPays video tutorials', 'itemListElement': [
    {'@type': 'ListItem', 'position': i + 1, 'item': {'@type': 'VideoObject', 'name': title, 'description': desc,
     'thumbnailUrl': [f'https://i.ytimg.com/vi/{vid}/maxresdefault.jpg', f'https://i.ytimg.com/vi/{vid}/hqdefault.jpg'],
     'embedUrl': f'https://www.youtube-nocookie.com/embed/{vid}', 'url': f'https://www.youtube.com/watch?v={vid}', 'inLanguage': 'en',
     **({'uploadDate': '2026-09-14'} if vid == '25wXab2hAB8' else {})}}
    for i, (vid, title, _t, desc) in enumerate(VIDEOS)]}
page('video-tutorials', 'video-tutorials/', 'ClickBaitPays Video Tutorials | Quick Guide by MTG',
     'Watch the ClickBaitPays overview, the income and commission plan, a back office walkthrough and the 14 September 2026 presentation, in the order that makes sense.',
     'ClickBaitPays Video Tutorials',
     'Four videos in the right order: overview, income plan, back office walkthrough and the latest presentation.',
     'ClickBaitPays video tutorials: overview, income plan, back office and presentation',
     videos_body, 'video-tutorials', extra_schema=[video_schema], crumb='Video Tutorials')

# ================================================================ CALCULATOR
calc_body = f'''<main id="main" class="calculator-main mtg-calc" data-profit-calculator>
  {crumbs_nav('../', 'Profit Calculator')}
  <header class="calculator-hero">
    <div><p class="eyebrow">PLAN IN 60 SECONDS</p><h1>ClickBaitPays Profit Calculator</h1><p>Choose a level, add up to three campaigns, and see the capital you need, listed member amounts, estimated profit, ROI and key dates. Use Quick Estimate for one level, or the Advanced Planner to mix levels and stagger start dates.</p></div>
    {CALC_CHIP}
  </header>
  {CALC}
  <section class="calculator-explainers">
    <details><summary>How This Calculation Works <span aria-hidden="true">+</span></summary><div><p>The calculator uses the fixed campaign figures from the published ClickBaitPays table. Daily, seven-day and 30-day member pace figures are spread evenly across the 12 click days. They are comparison rates and are never added to a campaign's completion value.</p><ul><li><strong>Total capital:</strong> the first total for the first campaign at a level, plus the repeat campaign cost for any additional campaign at that same level.</li><li><strong>Gross completion value:</strong> the published completion value for each campaign.</li><li><strong>Listed member amount:</strong> the published 90% member figure for each campaign.</li><li><strong>Estimated net profit:</strong> listed member amount minus total capital committed.</li><li><strong>Estimated ROI:</strong> estimated net profit divided by total capital, multiplied by 100.</li></ul></div></details>
    <details><summary>How Staggered Campaigns Work <span aria-hidden="true">+</span></summary><div><p>Campaign 1 starts on Day 0, Campaign 2 on Day 7 and Campaign 3 on Day 14. Each campaign keeps the same individual figures. Staggering changes timing and workload only. It does not increase the earning rate or guarantee weekly withdrawals.</p></div></details>
  </section>
  {CALC_DIALOG}
  {next_step('Numbers look interesting? Clear the common doubts before you start.', '../faq/', 'Read the FAQ')}
  {register_panel('../', 'Like the numbers? Start free.')}
  {disclaimer()}
</main>'''
calc_schema = {'@type': 'WebApplication', 'name': 'ClickBaitPays Profit Calculator', 'url': BASE + 'profit-calculator/', 'applicationCategory': 'FinanceApplication', 'operatingSystem': 'Any web browser',
               'isAccessibleForFree': True, 'offers': {'@type': 'Offer', 'price': '0', 'priceCurrency': 'USD'},
               'description': 'Plan up to three ClickBaitPays Ad Campaigns, simultaneous or staggered, and estimate capital, listed member amounts, profit, ROI and dates.',
               'creator': {'@id': SITE + '/#mtg'}}
page('profit-calculator', 'profit-calculator/', 'ClickBaitPays Profit Calculator | Capital, Profit and ROI',
     'Free ClickBaitPays profit calculator. Plan up to three simultaneous or staggered Ad Campaigns and estimate capital, profit, ROI and dates for Levels 1 to 7.',
     'ClickBaitPays Profit Calculator',
     'Plan up to three campaigns and see capital, listed returns, profit, ROI and dates in about a minute.',
     'ClickBaitPays Profit Calculator for planning capital, profit, ROI and dates',
     calc_body, 'profit-calculator', extra_schema=[calc_schema],
     scripts=f'\n  <script defer src="../../assets/campaign-data.js"></script><script defer src="../../assets/profit-calculator.js"></script>',
     body_class='mtg-site calculator-page', crumb='Profit Calculator')

# ================================================================ FAQ
NEW_FAQ = {
    'team': ('How can I help my team get started without explaining everything myself?',
             'Share this quick guide. It walks a new person through the videos, the profit calculator, these answers and the glossary in one place, so your conversations can focus on their real questions. You can also send a link straight to one answer, because every question on this page has its own address.'),
    'copy': ('Can I get a copy of these pages with my own referral link?',
             'Yes. For a one-time payment of 32 USDT on TRON (TRC-20), MTG sets up these pages with your referral link, profile image and contact links. Hosting on clickbaitpaysus.com and updates for the life of your page are included. Start on the <a href="../request-a-copy/">Request a Copy</a> page.'),
}
OVERRIDE = {19: ('Is this the official ClickBaitPays website?', f'No. This quick guide is part of ClickBaitPaysUs.com, an independent education website created by MTG. Official platform pages open on the clickbaitpays.me domain, and the <a href="{SITE}/dashboard.html">full 11-lesson course</a> is free on the main site.')}
ANCHORS = {17: 'withdrawal-fee', 14: 'campaign-limit', 16: 'funds-available', 21: 'referral-commission', 13: 'free-registration', 2: 'scam-or-ponzi', 18: 'household-accounts', 22: 'staggering'}
FAQ_GROUPS = [
    ('basics', 'The basics', [1, 19, 2, 3, 4, 13]),
    ('money', 'Campaigns, timing and withdrawals', [14, 23, 16, 17, 15, 22, 18]),
    ('team', 'Referrals and building a team', [21, 9, 'team', 'copy']),
    ('model', 'Advertising and sustainability', [10, 11, 12, 8, 6, 7]),
]


def slugify(value):
    return re.sub(r'[^a-z0-9]+', '-', value.lower()).strip('-')[:60].strip('-')


faq_items, n, used = [], 0, set()
faq_html = f'<nav class="mtg-faq-jump" aria-label="FAQ topics">' + ''.join(f'<a href="#{gid}">{name}</a>' for gid, name, _ in FAQ_GROUPS) + '</nav>'
for gid, name, refs in FAQ_GROUPS:
    faq_html += f'<section class="mtg-faq-group" id="{gid}" aria-labelledby="{gid}-title"><h2 id="{gid}-title">{name} <small>{len(refs)} questions</small></h2><div class="faq-list">'
    for ref in refs:
        n += 1
        if isinstance(ref, str):
            q, a = NEW_FAQ[ref]
            anchor = {'team': 'help-my-team', 'copy': 'get-a-copy'}[ref]
        else:
            q, a = OVERRIDE.get(ref, FAQ_SRC[ref])
            anchor = ANCHORS.get(ref) or slugify(strip(q))
        assert anchor not in used, anchor
        used.add(anchor)
        faq_items.append((strip(q), strip(a)))
        faq_html += f'<details id="{anchor}"><summary><span>{n:02d}</span><strong>{q}</strong><i aria-hidden="true">+</i></summary><p>{a}</p></details>'
    faq_html += '</div></section>'
faq_body = f'''<main id="main">
  {crumbs_nav('../', 'FAQ')}
  <section class="page-hero compact"><p class="eyebrow">STRAIGHT ANSWERS</p><h1>The questions people ask before they start.</h1><p>{n} short answers on fees, timing, withdrawals, referrals and risk. Tap a question to open it, or jump to a topic.</p></section>
  <section class="mtg-section">{faq_html}</section>
  {next_step('Met a word you did not know? Every term is explained in plain English.', '../glossary/', 'Open the Glossary')}
  {register_panel('../', 'Doubts cleared? Start free.')}
  {disclaimer()}
</main>'''
faq_schema = {'@type': 'FAQPage', '@id': BASE + 'faq/#faq', 'mainEntity': [{'@type': 'Question', 'name': q, 'acceptedAnswer': {'@type': 'Answer', 'text': a}} for q, a in faq_items]}
page('faq', 'faq/', 'ClickBaitPays FAQ | Fees, Withdrawals, Referrals and Risk',
     f'{n} straight answers about ClickBaitPays: is it legit, free registration, the 3-campaign limit, the 7-day hold, the 10% withdrawal fee and referrals.',
     'ClickBaitPays FAQ: Straight Answers',
     'Fees, timing, withdrawals, referrals, household rules and risk, answered in plain English.',
     'ClickBaitPays FAQ: straight answers on fees, withdrawals, referrals and risk',
     faq_body, 'faq', extra_schema=[faq_schema], crumb='FAQ')

# ================================================================ GLOSSARY
term_cards = ''.join(
    f'<article id="{slugify(strip(name))}" data-glossary-term="{key}"><span>{letter}</span><h2>{name}</h2><p>{absolute_links(text)}</p></article>'
    for key, letter, name, text in TERMS)
glossary_body = f'''<main id="main">
  {crumbs_nav('../', 'Glossary')}
  <section class="page-hero compact"><p class="eyebrow">PLAIN-ENGLISH DEFINITIONS</p><h1>Know the words. Move with confidence.</h1><p>{len(TERMS)} ClickBaitPays, advertising and crypto terms explained in one or two sentences. Type a word to filter the list.</p><label class="search-box"><span class="sr-only">Search the glossary</span><input type="search" placeholder="Search activation, hold, USDT..." data-glossary-search></label></section>
  <section class="mtg-section">{CALLOUT}<div class="glossary-grid" data-glossary-grid>{term_cards}</div><p class="empty-state" data-glossary-empty hidden>No matching term found. Try a shorter word.</p></section>
  {next_step('Ready to see the terms in action? Watch how the platform works.', '../video-tutorials/', 'Watch the Videos')}
  {register_panel('../')}
  {disclaimer()}
</main>'''
glossary_schema = {'@type': 'DefinedTermSet', '@id': BASE + 'glossary/#terms', 'name': 'ClickBaitPays Glossary', 'hasDefinedTerm': [
    {'@type': 'DefinedTerm', 'name': strip(name), 'description': strip(text), 'url': BASE + 'glossary/#' + slugify(strip(name)), 'inDefinedTermSet': BASE + 'glossary/#terms'} for _k, _l, name, text in TERMS]}
page('glossary', 'glossary/', 'ClickBaitPays Glossary | Terms in Plain English',
     f'{len(TERMS)} ClickBaitPays terms in plain English: activation fee, Ad Campaign, Available Balance, holding period, USDT, TRC-20, affiliate link and more.',
     'ClickBaitPays Glossary: Terms in Plain English',
     f'{len(TERMS)} campaign, advertising and crypto terms, each explained in a sentence or two.',
     'ClickBaitPays glossary of campaign, advertising and crypto terms in plain English',
     glossary_body, 'glossary', extra_schema=[glossary_schema], crumb='Glossary')

# ================================================================ REQUEST A COPY
ADDRESS = 'TFx7DMtb5PuSmGTVe6LnCwLxEF7b8mutBt'
request_body = f'''<main id="main">
  {crumbs_nav('../', 'Request a Copy')}
  <section class="page-hero compact"><p class="eyebrow">YOUR OWN CLICKBAITPAYS QUICK GUIDE</p><h1>This guide, with your referral link.</h1><p>Get these exact pages for yourself or your team: home, videos, profit calculator, FAQ and glossary, personalized with your referral link, profile image and contact links. Share one link and let the page explain ClickBaitPays while you get on with your day.</p></section>
  <section class="mtg-section">
    <div class="mtg-overview"><div><strong>32 USDT once</strong><span>One-time setup. No monthly website fee.</span></div><div><strong>Hosting included</strong><span>No extra charge for your page on clickbaitpaysus.com.</span></div><div><strong>Lifetime updates</strong><span>Changes to your page at no further fee for the life of your page.</span></div><div><strong>Ready to share</strong><span>Mobile-friendly pages, videos, calculator and answers with your links.</span></div></div>
    <p class="mtg-domain">Want your own domain instead? We can help connect it for a small additional setup fee, quoted before any work begins. You pay domain purchase and renewal charges directly to your registrar.</p>

    <section class="mtg-panel mtg-step-panel" aria-labelledby="payment-title"><p class="eyebrow">STEP 1 OF 2 · MAKE YOUR PAYMENT</p><h2 id="payment-title">Send exactly 32 USDT on TRON (TRC-20).</h2><p>Use the TRON (TRC-20) network only. Check the full address in your wallet before sending. If your exchange deducts a withdrawal fee, make sure 32 USDT arrives. Keep your transaction ID and a screenshot or PDF of the confirmation. Pay only the base website fee now; optional domain setup is quoted separately.</p>
      <div class="mtg-address"><span id="payment-address" data-payment-address>{ADDRESS}</span><button type="button" data-copy-address aria-label="Copy the TRON USDT payment address">Copy Address</button></div><p class="mtg-address-status" data-address-status role="status" aria-live="polite"></p>
      <label class="mtg-verify" for="address-check">Verify before paying: paste the copied address here<input id="address-check" data-verify-address type="text" autocomplete="off" spellcheck="false" placeholder="Paste and check for an exact match"></label><p class="mtg-verify-status" data-verify-status role="status" aria-live="polite">A copy confirmation is not a payment confirmation. Always check the address and network in your wallet.</p>
      <p class="mtg-payment-note">This payment is for your personalized website copy only. It is separate from any ClickBaitPays Ad Campaign purchase or activation fee. Do not use another network or token. Network fees may apply.</p>
    </section>

    <section class="mtg-panel mtg-step-panel" aria-labelledby="form-title"><p class="eyebrow">STEP 2 OF 2 · TELL US WHAT TO CUSTOMIZE</p><h2 id="form-title">Complete your request after paying.</h2><p>This form prepares a WhatsApp message to <strong>MTG 👑</strong>. Your browser cannot attach files automatically: after WhatsApp opens, add your selected image and proof of payment, then press Send.</p>
      <form id="copy-request-form" class="mtg-form" data-copy-request>
        <fieldset><legend>Your contact details</legend>
          <div class="mtg-form-grid"><label>Full name <span aria-hidden="true">*</span><input name="fullName" type="text" autocomplete="name" minlength="2" maxlength="80" required placeholder="Your name"></label><label>WhatsApp contact number <span aria-hidden="true">*</span><input name="contactNumber" type="tel" autocomplete="tel" inputmode="tel" minlength="7" maxlength="24" required placeholder="+27 72 123 4567"></label></div>
          <label>Preferred page name or URL ending <span class="mtg-optional">optional</span><input name="pageName" type="text" maxlength="80" placeholder="For example, /thandi or Thandi's ClickBaitPays guide"></label>
        </fieldset>
        <fieldset><legend>Your page details</legend>
          <label>Your ClickBaitPays referral link <span aria-hidden="true">*</span><input name="referralUrl" type="url" required maxlength="250" placeholder="https://clickbaitpays.me/join.php?ref=yourname" autocomplete="off"><small>Find it in your ClickBaitPays back office. This is the link visitors will copy and use to register.</small></label>
          <label>Profile picture or logo <span class="mtg-optional">optional</span><input name="profilePhoto" type="file" accept="image/png,image/jpeg,image/webp"><small>JPG, PNG or WebP, up to 8 MB. Leave blank to use the ClickBaitPays logo. You will attach it in WhatsApp.</small></label>
          <div class="mtg-form-grid"><label>Your WhatsApp link <span class="mtg-optional">optional</span><input name="memberWhatsapp" type="url" maxlength="250" placeholder="https://wa.me/..." autocomplete="off"><small>If blank, we can make one from your contact number.</small></label><label>WhatsApp group invite <span class="mtg-optional">optional</span><input name="memberGroup" type="url" maxlength="250" placeholder="https://chat.whatsapp.com/..." autocomplete="off"><small>Only if you want visitors sent to your group.</small></label></div>
          <label>Which WhatsApp link should appear on your page? <select name="whatsappChoice"><option value="contact">My personal WhatsApp link or contact number</option><option value="group">My WhatsApp group invite link</option></select></label>
          <div class="mtg-form-grid"><label>YouTube channel <span class="mtg-optional">optional</span><input name="youtubeUrl" type="url" maxlength="250" placeholder="https://www.youtube.com/@..." autocomplete="off"></label><label>TikTok page <span class="mtg-optional">optional</span><input name="tiktokUrl" type="url" maxlength="250" placeholder="https://www.tiktok.com/@..." autocomplete="off"></label></div>
          <label>Facebook page <span class="mtg-optional">optional</span><input name="facebookUrl" type="url" maxlength="250" placeholder="https://www.facebook.com/..." autocomplete="off"></label>
          <div class="mtg-form-grid"><label>Would you like help with a custom domain? <select name="customDomainHelp"><option value="no">No, use the included clickbaitpaysus.com hosting</option><option value="need-help">Yes, please quote domain setup</option><option value="already-own">Yes, I already have a domain</option></select></label><label>Your domain name, if you have one <span class="mtg-optional">optional</span><input name="customDomainName" type="text" maxlength="150" placeholder="example.com" autocomplete="off"><small>We agree on the optional setup fee before starting.</small></label></div>
          <label>Other details or changes you want <span class="mtg-optional">optional</span><textarea name="notes" rows="3" maxlength="600" placeholder="Tell me what you want your page to say or show."></textarea></label>
        </fieldset>
        <fieldset><legend>Payment confirmation</legend>
          <label>TRON transaction ID or exchange withdrawal reference <span aria-hidden="true">*</span><input name="paymentReference" type="text" minlength="8" maxlength="120" required placeholder="Paste the transaction hash or payment reference"><small>This helps us match your payment to your request.</small></label>
          <label>Proof of payment <span aria-hidden="true">*</span><input name="paymentProof" type="file" accept="image/png,image/jpeg,image/webp,application/pdf" required><small>Screenshot or PDF, up to 10 MB. You will attach it in the WhatsApp chat.</small></label>
          <label class="mtg-check"><input name="paymentConfirmed" type="checkbox" required><span>I have sent 32 USDT on TRON (TRC-20) to the address above, and I will attach my payment proof in WhatsApp before sending this request.</span></label>
        </fieldset>
        <button class="button primary mtg-submit" type="submit">Open WhatsApp With My Request <span aria-hidden="true">→</span></button><p class="mtg-form-hint">This opens a prepared WhatsApp message. Your request reaches us only after you attach the files and tap Send. We verify payment before starting your page.</p>
        <div class="mtg-form-status" data-form-status role="status" aria-live="polite"></div>
      </form>
      <div class="mtg-after" data-order-after hidden><strong>Finish in WhatsApp</strong><p>Attach your profile image (if selected) and your payment proof in the chat, then tap Send. Your form is still here if you need to check a detail.</p><a href="#" data-whatsapp-reopen target="_blank" rel="noopener noreferrer">Open the Prepared Message Again →</a><button type="button" data-copy-request-details>Copy Request Text</button></div>
    </section>
  </section>

  <section class="mtg-section" aria-labelledby="before-title"><div class="mtg-panel"><p class="eyebrow">BEFORE YOU SEND</p><h2 id="before-title">What your 32 USDT covers.</h2><p>Setup of all six pages, your profile image, referral link and contact links. Hosting on clickbaitpaysus.com has no extra charge, and updates to your page are included for its lifetime. We start once your payment is matched to your request, and we will contact you on WhatsApp if a detail is missing. Custom domain setup is optional and quoted separately.</p><div class="button-row"><a class="button secondary" href="../faq/#get-a-copy">Read the Copy FAQ</a><a class="button whatsapp" href="https://wa.me/27721714626" target="_blank" rel="noopener">Ask MTG a Question</a></div></div></section>

  <section class="mtg-section" aria-labelledby="traffic-title">
    <div class="mtg-head"><p class="eyebrow">AFTER YOUR PAGE IS READY</p><h2 id="traffic-title">Your page explains. Advertising helps people find it.</h2><p>Keep doing what works for you: status posts, lives, videos and conversations. Your page gives curious people a place to explore at their own pace.</p></div>
    <div class="mtg-grid two">
      <article class="mtg-card"><span class="mtg-icon" aria-hidden="true">◎</span><h3>Advertise your page on ClickBaitPays</h3><p>An approved Ad Campaign can put your page in front of participating viewers. Some may register, many may not, and campaign costs are separate from this 32 USDT service.</p></article>
      <article class="mtg-card"><span class="mtg-icon" aria-hidden="true">₿</span><h3>Also sharing Bitcoin Wealth?</h3><p>A matching Bitcoin Wealth quick guide is available too, with videos, wallet setup guides, FAQ and glossary.</p><span class="mtg-go"><a href="https://bitcoinwealthpays.com/mtg/request-a-copy/" target="_blank" rel="noopener">Get the Bitcoin Wealth copy →</a></span></article>
    </div>
  </section>
  {disclaimer()}
</main>'''
service_schema = {'@type': 'Service', 'name': 'Personalized ClickBaitPays Quick Guide', 'serviceType': 'Personalized affiliate education website', 'provider': {'@id': SITE + '/#mtg'},
                  'url': BASE + 'request-a-copy/', 'description': 'A personalized copy of the ClickBaitPays Quick Guide with your referral link, profile image and contact links, hosted on clickbaitpaysus.com.',
                  'offers': {'@type': 'Offer', 'price': '32', 'priceCurrency': 'USDT', 'description': 'One-time setup fee paid in USDT on TRON (TRC-20). Hosting and lifetime updates included.'}}
page('request-a-copy', 'request-a-copy/', 'Get Your Own ClickBaitPays Quick Guide | 32 USDT Once',
     'Get this ClickBaitPays quick guide with your own referral link, profile image and contact links. One-time 32 USDT, hosting and lifetime updates included.',
     'Your Own ClickBaitPays Quick Guide',
     'These pages, with your referral link, photo and contact links. 32 USDT once, hosting and updates included.',
     'Personalized ClickBaitPays Quick Guide with your referral link, 32 USDT once',
     request_body, 'request-a-copy', extra_schema=[service_schema],
     scripts=f'\n  <script defer src="../copy-request.js?v={V_MTG}"></script>', crumb='Request a Copy')

# ================================================================ sitemap
urls = ''.join(
    f'<url><loc>{BASE}{path}</loc><lastmod>{UPDATED}</lastmod><image:image><image:loc>{BASE}share/{slug}.png</image:loc></image:image></url>\n'
    for slug, path, _l in PAGES)
(OUT / 'sitemap.xml').write_text('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n' + urls + '</urlset>\n', encoding='utf-8')
print(f'Built {len(PAGES)} quick guide pages, {n} FAQ answers, {len(TERMS)} glossary terms.')
