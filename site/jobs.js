import { jobFreshness, matchesJobFilters } from './jobs-state.js';

const library = document.querySelector('[data-jobs-library]');
if (library) {
  const es = document.documentElement.lang === 'es';
  const t = (ru, spanish) => es ? spanish : ru;
  const form = library.querySelector('[data-job-filters]');
  const cards = [...library.querySelectorAll('[data-job]')];
  const rows = new Map([...library.querySelectorAll('[data-job-row]')].map(row => [row.dataset.jobRow, row]));
  const dialog = library.querySelector('[data-job-dialog]');
  const back = dialog.querySelector('[data-job-back]');
  const controls = Object.fromEntries([...form.elements].filter(el => el.name).map(el => [el.name, el]));
  const count = library.querySelector('[data-jobs-count]');
  const extra = library.querySelector('#jobs-extra');
  const more = form.querySelector('[data-more-filters]');
  const tokens = form.querySelector('[data-active-filters]');
  const options = new Map([...form.querySelectorAll('select')].map(el => [el.name, [...el.options].map(o => ({value:o.value, text:o.textContent}))]));
  let lastId = '', listY = 0, searchSession = false, limit = 12;
  try {
    const saved=JSON.parse(sessionStorage.getItem('natali-jobs-context')||'null');
    if (!history.state?.jobs && saved?.search === location.search) {
      history.replaceState({...history.state,jobs:{...saved,fromList:false}},'',location.href);
      lastId=saved.selected||''; limit=saved.limit||12;
    }
  } catch {}
  library.classList.add('jobs-enhanced');
  dialog.removeAttribute('open');
  dialog.querySelector('.jobs-dialog-toolbar').hidden = false;
  form.hidden = false;
  history.scrollRestoration = 'manual';
  function filters() { return Object.fromEntries(Object.entries(controls).map(([key, el]) => [key, el.type==='checkbox' ? (el.checked?el.value:'') : el.value.trim()])); }
  function clearControl(el){if(el.type==='checkbox')el.checked=false;else el.value='';}
  function save() {
    const state={...history.state?.jobs, y:dialog.open?listY:scrollY, selected:lastId, detail:dialog.scrollTop, limit};
    history.replaceState({...history.state,jobs:state},'',location.href);
    try {sessionStorage.setItem('natali-jobs-context',JSON.stringify({...state,search:location.search}));} catch {}
  }
  function write(mode, id = '') {
    const url = new URL(location.href);
    for (const [key, value] of Object.entries(filters())) {
      if (value) url.searchParams.set(key, value); else url.searchParams.delete(key);
    }
    if (id) url.searchParams.set('job', id); else url.searchParams.delete('job');
    url.hash = '';
    const state = {...history.state, jobs:{y:dialog.open ? listY : scrollY, selected:id || lastId, fromList:!!id, detail:0, limit}};
    history[mode === 'push' ? 'pushState' : 'replaceState'](state, '', url);
  }
  function closeView(restore = true) {
    if (!dialog.open) return;
    dialog.close();
    rows.forEach(row=>row.querySelectorAll('[data-job-result]').forEach(link=>link.setAttribute('aria-expanded','false')));
    document.body.classList.remove('jobs-modal-open');
    if (restore) {
      window.scrollTo({top:history.state?.jobs?.y ?? listY, behavior:'instant'});
      const row = rows.get(lastId);
      if (row && !row.hidden) row.querySelector('[data-job-result]').focus({preventScroll:true});
      else count.focus({preventScroll:true});
    }
  }
  function openView(card, restore = false) {
    const changing = !dialog.open || lastId !== card.id;
    if (!dialog.open) listY = history.state?.jobs?.y ?? scrollY;
    lastId = card.id;
    cards.forEach(item => { item.hidden = item !== card; });
    rows.forEach((row, id) => {
      row.classList.toggle('is-selected', id === lastId);
      row.querySelectorAll('[data-job-result]').forEach(link => link.setAttribute('aria-expanded', String(id === lastId)));
    });
    dialog.setAttribute('aria-labelledby', card.id + '-title');
    if (!dialog.open) { dialog.showModal(); document.body.classList.add('jobs-modal-open'); }
    if (changing || restore) {
      dialog.scrollTop = restore ? history.state?.jobs?.detail || 0 : 0;
      card.querySelector('h2').focus({preventScroll:true});
    }
    dialog.querySelectorAll('[data-job-locale]').forEach(link => {
      const url = new URL(link.href);
      url.search = location.search;
      link.href = url.pathname + url.search;
    });
  }
  function apply({hydrate = false, restore = false, changed = ''} = {}) {
    const params = new URL(location.href).searchParams;
    if(hydrate){for(const [key,el] of Object.entries(controls)){if(el.type==='checkbox')el.checked=params.get(key)===el.value;else el.value=(params.get(key)||'').slice(0,120);}limit=history.state?.jobs?.limit||12;}
    const eligible = cards.filter(card => jobFreshness(card.dataset) !== 'hidden');
    // A changed parent clears only an incompatible child, never silently rewrites a valid combination.
    if (changed === 'province' && controls.city.value && !eligible.some(card => card.dataset.city === controls.city.value && (!controls.province.value || card.dataset.province === controls.province.value))) controls.city.value = '';
    if (changed === 'city' && controls.city.value && controls.province.value && !eligible.some(card => card.dataset.city === controls.city.value && card.dataset.province === controls.province.value)) controls.province.value = '';
    for (const field of ['province','city']) {
      const current = controls[field].value;
      const values = new Set(eligible.filter(card => (!controls.industry.value || card.dataset.industry === controls.industry.value) && (field !== 'city' || !controls.province.value || card.dataset.province === controls.province.value)).map(card => card.dataset[field]));
      const available = options.get(field).filter(o => !o.value || values.has(o.value));
      controls[field].replaceChildren(...available.map(o => { const el=document.createElement('option');el.value=o.value;el.textContent=o.text;return el; }));
      controls[field].value = values.has(current) ? current : '';
    }
    const active = filters();
    const visible = [];
    for (const card of cards) {
      const freshness = jobFreshness(card.dataset);
      const matches = freshness !== 'hidden' && matchesJobFilters(card.dataset, active);
      rows.get(card.id).hidden = !matches;
      if (matches) visible.push(card);
      const pending = freshness === 'pending';
      card.querySelector('[data-job-freshness]').textContent = pending ? t('Нужна повторная проверка','Revisión pendiente') : t('Приём откликов был открыт при проверке','La fuente aceptaba candidaturas al revisar');
      rows.get(card.id).querySelector('[data-row-freshness]').textContent = pending ? t('Перепроверка','Pendiente') : '';
      card.hidden = true;
    }
    count.textContent = t('Вакансий: ','Vacantes: ') + visible.length;
    count.tabIndex = -1;
    library.querySelector('[data-jobs-empty]').hidden = visible.length !== 0;
    library.querySelector('.jobs-table').hidden = visible.length === 0;
    form.querySelectorAll('[data-sector]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.sector === active.industry)));
    tokens.replaceChildren();
    for (const [key,value] of Object.entries(active)) {
      if (!value) continue;
      const token = document.createElement('button');token.type='button';token.dataset.removeFilter=key;
      const label = key === 'pay' ? t('С опубликованной зарплатой','Con sueldo publicado') : key === 'industry' ? form.querySelector('[data-sector="' + value + '"]')?.textContent || value : options.has(key) ? options.get(key).find(o => o.value === value)?.text || value : value;
      token.textContent=label+' ×';token.setAttribute('aria-label',t('Убрать фильтр: ','Quitar filtro: ')+label);tokens.append(token);
    }
    if (tokens.children.length) {
      const clear=document.createElement('button');clear.type='button';clear.dataset.clearFilters='';clear.textContent=t('Сбросить всё','Borrar todo');tokens.append(clear);
    }
    form.querySelector('[data-more-count]').textContent = ['province','schedule','kind','pay'].filter(key=>active[key]).length||'';
    let selected = params.get('job') || decodeURIComponent(location.hash.slice(1));
    const card = visible.find(item => item.id === selected);
    if(card)limit=Math.max(limit,Math.ceil((visible.indexOf(card)+1)/12)*12);
    visible.forEach((item,index)=>{rows.get(item.id).hidden=index>=limit;});
    const moreJobs=library.querySelector('[data-jobs-more]');
    library.querySelector('[data-jobs-pagination]').hidden=visible.length<=12;
    library.querySelector('[data-jobs-shown]').textContent=t('Показано ','Mostrando ')+Math.min(limit,visible.length)+t(' из ',' de ')+visible.length;
    moreJobs.hidden=visible.length<=limit;
    refreshCities(eligible);
    const notice = library.querySelector('[data-jobs-notice]');notice.hidden = !selected || !!card;
    if (selected && !card) { notice.textContent=t('Эта вакансия больше не доступна в подборке. Выберите другую.','Esta vacante ya no está disponible en la selección. Elegí otra.'); write('replace'); selected=''; }
    if (card) { if (location.hash) write('replace',card.id); openView(card,restore); }
    else { closeView(restore); cards.forEach(item => {item.hidden=true;}); }
    if (restore && !card) window.scrollTo({top:history.state?.jobs?.y || 0, behavior:'instant'});
  }
  function update(changed, mode='push') {
    save();limit=12;
    // Apply cascading controls before serializing them, with no selected detail.
    const url = new URL(location.href);url.searchParams.delete('job');url.hash='';history.replaceState(history.state,'',url);
    apply({changed});write(mode);apply();
  }
  form.addEventListener('submit',event=>event.preventDefault());
  form.addEventListener('input',event=>{
    if (event.target.name !== 'q') return;
    update('q',searchSession?'replace':'push');searchSession=true;
  });
  controls.q.addEventListener('blur',()=>{searchSession=false;});
  form.addEventListener('change',event=>{if(event.target.name && event.target.name !== 'q')update(event.target.name);});
  library.addEventListener('click',event=>{
    const link=event.target.closest('[data-job-result]');
    if(link && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey && event.button === 0){
      event.preventDefault();const card=cards.find(item=>item.id===link.dataset.jobResult);
      if (!card || jobFreshness(card.dataset)==='hidden' || rows.get(card.id).hidden) {apply();return;}
      save();listY=scrollY;write('push',card.id);openView(card);return;
    }
    const sector=event.target.closest('[data-sector]');
    if(sector){controls.industry.value=sector.dataset.sector;update('industry');return;}
    const remove=event.target.closest('[data-remove-filter]');
    if(remove){clearControl(controls[remove.dataset.removeFilter]);update(remove.dataset.removeFilter);controls.q.focus({preventScroll:true});return;}
    if(event.target.closest('[data-clear-filters]')){for(const el of Object.values(controls))clearControl(el);update('reset');controls.q.focus({preventScroll:true});}
  });
  library.querySelector('[data-jobs-more]').addEventListener('click',()=>{limit+=12;apply();save();});
  function filterPanel(open) {extra.hidden=!open;more.setAttribute('aria-expanded',String(open));if(open)controls.province.focus({preventScroll:true});else more.focus({preventScroll:true});}
  more.addEventListener('click',()=>filterPanel(extra.hidden));
  form.querySelector('[data-hide-filters]').addEventListener('click',()=>filterPanel(false));
  extra.addEventListener('keydown',event=>{if(event.key==='Escape'){event.stopPropagation();filterPanel(false);}});
  function goBack(){
    if(history.state?.jobs?.fromList)history.back();
    else{write('replace');closeView(true);apply();}
  }
  back.addEventListener('click',goBack);
  dialog.addEventListener('cancel',event=>{event.preventDefault();goBack();});
  dialog.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)goBack();}});
  window.addEventListener('popstate',()=>apply({hydrate:true,restore:true}));
  window.addEventListener('pagehide',save);
  window.addEventListener('pageshow',()=>apply({hydrate:true,restore:true}));
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)apply();});
  dialog.querySelectorAll('[data-job-locale]').forEach(link=>link.addEventListener('click',save));
  const cityTrigger=library.querySelector('[data-city-trigger]');
  const cityPopover=library.querySelector('#jobs-city-popover');
  const cityQuery=library.querySelector('[data-city-query]');
  const cityList=library.querySelector('#jobs-city-options');
  const customCity=typeof cityPopover.showPopover==='function';
  function refreshCities(eligible=cards.filter(card=>jobFreshness(card.dataset)!=='hidden')){
    if(!customCity)return;
    const normalize=value=>value.normalize('NFD').replace(/\p{M}/gu,'').toLowerCase();
    const query=normalize(cityQuery.value);
    cityList.replaceChildren();
    const other={...filters(),city:''};
    for(const option of [...controls.city.options]){
      if(query&&!normalize(option.textContent).includes(query))continue;
      const qty=eligible.filter(card=>matchesJobFilters(card.dataset,{...other,city:option.value})).length;
      const button=document.createElement('button');button.type='button';button.dataset.cityValue=option.value;button.role='option';button.setAttribute('aria-selected',String(controls.city.value===option.value));button.disabled=qty===0;button.tabIndex=-1;
      const name=document.createElement('span');name.textContent=option.textContent;const count=document.createElement('span');count.textContent=qty;count.className='jobs-city-qty';button.append(name,count);cityList.append(button);
    }
    library.querySelector('[data-city-empty]').hidden=cityList.children.length!==0;
    library.querySelector('[data-city-label]').textContent=controls.city.selectedOptions[0]?.textContent||t('Все города','Todas las ciudades');
  }
  function closeCities(){if(cityPopover.matches(':popover-open'))cityPopover.hidePopover();cityTrigger.setAttribute('aria-expanded','false');cityTrigger.focus({preventScroll:true});}
  if(customCity){
    controls.city.hidden=true;cityTrigger.hidden=false;cityTrigger.parentElement.classList.add('city-ready');
    cityTrigger.addEventListener('click',()=>{
      if(cityPopover.matches(':popover-open')){closeCities();return;}
      cityQuery.value='';refreshCities();const rect=cityTrigger.getBoundingClientRect();
      cityPopover.style.left=Math.max(16,Math.min(rect.left,innerWidth-400))+'px';cityPopover.style.top=Math.max(16,Math.min(rect.bottom+8,innerHeight-Math.min(460,innerHeight*.7)-16))+'px';
      cityPopover.showPopover();cityTrigger.setAttribute('aria-expanded','true');cityQuery.focus({preventScroll:true});
    });
    cityQuery.addEventListener('input',()=>refreshCities());
    cityList.addEventListener('click',event=>{const button=event.target.closest('[data-city-value]');if(!button)return;controls.city.value=button.dataset.cityValue;closeCities();update('city');});
    cityPopover.querySelector('[data-city-close]').addEventListener('click',closeCities);
    cityPopover.addEventListener('toggle',()=>{cityTrigger.setAttribute('aria-expanded',String(cityPopover.matches(':popover-open')));});
    cityPopover.addEventListener('keydown',event=>{
      const buttons=[...cityList.querySelectorAll('button:not(:disabled)')];const index=buttons.indexOf(document.activeElement);
      if(['ArrowDown','ArrowUp','Home','End'].includes(event.key)){event.preventDefault();let next=event.key==='Home'?0:event.key==='End'?buttons.length-1:event.key==='ArrowDown'?Math.min(index+1,buttons.length-1):Math.max(index-1,0);buttons[next]?.focus();}
      if(event.key==='Enter'&&document.activeElement===cityQuery){event.preventDefault();buttons[0]?.click();}
      if(event.key==='Escape'){event.preventDefault();event.stopPropagation();closeCities();}
    });
  }
  apply({hydrate:true,restore:!!history.state?.jobs});
  save();
}
