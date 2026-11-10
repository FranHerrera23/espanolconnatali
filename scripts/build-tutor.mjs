import {build} from 'esbuild';
import {readFileSync,writeFileSync} from 'node:fs';
const result=await build({entryPoints:['private-preview/client.js'],bundle:true,minify:true,write:false,format:'iife',target:'es2022'});
let html=readFileSync('private-preview/tutor-shell.html','utf8');
html=html.replace('<!--CLIENT-->',`<script>${result.outputFiles[0].text.replaceAll('</script','<\\/script')}</script>`);
writeFileSync('private-preview/tutor.html',html.split('\n').map(x=>x.trimEnd()).join('\n')); 
console.log('Protected voice UI built; no credentials bundled.');
