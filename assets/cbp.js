/* ClickBaitPays Guide by MTG: the video player, the Up and Down buttons, the calculator and the order form.
   The dashboard menu itself is the shared MTG Dashboard Standard (/assets/mtg-dash.js). */
(function () {
  'use strict';
  var d = document, w = window, html = d.documentElement;
  var RM = w.matchMedia && w.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function $(s, r) { return (r || d).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || d).querySelectorAll(s)); }
  function on(el, ev, fn, o) { if (el) el.addEventListener(ev, fn, o || false); }
  function quiet(p) { if (p && p.catch) p.catch(function () {}); }
  var V = w.CBPV || {};

  /* ------------------------------------------------------------ toast */
  var toastEl = $('#toast'), toastT;
  function toast(msg) {
    if (!toastEl) return;
    toastEl.textContent = msg; toastEl.classList.add('on');
    clearTimeout(toastT); toastT = setTimeout(function () { toastEl.classList.remove('on'); }, 3200);
  }

  /* ------------------------------------------------------------ the pop-up (a sheet)
     It never traps anyone: Close is always on screen, tapping outside, Escape and the phone's Back button all close it,
     and a video that plays to the end closes it and puts the page back exactly where the visitor was. */
  var lastFocus = null, savedY = 0, sheetHist = false, maxHist = false, skipPop = 0;
  function ownBack() { skipPop++; try { history.back(); } catch (e) { skipPop--; } }
  function hush(yes) {
    $$('body > *').forEach(function (c) {
      if (c.classList.contains('sheet') || c.classList.contains('pl') || c.id === 'toast') return;
      if (yes) c.setAttribute('inert', ''); else c.removeAttribute('inert');
    });
  }
  function openSheet(el) {
    if (!el) return;
    if (!$('.sheet.on')) { lastFocus = d.activeElement; savedY = w.scrollY || 0; }
    clearTimeout(el._t); el._at = Date.now();
    el.hidden = false; void el.offsetWidth; el.classList.add('on');
    d.body.style.overflow = 'hidden'; hush(true);
    if (!sheetHist) { try { history.pushState({ cbpSheet: 1 }, ''); sheetHist = true; } catch (e) {} }
    var f = $('[data-pl-x]', el); if (f) setTimeout(function () { f.focus({ preventScroll: true }); }, 30);
  }
  function closeSheet(el, fromPop) {
    if (!el || el.hidden || !el.classList.contains('on')) return;
    el.classList.remove('on'); d.body.style.overflow = ''; hush(false);
    var pl = $('#pl-pop');
    if (pl) { stopMedia(pl); leaveMax(pl); }
    el._t = setTimeout(function () { el.hidden = true; if (pl) plShut(pl); }, 260);
    if (lastFocus && lastFocus.focus) { try { lastFocus.focus({ preventScroll: true }); } catch (e) {} }
    var y = savedY;
    if (Math.abs((w.scrollY || 0) - y) > 2) w.scrollTo(0, y);
    setTimeout(function () { if (Math.abs((w.scrollY || 0) - y) > 2) w.scrollTo(0, y); }, 400);
    if (sheetHist && !fromPop) { sheetHist = false; ownBack(); }
  }
  on(w, 'popstate', function () {
    if (skipPop) { skipPop--; return; }
    if (maxHist) { maxHist = false; if (maxed && maxed._hold) coverWindow(maxed, false, true); return; }
    if (sheetHist) { sheetHist = false; $$('.sheet.on').forEach(function (s) { closeSheet(s, true); }); }
  });
  $$('.sheet').forEach(function (s) {
    on(s, 'click', function (e) {
      if (e.target === s && Date.now() - (s._at || 0) < 500) return;      // the second tap of a double tap must not close what the first one opened
      if (e.target === s || e.target.classList.contains('sheet-in')) closeSheet(s);
    });
  });
  on(d, 'keydown', function (e) {
    if (e.key !== 'Escape') return;
    if (maxed && maxed._hold) return leaveMax(maxed);
    $$('.sheet.on').forEach(function (s) { closeSheet(s); });
  });

  /* ------------------------------------------------------------ video players (the one player of /bw, MTG 16 Nov 2026)
     .on: playing (the bar shows Full Screen and Close); .max: full screen (the bar and the whole video, nothing else).
     YouTube videos play from youtube-nocookie.com with YouTube's own full-screen button off, so Close always stays on screen. */
  var maxed = null, wantMax = null;
  var IPHONE = /iP(hone|od)/.test(navigator.userAgent || '');
  function fsElement() { return d.fullscreenElement || d.webkitFullscreenElement || null; }
  function hdrHeight() { var t = $('.md-top') || $('.top'); return t ? t.getBoundingClientRect().height : 64; }
  function footHeight() { var q = $('.qbar'); return q && getComputedStyle(q).display !== 'none' ? q.getBoundingClientRect().height : 0; }      // the quick bar on phones
  if (!(w.CSS && CSS.supports && CSS.supports('height', '100svh'))) {
    var vhFix = function () { var h = (w.innerHeight || html.clientHeight) + 'px'; html.style.setProperty('--svh', h); html.style.setProperty('--dvh', h); };
    vhFix(); on(w, 'resize', vhFix);
  }
  function setMax(pl, yes) {
    pl.classList.toggle('max', yes);
    var b = $('[data-pl-max]', pl); if (b) b.setAttribute('aria-label', yes ? 'Exit Full Screen' : 'Full Screen');
    if (yes) maxed = pl; else if (maxed === pl) maxed = null;
    try {
      var o = w.screen && screen.orientation;
      if (o && yes && o.lock && pl.classList.contains('pl-h') && fsElement()) quiet(o.lock('landscape'));
      else if (o && !yes && o.unlock) o.unlock();
    } catch (e) {}
  }
  /* where the browser has no full screen for a page element (iPhone, some in-app browsers), the player covers the window */
  function coverWindow(pl, yes, fromPop) {
    var f = d.activeElement;
    if (yes && !pl._hold) {
      var h = d.createElement('div'); h.className = 'pl-hold'; h.style.height = pl.offsetHeight + 'px';
      pl.parentNode.insertBefore(h, pl); pl._hold = h;
      if (pl.id !== 'pl-pop') d.body.appendChild(pl);
      pl.classList.add('cover-win'); html.classList.add('pl-lock');
      if (!maxHist) { try { history.pushState({ cbpMax: 1 }, ''); maxHist = true; } catch (e) {} }
    } else if (!yes && pl._hold) {
      if (pl.id !== 'pl-pop') pl._hold.parentNode.replaceChild(pl, pl._hold); else pl._hold.parentNode.removeChild(pl._hold);
      pl._hold = null; pl.classList.remove('cover-win'); html.classList.remove('pl-lock');
      if (maxHist && !fromPop) { maxHist = false; ownBack(); }
    }
    setMax(pl, yes);
    var v = $('video', pl); if (v && v.paused && pl.classList.contains('on')) quiet(v.play());
    if (f && f !== d.activeElement && pl.contains(f)) { try { f.focus({ preventScroll: true }); } catch (e) {} }
  }
  function maxFailed() { var pl = wantMax; wantMax = null; if (pl && pl.classList.contains('on') && !fsElement()) coverWindow(pl, true); }
  function enterMax(pl) {
    var req = pl.requestFullscreen || pl.webkitRequestFullscreen;
    if (req && (d.fullscreenEnabled || d.webkitFullscreenEnabled) && !IPHONE) {
      wantMax = pl;
      try { var r = req.call(pl); if (r && r.catch) r.catch(maxFailed); } catch (e) { maxFailed(); }
      setTimeout(function () { if (wantMax === pl) maxFailed(); }, 1200);
    } else coverWindow(pl, true);
  }
  function leaveMax(pl) {
    if (wantMax === pl) wantMax = null;
    try { if (fsElement()) { if (d.exitFullscreen) quiet(d.exitFullscreen()); else if (d.webkitExitFullscreen) d.webkitExitFullscreen(); } } catch (e) {}
    if (pl && pl._hold) coverWindow(pl, false);
  }
  function whenOut(fn) {
    if (!fsElement()) return fn();
    var done = false, evs = ['fullscreenchange', 'webkitfullscreenchange'], t = setTimeout(go, 1200);
    function go() { if (done) return; done = true; clearTimeout(t); evs.forEach(function (e) { d.removeEventListener(e, chk); }); fn(); }
    function chk() { if (!fsElement()) go(); }
    evs.forEach(function (e) { d.addEventListener(e, chk); });
  }
  ['fullscreenchange', 'webkitfullscreenchange'].forEach(function (ev) {
    on(d, ev, function () {
      var el = fsElement();
      if (el) wantMax = null;
      $$('.pl.max').forEach(function (p) { if (p !== el && !p._hold) setMax(p, false); });
      if (el && el.classList && el.classList.contains('pl')) setMax(el, true);
    });
  });
  ['fullscreenerror', 'webkitfullscreenerror'].forEach(function (ev) { on(d, ev, maxFailed); });

  /* while an open player is on screen, the floating buttons step aside */
  var plSeen = 'IntersectionObserver' in w ? new IntersectionObserver(function (es) { es.forEach(function (en) { en.target._seen = en.isIntersecting; }); syncPlaying(); }) : null;
  function syncPlaying() { html.classList.toggle('pl-playing', $$('.pl.on').some(function (p) { return p._seen !== false; })); }

  /* YouTube: the IFrame API, loaded once on the first press of play */
  var ytQ = null;
  function loadYT(cb) {
    if (w.YT && w.YT.Player) return cb(true);
    if (ytQ) return ytQ.push(cb);
    ytQ = [cb];
    var prev = w.onYouTubeIframeAPIReady;
    w.onYouTubeIframeAPIReady = function () { if (prev) try { prev(); } catch (e) {} var q = ytQ; ytQ = []; q.forEach(function (f) { f(true); }); };
    var s = d.createElement('script'); s.src = 'https://www.youtube.com/iframe_api'; s.async = true;
    s.onerror = function () { var q = ytQ; ytQ = null; q.forEach(function (f) { f(false); }); };
    d.head.appendChild(s);
    setTimeout(function () { if (ytQ && ytQ.length && !(w.YT && w.YT.Player)) { var q = ytQ; ytQ = null; q.forEach(function (f) { f(false); }); } }, 7000);
  }
  function stopMedia(pl) {
    var v = $('video', pl); if (v) { try { v.pause(); } catch (e) {} }
    if (pl._yt && pl._yt.pauseVideo) { try { pl._yt.pauseVideo(); } catch (e) {} }
  }
  function pauseOthers(pl) {
    $$('.pl.on').forEach(function (o) { if (o !== pl) stopMedia(o); });
  }
  function plShut(pl) {                                 // back to the cover: no video left in the player
    var v = $('video', pl);
    if (v) { try { v.pause(); } catch (e) {} v.removeAttribute('src'); try { v.load(); } catch (e) {} if (v.parentNode) v.parentNode.removeChild(v); }
    if (pl._yt) { try { pl._yt.destroy(); } catch (e) {} pl._yt = null; }
    $$('.pl-scr > iframe, .pl-scr > .ytp', pl).forEach(function (x) { x.parentNode.removeChild(x); });
    pl.classList.remove('on');
    if (plSeen) plSeen.unobserve(pl);
    syncPlaying();
  }
  function plClose(pl, ended) {                         // Close, or the video ended: out of full screen first, then back to the cover
    stopMedia(pl);
    leaveMax(pl);
    whenOut(function () {
      if (pl.id === 'pl-pop') return closeSheet($('#player'));
      var had = pl.contains(d.activeElement) || d.activeElement === d.body || !d.activeElement;
      plShut(pl);
      if (ended && typeof pl._ret === 'number') {       // the page goes back to exactly where the visitor pressed play (MTG, 10 Nov 2026)
        var go = function () { var dy = pl.getBoundingClientRect().top - pl._ret; if (Math.abs(dy) > 2) { html.style.scrollBehavior = 'auto'; w.scrollBy(0, dy); html.style.scrollBehavior = ''; } };
        go(); setTimeout(go, 350);
      }
      var b = $('.vplay', pl); if (b && had) { try { b.focus({ preventScroll: true }); } catch (e) {} }
    });
  }
  function plOpen(pl, k, src, yt, poster) {
    plShut(pl);
    var scr = $('.pl-scr', pl), info = V[k] || {};
    pl.classList.add('on'); pl._seen = true; if (plSeen) plSeen.observe(pl); syncPlaying();
    pauseOthers(pl);
    if (yt && w.CBP_PREVIEW) {                          // MTG's private preview link cannot embed YouTube: say so, in the laptop
      var note = d.createElement('div'); note.className = 'ytp ytp-note';
      note.innerHTML = (poster ? '<img src="' + poster + '" alt="">' : '') + '<div class="yn"><b>Preview link only</b><span>YouTube cannot play inside this private preview. On mtgtribe.com it plays right here, in this laptop.</span>' +
        '<a class="btn btn-join sm" href="https://www.youtube.com/watch?v=' + yt + '" target="_blank" rel="noopener">Watch On YouTube</a></div>';
      scr.appendChild(note); return null;
    }
    if (yt) {
      var holder = d.createElement('div'); holder.className = 'ytp'; scr.appendChild(holder);
      loadYT(function (ok) {
        if (!pl.classList.contains('on') || !holder.parentNode) return;
        if (!ok) {                                       // the API could not load: the plain YouTube player, without the auto close
          var f = d.createElement('iframe');
          f.src = 'https://www.youtube-nocookie.com/embed/' + yt + '?autoplay=1&rel=0&playsinline=1&fs=0&modestbranding=1';
          f.allow = 'autoplay; encrypted-media; picture-in-picture'; f.title = info.t || 'Video';
          holder.parentNode.replaceChild(f, holder); return;
        }
        pl._yt = new w.YT.Player(holder, {
          host: 'https://www.youtube-nocookie.com', videoId: yt, width: '100%', height: '100%',
          playerVars: { autoplay: 1, rel: 0, playsinline: 1, modestbranding: 1, fs: 0 },
          events: {
            onReady: function (e) { try { e.target.playVideo(); } catch (x) {} var f = $('iframe', scr); if (f) f.title = info.t || 'Video'; },
            onStateChange: function (e) { if (e.data === 1) pauseOthers(pl); if (e.data === 0) plClose(pl, true); }
          }
        });
      });
      return null;
    }
    var v = d.createElement('video');
    v.controls = true; v.playsInline = true; v.setAttribute('playsinline', ''); v.preload = 'auto';
    v.setAttribute('controlslist', 'nofullscreen nodownload noremoteplayback');
    v.setAttribute('disablepictureinpicture', '');
    v.setAttribute('aria-label', info.t || 'Video');
    if (poster) v.poster = poster;
    v.src = src;
    scr.appendChild(v);
    on(v, 'play', function () { pauseOthers(pl); });
    on(v, 'ended', function () { if ($('video', pl) === v) plClose(pl, true); });
    quiet(v.play());
    return v;
  }
  function plIntoView(pl) {
    var r = pl.getBoundingClientRect(), top = hdrHeight() + 10, bot = (w.innerHeight || html.clientHeight) - footHeight() - 8;
    var dy = r.top < top ? r.top - top : (r.bottom > bot ? Math.min(r.bottom - bot, r.top - top) : 0);
    if (Math.abs(dy) > 2) { try { w.scrollBy({ top: dy, behavior: RM ? 'auto' : 'smooth' }); } catch (e) { w.scrollBy(0, dy); } }
  }
  function plRoom(pl) { return (w.innerHeight || html.clientHeight) - (pl.id === 'pl-pop' ? 16 : hdrHeight() + footHeight()); }
  function fitOrMax(pl) { if (pl.getBoundingClientRect().height > plRoom(pl)) enterMax(pl); else if (pl.id !== 'pl-pop') plIntoView(pl); }
  var fitT;
  on(w, 'resize', function () {
    clearTimeout(fitT); fitT = setTimeout(function () { var pl = $('.pl.on:not(.max)'); if (pl && pl.getBoundingClientRect().height > plRoom(pl)) enterMax(pl); }, 350);
  });
  /* a video file comes in two sizes: 720p for phones, 1080p for screens 1200 px and wider (as on /bw) */
  function pickSrc(s, hd) { return hd && (w.innerWidth || html.clientWidth) >= 1200 ? hd : s; }
  function startInline(b) {
    var pl = b.closest('.pl'); if (!pl) return;
    pl._ret = pl.getBoundingClientRect().top;
    var img = $('.pl-scr img', pl);
    plOpen(pl, b.getAttribute('data-code'), pickSrc(b.getAttribute('data-src'), b.getAttribute('data-src-hd')), b.getAttribute('data-yt'), img ? (img.currentSrc || img.src) : '');
    fitOrMax(pl);
  }
  function openPop(k) {
    var info = V[k], sheet = $('#player'), pop = $('#pl-pop'); if (!info || !sheet || !pop) return;
    pop.classList.toggle('pl-h', info.o === 'h'); pop.classList.toggle('pl-v', info.o !== 'h');
    var tx = $$('.pl-tx', pop); if (tx[0]) tx[0].textContent = info.bar; if (tx[1]) tx[1].textContent = info.d;
    sheet.setAttribute('aria-label', info.t + ' (' + info.d + ')');
    openSheet(sheet);
    plOpen(pop, k, pickSrc(info.s, info.h), info.yt, info.p);
    fitOrMax(pop);
  }
  /* a finger or a mouse on a YouTube play button: start loading YouTube now, so the video starts the moment it is pressed */
  function warm(e) { var b = e.target && e.target.closest && e.target.closest('[data-yt],[data-play]'); if (b && (b.hasAttribute('data-yt') || (V[b.getAttribute('data-play')] || {}).yt)) loadYT(function () {}); }
  on(d, 'pointerdown', warm, true); on(d, 'focusin', warm); on(d, 'mouseover', warm, { passive: true });
  on(d, 'click', function (e) {
    var t = e.target, b, pl;
    if ((b = t.closest('.vplay')) && !b.hasAttribute('data-play')) return startInline(b);
    if ((b = t.closest('[data-pl-max]'))) { pl = b.closest('.pl'); return pl.classList.contains('max') ? leaveMax(pl) : enterMax(pl); }
    if ((b = t.closest('[data-pl-x]'))) return plClose(b.closest('.pl'));
    if ((b = t.closest('[data-play]'))) return openPop(b.getAttribute('data-play'));
    if ((b = t.closest('[data-soon]'))) {
      var st = $('b', b); toast('"' + b.getAttribute('data-soon') + '" is ' + (st ? st.textContent.toLowerCase() : 'coming soon') + '. Everything it covers is written on this page.');
    }
  });

  /* ------------------------------------------------------------ Up and Down (MTG, 22 Nov 2026: "navigation arrows ... up and down")
     Up: back to the top. Down: the next part of the page (the next section, then the Previous and Next buttons, then the end). */
  var ud = $('[data-ud]'), upB = ud && $('[data-up]', ud), dnB = ud && $('[data-down]', ud), udT = false;
  function stops() { return $$('#main > *, .dfoot, .foot').filter(function (el) { return el.offsetHeight > 0 && !el.matches('script'); }); }
  function paintUd() {
    udT = false; if (!ud) return;
    var y = w.scrollY || html.scrollTop, max = html.scrollHeight - (w.innerHeight || html.clientHeight);
    upB.classList.toggle('on', y > 260);
    dnB.classList.toggle('on', y < max - 60);
    var r = ud.getBoundingClientRect(), over = $$('.pl').some(function (p) {      // never on the picture of a video
      if (p.id === 'pl-pop') return false;
      var q = p.getBoundingClientRect(); return q.bottom > r.top - 6 && q.top < r.bottom + 6 && q.right > r.left - 6 && q.left < r.right + 6;
    });
    ud.classList.toggle('off', over);
  }
  function jump(top) { var y = Math.max(0, top); try { w.scrollTo({ top: y, behavior: RM ? 'auto' : 'smooth' }); } catch (e) { w.scrollTo(0, y); } }
  on(upB, 'click', function () {
    jump(0);
    var m = $('#main'); if (m) setTimeout(function () { try { m.focus({ preventScroll: true }); } catch (e) {} }, RM ? 0 : 500);
  });
  on(dnB, 'click', function () {
    var line = hdrHeight() + 24, y = w.scrollY || 0;
    var next = stops().filter(function (el) { return el.getBoundingClientRect().top > line; })[0];
    if (next) jump(y + next.getBoundingClientRect().top - hdrHeight() - 12); else jump(html.scrollHeight);
  });
  on(w, 'scroll', function () { if (!udT) { udT = true; requestAnimationFrame(paintUd); } }, { passive: true });
  on(w, 'resize', paintUd); paintUd();

  /* ------------------------------------------------------------ the quick bar's Menu opens the dashboard menu */
  on(d, 'click', function (e) { var q = e.target.closest && e.target.closest('[data-qmenu]'); if (q) { var m = $('.md-menu'); if (m) m.click(); } });

  /* ------------------------------------------------------------ 3D: cards tilt toward the pointer and catch the light (mouse and trackpad only) */
  if (!RM && w.matchMedia && w.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    var tilted = null;
    var untilt = function (el) { if (!el) return; el.classList.remove('lit'); ['--rx', '--ry', '--mx', '--my'].forEach(function (p) { el.style.removeProperty(p); }); };
    on(d, 'pointermove', function (e) {
      var el = e.target.closest && e.target.closest('.t3d');
      if (el !== tilted) { untilt(tilted); tilted = el; }
      if (!el) return;
      var r = el.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      var k = Math.min(1, 320 / Math.max(r.width, 1));                 // big panels tilt less than small cards
      el.style.setProperty('--rx', ((0.5 - y) * 9 * k).toFixed(2) + 'deg');
      el.style.setProperty('--ry', ((x - 0.5) * 11 * k).toFixed(2) + 'deg');
      el.style.setProperty('--mx', (x * 100).toFixed(1) + '%'); el.style.setProperty('--my', (y * 100).toFixed(1) + '%');
      el.classList.add('lit');
    }, { passive: true });
    on(d, 'pointerleave', function () { untilt(tilted); tilted = null; });
  }

  /* ------------------------------------------------------------ reveal: what is below the first screen lifts gently into place */
  if ('IntersectionObserver' in w && !RM) {
    var rvs = $$('.rv').filter(function (el) { return el.getBoundingClientRect().top > (w.innerHeight || 800) * 0.92; });
    rvs.forEach(function (el) { el.classList.add('pre'); });
    var rio = new IntersectionObserver(function (es) {
      es.forEach(function (en) { if (en.isIntersecting) { en.target.classList.remove('pre'); rio.unobserve(en.target); } });
    }, { rootMargin: '0px 0px -8% 0px' });
    rvs.forEach(function (el) { rio.observe(el); });
  }

  /* ------------------------------------------------------------ numbers count up when they come into view */
  var counts = $$('[data-count]');
  if (counts.length && 'IntersectionObserver' in w && !RM) {
    var runCount = function (el) {
      var end = +el.getAttribute('data-count'), t0 = null;
      (function step(t) { if (!t0) t0 = t; var k = Math.min(1, (t - t0) / 1300), e = 1 - Math.pow(1 - k, 3); el.textContent = Math.round(end * e); if (k < 1) requestAnimationFrame(step); })(performance.now());
    };
    var cio = new IntersectionObserver(function (es) { es.forEach(function (en) { if (en.isIntersecting) { runCount(en.target); cio.unobserve(en.target); } }); }, { threshold: 0.5 });
    counts.forEach(function (el) { cio.observe(el); });
  }

  /* ------------------------------------------------------------ calculator */
  var tool = $('[data-calc]');
  if (tool) {
    var L = JSON.parse(tool.getAttribute('data-calc')), nIn = $('#c-n', tool), dIn = $('#c-d', tool);
    var cents = function (x) { return Math.round(x * 100) / 100; };
    var usdt = function (x) { return '$' + cents(x).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' USDT'; };
    var num = function (x) { return '$' + cents(x).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); };
    var iso = function (dt) { return dt.getFullYear() + '-' + String(dt.getMonth() + 1).padStart(2, '0') + '-' + String(dt.getDate()).padStart(2, '0'); };
    var out = function (k, v) { var el = $('[data-o="' + k + '"]', tool); if (el) el.textContent = v; };
    var today = function () { return iso(new Date()); };
    dIn.value = today();
    var calc = function () {
      var lv = +($('[name="lvl"]:checked', tool) || {}).value || 4, x = L.filter(function (r) { return r.l === lv; })[0];
      var first = ($('[name="first"]:checked', tool) || {}).value === '1';
      var n = Math.max(1, Math.min(5, Math.round(+nIn.value || 1)));
      if (String(n) !== nIn.value) nIn.value = n;
      var pay = x.p * n + (first ? x.a : 0), clicks = x.n * n, day = x.c * x.n * n, tot = x.t * n;
      out('pay', usdt(pay));
      out('payx', (n > 1 ? n + ' x ' : '') + 'Level ' + lv + ' campaign ' + num(x.p) + (first ? ' + one-time activation ' + num(x.a) : ' (level already active)'));
      out('clicks', clicks);
      out('day', usdt(day));
      out('dayx', num(x.c) + ' per click x ' + clicks + ' clicks');
      out('tot', usdt(tot));
      var exact = cents(x.c * x.n * 12) === cents(x.t);
      out('totx', (n > 1 ? n + ' x ' : '') + num(x.t) + (exact ? ' (' + num(x.c) + ' x ' + x.n + ' x 12 days)' : ' (the site\'s own total)'));
      var start = dIn.value ? new Date(dIn.value + 'T12:00:00') : null;
      if (start && !isNaN(start)) {
        var rel = new Date(start.getTime()); rel.setDate(rel.getDate() + 18);
        out('date', rel.toLocaleDateString('en-ZA', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' }));
      } else out('date', '-');
      out('net', usdt(tot * 0.9));
      out('formula', 'Level ' + lv + ': you pay ' + usdt(pay) + ' today, click ' + clicks + ' ads a day for 12 click days, and the platform\'s figure for ' +
        (n > 1 ? 'these ' + n + ' campaigns' : 'this campaign') + ' is ' + usdt(tot) + '.');
    };
    $$('input', tool).forEach(function (i) { on(i, 'input', calc); on(i, 'change', calc); });
    on($('[data-inc]', tool), 'click', function () { nIn.value = Math.min(5, (+nIn.value || 1) + 1); calc(); });
    on($('[data-dec]', tool), 'click', function () { nIn.value = Math.max(1, (+nIn.value || 1) - 1); calc(); });
    on($('[data-reset]', tool), 'click', function () {
      $('[name="lvl"][value="4"]', tool).checked = true; $('[name="first"][value="1"]', tool).checked = true; nIn.value = 1; dIn.value = today(); calc();
    });
    calc();
  }

  /* ------------------------------------------------------------ copy order form: builds a WhatsApp message, stores nothing */
  var OF = $('[data-order]');
  if (OF) {
    var slugIn = $('[name="slug"]', OF), addr = $('[data-out="addr"]', OF);
    var slugify = function (v) { return String(v || '').toLowerCase().replace(/[^a-z0-9]+/g, '').slice(0, 24); };
    var dom = function () { var r = $('[name="domain"]:checked', OF); return r ? r.value : 'mtgtribe.com/cbp/'; };
    var paintAddr = function () { addr.textContent = dom() + (slugify(slugIn.value) || 'yourname'); };
    on(slugIn, 'input', paintAddr); $$('[name="domain"]', OF).forEach(function (r) { on(r, 'change', paintAddr); }); paintAddr();
    on(OF, 'submit', function (e) {
      e.preventDefault();
      $$('.field', OF).forEach(function (f) { f.classList.remove('err'); });
      var bad = $$('[required]', OF).filter(function (x) { return x.type === 'radio' ? !$('[name="' + x.name + '"]:checked', OF) : !x.value.trim(); });
      var ref = $('[name="ref"]', OF);
      if (ref.value.trim() && !/^https?:\/\/\S*clickbaitpays\S*/i.test(ref.value.trim())) bad.push(ref);
      if (slugIn.value.trim() && !slugify(slugIn.value)) bad.push(slugIn);
      if (bad.length) { bad.forEach(function (x) { var f = x.closest('.field'); if (f) f.classList.add('err'); }); bad[0].focus(); return; }
      var v = function (n) { var x = $('[name="' + n + '"]', OF); return x ? x.value.trim() : ''; };
      var pay = $('[name="pay"]:checked', OF);
      var lines = ['Hi MTG, I would like to order my own ClickBaitPays guide website (R1,000 or $50 once-off, paid after it is built).', '',
        'Name: ' + v('name'), 'Page address: ' + dom() + slugify(v('slug')), 'My ClickBaitPays referral link: ' + v('ref'),
        'My WhatsApp number: ' + v('wa'), 'My WhatsApp group link: ' + (v('group') || 'none yet'),
        'TikTok: ' + (v('tiktok') || '-'), 'Facebook: ' + (v('fb') || '-'), 'YouTube: ' + (v('yt') || '-'),
        'How I would like to pay: ' + (pay ? pay.value : 'to agree on WhatsApp'), 'Notes: ' + (v('notes') || '-')];
      var url = OF.getAttribute('data-wa') + '?text=' + encodeURIComponent(lines.join('\n'));
      var win = w.open(url, '_blank', 'noopener'); if (!win) w.location.href = url;
      var ok = $('[data-sent]'); if (ok) { ok.hidden = false; ok.scrollIntoView({ behavior: RM ? 'auto' : 'smooth', block: 'center' }); }
    });
  }
})();
