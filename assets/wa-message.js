/* Clear WhatsApp messages to MTG (MTG, 16 Nov 2026): "Specificity will help me know exactly which page and stream of
   income they are from, and what exactly they need assistance with. I don't like vague messages."
   Every link to MTG's WhatsApp (wa.me/27721714626) gets a ready message that names the income stream, the exact page
   and what the visitor needs:

     Hi MTG,

     I'm on your JetUP and TAG Markets guide, page "JetUP and TAG Markets FAQ" (mtgtribe.com/jetup/faq/).

     I have a question about JetUP and TAG Markets. Can you please help me?

     Thank you 😊

   A link can set its own words: data-wa-text="..." is used exactly as written (the JetUP Zoom buttons), and
   data-wa-need="..." replaces only the need line. data-wa-keep leaves a link as it is. The BW and ClickBaitPays order pages
   (/bwcopy/, /cbpcopy/) are skipped: their forms write the order into the message itself.
   One line on any page:  <script src="/assets/wa-message.js" defer></script> */
(function () {
  if (window.__mtgWaDone) return; window.__mtgWaDone = true;
  var P = location.pathname, NUM = 'https://wa.me/27721714626';
  if (/^\/(bwcopy|cbpcopy)(\/|$)/i.test(P)) return;
  var ZOOM = 'Hi MTG,\n\nPlease send me the Zoom link for your next JetUp session.\n\nThank you 😊';
  // income stream and the default need, by the start of the address
  var S = [
    [/^\/jetup\/zoom(\/|$)/i, null, null, ZOOM],
    [/^\/jetupzoom(\/|$)/i, null, null, ZOOM],
    [/^\/bw\/dashboard\/live-on-zoom(\/|$)/i, null, null, 'Hi MTG,\n\nPlease send me the Zoom link for your next Bitcoin Wealth session.\n\nThank you \uD83D\uDE0A'],
    [/^\/jetup(\/|$)/i, 'JetUP and TAG Markets guide', 'I have a question about JetUP and TAG Markets. Can you please help me?'],
    [/^\/altruva(\/|$)/i, 'ALTRUVA guide', 'I have a question about ALTRUVA. Can you please help me?'],
    [/^\/bw(\/|$)/i, 'Bitcoin Wealth guide', 'I have a question about Bitcoin Wealth. Can you please help me?'],
    [/^\/cbp(\/|$)/i, 'ClickBaitPays guide', 'I have a question about ClickBaitPays. Can you please help me?'],
    [/^\/canton-weekly(\/|$)/i, 'Canton Coin weekly report', 'I have a question about Canton Coin (CC) and CNTN. Can you please help me?'],
    [/^\/cc(\/|$)/i, 'How to buy Canton Coin guide', 'I need help buying Canton Coin (CC). Can you please help me?'],
    [/^\/cntn(\/|$)/i, 'How to buy CNTN stock guide', 'I need help buying CNTN stock. Can you please help me?'],
    [/^\/dashboard(\/|$)/i, 'MTG TRIBE dashboard', 'I have a question about the MTG TRIBE and your income streams. Can you please help me?'],
    [/^\/$/, 'MTG TRIBE website', 'I would like to know more about the MTG TRIBE. Can you please help me?']
  ];
  var stream = 'MTG TRIBE website', need = 'I have a question. Can you please help me?', exact = null;
  for (var i = 0; i < S.length; i++) if (S[i][0].test(P)) { stream = S[i][1]; need = S[i][2]; exact = S[i][3] || null; break; }
  function clean(s) { return (s || '').replace(/\s+/g, ' ').replace(/^\s+|\s+$/g, ''); }
  // the page's proper name: its title up to the first " | " or ": " (headlines can be slogans, titles are names)
  var full = clean((document.title || '').split(' | ')[0]);
  var page = clean(full.split(': ')[0]) || full;
  if (page.length < 4) page = full;
  if (page.length > 70) page = page.slice(0, 67).replace(/\s+\S*$/, '') + '...';
  var where = 'mtgtribe.com' + P;
  function message(a) {
    if (a.hasAttribute('data-wa-text')) return a.getAttribute('data-wa-text');
    if (exact && !a.hasAttribute('data-wa-need')) return exact;
    var n = a.getAttribute('data-wa-need') || need;
    var line = P === '/' ? "I'm on your MTG TRIBE home page (mtgtribe.com)." :
      "I'm on your " + stream + ', page "' + page + '" (' + where + ').';
    return 'Hi MTG,\n\n' + line + '\n\n' + n + '\n\nThank you 😊';
  }
  function run() {
    var links = document.querySelectorAll('a[href^="https://wa.me/27721714626"], a[href^="https://api.whatsapp.com/send?phone=27721714626"]');
    for (var j = 0; j < links.length; j++) {
      var a = links[j]; if (a.hasAttribute('data-wa-keep')) continue;
      a.setAttribute('href', NUM + '?text=' + encodeURIComponent(message(a)));
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run); else run();
})();
