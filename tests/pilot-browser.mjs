import {test} from 'node:test';import assert from 'node:assert/strict';import {build} from 'esbuild';import {readFileSync} from 'node:fs';
const {JSDOM}=await import('/private/tmp/ecn-dom-tests/node_modules/jsdom/lib/api.js');
const compiled=await build({entryPoints:['private-preview/pilot-client.js'],bundle:true,write:false,format:'esm',target:'es2022',plugins:[{name:'mock-sdk',setup(b){b.onResolve({filter:/^@elevenlabs\/client$/},()=>({path:'sdk',namespace:'mock'}));b.onLoad({filter:/.*/,namespace:'mock'},()=>({contents:'export const Conversation={async startSession(o){window.options=o;o.onConnect();return {async endSession(){}}}}',loader:'js'}))}}]});
const tick=()=>new Promise(r=>setTimeout(r,30));
test('Private link opens without crashing, removes token, names account, no automatic microphone; remembers theme and opens history',async()=>{
 const dom=new JSDOM(readFileSync('private-preview/pilot-shell.html','utf8').replace('<!--CLIENT-->',''),{url:'https://www.espanolconnatali.com/tutor-dashboard/#access=test',runScripts:'outside-only'});const w=dom.window;const calls=[];
 Object.defineProperty(w.navigator,'mediaDevices',{value:{getUserMedia:async()=>{calls.push('mic');return {getTracks:()=>[{stop(){}}]}}}});
 w.fetch=async(_,o)=>{const body=JSON.parse(o.body);calls.push(body.action);return {ok:true,json:async()=>body.action==='history'?[{finishedAt:Date.now(),transcript:[{role:'user',text:'Soy contable.'}]}]:body.action==='start'?{signedUrl:'wss://test',dynamicVariables:{user_name:'Marina'}}:{name:'Marina',remaining:2,completed:0,status:'ready',theme:'pinar',historyCount:1,lastPracticeAt:Date.now(),memory:'Soy contable.'}}};
 w.eval('(async()=>{'+compiled.outputFiles[0].text+'})()');await tick();assert.deepEqual(calls,['claim']);assert.equal(w.location.hash,'');assert.match(w.document.getElementById('greeting').textContent,/Marina/);assert.equal(w.document.body.dataset.theme,'pinar');assert.equal(w.document.getElementById('dashboard').hidden,false);
 w.document.getElementById('start').click();await tick();assert.deepEqual(calls.slice(-2),['mic','start']);assert.equal(w.options.dynamicVariables.user_name,'Marina');dom.window.close();
});
