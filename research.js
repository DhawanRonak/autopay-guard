'use strict';
const $=id=>document.getElementById(id), KEY='guard_research_v2';
let data={rows:[],session:null}, ready=false, latest={list:[],events:[]};
$('researchStatus').textContent='Loading the interactive dashboard…';
try{const saved=JSON.parse(localStorage.getItem(KEY));if(saved&&Array.isArray(saved.rows)&&saved.rows.every(r=>typeof r.participant==='string'&&/^T[1-5]$/.test(r.task)&&[0,1].includes(r.success)&&Number.isFinite(r.seconds)&&Number.isInteger(r.taps)&&Number.isInteger(r.wrong_opens)&&Number.isInteger(r.ease)&&r.ease>=1&&r.ease<=7)){data.rows=saved.rows;if(saved.session&&typeof saved.session.pid==='string'&&Number.isInteger(saved.session.i)&&saved.session.i>=0&&saved.session.i<5&&Array.isArray(saved.session.rows))data.session=saved.session;}}catch{$('researchStatus').textContent='Saved research data could not be read.';}
function save(){try{localStorage.setItem(KEY,JSON.stringify(data));}catch{$('researchStatus').textContent='Storage is unavailable. Export results before leaving this page.';}}
function render(){
 const s=data.session;$('start').disabled=!!s||!ready;$('participant').disabled=!!s;$('export').disabled=!data.rows.length;
 if(!s){$('task').innerHTML='<p>Start a session to load fresh sample mandates. Completed results remain available for export.</p>';return;}
 if(s.rating){$('task').innerHTML='<h2>How easy was that?</h2><p>1 = very hard · 7 = very easy</p><div class="actions">'+[1,2,3,4,5,6,7].map(n=>`<button data-ease="${n}" aria-label="Ease rating ${n}">${n}</button>`).join('')+'</div>';return;}
 $('task').innerHTML=`<p class="eyebrow">TASK ${s.i+1} OF 5</p><h3>${Guard.TASKS[s.i].text}</h3><button id="giveUp">I can’t complete this task</button><button id="endSession" class="quiet">End session</button>`;
 $('giveUp').onclick=()=>endTask(false);$('endSession').onclick=()=>{data.session=null;save();render();$('researchStatus').textContent='Session ended. Completed tasks are saved.';};
}
function showResults(){const rows=data.rows.slice(-5);$('results').innerHTML=rows.length?'<table><thead><tr><th>Code</th><th>Task</th><th>Success</th><th>Seconds</th><th>Ease</th></tr></thead><tbody>'+rows.map(r=>`<tr><td>${r.participant.replace(/[^A-Za-z0-9_-]/g,'')}</td><td>${r.task}</td><td>${r.success?'Yes':'No'}</td><td>${r.seconds}</td><td>${r.ease}</td></tr>`).join('')+'</tbody></table>':'';}
function beginTask(){const s=data.session;s.t0=Date.now();s.taps=0;s.wrong=0;s.mark=latest.events.length;s.rating=null;save();render();}
function endTask(ok){const s=data.session;if(!s||s.rating)return;s.rating={participant:s.pid,task:Guard.TASKS[s.i].id,success:ok?1:0,seconds:+((Date.now()-s.t0)/1000).toFixed(1),taps:s.taps,wrong_opens:s.wrong};save();render();}
window.addEventListener('message',e=>{
 if(e.origin!==location.origin||e.source!==$('dashboard').contentWindow)return;
 if(e.data?.type==='guard-state'&&Guard.validList(e.data.list)&&Array.isArray(e.data.events)){
 latest=e.data;if(!ready)$('researchStatus').textContent='Dashboard ready.';ready=true;if(!data.session)render();
 const s=data.session;if(s&&!s.rating&&Guard.TASKS[s.i].done(latest.list,latest.events.slice(s.mark)))endTask(true);
 }else if(e.data?.type==='guard-click'){
 const s=data.session;if(!s||s.rating)return;s.taps++;const target=Guard.TASKS[s.i].target;if(target&&e.data.detailId&&e.data.detailId!==target)s.wrong++;save();
 }
});
$('startForm').onsubmit=e=>{e.preventDefault();const pid=$('participant').value.trim();if(!/^[A-Za-z0-9_-]{1,20}$/.test(pid))return;data.session=null;latest={list:[],events:[]};$('dashboard').contentWindow.postMessage({type:'guard-research-reset'},location.origin);data.session={pid,i:0,rows:[],t0:Date.now(),taps:0,wrong:0,mark:0,rating:null};save();render();$('researchStatus').textContent='Session started. Use the dashboard to complete each task.';};
$('task').onclick=e=>{const button=e.target.closest('[data-ease]');if(!button)return;const s=data.session;if(!s?.rating)return;const row={...s.rating,ease:Number(button.dataset.ease)};data.rows.push(row);s.rows.push(row);s.rating=null;if(++s.i>=Guard.TASKS.length){data.session=null;save();render();showResults();$('researchStatus').textContent='All five tasks completed. Results saved and ready to export.';}else{beginTask();showResults();}};
$('export').onclick=()=>{const keys=['participant','task','success','seconds','taps','wrong_opens','ease'];const quote=v=>'"'+String(v).replace(/"/g,'""')+'"';const csv=keys.join(',')+'\r\n'+data.rows.map(r=>keys.map(k=>quote(k==='participant'?r[k].replace(/^[=+@-]/,"'"):r[k])).join(',')).join('\r\n');const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='autopay-research.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
$('clear').onclick=()=>{if(!confirm('Delete all research results and the current session on this device?'))return;data={rows:[],session:null};save();render();showResults();$('researchStatus').textContent='Research results cleared.';};
render();showResults();
