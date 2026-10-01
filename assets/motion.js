/* ClickBaitPays premium motion layer */
(function(){
"use strict";
var root=document.documentElement;
var reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
var saveData=navigator.connection&&navigator.connection.saveData;
var stage=document.querySelector('.hero-v2, .lesson-hero, .page-hero, .dashboard-welcome, .calculator-hero, .completion-hero');
/* fallback: any future page layout, use the block that holds the main headline */
if(!stage){var mh=document.querySelector('main h1');if(mh)stage=mh.closest('header, section')||mh.parentElement}
function each(sel,fn){[].slice.call(document.querySelectorAll(sel)).forEach(fn)}

/* ---------- buttons: light ring, glint, arrow nudge ---------- */
each('.button.primary, .button.platform-register, .hero-v2 .button',function(b,i){
  if(b.classList.contains('cbm-ring'))return;
  b.classList.add('cbm-ring','cbm-glint');if(b.classList.contains('platform-register'))b.classList.add('cbm-alt');
  var g=document.createElement('span');g.className='cbm-gl';g.setAttribute('aria-hidden','true');b.appendChild(g);
  var arr=b.querySelector('span[aria-hidden="true"]');if(arr&&/→|➜/.test(arr.textContent))arr.classList.add('cbm-arr');
});

/* ---------- cards: border light follows the pointer ---------- */
each('.value-grid article, .process-grid article, .landing-video-card, .advertise-callout, .lesson-card, .module-card, .resource-card, .dashboard-card, .calculator-panel, .calculator-results, .decision-card, .community-card, .journey-summary > div',function(c){
  c.classList.add('cbm-glow');
  c.addEventListener('pointermove',function(e){var r=c.getBoundingClientRect();c.style.setProperty('--gx',(e.clientX-r.left)+'px');c.style.setProperty('--gy',(e.clientY-r.top)+'px')});
});

/* ---------- lesson number ring ---------- */
each('.lesson-orbit, .completion-mark, .calculator-rule-chip',function(o){o.classList.add('cbm-lesson-ring')});

if(!stage){root.classList.add('cbm-go');return}
stage.classList.add('cbm-stage');

/* ---------- headline: lines (home) or words (inner pages) rise once ---------- */
function rise(el,delay,dur,y,blur){if(!el.animate)return;try{el.animate([{opacity:0,transform:'translateY('+y+')',filter:'blur('+blur+'px)'},{opacity:1,transform:'none',filter:'blur(0px)'}],{duration:dur,delay:delay,easing:'cubic-bezier(.16,1,.3,1)',fill:'backwards'})}catch(e){}}
var h1=stage.querySelector('h1'),n=0;
if(h1&&!reduce){
  var lines=[].slice.call(h1.children).filter(function(c){return c.tagName==='SPAN'});
  var dyn=[].slice.call(h1.attributes).some(function(a){return a.name.indexOf('data-')===0});
  if(lines.length>1){lines.forEach(function(l,i){l.classList.add('cbm-line');rise(l,250+i*170,1050,'.35em',10)});n=lines.length*170+250}
  else if(dyn){rise(h1,200,1000,'.3em',10);n=500}
  else{h1.setAttribute('aria-label',h1.textContent.replace(/\s+/g,' ').trim());
    var walk=function(node){[].slice.call(node.childNodes).forEach(function(t){
      if(t.nodeType===3){var f=document.createDocumentFragment();t.textContent.split(/(\s+)/).forEach(function(w){if(!w)return;if(/^\s+$/.test(w)){f.appendChild(document.createTextNode(' '));return}
        var s=document.createElement('span');s.className='cbm-word';s.setAttribute('aria-hidden','true');s.textContent=w;rise(s,200+n*55,900,'.4em',8);n++;f.appendChild(s)});t.replaceWith(f)}
      else if(t.nodeType===1)walk(t)})};
    walk(h1);n=200+n*55}
  [].slice.call(stage.querySelectorAll('.lead, :scope > p:not(.eyebrow), :scope > div > p:not(.eyebrow), .button-row, .trust-list')).forEach(function(el,i){
    if(el.closest('h1'))return;rise(el,n+250+i*150,850,'12px',0)});
}

/* ---------- eyebrow decode ---------- */
var eb=stage.querySelector('.eyebrow');
function esc(s){return s.replace(/&/g,'&amp;').replace(/</g,'&lt;')}
function decode(el){if(reduce||!el||el.children.length>1)return;var fin=el.getAttribute('data-txt')||el.textContent;el.setAttribute('data-txt',fin);el.setAttribute('aria-label',fin);el.classList.add('cbm-dec');
  var g='0123456789ABCDEF$#%',t0=performance.now();
  (function f(now){var p=Math.min(1,(now-t0)/1000),out='';for(var i=0;i<fin.length;i++){var c=fin[i];if(/[\s•,]/.test(c)||p*fin.length*1.3>i+fin.length*.3*Math.random())out+=esc(c);else out+='<span class="sc" aria-hidden="true">'+g[(Math.random()*g.length)|0]+'</span>'}
    el.innerHTML=p>=1?esc(fin):out;if(p<1)requestAnimationFrame(f)})(t0)}
eb&&eb.addEventListener('mouseenter',function(){decode(eb)});

/* ---------- ad network canvas: ad blocks with cyan and pink click packets ---------- */
var cv=document.createElement('canvas');cv.className='cbm-canvas';cv.setAttribute('aria-hidden','true');
var spot=document.createElement('div');spot.className='cbm-spot';spot.setAttribute('aria-hidden','true');
stage.prepend(cv);stage.prepend(spot);
var ctx=cv.getContext&&cv.getContext('2d'),N=[],P=[],F=[],W=0,H=0,ptr={x:.7,y:.4,tx:.7,ty:.4,on:false,last:0},home=stage.classList.contains('hero-v2'),running=false;
function light(){return root.getAttribute('data-theme')==='light'}
function small(){return innerWidth<760}
function init(){if(!ctx)return;var r=stage.getBoundingClientRect(),d=Math.min(2,devicePixelRatio||1);W=r.width;H=r.height;cv.width=W*d;cv.height=H*d;ctx.setTransform(d,0,0,d,0,0);
  var c=Math.min(small()?(home?22:12):(home?58:26),Math.round(W*H/(home?16000:13000)));N=[];
  for(var i=0;i<c;i++)N.push({x:Math.random()*W,y:Math.random()*H,vx:(Math.random()-.5)*.15,vy:(Math.random()-.5)*.15,w:3+Math.random()*4,z:.4+Math.random()*.6,pk:Math.random()<.45})}
function D(){return small()?110:150}
function spawn(){var d=D();for(var t=0;t<10;t++){var a=N[Math.random()*N.length|0],b=null,bd=1e9;for(var j=0;j<N.length;j++){var c=N[j];if(c===a)continue;var q=Math.hypot(a.x-c.x,a.y-c.y);if(q<d&&q<bd&&Math.random()>.3){bd=q;b=c}}if(b){P.push({a:a,b:b,t:0,sp:.008+Math.random()*.009,h:1+(Math.random()*3|0),pk:Math.random()<.5});return}}}
function rr(x,y,w,h,r){ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath()}
function draw(){if(!ctx)return;var L=light(),d=D(),i,j,n;ctx.clearRect(0,0,W,H);var mx=ptr.x*W,my=ptr.y*H,line=L?'40,30,90':'170,200,255';
  for(i=0;i<N.length;i++){n=N[i];if(!reduce){n.x+=n.vx;n.y+=n.vy}
    if(ptr.on){var dx=mx-n.x,dy=my-n.y,dd=Math.hypot(dx,dy);if(dd<180&&dd>1){n.x+=dx/dd*.1*n.z;n.y+=dy/dd*.1*n.z}}
    if(n.x<-20)n.x=W+20;if(n.x>W+20)n.x=-20;if(n.y<-20)n.y=H+20;if(n.y>H+20)n.y=-20}
  ctx.lineWidth=1;
  for(i=0;i<N.length;i++){var a=N[i];for(j=i+1;j<N.length;j++){var b=N[j],x=a.x-b.x,y=a.y-b.y,q=x*x+y*y;if(q<d*d){ctx.strokeStyle='rgba('+line+','+((1-Math.sqrt(q)/d)*.14*Math.min(a.z,b.z))+')';ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke()}}
    if(ptr.on){var e=Math.hypot(a.x-mx,a.y-my);if(e<170){ctx.strokeStyle='rgba(0,229,255,'+((1-e/170)*.3)+')';ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(mx,my);ctx.stroke()}}}
  for(i=0;i<N.length;i++){n=N[i];var w=n.w*1.7,h=n.w*1.1;rr(n.x-w/2,n.y-h/2,w,h,2);ctx.fillStyle=n.pk?'rgba(255,0,255,'+(.16*n.z+.05)+')':'rgba(0,229,255,'+(.18*n.z+.05)+')';ctx.fill();ctx.strokeStyle=n.pk?'rgba(255,0,255,'+(.4*n.z)+')':'rgba(0,229,255,'+(.4*n.z)+')';ctx.stroke()}
  if(!reduce){
    for(i=P.length-1;i>=0;i--){var p=P[i];p.t+=p.sp;var k=p.t<.5?2*p.t*p.t:1-Math.pow(-2*p.t+2,2)/2,px=p.a.x+(p.b.x-p.a.x)*k,py=p.a.y+(p.b.y-p.a.y)*k,col=p.pk?'255,0,255':'0,229,255';
      var tx=p.a.x+(p.b.x-p.a.x)*Math.max(0,k-.18),ty=p.a.y+(p.b.y-p.a.y)*Math.max(0,k-.18),gr=ctx.createLinearGradient(tx,ty,px,py);gr.addColorStop(0,'rgba('+col+',0)');gr.addColorStop(1,'rgba('+col+',.9)');
      ctx.strokeStyle=gr;ctx.lineWidth=1.6;ctx.beginPath();ctx.moveTo(tx,ty);ctx.lineTo(px,py);ctx.stroke();ctx.lineWidth=1;
      ctx.shadowColor='rgb('+col+')';ctx.shadowBlur=12;ctx.fillStyle=p.pk?'#ff7bff':'#8ff6ff';ctx.beginPath();ctx.arc(px,py,2.2,0,6.283);ctx.fill();ctx.shadowBlur=0;
      if(p.t>=1){F.push({n:p.b,r:0,l:1,pk:p.pk});if(--p.h>0){var bb=null,bd=1e9;for(j=0;j<N.length;j++){var c2=N[j];if(c2===p.b||c2===p.a)continue;var q2=Math.hypot(c2.x-p.b.x,c2.y-p.b.y);if(q2<d&&q2<bd){bd=q2;bb=c2}}if(bb){p.a=p.b;p.b=bb;p.t=0;p.pk=!p.pk;continue}}P.splice(i,1)}}
    for(i=F.length-1;i>=0;i--){var f=F[i];f.r+=.9;f.l-=.024;ctx.strokeStyle='rgba('+(f.pk?'255,0,255':'0,229,255')+','+(f.l*.6)+')';rr(f.n.x-f.r/2-4,f.n.y-f.r/3-3,f.r+8,f.r*.66+6,3);ctx.stroke();if(f.l<=0)F.splice(i,1)}
    if(P.length<(small()?3:(home?6:3))&&Math.random()<.035)spawn();
    ptr.x+=(ptr.tx-ptr.x)*.08;ptr.y+=(ptr.ty-ptr.y)*.08;
    if(!ptr.on&&Date.now()-ptr.last>1500){var tt=Date.now();ptr.tx=.68+Math.sin(tt/4200)*.25;ptr.ty=.4+Math.cos(tt/3100)*.2}
    stage.style.setProperty('--mx',(ptr.x*100).toFixed(2)+'%');stage.style.setProperty('--my',(ptr.y*100).toFixed(2)+'%');
    if(!document.hidden&&running)requestAnimationFrame(draw)}
}
stage.addEventListener('pointermove',function(e){if(e.pointerType==='touch')return;var r=stage.getBoundingClientRect();ptr.tx=(e.clientX-r.left)/r.width;ptr.ty=(e.clientY-r.top)/r.height;ptr.on=true;ptr.last=Date.now()});
stage.addEventListener('pointerleave',function(){ptr.on=false});
/* only animate while the header is on screen */
if('IntersectionObserver' in window)new IntersectionObserver(function(es){es.forEach(function(e){var was=running;running=e.isIntersecting&&!reduce&&!saveData;if(running&&!was)requestAnimationFrame(draw)})}).observe(stage);
else running=!reduce&&!saveData;
document.addEventListener('visibilitychange',function(){if(!document.hidden&&running)requestAnimationFrame(draw)});
var rt;addEventListener('resize',function(){clearTimeout(rt);rt=setTimeout(function(){init();if(!running)draw()},150)});

function start(){init();draw();requestAnimationFrame(function(){root.classList.add('cbm-go');decode(eb)})}
(document.fonts&&document.fonts.ready?document.fonts.ready:Promise.resolve()).then(start);
})();
