/* Static-site handoff. WhatsApp only receives data after the visitor presses Send. */
(function () {
  'use strict';
  var form = document.querySelector('[data-copy-request]');
  if (!form) return;
  var destination = 'https://wa.me/27721714626';
  var paymentAddress = 'TFx7DMtb5PuSmGTVe6LnCwLxEF7b8mutBt';
  var status = document.querySelector('[data-form-status]');
  var after = document.querySelector('[data-order-after]');
  var reopen = document.querySelector('[data-whatsapp-reopen]');
  var requestText = '';

  function clean(value) { return String(value || '').trim().replace(/[\r\n]+/g, ' '); }
  function field(name) { return form.elements.namedItem(name); }
  function get(name) { return clean(field(name).value); }
  function showError(input, message) {
    input.setCustomValidity(message);
    input.reportValidity();
    status.textContent = message;
    input.focus();
  }
  function validUrl(name, hosts, message) {
    var input = field(name), value = clean(input.value);
    if (!value) return true;
    try {
      var url = new URL(value);
      if (url.protocol === 'https:' && (!hosts || hosts.some(function (host) { return url.hostname === host || url.hostname.endsWith('.' + host); }))) return true;
    } catch (error) { /* report using the field below */ }
    showError(input, message);
    return false;
  }
  function validFile(name, allowed, limit, message) {
    var input = field(name), file = input.files && input.files[0];
    if (!file) return name === 'profilePhoto';
    var suffix = (file.name.split('.').pop() || '').toLowerCase();
    if (file.size > limit || !allowed.includes(suffix)) {
      showError(input, message);
      return false;
    }
    return true;
  }
  async function copy(text, statusNode, needsVerification) {
    try {
      var box = document.createElement('textarea');
      box.value = text;
      box.setAttribute('readonly', '');
      box.style.cssText = 'position:fixed;opacity:0;left:-9999px';
      document.body.appendChild(box);
      box.focus();
      box.select();
      var copied = document.execCommand('copy');
      box.remove();
      if (!copied) {
        if (navigator.clipboard && window.isSecureContext) await navigator.clipboard.writeText(text);
        else throw new Error('Unavailable');
      }
      statusNode.textContent = needsVerification ? 'Copy attempted. Paste below to verify the exact address.' : 'Copy attempted. Paste to confirm.';
    } catch (error) {
      statusNode.textContent = 'Please select and copy the text manually.';
    }
  }
  document.querySelector('[data-copy-address]').addEventListener('click', function () {
    copy(paymentAddress, document.querySelector('[data-address-status]'), true);
  });
  var addressCheck = document.querySelector('[data-verify-address]');
  addressCheck.addEventListener('input', function () {
    var message = document.querySelector('[data-verify-status]');
    var pasted = addressCheck.value.trim();
    message.classList.remove('matches', 'mismatch');
    if (!pasted) {
      message.textContent = 'A copy confirmation is not a payment confirmation. Always check the address and network in your wallet.';
    } else if (pasted === paymentAddress) {
      message.textContent = 'Exact match. Check the TRON (TRC-20) network in your wallet before sending.';
      message.classList.add('matches');
    } else {
      message.textContent = 'This does not match the payment address. Do not send. Copy the address shown above and check again.';
      message.classList.add('mismatch');
    }
  });
  document.querySelector('[data-copy-request-details]').addEventListener('click', function () {
    if (requestText) copy(requestText, status);
  });
  form.querySelectorAll('input,textarea,select').forEach(function (input) {
    input.addEventListener('input', function () { input.setCustomValidity(''); status.textContent = ''; });
    input.addEventListener('change', function () { input.setCustomValidity(''); status.textContent = ''; });
  });
  form.addEventListener('submit', function (event) {
    event.preventDefault();
    status.textContent = '';
    var contact = field('contactNumber');
    if (!/^[+0-9 ()-]{7,24}$/.test(get('contactNumber'))) {
      showError(contact, 'Enter your WhatsApp number with country code, such as +27 72 123 4567.'); return;
    }
    if (!validUrl('referralUrl', ['clickbaitpays.me'], 'Paste your complete ClickBaitPays referral link, such as https://clickbaitpays.me/join.php?ref=yourname.')) return;
    if (!validUrl('memberWhatsapp', ['wa.me', 'api.whatsapp.com', 'whatsapp.com'], 'Use a complete WhatsApp link, such as https://wa.me/27721234567.')) return;
    if (!validUrl('memberGroup', ['chat.whatsapp.com'], 'Use a complete WhatsApp group invite link from chat.whatsapp.com.')) return;
    if (!validUrl('youtubeUrl', ['youtube.com', 'youtu.be'], 'Use a complete YouTube channel link.')) return;
    if (!validUrl('tiktokUrl', ['tiktok.com'], 'Use a complete TikTok profile link.')) return;
    if (!validUrl('facebookUrl', ['facebook.com', 'fb.com'], 'Use a complete Facebook page link.')) return;
    if (get('whatsappChoice') === 'group' && !get('memberGroup')) {
      showError(field('memberGroup'), 'Paste your group invite link if you want the page to open your WhatsApp group.'); return;
    }
    if (!validFile('profilePhoto', ['jpg', 'jpeg', 'png', 'webp'], 8 * 1024 * 1024, 'Use a JPG, PNG or WebP profile image smaller than 8 MB.')) return;
    if (!validFile('paymentProof', ['jpg', 'jpeg', 'png', 'webp', 'pdf'], 10 * 1024 * 1024, 'Use an image or PDF payment proof smaller than 10 MB.')) return;
    var photo = field('profilePhoto').files[0], proof = field('paymentProof').files[0];
    if (!proof) { showError(field('paymentProof'), 'Choose your payment proof before continuing.'); return; }
    var lines = [
      'PERSONALIZED CLICKBAITPAYS QUICK GUIDE COPY REQUEST',
      'Name: ' + get('fullName'),
      'My WhatsApp contact: ' + get('contactNumber'),
      'Preferred page name: ' + (get('pageName') || 'Please choose with me'),
      'My ClickBaitPays referral link: ' + get('referralUrl'),
      'Use this WhatsApp destination: ' + (get('whatsappChoice') === 'group' ? 'Group invite' : 'Personal contact'),
      'My WhatsApp link: ' + (get('memberWhatsapp') || 'Use my contact number above'),
      'My WhatsApp group: ' + (get('memberGroup') || 'None'),
      'My YouTube: ' + (get('youtubeUrl') || 'None'),
      'My TikTok: ' + (get('tiktokUrl') || 'None'),
      'My Facebook: ' + (get('facebookUrl') || 'None'),
      'Custom domain help: ' + ({'no':'No, included hosting on clickbaitpaysus.com','need-help':'Please quote domain setup','already-own':'I have a domain and need help connecting it'}[get('customDomainHelp')] || 'No, included hosting'),
      'Domain name (if applicable): ' + (get('customDomainName') || 'Not provided'),
      'Other details: ' + (get('notes') || 'None'),
      '',
      'Payment: 32 USDT, TRON (TRC-20), base website fee only',
      'Sent to: ' + paymentAddress,
      'Transaction ID / reference: ' + get('paymentReference'),
      'Profile image selected: ' + (photo ? clean(photo.name) : 'Use the ClickBaitPays logo'),
      'Payment proof selected: ' + clean(proof.name),
      '',
      'I will attach the selected files to this chat before pressing Send.'
    ];
    requestText = lines.join('\n');
    var url = destination + '?text=' + encodeURIComponent(requestText);
    reopen.href = url;
    after.hidden = false;
    status.textContent = 'WhatsApp is opening. Attach your selected files there and tap Send. Your request has not been delivered yet.';
    var link = document.createElement('a');
    link.href = url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    link.remove();
    after.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'center' });
  });
})();
