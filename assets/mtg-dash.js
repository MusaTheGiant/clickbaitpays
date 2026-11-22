/* MTG 👑 Dashboard Standard | side panel behaviour
   Laptops and desktops (1061px and wider): the edge pill and the Menu button collapse or expand the panel,
   and the choice is remembered. Tablets and phones: the panel slides out as a drawer over a dimmed page. */
(function(){
"use strict";
var shell=document.querySelector('.md-shell'),side=document.querySelector('.md-side');
if(!shell||!side)return;
var KEY='mtg-side',tog=document.querySelector('.md-toggle'),btn=document.querySelector('.md-menu'),scrim=document.querySelector('.md-scrim');
var wide=window.matchMedia('(min-width:1061px)'),open=false,lastFocus=null;
function store(v){try{localStorage.setItem(KEY,v)}catch(e){}}
function saved(){try{return localStorage.getItem(KEY)!=='off'}catch(e){return true}}
function label(el,isOpen){if(!el)return;el.setAttribute('aria-expanded',isOpen?'true':'false');var t=isOpen?'Collapse menu':'Expand menu';if(el===btn){var l=el.querySelector('.lbl');if(l)l.textContent=isOpen&&!wide.matches?'Close':'Menu';el.setAttribute('aria-label',isOpen?'Close menu':'Open menu')}else{el.setAttribute('aria-label',t);el.setAttribute('title',t)}}
function set(next,focus){
  open=next;label(tog,next);label(btn,next);
  if(wide.matches){
    shell.classList.toggle('md-off',!next);side.classList.remove('open');if(scrim)scrim.classList.remove('on');
    side.removeAttribute('inert');side.toggleAttribute('inert',!next);
  }else{
    shell.classList.remove('md-off');side.classList.toggle('open',next);if(scrim)scrim.classList.toggle('on',next);
    side.toggleAttribute('inert',!next);document.documentElement.style.overflow=next?'hidden':'';
    if(next&&focus){lastFocus=document.activeElement;var a=side.querySelector('a,button');if(a)setTimeout(function(){a.focus({preventScroll:true})},60)}
    if(!next&&focus&&lastFocus){lastFocus.focus({preventScroll:true});lastFocus=null}
  }
}
function sync(){set(wide.matches?saved():false,false)}
function flip(){var n=!open;set(n,true);if(wide.matches)store(n?'on':'off')}
sync();
if(wide.addEventListener)wide.addEventListener('change',sync);else if(wide.addListener)wide.addListener(sync);
if(tog)tog.addEventListener('click',flip);
if(btn)btn.addEventListener('click',flip);
if(scrim)scrim.addEventListener('click',function(){set(false,true)});
document.addEventListener('keydown',function(e){if(e.key==='Escape'&&open&&!wide.matches)set(false,true)});
/* on phones, picking a menu item closes the drawer; same-page links also light up as you pick them */
side.querySelectorAll('a').forEach(function(a){a.addEventListener('click',function(){
  var h=a.getAttribute('href')||'';
  if(h.charAt(0)==='#'&&a.classList.contains('md-nav')){side.querySelectorAll('.md-nav').forEach(function(n){n.classList.remove('is-on')});a.classList.add('is-on')}
  if(!wide.matches)set(false,false);
})});
/* let the page draw before animations are switched on, so a remembered collapsed panel does not slide on load */
requestAnimationFrame(function(){requestAnimationFrame(function(){document.documentElement.classList.add('md-ready')})});
})();
