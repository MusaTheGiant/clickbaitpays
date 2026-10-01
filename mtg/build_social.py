"""Generate the 1200x630 share images for the Quick Guide pages (mtg/share/*.png).

Uses Orbitron when available (set ORBITRON_DIR to a folder with orbitron-latin-*-normal.woff),
otherwise falls back to DejaVu Sans.
"""
from pathlib import Path
import os
from PIL import Image, ImageDraw, ImageFont, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
DEST = ROOT / 'mtg' / 'share'
DEST.mkdir(exist_ok=True)
ORB = Path(os.environ.get('ORBITRON_DIR', ''))
POP = Path('/usr/share/fonts/truetype/google-fonts')
DEJAVU = Path('/usr/share/fonts/truetype/dejavu')


def font(kind, size):
    options = {
        'display': [ORB / 'orbitron-latin-800-normal.woff', DEJAVU / 'DejaVuSans-Bold.ttf'],
        'label': [ORB / 'orbitron-latin-700-normal.woff', DEJAVU / 'DejaVuSans-Bold.ttf'],
        'body': [POP / 'Poppins-Medium.ttf', POP / 'Poppins-Regular.ttf', DEJAVU / 'DejaVuSans.ttf'],
    }[kind]
    for path in options:
        if path.is_file():
            return ImageFont.truetype(str(path), size)
    raise SystemExit('No usable font found')


CYAN, PINK, GREEN, WHITE, MUTED = (0, 229, 255), (255, 0, 223), (70, 242, 173), (255, 255, 255), (190, 184, 214)
PAGES = {
    'home': ('QUICK GUIDE', ['ClickBaitPays', 'in 10 minutes.'], 'Videos, numbers and straight answers for busy people.', 'clickbaitpaysus.com/mtg'),
    'video-tutorials': ('VIDEO TUTORIALS', ['Watch it work.', 'Four videos.'], 'Overview, income plan, back office and the latest presentation.', 'clickbaitpaysus.com/mtg'),
    'profit-calculator': ('PROFIT CALCULATOR', ['Plan your', 'campaigns.'], 'Capital, listed returns, profit, ROI and dates for Levels 1 to 7.', 'clickbaitpaysus.com/mtg'),
    'faq': ('FAQ', ['Straight', 'answers.'], 'Fees, timing, withdrawals, referrals and risk in plain English.', 'clickbaitpaysus.com/mtg'),
    'glossary': ('GLOSSARY', ['Know the', 'words.'], 'Campaign, advertising and crypto terms, explained simply.', 'clickbaitpaysus.com/mtg'),
    'request-a-copy': ('YOUR OWN COPY', ['This guide.', 'Your link.'], '32 USDT once. Hosting and lifetime updates included.', 'clickbaitpaysus.com/mtg/request-a-copy'),
}

logo = Image.open(ROOT / 'assets' / 'logo.png').convert('RGBA').resize((210, 210), Image.Resampling.LANCZOS)


def gradient_text(base, xy, text, fnt):
    d = ImageDraw.Draw(base)
    box = d.textbbox(xy, text, font=fnt)
    w, h = box[2] - box[0], box[3] - box[1]
    grad = Image.new('RGBA', (w, h))
    gd = ImageDraw.Draw(grad)
    for x in range(w):
        t = x / max(1, w - 1)
        gd.line([(x, 0), (x, h)], fill=tuple(int(CYAN[i] + (PINK[i] - CYAN[i]) * t) for i in range(3)) + (255,))
    mask = Image.new('L', (w, h), 0)
    ImageDraw.Draw(mask).text((xy[0] - box[0], xy[1] - box[1]), text, font=fnt, fill=255)
    base.paste(grad, (box[0], box[1]), mask)


for slug, (label, lines, sub, url) in PAGES.items():
    art = Image.new('RGBA', (1200, 630), (8, 0, 21, 255))
    glow = Image.new('RGBA', art.size, (0, 0, 0, 0))
    g = ImageDraw.Draw(glow)
    g.ellipse((760, 40, 1240, 520), fill=(255, 0, 223, 50))
    g.ellipse((640, 160, 1060, 600), fill=(0, 229, 255, 38))
    g.ellipse((-200, 380, 300, 820), fill=(0, 229, 255, 30))
    art = Image.alpha_composite(art, glow.filter(ImageFilter.GaussianBlur(80)))
    d = ImageDraw.Draw(art)
    # circuit traces
    for y, c in ((70, CYAN), (588, PINK)):
        d.line([(0, y), (120, y), (150, y + (30 if y < 300 else -30)), (300, y + (30 if y < 300 else -30))], fill=c + (90,), width=2)
    d.rounded_rectangle((28, 28, 1172, 602), radius=30, outline=CYAN + (110,), width=2)
    # badge
    d.rounded_rectangle((72, 70, 72 + 22 + d.textlength('CLICKBAITPAYS  /  MTG', font=font('label', 18)) + 22, 114), radius=22, fill=(20, 8, 44, 255), outline=PINK + (150,), width=2)
    d.text((94, 81), 'CLICKBAITPAYS  /  MTG', font=font('label', 18), fill=PINK)
    d.text((76, 168), label, font=font('label', 22), fill=CYAN)
    size = 70
    while max(d.textlength(t, font=font('display', size)) for t in lines) > 640:
        size -= 2
    d.text((72, 208), lines[0], font=font('display', size), fill=WHITE)
    gradient_text(art, (72, 208 + int(size * 1.18)), lines[1], font('display', size))
    d = ImageDraw.Draw(art)
    d.line((76, 438, 300, 438), fill=CYAN, width=4)
    d.text((76, 462), sub, font=font('body', 25), fill=MUTED)
    d.text((76, 535), url, font=font('label', 20), fill=WHITE)
    # logo in glowing ring
    cx, cy = 930, 282
    ring = Image.new('RGBA', art.size, (0, 0, 0, 0))
    rd = ImageDraw.Draw(ring)
    rd.ellipse((cx - 150, cy - 150, cx + 150, cy + 150), outline=CYAN + (255,), width=4)
    rd.ellipse((cx - 172, cy - 172, cx + 172, cy + 172), outline=PINK + (120,), width=2)
    art = Image.alpha_composite(art, ring.filter(ImageFilter.GaussianBlur(10)))
    art = Image.alpha_composite(art, ring)
    d = ImageDraw.Draw(art)
    d.ellipse((cx - 140, cy - 140, cx + 140, cy + 140), fill=(10, 4, 26, 255))
    lmask = Image.new('L', logo.size, 0)
    ImageDraw.Draw(lmask).rounded_rectangle((6, 6, 203, 203), radius=40, fill=255)
    art.paste(logo, (cx - 105, cy - 105), lmask)
    art.convert('RGB').save(DEST / f'{slug}.png', optimize=True)
print('Generated', len(PAGES), 'share images in', DEST)
