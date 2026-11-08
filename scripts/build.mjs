import {readFile,writeFile,mkdir,cp,rm} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {jobFreshness} from '../site/jobs-state.js';
import {markdown,esc} from './markdown.mjs';
import {buildLocale,languagePicker} from './locales.mjs';
import {jobsRoute,renderJobs,jobsTeaser,lifeRoute,renderLife,jobDetailRoute,renderJobDetail,publicJobs} from './jobs.mjs';
const config=JSON.parse(await readFile('site.config.json','utf8'));
const production=process.env.DEPLOY_MODE==='production'||(process.env.VERCEL_ENV==='production');
const base=new URL(process.env.SITE_URL||config.productionSiteUrl||'http://localhost:4173').origin;
if(production && base!==new URL(config.productionSiteUrl).origin)throw Error('Production origin must match site.config.json; refusing stale SITE_URL');
if(production&&!base.startsWith('https://'))throw Error('Production requires a confirmed HTTPS origin');
const downloads=JSON.parse(await readFile('content/downloads-manifest.json','utf8')).downloads;
if(new Set(downloads.map(d=>d.articleRoute)).size!==downloads.length)throw Error('Duplicate article PDF mapping');
for(const d of downloads){const bytes=await readFile('site'+d.downloadRoute);if(createHash('sha256').update(bytes).digest('hex')!==d.sha256 || bytes.length!==d.bytes)throw Error('PDF integrity mismatch '+d.id);}
const manifest=JSON.parse(await readFile('content/launch/manifest.json','utf8'));
if(downloads.length!==manifest.length)throw Error('Expected one PDF for each article');
const jobsData=JSON.parse(await readFile('content/jobs.json','utf8'));
const publicationDate = new Intl.DateTimeFormat('ru-RU', { day:'numeric', month:'long', year:'numeric', timeZone:'UTC' });
const out=process.env.BUILD_DIR||'dist';if(!['dist','work/test-dist'].includes(out))throw Error('Invalid output directory');
await rm(out,{recursive:true,force:true});await mkdir(out,{recursive:true});
await cp('site/assets',out+'/assets',{recursive:true});for(const f of ['design-system.css','library.css','resources.js','reader.js','jobs.css','jobs.js','jobs-state.js','job-detail.js'])await cp('site/'+f,out+'/'+f);
const home=(await readFile('site/index.html','utf8')).replaceAll('src="assets/brand/','src="/assets/brand/');
let header=home.match(/<header class="site-nav[\s\S]*?<\/header>/)[0].replaceAll('resources.html','/resources/').replaceAll('href="#','href="/#');
const resourceMenu='<details class="resource-nav"><summary>Ресурсы</summary><div><a href="/resources/">Учить испанский</a><a href="/life-in-spain/">Жизнь в Испании</a></div></details>';
header=header.replace('<a href="/resources/">Бесплатные материалы</a>',resourceMenu);
const readerHeader=header.replace(/<nav[\s\S]*?<\/nav>/,'<nav class="nav-links" id="navigation" aria-label="Навигация">'+resourceMenu+'</nav>').replace(/<a class="link nav-contact"[\s\S]*?<\/a>/,'');
const footer=home.match(/<footer[\s\S]*?<\/footer>/)[0].replaceAll('href="#home"','href="/"');
const org={'@type':'EducationalOrganization','@id':base+'/#organization',name:'Español con Natali',url:base+'/',sameAs:[config.instagram]};
const editor={'@type':'Organization','@id':base+'/#editorial',name:'Редакция Español con Natali',parentOrganization:{'@id':org['@id']}};
const site={'@type':'WebSite','@id':base+'/#website',url:base+'/',name:'Español con Natali',inLanguage:'ru',publisher:{'@id':org['@id']}};
const urls=[];
async function page(route,title,desc,body,extra=[],commercial=false,options={}){
 const canonical=base+route;const webpage={'@type':['/resources/','/students/',jobsRoute,lifeRoute].includes(route)?'CollectionPage':'WebPage','@id':canonical+'#page',url:canonical,name:title,inLanguage:'ru',isPartOf:{'@id':site['@id']}};
 const graph=[org,editor,site,webpage,...extra];
  if(route!=='/') {
 const practical=route.startsWith(jobsRoute)||route===lifeRoute;
 graph.push({'@type':'BreadcrumbList',itemListElement:[{'@type':'ListItem',position:1,name:'Главная',item:base+'/'},...(route===lifeRoute?[]:[{'@type':'ListItem',position:2,name:practical?'Жизнь в Испании':'Бесплатные материалы',item:base+(practical?lifeRoute:'/resources/')}]),...(route.startsWith(jobsRoute)&&route!==jobsRoute?[{'@type':'ListItem',position:3,name:'Вакансии в Испании',item:base+jobsRoute}]:[]),...(route==='/resources/'?[]:[{'@type':'ListItem',position:route===lifeRoute?2:route.startsWith(jobsRoute)&&route!==jobsRoute?4:3,name:title,item:canonical}])]});
 }
 graph.forEach((node,i)=>{if(!node['@id'])node['@id']=canonical+'#entity-'+i;});
 const json=JSON.stringify({'@context':'https://schema.org','@graph':graph}).replace(/</g,'\\u003c');
 const html=`<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)} — Español con Natali</title><meta name="description" content="${esc(desc)}"><meta name="robots" content="${production&&options.indexable!==false?'index,follow,max-image-preview:large':'noindex,follow'}"><link rel="canonical" href="${canonical}"><meta property="og:url" content="${canonical}"><meta property="og:type" content="${extra.some(node=>node['@type']==='Article')?'article':'website'}"><meta property="og:locale" content="ru_RU"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}"><meta property="og:image" content="${base}/assets/natali-city.jpg"><meta name="twitter:card" content="summary_large_image"><link rel="stylesheet" href="/design-system.css"><link rel="stylesheet" href="/library.css"><link rel="stylesheet" href="/jobs.css"><script type="application/ld+json">${json}</script></head><body>${production?'':'<div class="preview-note">Предпросмотр · Не индексируется</div>'}<a class="skip" href="#main">Перейти к содержанию</a>${languagePicker(commercial?header:readerHeader,route)}<main id="main">${body}</main>${commercial?footer:footer.replace(/<p>[\s\S]*?<\/p>/,'').replace(/<span>Курс в своём темпе[\s\S]*?<\/span>/,'')}<script src="/reader.js"></script>${route===jobsRoute?'<script type="module" src="/jobs.js"></script>':route.startsWith(jobsRoute)?'<script type="module" src="/job-detail.js"></script>':''}${commercial?'<script src="/assets/vendor/lenis.min.js"></script><script src="/assets/vendor/gsap.min.js"></script><script src="/assets/vendor/ScrollTrigger.min.js"></script><script src="/assets/vendor/SplitText.min.js"></script><script src="/resources.js"></script>':''}</body></html>`;
 const filename=out+(route==='/'?'/index.html':route+'index.html');await mkdir(path.dirname(filename),{recursive:true});await writeFile(filename,html);if(options.indexable!==false)urls.push(canonical);
}
const readingTimes = new Map();
const linkmap=Object.fromEntries(manifest.map(a=>[path.basename(a.sourceFile),a.route]));
for(const a of manifest){
 const pubdate=a.publishedAt || config.releaseDate;
 if(a.editorialApproval?.by!=='Fran')throw Error('Approval missing '+a.id);
 const md=await readFile('content/launch/'+path.basename(a.sourceFile),'utf8');if(createHash('sha256').update(md).digest('hex')!==a.sha256)throw Error('Source hash changed '+a.id);
 let prose=md.replace(/^# .*\n+/,'').replace('Примеры и задания — редакционные; аудиозапись к этой версии не приложена.','Примеры и задания составлены редакцией.');
 for(const link of a.contextLinks ?? []){
  const heading='\n## '+link.beforeHeading+'\n';
  if(prose.split(heading).length!==2)throw Error('Expected one context link heading in '+a.id);
  prose=prose.replace(heading,()=> '\n'+link.markdown+'\n'+heading);
 }
 for(const image of Object.values(a.images ?? {})){
  if(!/^\/assets\/editorial\/[a-z0-9/-]+\.(?:jpg|png|webp)$/.test(image.src) || image.src.includes('..'))throw Error('Invalid editorial image path '+a.id);
  const bytes=await readFile('site'+image.src);
  if(createHash('sha256').update(bytes).digest('hex')!==image.sha256)throw Error('Editorial image hash mismatch '+a.id);
  if(!a.sourceUrls.includes(image.sourceUrl))throw Error('Missing editorial image attribution '+a.id);
 }
 let rendered=markdown(prose,a.images).replace(/href="([^\"]+\.md)"/g,(_,f)=>{if(!linkmap[f])throw Error('Unknown internal link '+f);return 'href="'+linkmap[f]+'"';});
 // Mark standalone Spanish dialogue lines for assistive pronunciation.
 rendered=rendered.replace(/(<p>|<br>)(—?\s*[¿¡A-Za-z][^<\n]*)(?=<|\n)/g,(all,start,t)=>/[А-Яа-яЁё]/.test(t)?all:start+'<span lang="es">'+t+'</span>');
 const minutes = Math.max(1, Math.ceil(prose.replace(/https?:\/\/\S+/g,'').split(/\s+/).filter(Boolean).length / 180));
 readingTimes.set(a.route, minutes);
 const sections=[];
 rendered=rendered.replace(/<h2>(.*?)<\/h2>/g,(_,title)=>{const id='section-'+(sections.length+1);sections.push({id,title});return '<h2 id="'+id+'">'+title+'</h2>';});
 const contents='<aside class="reader-contents"><details open><summary>В этом материале</summary><nav aria-label="Содержание статьи">'+sections.map(h=>'<a href="#'+h.id+'">'+h.title+'</a>').join('')+'</nav></details></aside>';
 const readingMeta='<p class="reading-time">Около '+minutes+' мин чтения <span>· Без учёта упражнений</span></p>';
 const download=downloads.find(d=>d.articleRoute===a.route);if(!download||download.id!==a.id||download.sourceSha256!==a.sha256)throw Error('Article/PDF mapping mismatch '+a.id);
 const pdf='<div class="reader-download"><a class="link" href="'+esc(download.downloadRoute)+'" download>Скачать PDF <span aria-hidden="true">↓</span></a><p>Полный материал с упражнениями и ответами<br><span>'+download.pages+' '+(download.pages===1?'страница':download.pages>=2 && download.pages<=4?'страницы':'страниц')+' · PDF</span></p></div>';
 const tools='<div class="reader-tools" aria-label="Сохранить и взять с собой">'+pdf+'<button class="link" data-print>Распечатать</button><button class="link" data-copy>Скопировать ссылку</button><span class="reader-status" role="status"></span></div>';
 const body='<div class="wrap read-top"><a class="link" href="/resources/">← Все бесплатные материалы</a></div><article class="wrap"><header class="reading-head"><p class="label">Бесплатные материалы · Практическое руководство</p><h1>'+esc(a.title)+'</h1>'+readingMeta+'<p class="answer">'+esc(a.description)+'</p><div class="editorial-byline">'+esc(a.author.name)+'<br>Опубликовано <time datetime="'+pubdate+'">'+publicationDate.format(new Date(pubdate))+'</time>'+ (a.updatedAt ? '<br>Обновлено <time datetime="'+a.updatedAt+'">'+publicationDate.format(new Date(a.updatedAt))+'</time>' : '')+'</div>'+tools+'</header><div class="reading-layout">'+contents+'<div class="reading-prose">'+rendered+tools+'</div></div></article><section class="related wrap"><h2>Что почитать дальше</h2>'+a.relatedFiles.map(f=>'<a href="'+linkmap[f]+'">'+esc(manifest.find(x=>path.basename(x.sourceFile)===f).title)+' ↗</a>').join('')+'</section>';
 const article={'@type':'Article','@id':base+a.route+'#article',headline:a.title,description:a.description,inLanguage:'ru',creativeWorkStatus:'Published',author:{'@type':'Organization','@id':editor['@id'],name:editor.name},publisher:{'@id':org['@id']},datePublished:pubdate,mainEntityOfPage:{'@id':base+a.route+'#page'},citation:a.sourceUrls,articleBody:prose};
 article.timeRequired='PT'+minutes+'M';
 if(a.images)article.image=Object.values(a.images).map(image=>base+image.src);
 article.encoding={'@type':'MediaObject',contentUrl:base+download.downloadRoute,encodingFormat:'application/pdf',contentSize:download.bytes+' bytes'};
 if(a.updatedAt)article.dateModified=a.updatedAt;
 await page(a.route,a.seoTitle || a.title,a.description,body,[article]);

}
const clusters=JSON.parse(await readFile('content/article-clusters.json','utf8')).clusters;
const clusterFor=a=>clusters.find(c=>c.articles.includes(a.route.split('/')[2]));
for(const a of manifest)if(clusters.filter(c=>c.articles.includes(a.route.split('/')[2])).length!==1)throw Error('Article needs exactly one primary cluster: '+a.route);
const activeClusters=clusters.filter(c=>manifest.some(a=>clusterFor(a)===c));
const ordered=[...manifest].sort((a,b)=>Number(b.route.includes('/spanish-from-zero/'))-Number(a.route.includes('/spanish-from-zero/')));
const filters='<div class="article-filters" role="group" aria-label="Темы материалов" hidden><button type="button" data-cluster="all" aria-pressed="true">Все материалы <span>'+manifest.length+'</span></button>'+activeClusters.map(c=>'<button type="button" data-cluster="'+c.id+'" aria-pressed="false">'+esc(c.label)+' <span>'+manifest.filter(a=>clusterFor(a)===c).length+'</span></button>').join('')+'</div>';
const entries=ordered.map(a=>{const c=clusterFor(a);const featured=a.route.includes('/spanish-from-zero/');return '<article class="journal-entry'+(featured?' journal-featured':'')+'" data-topic="'+c.id+'"'+(featured?' data-featured':'')+'><a class="journal-link" href="'+a.route+'">'+(featured?'<div class="journal-cover" aria-hidden="true"><span>Español con Natali</span><strong>Español<br>desde cero.</strong><span>01 — '+esc(c.label)+'</span></div>':'')+'<span class="journal-topic">'+esc(c.label)+'</span><div class="journal-text"><h2>'+esc(a.title)+'</h2><p>'+esc(a.description)+'</p></div><span class="journal-time"><time class="journal-date" datetime="'+a.publishedAt+'">'+publicationDate.format(new Date(a.publishedAt))+'</time>Около '+readingTimes.get(a.route)+' мин чтения <span class="journal-arrow" aria-hidden="true">↗</span></span></a></article>';}).join('');
await page('/resources/','Бесплатные материалы по испанскому','Открытые руководства на русском: испанские примеры, упражнения, ответы и источники.','<section class="library-hero wrap"><p class="label">Бесплатные материалы</p><div class="library-intro"><h1>Испанский для<br>вашей жизни.</h1><p>Объяснения, примеры и практика. Читайте, проверяйте себя и возвращайтесь к тому, что пригодится в разговоре. Все материалы открыты без регистрации.</p></div></section><section class="journal wrap" aria-label="Статьи по испанскому">'+filters+'<p class="journal-count" role="status" aria-live="polite">Материалы: '+manifest.length+'</p><div class="journal-list">'+entries+'</div></section>'+jobsTeaser('ru') ,[{'@type':'ItemList',itemListElement:ordered.map((a,i)=>({'@type':'ListItem',position:i+1,url:base+a.route,name:a.title}))}]);


await page(lifeRoute,'Жизнь в Испании','Практические ресурсы для жизни в Испании: вакансии, оригинальные источники и проверенные условия.',renderLife());
const availableJobs=publicJobs(jobsData,base);
await mkdir(out+'/assets/data',{recursive:true});
await writeFile(out+'/assets/data/jobs.json',JSON.stringify({name:'Вакансии в Испании',language:'ru',country:'ES',generatedAt:new Date().toISOString(),checkedOn:jobsData.selectionCheckedOn,freshnessPolicy:{pendingAfterDays:4,hiddenAfterDays:7},jobs:availableJobs},null,2));
await page(jobsRoute,'Вакансии в Испании','Сравните вакансии по городу, профессии, занятости и языкам. Задачи, условия, даты проверки и оригинальные источники — без регистрации.',renderJobs(jobsData),[
 {'@type':'ItemList',name:'Вакансии в Испании',numberOfItems:availableJobs.length,itemListElement:availableJobs.map((job,i)=>({'@type':'ListItem',position:i+1,name:job.title+' — '+job.cityRu,url:job.url}))},
 {'@type':'Dataset',name:'Независимая подборка вакансий в Испании',description:'Задачи, условия, города, источники и даты проверки вакансий. Статус отражает последнюю проверку источника.',url:base+jobsRoute,creator:{'@id':editor['@id']},inLanguage:'ru',distribution:{'@type':'DataDownload',encodingFormat:'application/json',contentUrl:base+'/assets/data/jobs.json'}}]);
for(const job of jobsData.jobs){
 const indexable=jobFreshness(job)!=='hidden';
 const route=jobDetailRoute(job);
 const description=job.titleRu+' — '+job.employer+', '+(job.cityRu||job.city)+'. '+job.tasksRu;
 const extra=indexable?[{'@type':'CreativeWork',name:job.titleRu,description,url:base+route,inLanguage:'ru',author:{'@id':editor['@id']},isBasedOn:job.sourceUrl,citation:job.sourceUrl,dateModified:job.lastCheckedDate}]:[];
 await page(route,job.titleRu+' — '+job.employer,description,renderJobDetail(jobsData,job),extra,false,{indexable});
}

const reviews=JSON.parse(await readFile('content/students/reviews.json','utf8'));
for (const r of reviews) { if (![r.width,r.height].every(n=>Number.isInteger(n)&&n>0&&n<10000)) throw Error('Invalid review image dimensions: '+r.id); }
const reviewRows=reviews.map((r,i)=>'<article class="student-story" id="'+esc(r.id)+'"><div class="student-story-copy"><p class="label">'+esc(r.context==='teacher'?'О преподавателе':r.topic)+'</p><h2>'+esc(r.name)+'</h2><blockquote>'+r.text.split('\n').map(t=>'<p>'+esc(t)+'</p>').join('')+'</blockquote>'+(r.partial?'<p class="voice-caption">Сообщение на предоставленной фотографии обрывается. Здесь приведена только видимая часть.</p>':'')+'</div><figure class="student-story-image"><a href="'+esc(r.image)+'" target="_blank" rel="noopener" aria-label="Открыть изображение отзыва: '+esc(r.name)+'"><img src="'+esc(r.image)+'" alt="Сообщение '+esc(r.name)+' — '+esc(r.topic)+'" width="'+r.width+'" height="'+r.height+'" loading="lazy" decoding="async"></a><figcaption>Фрагмент сообщения · <a href="'+esc(r.image)+'" target="_blank" rel="noopener">Открыть полностью ↗</a></figcaption></figure></article>').join('');
await page('/students/','Отзывы учеников об испанском с Натали','Отзывы учеников Español con Natali: сообщения о курсе испанского, самостоятельной практике и занятиях. Текст отзывов и реальные снимки сообщений.','<section class="students-page wrap"><header class="students-intro"><p class="label">Español con Natali · Ученики</p><h1>У каждого —<br>свой опыт.</h1><p class="students-lead">Отзывы учеников об испанском с Натали. Их слова — и сообщения, из которых они взяты.</p><p class="students-context">Здесь собраны отзывы разных выпусков курса и сообщения о преподавателе. Формат обучения со временем менялся: упоминания групп, WhatsApp и обратной связи относятся к опыту авторов. Актуальный состав курса указан <a href="/#course">на главной странице</a>.</p></header><div class="student-stories">'+reviewRows+'</div></section>',[{'@type':'ItemList',name:'Отзывы учеников',numberOfItems:reviews.length,itemListElement:reviews.map((r,i)=>({'@type':'ListItem',position:i+1,name:r.name+' — '+r.topic,url:base+'/students/#'+r.id}))}],true);

let homebody=home.split('<div class="home-view" id="home">')[1].split('</div></main>')[0];if(!homebody)throw Error('Home structure changed');
homebody='<div class="home-view" id="home">'+homebody+'</div>';
homebody=homebody.replace(/href="resources.html"/g,'href="/resources/"').replace(/href="resources\/([^".]+)\.html"/g,'href="/resources/$1/"').replaceAll('src="assets/','src="/assets/');
homebody=homebody.replace(/(<a class="resource-button link" href=")(.*?)(">)/g,(_,before,route,after)=>{const article=manifest.find(a=>a.route===route);return '<p class="reading-time"><time data-publication-date datetime="'+article.publishedAt+'">'+publicationDate.format(new Date(article.publishedAt))+'</time> · Около '+readingTimes.get(route)+' мин чтения</p>'+before+route+after;});
homebody=homebody.replace(/(<section class="resources[\s\S]*?)(<\/section>)/,(_,content,end)=>content+jobsTeaser('ru',true)+end);
await page('/','Испанский для русскоязычных','Курс испанского в своём темпе и индивидуальные занятия с Натали.',homebody,[{'@type':'Person','@id':base+'/#natali',name:'Натали',jobTitle:'Преподаватель испанского языка',sameAs:[config.instagram]},{'@type':'Course',name:'Курс испанского в своём темпе',description:'10 видеоуроков на Google Drive, дополнительные видео для практики и домашние задания. Заключительное занятие с Натали — 30 минут.',provider:{'@id':org['@id']},inLanguage:'ru',url:base+'/#course'}],true);
for (const language of ['es', 'en']) {
 await buildLocale(language,{out,base,production,header,footer,homebody,ordered,clusters:activeClusters,clusterFor,readingTimes,reviewRows,jobsData,readerHeader});
}
await writeFile(out+'/robots.txt',production?'User-agent: *\nAllow: /\nSitemap: '+base+'/sitemap.xml\n':'User-agent: *\nDisallow: /\n');
await writeFile(out+'/sitemap.xml','<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+(production?urls:[]).map(u=>'<url><loc>'+u+'</loc></url>').join('')+'</urlset>');
await writeFile(out+'/404.html','<!doctype html><html lang="ru"><meta charset="utf-8"><meta name="robots" content="noindex"><title>Страница не найдена</title><h1>Страница не найдена</h1><a href="/">На главную</a></html>');
console.log(JSON.stringify({mode:production?'production':'preview',origin:base,pages:urls.length,articles:manifest.length}));
