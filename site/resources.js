let nataliScroll=null;const menu=document.querySelector('.menu-button'),nav=document.querySelector('.nav-links');menu.addEventListener('click',()=>{const open=menu.getAttribute('aria-expanded')!=='true';menu.setAttribute('aria-expanded',String(open));nav.classList.toggle('open',open)});document.querySelectorAll('a[href^="#"]').forEach(a=>a.addEventListener('click',()=>{menu.setAttribute('aria-expanded','false');nav.classList.remove('open')}));
// Content is visible without dependencies or with reduced motion.
if(window.gsap&&window.ScrollTrigger&&window.Lenis){
 gsap.registerPlugin(ScrollTrigger);
 const media=gsap.matchMedia();
 media.add({motion:'(prefers-reduced-motion: no-preference)',desktop:'(min-width: 900px) and (pointer: fine)'},context=>{
  if(!context.conditions.motion)return;
  const desktop=context.conditions.desktop;
  if(desktop){
   nataliScroll=new Lenis({duration:1.35,easing:t=>Math.min(1,1.001-Math.pow(2,-10*t)),anchors:true,smoothWheel:true,wheelMultiplier:.9,syncTouch:false});
   nataliScroll.on('scroll',ScrollTrigger.update);
  }
  const tick=t=>nataliScroll?.raf(t*1000);
  gsap.ticker.add(tick);
  const focus=e=>{if(nataliScroll&&e.target instanceof HTMLElement){const r=e.target.getBoundingClientRect();if(r.top<24||r.bottom>innerHeight-24)nataliScroll.scrollTo(e.target,{offset:-80,immediate:true});}};
  document.addEventListener('focusin',focus);
  document.querySelectorAll('.home-view h2').forEach(el=>{
   gsap.fromTo(el,{y:24},{y:0,ease:'none',scrollTrigger:{trigger:el,start:'top 94%',end:'top 64%',scrub:.7,invalidateOnRefresh:true}});
  });
  document.querySelectorAll('.practice-sequence article').forEach(el=>{
   gsap.fromTo(el,{x:desktop?24:10},{x:0,ease:'none',scrollTrigger:{trigger:el,start:'top 88%',end:'top 55%',scrub:.8,onUpdate:self=>{el.dataset.scrollProgress=self.progress.toFixed(3);el.dataset.scrollRange=self.start+','+self.end;}}});
   gsap.fromTo(el,{borderTopColor:'#cdd4ce'},{borderTopColor:'#253d34',ease:'none',scrollTrigger:{trigger:el,start:'top 70%',end:'top 42%',scrub:.7}});
  });
  document.querySelectorAll('.hero-picture img,.story-picture img').forEach(el=>{
   gsap.fromTo(el,{clipPath:'inset(4% 3% 4% 3%)'},{clipPath:'inset(0% 0% 0% 0%)',ease:'none',scrollTrigger:{trigger:el,start:'top 95%',end:'top 25%',scrub:.9}});
  });
  document.fonts.ready.then(()=>ScrollTrigger.refresh());
  document.querySelectorAll('img').forEach(el=>el.addEventListener('load',()=>ScrollTrigger.refresh(),{once:true}));
  return ()=>{document.removeEventListener('focusin',focus);gsap.ticker.remove(tick);nataliScroll?.destroy();nataliScroll=null;};
 });
}
