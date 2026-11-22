/* Back to the video when it ends (MTG, 10 Nov 2026).
   "As soon as the video finishes playing, the visitor must be automatically scrolled to the exact section where the
   video is at." When a video that a visitor started plays to the end, the page goes back to exactly where they were
   when they pressed play, with the video's cover on screen, even if full screen, a pop-up player or the phone moved
   the page. Works with every player (pop-up, inline, playlists) on every page that loads this file, on phones and
   computers. Standing rule for every MTG website: load this file on every page that has a video.
   Usage: <script src="/assets/video-return.js?v=1" defer></script>  (no setup, no markup changes) */
(function () {
  'use strict';
  if (window.__mtgVideoReturn) return;
  window.__mtgVideoReturn = 1;
  var d = document, root = d.documentElement, last = null, TAP_MS = 5000, CARRY_MS = 6000;

  function scrollY() { return window.pageYOffset || root.scrollTop || 0; }
  function el(t) { return t && t.nodeType === 1 ? t : (t && t.parentElement) || null; }
  // the player a video lives in: a pop-up (dialog or sheet) or, for inline players, its own box
  function playerOf(v) {
    return (v.closest && v.closest('dialog,[role="dialog"],.sheet,.vm,#vm,#player,.modal,.lightbox')) || v.parentElement || v;
  }
  function inFullscreen(v) {
    return !!(d.fullscreenElement || d.webkitFullscreenElement || (v && v.webkitDisplayingFullscreen));
  }
  function visible(n) {
    if (!n || !n.isConnected) return false;
    var r = n.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  }

  // remember the last tap (what was tapped and where the page was) before the page's own code runs
  function mark(e) {
    var t = el(e.target);
    if (!t) return;
    var a = t.closest ? t.closest('a,button,video,[data-video],[data-invite],[data-play],[data-src],[data-pick],[role="button"],.vplay,.vcover') : null;
    var n = a || t;
    last = { el: n, y: scrollY(), top: n.getBoundingClientRect().top, t: Date.now() };
  }
  d.addEventListener('pointerdown', mark, true);
  d.addEventListener('click', function (e) { if (!last || Date.now() - last.t > 800) mark(e); }, true);
  d.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') mark(e); }, true);

  // a video starts: note where to come back to (only for videos a visitor started, never for background videos)
  d.addEventListener('play', function (e) {
    var v = e.target;
    if (!v || v.tagName !== 'VIDEO') return;
    var s = v.__ret, now = Date.now(), box = playerOf(v);
    var tapped = last && now - last.t < TAP_MS;
    var fresh = tapped && last.el && !box.contains(last.el) && !(s && s.anchor === last.el);
    if (s && !s.done && !fresh && s.src === v.currentSrc) return;         // same session: pause and play again
    if (s && s.done && !tapped && now - s.endedAt < CARRY_MS) {            // a playlist moving on by itself
      s.done = false; s.src = v.currentSrc; return;
    }
    if (!tapped) { v.__ret = null; return; }                               // started by the page, not by a visitor
    var outside = last.el && !box.contains(last.el), anchor = outside ? last.el : v;
    // where the video's cover sat on the screen when they pressed play (an inline player sits where its cover was)
    var top = outside ? last.top : (v.isConnected ? v.getBoundingClientRect().top : last.top);
    v.__ret = { anchor: anchor, top: top, y: last.y, src: v.currentSrc, done: false, endedAt: 0 };
  }, true);

  function goBack(s, v) {
    if (inFullscreen(v)) return false;
    var dlg = v.closest && v.closest('dialog');
    if (dlg && dlg.open && dlg.classList.contains('show')) return false;  // the pop-up is still closing
    var prev = root.style.scrollBehavior;
    root.style.scrollBehavior = 'auto';
    // put the video's cover back exactly where it was on the screen, even if pictures above it loaded meanwhile
    if (visible(s.anchor)) {
      var dy = s.anchor.getBoundingClientRect().top - s.top;
      if (Math.abs(dy) > 2) window.scrollBy(0, dy);
    } else if (Math.abs(scrollY() - s.y) > 2) window.scrollTo(0, s.y);
    // and make sure it really is on screen
    var a = visible(s.anchor) ? s.anchor : (visible(v) ? v : null);
    if (a) {
      var r = a.getBoundingClientRect(), h = window.innerHeight || root.clientHeight;
      if (r.bottom < 40 || r.top > h - 40) {
        try { a.scrollIntoView({ block: 'center', inline: 'nearest' }); } catch (_) { a.scrollIntoView(); }
      }
    }
    root.style.scrollBehavior = prev;
    return true;
  }

  // the video ends: wait for the player to leave full screen and close, then go back (a few tries, quietly)
  d.addEventListener('ended', function (e) {
    var v = e.target;
    if (!v || v.tagName !== 'VIDEO' || !v.__ret) return;
    var s = v.__ret;
    s.done = true; s.endedAt = Date.now();
    var tries = [450, 800, 1200, 1700, 2400, 3200], i = 0, moved = false;
    function stop() { moved = true; }
    // the visitor scrolls or swipes on purpose after the end: leave them be
    ['wheel', 'touchmove', 'keydown'].forEach(function (t) { d.addEventListener(t, stop, { capture: true, passive: true, once: true }); });
    function next() {
      if (i >= tries.length) return;
      setTimeout(function () {
        if (moved || !s.done || v.__ret !== s) return;                     // they moved, or a new video started
        goBack(s, v);
        i++; next();
      }, tries[i] - (i ? tries[i - 1] : 0));
    }
    next();
  }, true);

  // leaving full screen by hand on an iPhone also moves the page: put it back while the video is open
  d.addEventListener('webkitendfullscreen', function (e) {
    var v = e.target, s = v && v.__ret;
    if (s && v.ended) setTimeout(function () { goBack(s, v); }, 300);
  }, true);
})();
