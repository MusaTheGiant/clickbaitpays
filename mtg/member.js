/* Applies member-config.js to the Quick Guide pages and runs the small page helpers. */
(function () {
  'use strict';
  var member = window.MTG_MEMBER || {};
  var safe = function (value) { return typeof value === 'string' && /^https:\/\//.test(value); };
  var each = function (selector, fn) { Array.prototype.forEach.call(document.querySelectorAll(selector), fn); };

  // Registration links and the visible referral address
  if (safe(member.registrationUrl)) {
    each('[data-register]', function (a) { a.href = member.registrationUrl; });
    each('[data-referral-url]', function (el) { el.textContent = member.registrationUrl; });
  }
  // Contact and social links. Links without a configured address are hidden.
  var links = { 'data-whatsapp': member.whatsappUrl, 'data-whatsapp-group': member.whatsappGroupUrl, 'data-youtube': member.youtubeUrl, 'data-tiktok': member.tiktokUrl, 'data-facebook': member.facebookUrl };
  Object.keys(links).forEach(function (attr) {
    each('[' + attr + ']', function (a) {
      if (safe(links[attr])) { a.href = links[attr]; a.hidden = false; }
      else if (a.hasAttribute('data-optional')) a.hidden = true;
    });
  });
  if (member.ownerName) each('[data-owner-name]', function (el) { el.textContent = member.ownerName; });
  if (member.ownerRole) each('[data-owner-role]', function (el) { el.textContent = member.ownerRole; });
  if (member.profileImage) each('[data-profile-image]', function (img) {
    img.addEventListener('error', function () { img.src = img.getAttribute('data-fallback') || img.src; }, { once: true });
    img.src = member.profileImage;
  });

  // Share this guide on WhatsApp, using the address of the copy being viewed
  var homeLink = document.querySelector('[data-guide-home]');
  var home = location.protocol === 'https:' && homeLink ? homeLink.href : null;
  each('[data-share-whatsapp]', function (a) {
    var url = home || a.getAttribute('data-share-url');
    var text = 'Busy but curious about ClickBaitPays? This quick guide shows how it works in about 10 minutes, with videos, a profit calculator and straight answers: ' + url;
    a.href = 'https://wa.me/?text=' + encodeURIComponent(text);
  });

  function copyText(text, status) {
    var done = function (ok) { if (status) status.textContent = ok ? 'Copied. Paste it wherever you need it.' : 'Please select the link and copy it manually.'; };
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(function () { done(true); }, function () { done(fallback(text)); });
    } else done(fallback(text));
  }
  function fallback(text) {
    try {
      var box = document.createElement('textarea');
      box.value = text; box.setAttribute('readonly', ''); box.style.cssText = 'position:fixed;opacity:0;left:-9999px';
      document.body.appendChild(box); box.select();
      var ok = document.execCommand('copy'); box.remove(); return ok;
    } catch (e) { return false; }
  }
  each('[data-copy-referral]', function (button) {
    button.addEventListener('click', function () {
      var source = button.parentElement.querySelector('[data-referral-url]');
      copyText(source ? source.textContent.trim() : '', button.closest('section').querySelector('[data-copy-status]'));
    });
  });
  each('[data-copy-page]', function (button) {
    button.addEventListener('click', function () {
      copyText(home || button.getAttribute('data-share-url'), button.closest('section').querySelector('[data-copy-status]'));
    });
  });

  // Mobile navigation
  each('[data-member-nav]', function (menu) {
    var toggle = menu.querySelector('[data-menu-toggle]');
    var list = menu.querySelector('[data-menu-links]');
    if (!toggle || !list) return;
    var close = function () { toggle.setAttribute('aria-expanded', 'false'); toggle.setAttribute('aria-label', 'Open navigation menu'); list.classList.remove('open'); };
    toggle.addEventListener('click', function (event) {
      event.stopPropagation();
      var open = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', String(!open));
      toggle.setAttribute('aria-label', open ? 'Open navigation menu' : 'Close navigation menu');
      list.classList.toggle('open', !open);
    });
    list.addEventListener('click', function (event) { if (event.target.closest('a')) close(); });
    document.addEventListener('click', function (event) { if (!menu.contains(event.target)) close(); });
    document.addEventListener('keydown', function (event) { if (event.key === 'Escape' && list.classList.contains('open')) { close(); toggle.focus(); } });
  });

  // Open a FAQ answer when its address is shared, for example faq/#withdrawal-fee
  function openHash() {
    var id = decodeURIComponent(location.hash.slice(1));
    var target = id && document.getElementById(id);
    if (target && target.tagName === 'DETAILS') { target.open = true; target.scrollIntoView({ block: 'start' }); }
  }
  window.addEventListener('hashchange', openHash);
  openHash();
})();
