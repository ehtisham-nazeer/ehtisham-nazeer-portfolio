/* ============================================================
   MOTION SYSTEM V3 — GSAP + Native Scroll (2026-11-03)
   ------------------------------------------------------------
   One shared motion file for all pages. Two paths, no doubles:

   PATH A (gsap + ScrollTrigger loaded, motion OK):
     - <html> gets .gsap-on  -> CSS kills its own heroIn / .reveal
       hidden-states / impact staggers / tab pgIn (GSAP drives them)
     - NATIVE scroll (no JS smoothing = zero input lag)
     - GSAP: opening timeline + scroll reveals + tab-switch stagger
     - CSS keeps: hovers, buttons, icons, menu, lightbox, orbs' float
   PATH B (CDN failed OR prefers-reduced-motion):
     - legacy vanilla system: IntersectionObserver reveals,
       rAF orb parallax, hero mouse parallax, card tilt.
     - content is ALWAYS visible: initial hidden states live in
       CSS only under .gsap-on or the legacy .reveal flow.
   Content, images, copy, paths: untouched. Presentation only.
   ============================================================ */
(function(){
'use strict';

/* ---------- shared: mobile menu (both paths) ---------- */
var menu=document.getElementById('menu'),links=document.getElementById('links');
if(menu&&links){
  menu.addEventListener('click',function(){
    var open=links.classList.toggle('open');
    menu.setAttribute('aria-expanded',String(open));
    menu.textContent=open?'CLOSE \u2212':'MENU +';
  });
  document.addEventListener('keydown',function(e){
    if(e.key==='Escape'&&links.classList.contains('open')){
      links.classList.remove('open');
      menu.setAttribute('aria-expanded','false');
      menu.textContent='MENU +';
      menu.focus();
    }
  });
}

/* ---------- shared: broken-image fallback (both paths) ---------- */
document.querySelectorAll('img').forEach(function(img){
  img.addEventListener('error',function(){
    var f=img.closest('figure');
    if(f){f.style.display='none';}else{img.style.display='none';}
  });
});

var reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
var finePointer=window.matchMedia('(pointer:fine)').matches;
var hasV2=!reduced&&window.gsap&&window.ScrollTrigger;

if(hasV2){
  /* add BEFORE first paint: CSS stands down, GSAP takes over */
  document.documentElement.classList.add('gsap-on');
  initV2();
}else{
  initLegacy();
}

/* ============================================================
   PATH A — Lenis + GSAP
   ============================================================ */
function initV2(){
  var E='power3.out'; /* restrained, matches --ease language */
  gsap.registerPlugin(ScrollTrigger);
  if(ScrollTrigger.config){ScrollTrigger.config({ignoreMobileResize:true});}

  /* ---- Native scroll: no JS smoothing = zero lag ---- */
  window.__lenis=null;

  /* ---- smooth anchor navigation (skip-link etc.) ---- */
  document.querySelectorAll('a[href^="#"]').forEach(function(a){
    var id=a.getAttribute('href');
    if(!id||id.length<2)return;
    var target=document.querySelector(id);
    if(!target)return;
    a.addEventListener('click',function(ev){
      ev.preventDefault();
      target.scrollIntoView({behavior:'smooth',block:'start'});
      if(target.getAttribute('tabindex')==null){target.setAttribute('tabindex','-1');}
      target.focus({preventScroll:true});
    });
  });

  /* ---- decorative orb scroll parallax (driven by Lenis) ---- */
  if(finePointer){
    var orbs=document.querySelectorAll('.page-orb,.cta-orb');
    if(orbs.length){
      var tick=false;
      window.addEventListener('scroll',function(){
        if(tick)return;tick=true;
        requestAnimationFrame(function(){
          var y=Math.min(window.scrollY,600)*0.07;
          for(var i=0;i<orbs.length;i++){orbs[i].style.translate='0 '+y.toFixed(1)+'px';}
          tick=false;
        });
      },{passive:true});
    }
    /* ---- hero mouse parallax (index only, desktop) ---- */
    var hero=document.querySelector('.hero'),art=document.querySelector('.hero-art');
    if(hero&&art){
      hero.addEventListener('mousemove',function(e){
        var r=hero.getBoundingClientRect(),
            x=(e.clientX-r.left)/r.width-0.5,
            y=(e.clientY-r.top)/r.height-0.5;
        art.style.translate=(x*16)+'px '+(y*12)+'px';
      });
      hero.addEventListener('mouseleave',function(){art.style.translate='0px 0px';});
    }
    /* ---- work-card tilt (projects only, desktop) ---- */
    document.querySelectorAll('.work-card').forEach(function(c){
      c.addEventListener('mousemove',function(e){
        var r=c.getBoundingClientRect(),
            x=(e.clientX-r.left)/r.width-0.5,
            y=(e.clientY-r.top)/r.height-0.5;
        c.style.transform='perspective(900px) rotateX('+(-y*5).toFixed(2)+'deg) rotateY('+(x*5).toFixed(2)+'deg) translateY(-4px)';
      });
      c.addEventListener('mouseleave',function(){c.style.transform='';});
    });
  }

  opening(E);
  reveals(E);

  window.addEventListener('load',function(){ScrollTrigger.refresh();});
}

/* ---- A. opening: one intentional sequence per hero, no waiting ---- */
function opening(E){
  if(document.querySelector('.hero')){
    gsap.timeline({defaults:{ease:E}})
      .from('.hero > .eyebrow',{y:14,opacity:0,duration:.4},0)
      /* signature: clean line-mask reveal on the name */
      .from('.hero > h1 .lm > span',{yPercent:118,duration:.6,stagger:.08},.05)
      /* opacity only: orbFloat owns .hero-art's transform */
      .from('.hero-art',{opacity:0,duration:.6},.1)
      .from('.hero > .hero-sub',{y:18,opacity:0,duration:.45},.12)
      .from('.hero > .hero-copy',{y:18,opacity:0,duration:.45},.16)
      .from('.hero > .hero-actions',{y:18,opacity:0,duration:.45},.22)
      .from('.hero > .metrics .metric',{y:14,opacity:0,duration:.4,stagger:.05},.28);
  }else{
    /* experience / projects / contact: lighter entrance */
    var sel='.page-hero > *, .contact-hero > *';
    if(document.querySelector('.page-hero, .contact-hero')){
      gsap.timeline({defaults:{ease:E}})
        .from(sel,{y:18,opacity:0,duration:.45,stagger:.05},0);
    }
  }
}

/* ---- B. scroll reveals: one technique per content type ---- */
function reveals(E){
  /* generic sections: soft rise */
  gsap.utils.toArray('.reveal').forEach(function(el){
    if(el.classList.contains('work-card')||el.classList.contains('impact'))return;
    gsap.fromTo(el,{y:24,opacity:0},
      {y:0,opacity:1,duration:.55,ease:E,clearProps:'transform,opacity',
       scrollTrigger:{trigger:el,start:'top 88%',once:true}});
  });

  /* impact band: staggered stats */
  var impact=document.querySelector('.impact');
  if(impact){
    var items=impact.querySelectorAll('.impact-item');
    gsap.set(items,{y:16,opacity:0});
    ScrollTrigger.create({trigger:impact,start:'top 85%',once:true,
      onEnter:function(){
        gsap.to(items,{y:0,opacity:1,duration:.6,ease:E,stagger:.07,clearProps:'transform,opacity'});
      }});
  }

  /* project cards: batch the visible group; hidden groups animate on tab switch */
  var activeGroup=document.querySelector('.project-group.active');
  if(activeGroup){batchCards(activeGroup,E);}

  window.__motionCards=function(group){
    var cards=group.querySelectorAll('.work-card');
    if(!cards.length)return;
    gsap.set(cards,{y:22,opacity:0});
    gsap.to(cards,{y:0,opacity:1,duration:.55,ease:E,stagger:.05,clearProps:'transform,opacity'});
    ScrollTrigger.refresh();
  };
}

function batchCards(group,E){
  var cards=gsap.utils.toArray(group.querySelectorAll('.work-card'));
  if(!cards.length)return;
  gsap.set(cards,{y:26,opacity:0});
  ScrollTrigger.batch(cards,{start:'top 92%',once:true,
    onEnter:function(els){
      gsap.to(els,{y:0,opacity:1,duration:.65,ease:E||'power3.out',stagger:.06,clearProps:'transform,opacity'});
    }});
}

/* ============================================================
   PATH B — legacy vanilla (CDN failed or reduced motion)
   Same behaviour the site had before V2. Content always ends
   visible: IO adds .visible; reduced-motion CSS kills transitions.
   ============================================================ */
function initLegacy(){
  var io=new IntersectionObserver(function(es){
    es.forEach(function(e){
      if(e.isIntersecting){e.target.classList.add('visible');io.unobserve(e.target);}
    });
  },{threshold:.1});
  document.querySelectorAll('.reveal').forEach(function(el){io.observe(el);});

  if(!finePointer||reduced)return;

  /* orb scroll parallax */
  var orbs=document.querySelectorAll('.page-orb,.cta-orb');
  if(orbs.length){
    var tick=false;
    window.addEventListener('scroll',function(){
      if(tick)return;tick=true;
      requestAnimationFrame(function(){
        var y=Math.min(window.scrollY,600)*0.07;
        orbs.forEach(function(o){o.style.translate='0 '+y.toFixed(1)+'px';});
        tick=false;
      });
    },{passive:true});
  }

  /* hero mouse parallax (index only) */
  var hero=document.querySelector('.hero'),art=document.querySelector('.hero-art');
  if(hero&&art){
    hero.addEventListener('mousemove',function(e){
      var r=hero.getBoundingClientRect(),
          x=(e.clientX-r.left)/r.width-0.5,
          y=(e.clientY-r.top)/r.height-0.5;
      art.style.translate=(x*16)+'px '+(y*12)+'px';
    });
    hero.addEventListener('mouseleave',function(){art.style.translate='0px 0px';});
  }

  /* work-card tilt (projects only) */
  document.querySelectorAll('.work-card').forEach(function(c){
    c.addEventListener('mousemove',function(e){
      var r=c.getBoundingClientRect(),
          x=(e.clientX-r.left)/r.width-0.5,
          y=(e.clientY-r.top)/r.height-0.5;
      c.style.transform='perspective(900px) rotateX('+(-y*5).toFixed(2)+'deg) rotateY('+(x*5).toFixed(2)+'deg) translateY(-4px)';
    });
    c.addEventListener('mouseleave',function(){c.style.transform='';});
  });
}
})();
