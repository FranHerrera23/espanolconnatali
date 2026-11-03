const menu=document.querySelector('.menu-button'),nav=document.querySelector('.nav-links');
// The home retains its own navigation/motion controller.
if(!document.querySelector('.home-view'))menu?.addEventListener('click',()=>{const open=menu.getAttribute('aria-expanded')!=='true';menu.setAttribute('aria-expanded',String(open));nav.classList.toggle('open',open)});
document.querySelectorAll('[data-print]').forEach(b=>b.addEventListener('click',()=>window.print()));
document.querySelectorAll('[data-copy]').forEach(b=>b.addEventListener('click',async()=>{const status=b.parentElement.querySelector('[role=status]');try{await navigator.clipboard.writeText(document.querySelector('link[rel=canonical]').href);status.textContent='Ссылка скопирована';}catch{status.textContent='Скопируйте адрес из строки браузера.';}}));
