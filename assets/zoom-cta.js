/* Live on Zoom calendar strip, one per income stream (MTG, 16 Nov 2026): JetUP pages link to mtgtribe.com/jetup/zoom/,
   Bitcoin Wealth pages to mtgtribe.com/bw/dashboard/live-on-zoom/, other pages show nothing.
   One line on any page:  <script src="/assets/zoom-cta.js" defer></script>
   Inserts a compact card right before the page's first <footer> (else at the end of <main>, else at the end of <body>).
   Self-contained: no dependencies, one <style> injected once, every class starts with mtgz-, so the host page's own
   styles are never touched. All links are absolute (some pages are exported to another domain).
   Does nothing on mtgtribe.com/jetup/zoom/ (and the old /jetuplive/ and /zoom/) and mtgtribe.com/group/, and never inserts twice. */
(function () {
  'use strict';
  var d = document, w = window;
  if (w.__mtgzDone) return;
  var host = (location.hostname || '').replace(/^www\./, '');
  if (host === 'mtgtribe.com' && /^\/(jetup\/zoom|jetuplive|zoom|group|bw\/dashboard\/live-on-zoom)(\/|$)/i.test(location.pathname)) return;
  // Bitcoin Wealth pages show the Bitcoin Wealth schedule (MTG, 16 Nov 2026: 'link it ... to all the mtgtribe.com/bw pages only')
  var BW = /^\/(bw|bwcopy)(\/|$)/i.test(location.pathname) || /bitcoinwealth/i.test(host);
  var JU = /^\/(jetup|jetupzoom)(\/|$)/i.test(location.pathname);
  // Each income stream shows only its own Zoom schedule (MTG, 16 Nov 2026): JetUP on JetUP pages, Bitcoin Wealth on
  // Bitcoin Wealth pages, and no card on the other streams' pages (ALTRUVA, Canton, the home page, the dashboard).
  if (!BW && !JU) return;
  var D = BW ? {kick: 'Bitcoin Wealth · Weekly', name: 'Bitcoin Wealth', url: 'https://mtgtribe.com/bw/dashboard/live-on-zoom/',
    days: 'Mon to Fri 14:00 English <span class="mtgz-dot" aria-hidden="true">·</span> Evenings in isiXhosa, English, isiZulu and Sesotho'}
    : {kick: 'JetUP · Weekly', name: 'JetUP', url: 'https://mtgtribe.com/jetup/zoom/',
    days: 'Tue <span class="mtgz-dot" aria-hidden="true">·</span> Thu <span class="mtgz-dot" aria-hidden="true">·</span> Sat 8pm <span class="mtgz-dot" aria-hidden="true">·</span> Sun 3pm international <span class="mtgz-dot" aria-hidden="true">·</span> Sun 8pm training'};

  var CSS = [
    '.mtgz{all:initial;display:block;box-sizing:border-box;width:auto;max-width:980px;margin:48px auto;margin-left:max(16px,calc((100% - 980px) / 2));margin-right:max(16px,calc((100% - 980px) / 2));',
    'font-family:Manrope,system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif;font-size:16px;line-height:1.5;color:#fbf8f2;text-align:left;-webkit-font-smoothing:antialiased;position:relative;z-index:1;clear:both}',
    '.mtgz div,.mtgz span,.mtgz a,.mtgz i,.mtgz svg,.mtgz span:before,.mtgz span:after,.mtgz a:before,.mtgz a:after{box-sizing:border-box;margin:0;padding:0;border:0;font:inherit;color:inherit;letter-spacing:normal;text-transform:none;text-decoration:none;background:none;box-shadow:none;text-shadow:none;float:none;min-width:0;max-width:none;width:auto;height:auto;position:static;opacity:1;transform:none;filter:none}',
    '.mtgz .mtgz-card{position:relative;display:grid;grid-template-columns:auto minmax(0,1fr) auto;align-items:center;gap:22px;padding:22px 24px;border-radius:22px;overflow:hidden;',
    'background:radial-gradient(420px 180px at 0% 0%,rgba(242,173,60,.20),transparent 70%),radial-gradient(520px 220px at 100% 100%,rgba(70,100,210,.22),transparent 70%),linear-gradient(150deg,#121d42,#0a1128 55%,#070b1b);',
    'box-shadow:inset 0 0 0 1px rgba(242,173,60,.42),inset 0 1px 0 rgba(255,255,255,.12),0 24px 60px rgba(0,0,0,.45)}',
    /* the mini calendar page */
    '.mtgz .mtgz-cal{position:relative;display:block;width:78px;padding-top:9px;flex:none}',
    '.mtgz .mtgz-rings{position:absolute;left:0;right:0;top:0;display:flex;justify-content:space-around;padding:0 12px;z-index:2}',
    '.mtgz .mtgz-rings i{display:block;width:7px;height:18px;border-radius:4px;background:linear-gradient(90deg,#7a4a0c,#ffe2aa 35%,#f2ad3c 60%,#b8741a);box-shadow:0 2px 4px rgba(0,0,0,.5)}',
    '.mtgz .mtgz-page{display:block;border-radius:12px;overflow:hidden;background:linear-gradient(180deg,#fffdf7,#f3ecdc);box-shadow:0 2px 0 #d9ceb3,0 4px 0 -1px #efe6d0,0 14px 26px rgba(0,0,0,.5)}',
    '.mtgz .mtgz-head{display:block;padding:11px 0 5px;background:linear-gradient(180deg,#e2413f,#b5262a);color:#fff;text-align:center;font:800 12px/1 Manrope,system-ui,sans-serif;letter-spacing:.2em;padding-left:.2em}',
    '.mtgz .mtgz-face{display:block;padding:6px 0 8px;text-align:center;font-size:34px;line-height:1;font-family:"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif}',
    /* the words */
    '.mtgz .mtgz-txt{display:block}',
    '.mtgz .mtgz-kick{display:block;color:#ffd98e;font-weight:800;font-size:11.5px;line-height:1.3;letter-spacing:.2em;text-transform:uppercase}',
    '.mtgz .mtgz-title{display:block;margin-top:6px;font:400 clamp(22px,3.2vw,30px)/1.05 Anton,Impact,"Arial Narrow Bold",sans-serif;letter-spacing:.01em;text-transform:uppercase;color:#fff}',
    '.mtgz .mtgz-gold{text-transform:inherit;letter-spacing:inherit;background:linear-gradient(180deg,#fff3d6,#ffd98e 30%,#f2ad3c 62%,#b8741a);-webkit-background-clip:text;background-clip:text;color:transparent;-webkit-text-fill-color:transparent}',
    '.mtgz .mtgz-days{display:block;margin-top:9px;color:#eef0f7;font-weight:800;font-size:15px;line-height:1.45}',
    '.mtgz .mtgz-dot{color:#f2ad3c;padding:0 2px}',
    '.mtgz .mtgz-tz{display:inline-flex;align-items:center;gap:6px;margin-top:9px;padding:4px 10px;border-radius:999px;background:rgba(242,173,60,.12);box-shadow:inset 0 0 0 1px rgba(242,173,60,.38);color:#f7e6bf;font-weight:700;font-size:12.5px;line-height:1.35}',
    /* the actions */
    '.mtgz .mtgz-acts{display:flex;flex-direction:column;align-items:stretch;gap:10px;text-align:center}',
    '.mtgz a.mtgz-btn{display:inline-flex;align-items:center;justify-content:center;gap:10px;min-height:50px;padding:12px 20px;border-radius:14px;cursor:pointer;',
    'background:linear-gradient(180deg,#ffd98e,#f2ad3c);color:#1a1002;font-weight:800;font-size:13.5px;line-height:1.2;letter-spacing:.07em;text-transform:uppercase;text-align:center;',
    'box-shadow:inset 0 0 0 1px rgba(255,236,190,.6),0 10px 22px rgba(0,0,0,.35);transition:transform .2s,filter .2s}',
    '.mtgz a.mtgz-btn:hover{transform:translateY(-2px);filter:brightness(1.06)}',
    '.mtgz a.mtgz-btn svg{display:block;width:18px;height:18px;flex:none}',
    '.mtgz a.mtgz-link{display:inline-flex;align-items:center;justify-content:center;gap:7px;padding:4px 2px;color:#7ff0a8;font-weight:700;font-size:13.5px;line-height:1.35;text-decoration:underline;text-decoration-color:rgba(127,240,168,.45);text-underline-offset:3px}',
    '.mtgz a.mtgz-link:hover{color:#b6ffd0}',
    '.mtgz a.mtgz-link svg{display:block;width:16px;height:16px;flex:none}',
    '.mtgz a:focus-visible{outline:3px solid #ffd98e;outline-offset:3px}',
    /* tablets: actions under the words; phones: everything stacked */
    '@media (max-width:760px){.mtgz .mtgz-card{grid-template-columns:auto minmax(0,1fr);gap:16px 18px;padding:20px}.mtgz .mtgz-acts{grid-column:1/-1}}',
    '@media (max-width:420px){.mtgz{margin-top:36px;margin-bottom:36px}.mtgz .mtgz-card{gap:14px;padding:18px 16px}.mtgz .mtgz-cal{width:62px}.mtgz .mtgz-face{font-size:26px}.mtgz .mtgz-head{font-size:10.5px;padding-top:10px}.mtgz .mtgz-days{font-size:14px}}',
    '@media (prefers-reduced-motion:no-preference){.mtgz .mtgz-face{animation:mtgz-tick 4s ease-in-out infinite}}',
    '@keyframes mtgz-tick{0%,86%,100%{transform:none}90%{transform:rotate(-10deg)}95%{transform:rotate(8deg)}}'
  ].join('');

  var WA = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.16-.17.2-.35.22-.64.08-.3-.15-1.26-.47-2.39-1.48-.88-.79-1.48-1.76-1.65-2.06-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.61-.92-2.2-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48 0 1.46 1.07 2.88 1.21 3.07.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.7.63.71.22 1.36.19 1.87.12.57-.09 1.76-.72 2-1.41.25-.7.25-1.29.18-1.41-.08-.13-.27-.2-.57-.35m-5.42 7.4h-.01a9.87 9.87 0 0 1-5.03-1.38l-.36-.21-3.74.98 1-3.65-.24-.37a9.86 9.86 0 0 1-1.51-5.26c0-5.45 4.44-9.88 9.89-9.88 2.64 0 5.12 1.03 6.99 2.9a9.82 9.82 0 0 1 2.89 6.99c0 5.45-4.44 9.88-9.88 9.88m8.41-18.3A11.82 11.82 0 0 0 12.05 0C5.5 0 .16 5.34.16 11.89c0 2.1.55 4.14 1.59 5.95L.06 24l6.3-1.65a11.88 11.88 0 0 0 5.69 1.45h.01c6.55 0 11.89-5.34 11.89-11.89 0-3.18-1.24-6.17-3.48-8.41Z"/></svg>';
  var CAL = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/><path d="M8 14h.01"/><path d="M12 14h.01"/><path d="M16 14h.01"/><path d="M8 18h.01"/><path d="M12 18h.01"/></svg>';

  var HTML =
    '<div class="mtgz-card">' +
      '<span class="mtgz-cal" aria-hidden="true"><span class="mtgz-rings"><i></i><i></i><i></i></span>' +
        '<span class="mtgz-page"><span class="mtgz-head">LIVE</span><span class="mtgz-face">🕗</span></span></span>' +
      '<span class="mtgz-txt">' +
        '<span class="mtgz-kick">' + D.kick + '</span>' +
        '<span class="mtgz-title" role="heading" aria-level="2"><span aria-hidden="true">📣 </span><span class="mtgz-gold">' + D.name + '</span> live on <span class="mtgz-gold">Zoom</span></span>' +
        '<span class="mtgz-days">' + D.days + '</span>' +
        '<span class="mtgz-tz">South African time (SAST)</span>' +
      '</span>' +
      '<span class="mtgz-acts">' +
        '<a class="mtgz-btn" href="' + D.url + '">' + CAL + 'See the full schedule</a>' +
        '<a class="mtgz-link" href="https://mtgtribe.com/group/">' + WA + 'Get the Zoom link on WhatsApp</a>' +
      '</span>' +
    '</div>';

  function mount() {
    if (w.__mtgzDone || d.querySelector('.mtgz')) { w.__mtgzDone = true; return; }
    w.__mtgzDone = true;
    if (!d.getElementById('mtgz-style')) {
      var st = d.createElement('style'); st.id = 'mtgz-style'; st.textContent = CSS;
      (d.head || d.documentElement).appendChild(st);
    }
    /* the card's two fonts (Anton title, Manrope text), only if the page does not load them already */
    var hasFonts = false, links = d.querySelectorAll('link[href*="fonts.googleapis.com"]');
    for (var k = 0; k < links.length; k++) if (/Anton/.test(links[k].href) && /Manrope/.test(links[k].href)) hasFonts = true;
    if (!hasFonts && !d.getElementById('mtgz-fonts')) {
      var fl = d.createElement('link'); fl.id = 'mtgz-fonts'; fl.rel = 'stylesheet';
      fl.href = 'https://fonts.googleapis.com/css2?family=Anton&family=Manrope:wght@700;800&display=swap';
      (d.head || d.documentElement).appendChild(fl);
    }
    var box = d.createElement('aside');
    box.className = 'mtgz';
    box.setAttribute('aria-label', D.name + ' live Zoom sessions');
    box.innerHTML = HTML;
    var foot = d.querySelector('footer'), main = d.querySelector('main');
    if (foot && foot.parentNode) foot.parentNode.insertBefore(box, foot);
    else if (main) main.appendChild(box);
    else d.body.appendChild(box);
  }
  if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', mount); else mount();
})();
