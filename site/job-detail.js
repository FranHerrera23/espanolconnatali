import {jobFreshness} from './jobs-state.js';
const card=document.querySelector('.job-detail-page [data-job]');
if(card){
 const review=()=>{
  const state=jobFreshness(card.dataset);
  if(state==='hidden'){
   card.hidden=true;
   document.querySelector('meta[name=robots]').content='noindex,follow';
   if(!document.querySelector('[data-job-unavailable]')){
    const notice=document.createElement('p');notice.className='jobs-closed';notice.dataset.jobUnavailable='';notice.role='status';
    notice.textContent=document.documentElement.lang==='es'?'Este anuncio ya no forma parte de la selección actual. Consultá las vacantes disponibles.':'Это объявление больше не входит в актуальную подборку. Посмотрите доступные вакансии.';
    card.before(notice);
   }
  }else if(state==='pending')card.querySelector('[data-job-freshness]').textContent=document.documentElement.lang==='es'?'Revisión pendiente':'Нужна повторная проверка';
 };
 review();window.addEventListener('pageshow',review);document.addEventListener('visibilitychange',()=>{if(!document.hidden)review();});
}
