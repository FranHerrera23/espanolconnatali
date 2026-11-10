(() => {
 const back=document.querySelector('[data-method-back]');if(!back||!document.referrer)return;
 try{const ref=new URL(document.referrer);if(ref.origin!==location.origin||!/^\/(?:es\/)?life-in-spain\//.test(ref.pathname)||ref.pathname===location.pathname)return;
 back.href=ref.pathname+ref.search+ref.hash;back.textContent=back.dataset.lang==='es'?'← Volver a la sección anterior':'← Вернуться к предыдущему разделу';
 back.addEventListener('click',e=>{if(e.button===0&&!e.metaKey&&!e.ctrlKey&&!e.shiftKey&&!e.altKey&&history.length>1){e.preventDefault();history.back();}});
 }catch{}
})();

(() => {
 const hub=document.querySelector('[data-life-hub]');if(!hub)return;
 const bar=hub.querySelector('[data-hub-controls]'),buttons=[...hub.querySelectorAll('[data-hub-category]')],panels=[...hub.querySelectorAll('[data-hub-panel]')],welcome=hub.querySelector('[data-hub-welcome]'),status=hub.querySelector('[role=status]');
 const valid=new Set(buttons.map(b=>b.dataset.hubCategory));let animation;
 const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
 const updateLanguages=()=>document.querySelectorAll('[data-language]').forEach(a=>{a.search=location.search;});
 function show(category,animate=false){
  const selected=valid.has(category)?category:null;
  buttons.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.hubCategory===selected)));
  panels.forEach(p=>p.hidden=p.dataset.hubPanel!==selected);welcome.hidden=!!selected;
  animation?.cancel();const panel=panels.find(p=>!p.hidden);
  if(panel&&animate&&!reduced()&&panel.animate)animation=panel.animate([{opacity:0,transform:'translateY(8px)'},{opacity:1,transform:'none'}],{duration:220,easing:'cubic-bezier(.2,.7,.2,1)'});
  status.textContent=selected?buttons.find(b=>b.dataset.hubCategory===selected).textContent.trim():'';updateLanguages();
 }
 function choose(id){const url=new URL(location.href);if(url.searchParams.get('category')===id)return;id?url.searchParams.set('category',id):url.searchParams.delete('category');history.pushState({hubCategory:id},'',url);show(id,true);}
 bar.hidden=false;show(new URL(location.href).searchParams.get('category'));
 buttons.forEach((b,i)=>{b.addEventListener('click',()=>choose(b.dataset.hubCategory));b.addEventListener('keydown',e=>{const step=e.key==='ArrowRight'?1:e.key==='ArrowLeft'?-1:0;if(step){e.preventDefault();buttons[(i+step+buttons.length)%buttons.length].focus();}if(e.key==='Home'){e.preventDefault();buttons[0].focus();}if(e.key==='End'){e.preventDefault();buttons.at(-1).focus();}});});
 hub.querySelectorAll('[data-hub-reset]').forEach(b=>b.addEventListener('click',()=>{const active=buttons.find(b=>b.getAttribute('aria-pressed')==='true');choose(null);active?.focus({preventScroll:true});}));
 addEventListener('popstate',()=>show(new URL(location.href).searchParams.get('category')));addEventListener('pageshow',()=>show(new URL(location.href).searchParams.get('category')));
 const header=document.querySelector('.cmp-nav'),align=()=>hub.style.setProperty('--hub-nav-height',header.getBoundingClientRect().height+'px');align();if(typeof ResizeObserver!=='undefined')new ResizeObserver(align).observe(header);
})();

