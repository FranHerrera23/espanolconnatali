import {readFile,writeFile,mkdir,cp,rm} from 'node:fs/promises';
import path from 'node:path';
const root=process.cwd(),src=path.resolve(root,process.env.SITE_SOURCE||'site'),out=path.join(root,process.env.BUILD_DIR||'dist');
if(!path.resolve(out).startsWith(root+path.sep)||path.resolve(out)===src)throw Error('Output must be a separate workspace directory');
const config=JSON.parse(await readFile('site.config.json','utf8'));
const production=process.env.DEPLOY_MODE==='production';
const baseInput=process.env.SITE_URL||config.productionSiteUrl;
if(production&&!baseInput)throw Error('Set SITE_URL to the confirmed production origin before a production build.');
const origin=new URL(baseInput||(process.env.VERCEL_URL?'https://'+process.env.VERCEL_URL:'http://localhost:4173'));
if(origin.pathname!=='/'||origin.search||origin.hash||origin.username||origin.password)throw Error('SITE_URL must be an origin without path, query or credentials');
if(production&&origin.protocol!=='https:')throw Error('Production SITE_URL must use HTTPS');
const base=origin.origin,instagram='https://www.instagram.com/espanol.con.natali/';
const records=Object.values(JSON.parse(await readFile(path.join(src,'resources-content.json'),'utf8')));
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const strip=s=>s.replace(/<[^>]+>/g,'').replace(/\s+/g,' ').trim();
const json=s=>JSON.stringify(s).replace(/</g,'\\u003c');
const url=p=>base+p;
for(const r of records){
 if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(r.slug))throw Error('Invalid article slug');
 if(r.takeaways.length!==3)throw Error('Exactly three takeaways required: '+r.slug);
 if(r.status==='published'){
  if(!r.author?.name||!r.author?.jobTitle||!r.author?.image||!r.reviewer?.name||!r.publishedAt||!r.updatedAt||!r.sources?.length)throw Error('Published article needs real author, reviewer, dates and sources: '+r.slug);
  if(!Number.isFinite(Date.parse(r.publishedAt))||!Number.isFinite(Date.parse(r.updatedAt))||Date.parse(r.updatedAt)<Date.parse(r.publishedAt))throw Error('Invalid editorial dates');
  if(r.approvalRequired!==false)throw Error('Publication approval missing: '+r.slug);
 }
}
const included=records.filter(r=>!production||r.status==='published');
const excluded=records.filter(r=>!included.includes(r));
await rm(out,{recursive:true,force:true});await mkdir(out,{recursive:true});
await cp(path.join(src,'assets'),path.join(out,'assets'),{recursive:true});
for(const name of ['design-system.css','library.css','resources.js'])await cp(path.join(src,name),path.join(out,name));
const org={'@type':'EducationalOrganization','@id':url('/#organization'),name:'Español con Natali',url:url('/'),sameAs:[instagram],founder:{'@id':url('/#natali')}};
const person={'@type':'Person','@id':url('/#natali'),name:'Натали',jobTitle:'Преподаватель испанского языка',image:url('/assets/natali-city.jpg'),sameAs:[instagram]};
const website={'@type':'WebSite','@id':url('/#website'),url:url('/'),name:'Español con Natali',inLanguage:'ru',publisher:{'@id':org['@id']}};
const course={'@type':'Course','@id':url('/#course'),name:'Курс испанского в своём темпе',description:'Десять часов видеоуроков с двумя преподавателями из команды Натали, упражнения к каждой главе, видео для практики и письменная обратная связь.',inLanguage:'ru',url:url('/#course'),provider:{'@id':org['@id']},teaches:'Испанский язык'};
const sitemap=[];
const routeHref=href=>{
 if(/^(https?:|mailto:|#|data:)/.test(href))return href;
 href=href.replace(/^\.\.\//,'');
 if(href.startsWith('index.html'))return '/'+href.slice(10);
 if(href==='resources.html')return '/resources/';
 if(href.startsWith('resources/')&&href.endsWith('.html'))return '/resources/'+href.slice(10,-5)+'/';
 if(/^(assets\/|design-system.css|library.css|resources.js)/.test(href))return '/'+href;
 return href;
};
const descriptions={home:'Испанский для русскоязычных: курс в своём темпе с практикой и письменной обратной связью. Индивидуальные занятия с Натали — три месяца с предоплатой.',library:'Бесплатные статьи и практикумы по испанскому: как поддержать разговор, договориться о встрече и практиковаться самостоятельно.'};
function removeDraftLinks(html){
 for(const r of excluded){
  const slug=r.slug;
  html=html.replace(/<section class="library-feature[\s\S]*?<\/section>/g,section=>section.includes('resources/'+slug+'.html')?'':section);

  html=html.replace(new RegExp('<article[^>]*>(?:(?!<article)[\\s\\S])*?href="(?:\\.\\./)?resources/'+slug+'\\.html"[\\s\\S]*?<\\/article>','g'),'');
  html=html.replace(new RegExp('<a[^>]*href="(?:\\.\\./)?resources/'+slug+'\\.html"[^>]*>[\\s\\S]*?<\\/a>','g'),'');
 }
 return html;
}
async function render(file,route,kind,r){
 let html=await readFile(path.join(src,file),'utf8');
 const published=r?.status==='published';
 let indexable=production&&(kind==='home'||kind==='library'&&included.length>0||kind==='article'&&published);
 if(production){
  html=html.replace(/<div class="preview-note">[\s\S]*?<\/div>/,'');
  html=html.replace(/<p class="resource-review-note">[\s\S]*?<\/p>/,'');
  html=removeDraftLinks(html);
  if(!included.length){
   html=html.replace(/<section class="library-feature[\s\S]*?<\/section>/,'');
   html=html.replace(/<section class="library-shelf[\s\S]*?<\/section>/,'<section class="library-shelf wrap"><h2>Скоро здесь появятся новые материалы.</h2><p>Пока можно познакомиться с курсом или заглянуть в Instagram Натали.</p><a class="link" href="'+instagram+'">Натали в Instagram ↗</a></section>');
  }
 }
 html=html.replace(/(?:<link rel="canonical"[^>]*>|<meta name="robots"[^>]*>|<meta name="description"[^>]*>)/g,'');
 html=html.replace(/(href|src)="([^\"]+)"/g,(_,attr,v)=>attr+'="'+routeHref(v)+'"');
 const title=kind==='home'?'Курс испанского для русскоязычных — Español con Natali':kind==='library'?'Бесплатные материалы по испанскому — Español con Natali':r.title+' — Español con Natali';
 const description=kind==='article'?r.answer:descriptions[kind];
 html=html.replace(/<title>[\s\S]*?<\/title>/,'<title>'+esc(title)+'</title>');
 const page={'@type':kind==='library'?'CollectionPage':'WebPage','@id':url(route+'#webpage'),url:url(route),name:title,description,inLanguage:'ru',isPartOf:{'@id':website['@id']},publisher:{'@id':org['@id']}};
 const graph=[org,person,website,page];
 if(kind==='home'){page.mainEntity={'@id':course['@id']};graph.push(course);}
 if(kind==='library'&&included.length){graph.push({'@type':'ItemList','@id':url(route+'#readings'),itemListElement:included.map((a,i)=>({'@type':'ListItem',position:i+1,url:url('/resources/'+a.slug+'/'),name:a.title}))});page.mainEntity={'@id':url(route+'#readings')};}
 if(kind!=='home'){
  graph.push({'@type':'BreadcrumbList','@id':url(route+'#breadcrumbs'),itemListElement:[{'@type':'ListItem',position:1,name:'Главная',item:url('/')},{'@type':'ListItem',position:2,name:'Бесплатные материалы',item:url('/resources/')},...(r?[{'@type':'ListItem',position:3,name:r.title,item:url(route)}]:[])]});
  page.breadcrumb={'@id':url(route+'#breadcrumbs')};
 }
 if(r){
  const article={'@type':'Article','@id':url(route+'#article'),headline:r.title,description:r.answer,inLanguage:'ru',mainEntityOfPage:{'@id':page['@id']},publisher:{'@id':org['@id']},image:url('/assets/natali-city.jpg'),articleSection:r.topic,creativeWorkStatus:published?'Published':'Draft'};
  if(published){
   article.author={'@type':'Person',name:r.author.name,jobTitle:r.author.jobTitle,image:r.author.image,...(r.author.url?{url:r.author.url}:{})};article.datePublished=r.publishedAt;article.dateModified=r.updatedAt;
   page.reviewedBy={'@type':'Person',name:r.reviewer.name};
   article.citation=r.sources.map(s=>s.url||s.title);
   const date=d=>new Intl.DateTimeFormat('ru-RU',{dateStyle:'long',timeZone:'UTC'}).format(new Date(d));
   html=html.replace(/<div class="review-byline">[\s\S]*?<\/div><\/div>/,`<div class="review-byline"><img src="${esc(r.author.image)}" alt="${esc(r.author.name)}"><div>${esc(r.author.name)} · ${esc(r.author.jobTitle)}<br>Проверка: ${esc(r.reviewer.name)}<br>Опубликовано <time datetime="${esc(r.publishedAt)}">${date(r.publishedAt)}</time> · Обновлено <time datetime="${esc(r.updatedAt)}">${date(r.updatedAt)}</time></div></div>`);
   html=html.replace(/<p class="editorial-note">[\s\S]*?<\/p>/,'<section><h2>Источники</h2><ul>'+r.sources.map(s=>'<li>'+(s.url?'<a href="'+esc(s.url)+'">'+esc(s.title)+'</a>':esc(s.title))+'</li>').join('')+'</ul></section>');
  }
  graph.push(article);page.mainEntity={'@id':article['@id']};
  if(r.faqs?.length)graph.push({'@type':'FAQPage','@id':url(route+'#faq'),inLanguage:'ru',isPartOf:{'@id':page['@id']},mainEntity:r.faqs.map(([q,a])=>({'@type':'Question',name:q,acceptedAnswer:{'@type':'Answer',text:a}}))});
 }
 const metadata=`<meta name="description" content="${esc(description)}"><meta name="robots" content="${indexable?'index,follow,max-image-preview:large':'noindex,follow'}"><link rel="canonical" href="${url(route)}"><meta property="og:type" content="${r?'article':'website'}"><meta property="og:locale" content="ru_RU"><meta property="og:site_name" content="Español con Natali"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(description)}"><meta property="og:url" content="${url(route)}"><meta property="og:image" content="${url('/assets/natali-city.jpg')}"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${esc(title)}"><meta name="twitter:description" content="${esc(description)}"><meta name="twitter:image" content="${url('/assets/natali-city.jpg')}"><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><script type="application/ld+json">${json({'@context':'https://schema.org','@graph':graph})}</script>`;
 html=html.replace('</head>',metadata+'</head>');
 const filename=path.join(out,route==='/'?'index.html':route.slice(1)+'index.html');await mkdir(path.dirname(filename),{recursive:true});await writeFile(filename,html);
 if(indexable)sitemap.push({url:url(route),lastmod:r?.updatedAt});
}
await render('index.html','/','home');await render('resources.html','/resources/','library');
for(const r of included)await render('resources/'+r.slug+'.html','/resources/'+r.slug+'/','article',r);
await writeFile(path.join(out,'sitemap.xml'),'<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+sitemap.map(x=>'<url><loc>'+esc(x.url)+'</loc>'+(x.lastmod?'<lastmod>'+esc(x.lastmod)+'</lastmod>':'')+'</url>').join('')+'</urlset>');
await writeFile(path.join(out,'robots.txt'),production?'User-agent: *\nAllow: /\nSitemap: '+url('/sitemap.xml')+'\n':'User-agent: *\nDisallow: /\n');
await writeFile(path.join(out,'404.html'),'<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,follow"><title>Страница не найдена — Español con Natali</title><link rel="stylesheet" href="/design-system.css"></head><body><main class="wrap section"><h1>Страница не найдена</h1><p>Проверьте адрес или вернитесь на главную.</p><a class="link" href="/">На главную →</a></main></body></html>');
console.log(JSON.stringify({mode:production?'production':'preview',origin:base,pages:included.length+2,indexable:sitemap.length,draftsExcluded:excluded.length,out}));
