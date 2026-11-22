'use strict';
const G = Guard, $ = id => document.getElementById(id);
const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money = n => new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',maximumFractionDigits:0}).format(n);
const when = d => d === 0 ? 'Today' : d === 1 ? 'Tomorrow' : `In ${d} days`;
const day = () => {const d=new Date();return Math.floor(Date.UTC(d.getFullYear(),d.getMonth(),d.getDate())/86400000);};
const localDate = () => {const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;};
const researchMode = new URLSearchParams(location.search).has('research');
const KEY = researchMode ? 'guard_research_dashboard_v2' : 'guard_dashboard_v2';
let state = {list:[],day:day(),events:[],undo:null}, storageOK = true, returnFocus, toastTimer;
function storageWarning(message) { $('storageMessage').hidden = false; $('storageMessage').textContent = message; }
function read(key) { try { return JSON.parse(localStorage.getItem(key)); } catch { storageWarning('Saved data could not be read. You can continue here or reset this device’s dashboard.'); return null; } }
function save() {
  state.day = day();
  try { localStorage.setItem(KEY,JSON.stringify(state)); $('saveState').textContent = 'Changes saved'; }
  catch { storageOK=false; $('saveState').textContent='This session only'; storageWarning('Your browser could not save changes. Keep this tab open to retain this session.'); }
  if (researchMode) parent.postMessage({type:'guard-state',list:state.list,events:state.events},location.origin);
}
const saved = read(KEY);
if (saved && G.validList(saved.list) && Number.isInteger(saved.day) && saved.day <= day()) {
  state={list:G.advance(saved.list,day()-saved.day),day:day(),events:Array.isArray(saved.events)?saved.events.filter(e=>e && typeof e.name==='string' && Number.isFinite(e.t)).slice(-500):[],undo:null};
  if (saved.day === day() && saved.undo && saved.undo.expires > Date.now() && G.validList(saved.undo.list)) state.undo=saved.undo;
} else if(saved) storageWarning('Saved dashboard data was invalid. Start with an example or add a mandate.');
function track(name,id,detail) { state.events.push({name,id,detail,t:Date.now()}); state.events=state.events.slice(-500); save(); }
function row(m) {
  return `<article class="mandate-row"><span class="avatar" aria-hidden="true">${esc(m.merchant.slice(0,2).toUpperCase())}</span><div class="mandate-copy"><button class="merchant" data-detail="${m.id}">${esc(m.merchant)}</button><p class="meta"><span class="status ${m.status}">${m.status}</span> ${esc(m.category)}${m.essential?' · Essential':''}</p><p class="meta">${m.status==='active'?when(m.nextInDays):m.status==='paused'?`Resumes ${when(m.resumeInDays ?? m.nextInDays).toLowerCase()}`:'No future debits'}${m.via!=='This app'?' · Another UPI app':''}</p>${m.status!=='cancelled'?`<div class="row-actions"><button data-action="${m.status==='paused'?'resume':'pause'}" data-id="${m.id}">${m.status==='paused'?'Resume':'Pause'}</button><button data-action="remind" data-id="${m.id}">Remind · ${m.reminderDays}d</button><button data-action="cancel" data-id="${m.id}">Cancel</button></div>`:''}</div><div class="amount"><b>${money(m.amount)}</b><small>${esc(m.freq)}</small></div></article>`;
}
const labels={trial_ending:'Trial ending',price_hike:'Price increase',big_annual:'Annual renewal',high_ceiling:'High limit',duplicate:'Possible overlap'};
function render() {
  const active=state.list.filter(m=>m.status==='active'), ins=G.insights(state.list), due=G.upcoming(state.list,7);
  $('summary').innerHTML=`<button id="breakdown" class="stat main-stat"><span class="label">Typical monthly autopay <span class="stat-link" aria-hidden="true">↗</span></span><strong>${money(G.monthlyTotal(state.list))}</strong><small>See category breakdown · annual plans averaged</small></button><div class="stat"><span class="label">Due in the next 7 days</span><strong>${money(G.dueTotal(state.list,7))}</strong><small>${due.length} active mandate${due.length===1?'':'s'} · includes today</small></div><div class="stat"><span class="label">Active mandates</span><strong>${active.length.toString().padStart(2,'0')}</strong><small>${state.list.filter(m=>m.status==='paused').length} paused · ${state.list.filter(m=>m.status==='cancelled').length} cancelled</small></div>`;
  $('breakdown').onclick=()=>{track('open_breakdown');openBreakdown();};
  $('insightCount').textContent=ins.length;
  $('insightCards').innerHTML=ins.length?ins.map(i=>`<article class="insight-card" data-kind="${i.kind}"><div class="insight-top"><span class="tag">${labels[i.kind]}</span><small>${String(i.pri).padStart(2,'0')}</small></div><h3>${esc(i.title)}</h3><p>${esc(i.body)}</p><div class="actions">${i.kind==='high_ceiling'?`<button class="action" data-action="lowerCeiling" data-id="${i.id}">Lower limit</button>`:i.kind==='big_annual'?`<button class="action" data-action="remind" data-id="${i.id}">Set reminder</button>`:`<button class="action" data-action="pause" data-id="${i.id}">Pause</button><button data-action="cancel" data-id="${i.id}">Cancel autopay</button>`}<button data-detail="${i.id}">Review</button></div></article>`).join(''):`<div class="empty"><h3>${state.list.length?'You’re all caught up':'Your next payment, in perspective'}</h3><p>${state.list.length?'No active mandates match the five alert rules. You can still review every payment below.':'Load the example to spot trial renewals, price increases and more. Or add your first mandate.'}</p>${state.list.length?'':'<button class="primary" data-example>Try an example</button>'}</div>`;
  renderList();
}
function renderList() {
  const query=$('search').value.toLowerCase().trim(), filter=$('filter').value;
  const visible=state.list.filter(m=>(filter==='all'||m.status===filter)&&`${m.merchant} ${m.category}`.toLowerCase().includes(query));
  $('mandateList').innerHTML=visible.length?visible.map(row).join(''):`<div class="empty"><h3>${state.list.length?'No matching mandates':'A clear view starts here'}</h3><p>${state.list.length?'Try another search or show all statuses.':'Add a mandate manually or try the example above.'}</p>${state.list.length?'<button id="clearFilters">Clear filters</button>':''}</div>`;
  if($('clearFilters')) $('clearFilters').onclick=()=>{$('search').value='';$('filter').value='all';renderList();};
}
function showDialog(title,html) {
  const modal=$('modal');
  if(!modal.open) returnFocus=document.activeElement;
  modal.innerHTML=`<button class="dialog-close" aria-label="Close dialog" id="closeDialog">×</button><h2 id="dialogTitle">${esc(title)}</h2>${html}`;
  if(!modal.open) modal.showModal();
  $('closeDialog').onclick=()=>modal.close();
}
$('modal').addEventListener('close',()=>{if(returnFocus?.isConnected)returnFocus.focus();});
$('modal').addEventListener('click',e=>{if(e.target===$('modal')){const r=$('modal').getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)$('modal').close();}});
function openBreakdown(){
  const cats=G.byCategory(state.list);
  showDialog('Your monthly breakdown',cats.length?`<table><thead><tr><th>Category</th><th>Monthly average</th></tr></thead><tbody>${cats.map(c=>`<tr><td>${esc(c.category)}</td><td>${money(c.amount)}</td></tr>`).join('')}</tbody></table><p>Weekly × 52 ÷ 12, quarterly ÷ 3, yearly ÷ 12. Rounded category amounts may differ slightly from the total. Variable bills use the last amount.</p>`:'<p>No active mandates yet. Add one or load the example to see where your money goes.</p>');
}
function openDetail(id){
  const m=state.list.find(x=>x.id===id);if(!m)return;
  track('open_mandate',id);
  showDialog(m.merchant,`<p>${esc(m.category)} · ${esc(m.status)}${m.essential?' · Essential payment':''}</p><dl class="details"><dt>Amount</dt><dd>${money(m.amount)} / ${esc(m.freq)}</dd><dt>Mandate limit</dt><dd>${money(m.maxAmount)} per debit</dd><dt>Next payment</dt><dd>${m.status==='cancelled'?'None':m.status==='paused'?`Paused until ${when(m.resumeInDays??m.nextInDays).toLowerCase()}`:when(m.nextInDays)}</dd><dt>Set up in</dt><dd>${esc(m.via)}</dd><dt>Reminder</dt><dd>${m.reminderDays} day(s) before</dd></dl>${m.variable?'<p>Variable bill: the next amount may differ from the last debit shown.</p>':''}<p>Changes here update your saved plan on this device. To change actual debits, use your UPI app. Reminders are saved preferences; no notification is sent.</p>${m.status!=='cancelled'?`<div class="actions"><button data-action="${m.status==='paused'?'resume':'pause'}" data-id="${id}">${m.status==='paused'?'Resume':'Pause'}</button><button data-action="remind" data-id="${id}">Set reminder</button>${!m.variable&&m.maxAmount>m.amount?`<button data-action="lowerCeiling" data-id="${id}">Lower limit</button>`:''}<button class="danger" data-action="cancel" data-id="${id}">Cancel autopay</button></div>`:'<p>Cancelled mandates stay here for your records. Add a new mandate if you set this payment up again.</p>'}`);
}
function toast(message,undo=false){
  clearTimeout(toastTimer);$('toast').hidden=false;$('toast').innerHTML=`<span>${esc(message)}</span>${undo?'<button id="undo">Undo</button>':''}`;
  if(undo)$('undo').onclick=()=>{if(!state.undo||state.undo.expires<Date.now())return;const prev=state.undo;state.list=prev.list;state.undo=null;track('undo',null,prev.action);render();toast('Change undone.');};
  toastTimer=setTimeout(()=>{$('toast').hidden=true;if(state.undo){state.undo=null;save();}},undo?Math.max(0,state.undo.expires-Date.now()):5000);
}
function apply(action,id,value){
  try{const previous=state.list;state.list=G.actions[action](state.list,id,value);state.undo={list:previous,action,expires:Date.now()+12000};track(({remind:'reminder_set',lowerCeiling:'ceiling_lowered'})[action]||action,id,value);$('modal').close();render();const m=state.list.find(m=>m.id===id);toast(`${m.merchant}: ${{pause:'paused for '+value+' cycle(s)',resume:'resumed',cancel:'autopay cancelled',remind:'reminder saved',lowerCeiling:'limit lowered to '+money(m.amount)}[action]}. Saved to your local plan.`,true);}
  catch(e){toast(e.message);}
}
function action(name,id){
  const m=state.list.find(m=>m.id===id);if(!m)return;
  if(name==='resume'||name==='lowerCeiling'){apply(name,id);return;}
  if(name==='pause'){
    track('pause_start',id);
    showDialog(`Pause ${m.merchant}`,`<p>Skip upcoming billing cycles. This saved plan resumes automatically after the pause. ${m.essential?'This is an essential payment. Arrange another way to pay to avoid missed contributions or cover.':''}</p><p>Update the mandate in your UPI app to stop actual debits.</p><div class="actions">${[1,2,3].map(c=>`<button class="${c===1?'primary':''}" data-apply="pause" data-id="${id}" data-value="${c}">${c} ${m.freq==='weekly'?'week':m.freq==='yearly'?'year':m.freq==='quarterly'?'quarter':'month'}${c>1?'s':''}</button>`).join('')}</div>`);
  }else if(name==='cancel'){
    track('cancel_start',id);
    showDialog(`Cancel ${m.merchant} autopay?`,`<p>This removes future debits from your saved plan. It does not end the merchant’s subscription. ${m.essential?'This is an essential payment. Arrange another way to pay to avoid missed contributions or loss of cover.':'You may still owe charges under your current plan.'}</p><p>Complete the cancellation in your UPI app to stop actual debits.</p><div class="actions"><button class="danger" data-apply="cancel" data-id="${id}">Cancel autopay</button><button id="keep">Keep autopay</button></div>`);
    $('keep').onclick=()=>{track('cancel_abandon',id);$('modal').close();};
  }else if(name==='remind'){
    showDialog(`Remind me about ${m.merchant}`,`<p>Choose a lead time for this device’s saved plan. No push or email notification is sent; set a matching reminder in your calendar.</p><div class="actions">${[1,3,7].map(d=>`<button aria-pressed="${m.reminderDays===d}" data-apply="remind" data-id="${id}" data-value="${d}">${d} day${d>1?'s':''} before</button>`).join('')}</div>`);
  }
}
function loadExample(){state.undo={list:state.list,action:'example',expires:Date.now()+12000};state.list=G.seed();$('search').value='';$('filter').value='all';track('example_loaded');render();toast('12 sample mandates loaded. Actions are saved on this device.',true);}
$('example').onclick=()=>{if(!state.list.length)loadExample();else{showDialog('Load the example?',`<p>Replace your current dashboard with 12 sample mandates. You can undo this for 12 seconds.</p><div class="actions"><button class="primary" id="confirmExample">Load example</button></div>`);$('confirmExample').onclick=()=>{$('modal').close();loadExample();};}};
$('reset').onclick=()=>{showDialog('Reset this dashboard?',`<p>Clear all mandates and action history on this dashboard. Research results are kept separately. You can undo for 12 seconds.</p><div class="actions"><button class="danger" id="confirmReset">Reset dashboard</button></div>`);$('confirmReset').onclick=()=>{state.undo={list:state.list,action:'reset',expires:Date.now()+12000};state.list=[];state.events=[];$('search').value='';$('filter').value='all';save();$('modal').close();render();toast('Dashboard reset.',true);};};
$('search').oninput=renderList;$('filter').onchange=renderList;
$('add').onclick=()=>{
  if(state.list.length>=500){toast('This dashboard holds up to 500 mandates. Reset it to start a new plan.');return;}
  showDialog('Add a mandate',`<p>Build a personal payment plan from the details in your UPI app. This does not connect to your bank.</p><form id="addForm"><div class="fields"><label class="wide">Merchant name<input name="merchant" required maxlength="60" autocomplete="off"></label><label>Category<select name="category">${['Video','Music','Storage','News','Fitness','Investments','Insurance','Bills','Education','Food','Other'].map(c=>`<option>${c}</option>`).join('')}</select></label><label>Frequency<select name="freq">${['weekly','monthly','quarterly','yearly'].map(f=>`<option ${f==='monthly'?'selected':''}>${f}</option>`).join('')}</select></label><label>Debit amount (₹)<input name="amount" type="number" required min="1" max="10000000" step="0.01"></label><label>Mandate limit (₹)<input name="maxAmount" type="number" required min="1" max="10000000" step="0.01"></label><label class="wide">Next payment date<input name="date" type="date" required min="${localDate()}" value="${localDate()}"></label></div><p id="formError" class="form-error" role="alert"></p><div class="actions"><button class="primary" type="submit">Save mandate</button></div></form>`);
  $('addForm').onsubmit=e=>{
    e.preventDefault();const f=new FormData(e.target), amount=Number(f.get('amount')), limit=Number(f.get('maxAmount')), merchant=f.get('merchant').trim(), date=new Date(f.get('date')+'T00:00:00'),today=new Date();today.setHours(0,0,0,0);const days=Math.round((date-today)/86400000);
    if(!merchant||!Number.isFinite(amount)||amount<=0||amount>1e7||!Number.isFinite(limit)||limit<amount||limit>1e7||!Number.isInteger(days)||days<0||days>3650){$('formError').textContent='Enter a name, an amount from ₹1 to ₹1 crore, a limit at least as high as the amount, and a payment date within the next 10 years.';return;}
    const previous=state.list;state.list=[...previous,{id:Math.max(0,...state.list.map(m=>m.id))+1,merchant,category:f.get('category'),amount,prevAmount:amount,maxAmount:limit,freq:f.get('freq'),nextInDays:days,via:'This app',status:'active',reminderDays:1,variable:false,trial:null,essential:['Investments','Insurance','Bills'].includes(f.get('category'))}];state.undo={list:previous,action:'add',expires:Date.now()+12000};track('mandate_added');$('modal').close();render();toast('Mandate added to your saved plan.',true);
  };
};
if(researchMode)document.addEventListener('click',e=>{const b=e.target.closest('button');if(b)parent.postMessage({type:'guard-click',detailId:Number(b.dataset.detail)||null},location.origin);},true);
document.addEventListener('click',e=>{
  const b=e.target.closest('button');if(!b)return;
  if(b.hasAttribute('data-example'))loadExample();
  if(b.dataset.detail)openDetail(Number(b.dataset.detail));
  if(b.closest('[data-kind]'))track('insight_tap',Number(b.dataset.id||b.dataset.detail),b.closest('[data-kind]').dataset.kind);
  if(b.dataset.action)action(b.dataset.action,Number(b.dataset.id));
  if(b.dataset.apply)apply(b.dataset.apply,Number(b.dataset.id),b.dataset.value?Number(b.dataset.value):undefined);
});
const steps=[
  {target:'.intro',title:'A calmer way to manage autopay',text:'Start with “Try an example” to load 12 realistic mandates, or add your own payment details. Everything is kept on this device.'},
  {target:'#summary',title:'Know what’s coming',text:'Your typical month averages weekly and annual plans. The next seven days shows scheduled charges, including today. Open the monthly card for categories.'},
  {target:'#insights',title:'Catch the expensive surprises',text:'Five rules flag trials ending, price increases, annual renewals, high limits and overlapping subscriptions. Each card puts the next action within reach.'},
  {target:'#mandates',title:'Make a call. Keep control.',text:'Search every mandate, pause a billing cycle, resume, cancel or save a reminder. You have 12 seconds to undo a change. Changes here stay in your local plan; actual debits are managed in your UPI app.'}
];
let tourIndex=0;
function tourStep(){
  document.querySelectorAll('.tour-highlight').forEach(e=>e.classList.remove('tour-highlight'));
  const s=steps[tourIndex],target=document.querySelector(s.target);target.classList.add('tour-highlight');target.scrollIntoView({block:'start',behavior:'instant'});
  $('tourStep').textContent=`GETTING STARTED · ${tourIndex+1} OF ${steps.length}`;$('tourTitle').textContent=s.title;$('tourText').textContent=s.text;$('prevTour').hidden=tourIndex===0;$('nextTour').textContent=tourIndex===steps.length-1?'Got it':'Next';
}
function endTour(){document.querySelectorAll('.tour-highlight').forEach(e=>e.classList.remove('tour-highlight'));try{localStorage.setItem('guard_tour_v2','true');}catch{}window.scrollTo({top:0,behavior:'instant'});}
function startTour(){tourIndex=0;$('tour').showModal();tourStep();}
$('tour').addEventListener('close',endTour);$('skipTour').onclick=()=>$('tour').close();$('prevTour').onclick=()=>{tourIndex--;tourStep();};$('nextTour').onclick=()=>{if(tourIndex===steps.length-1)$('tour').close();else{tourIndex++;tourStep();}};$('how').onclick=startTour;
window.addEventListener('storage',e=>{if(e.key===KEY)storageWarning('This dashboard changed in another tab. Refresh to load its latest saved version before making more changes.');});
if(researchMode){$('how').hidden=true;window.addEventListener('message',e=>{if(e.origin===location.origin&&e.source===parent&&e.data?.type==='guard-research-reset'){state={list:G.seed(),events:[],day:day(),undo:null};$('modal').close();$('search').value='';$('filter').value='all';save();render();}});}
render();save();if(state.undo)toast('Your last change can still be undone.',true);
if(!researchMode){try{if(localStorage.getItem('guard_tour_v2')!=='true')startTour();}catch{startTour();}}