(() => {
 const root=document.querySelector('[data-comparison]');
 const form=root?.querySelector('form'),dialog=root?.querySelector('dialog');
 const normalize=s=>s.normalize('NFKD').replace(/\p{M}/gu,'').toLowerCase().replace(/ё/g,'е');
 const params=()=>new URL(location.href).searchParams;
 function languageLinks(){document.querySelectorAll('[data-language]').forEach(a=>{a.search=location.search;});}
 languageLinks();
 const back=document.querySelector('[data-return]');
 if(back&&document.referrer){const ref=new URL(document.referrer);if(ref.origin===location.origin&&ref.pathname===new URL(back.href).pathname){back.href=ref.pathname+ref.search;back.addEventListener('click',e=>{if(e.button===0&&!e.metaKey&&!e.ctrlKey&&!e.shiftKey){e.preventDefault();history.back();}});}}
 if(!root||!form||!dialog)return;
 const rows=[...root.querySelectorAll('[data-row]')],empty=root.querySelector('[data-empty]'),count=root.querySelector('[role=status]');
 const content=dialog.querySelector('[data-dialog-content]');
 let trigger=null,returnY=0,ownsEntry=false;
 function apply(){
  const q=normalize(form.elements.q.value).trim().split(/\s+/).filter(Boolean),city=form.elements.city.value,evidence=form.elements.evidence.value;
  let n=0;rows.forEach(row=>{const read=Number(row.dataset.read);row.hidden=(city&&row.dataset.city!==city)||!q.every(w=>normalize(row.dataset.search).includes(w))||(evidence==='read'&&read===0)||(evidence==='pending'&&read>0);if(!row.hidden)n++;});
  empty.hidden=n!==0;count.textContent=(root.dataset.lang==='es'?'Sedes: ':'Площадок: ')+n+' / '+rows.length;
  languageLinks();
 }
 function restore(){['q','city','evidence'].forEach(k=>{form.elements[k].value=params().get(k)||'';});apply();}
 function save(){const url=new URL(location.href);['q','city','evidence'].forEach(k=>{const v=form.elements[k].value;v?url.searchParams.set(k,v):url.searchParams.delete(k);});history.replaceState(history.state,'',url);apply();}
 function closeUI(){if(dialog.open)dialog.close();content.replaceChildren();document.body.classList.remove('cmp-modal-open');window.scrollTo({top:returnY,behavior:'instant'});trigger?.focus({preventScroll:true});}
 function openUI(id){const t=document.getElementById('entry-'+id);if(!t)return false;content.replaceChildren(t.content.cloneNode(true));document.body.classList.add('cmp-modal-open');if(!dialog.open)dialog.showModal();dialog.scrollTop=0;dialog.querySelector('[data-close]').focus({preventScroll:true});return true;}
 function close(){if(ownsEntry&&params().has('entry')){history.back();}else{const u=new URL(location.href);u.searchParams.delete('entry');history.replaceState(history.state,'',u);closeUI();languageLinks();}}
 form.hidden=false;restore();
 form.addEventListener('submit',e=>e.preventDefault());form.addEventListener('input',save);form.addEventListener('change',save);
 form.addEventListener('reset',()=>setTimeout(save,0));root.querySelector('[data-reset]').addEventListener('click',()=>form.reset());
 root.addEventListener('click',e=>{const a=e.target.closest('[data-dossier]');if(!a||e.button!==0||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey||typeof dialog.showModal!=='function')return;e.preventDefault();trigger=a;returnY=scrollY;if(openUI(a.dataset.dossier)){const u=new URL(location.href);u.searchParams.set('entry',a.dataset.dossier);history.pushState({cmpEntry:true,cmpY:returnY},'',u);ownsEntry=true;languageLinks();}});
 dialog.querySelector('[data-close]').addEventListener('click',close);dialog.addEventListener('cancel',e=>{e.preventDefault();close();});
 dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)close();}});
 addEventListener('popstate',()=>{restore();if(params().has('entry')){returnY=history.state?.cmpY||scrollY;openUI(params().get('entry'));}else{closeUI();ownsEntry=false;}});
 addEventListener('pageshow',restore);
 if(params().has('entry')&&typeof dialog.showModal==='function'){returnY=scrollY;openUI(params().get('entry'));}
})();
