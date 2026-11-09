import {readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const {JSDOM}=await import(process.env.JSDOM_MODULE||'jsdom');
const code=await readFile('site/comparisons.js','utf8');
const data=JSON.parse(await readFile('content/property-pilot.json','utf8'));
assert.equal(data.entries.length,6);assert.equal(data.categories.length,1);
for(const lang of ['ru','es']){
 const prefix=lang==='es'?'/es':'';
 const html=await readFile('dist'+prefix+'/life-in-spain/property-buying/index.html','utf8');
 const dom=new JSDOM(html,{url:'https://www.espanolconnatali.com'+prefix+'/life-in-spain/property-buying/',runScripts:'outside-only',pretendToBeVisual:true});
 const w=dom.window;w.scrollTo=()=>{};w.HTMLDialogElement.prototype.showModal=function(){this.open=true;};w.HTMLDialogElement.prototype.close=function(){this.open=false;};w.eval(code);
 const doc=w.document,form=doc.querySelector('form');assert.equal(form.hidden,false);assert.equal(doc.querySelectorAll('[data-row]').length,6);
 form.elements.city.value='Barcelona';form.dispatchEvent(new w.Event('change',{bubbles:true}));assert.equal([...doc.querySelectorAll('[data-row]')].filter(x=>!x.hidden).length,1);
 doc.querySelector('[data-dossier="aproperties-barcelona"]').click();assert.equal(doc.querySelector('dialog').open,true);assert.ok(doc.querySelector('dialog .cmp-verdict'));assert.ok(w.location.search.includes('entry='));
 for(const e of data.entries){const file=await readFile('dist'+prefix+'/life-in-spain/property-buying/'+e.id+'/index.html','utf8');assert.ok(file.includes('cmp-verdict'));assert.ok(file.includes('cmp-examples'));assert.ok(!file.includes('Borrador para Fran'));assert.ok(file.includes('index,follow'));}
 dom.window.close();
}
console.log('Property checks passed: RU/ES, 6 dossiers, city filter, dialog, verdicts/examples, publication scope.');
