const $ = s => document.querySelector(s);
const app = $('#app'), sheet = $('#sheet'), form = $('#editor');
const keyName = 'wise-wallet:v1:' + new URL('./', location.href).pathname;
const money = cents => new Intl.NumberFormat('en-IE',{style:'currency',currency:'EUR'}).format(cents/100);
const esc = s => String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const today = () => {const d=new Date();return new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,10)};
const sum = rows => rows.reduce((v,r)=>v+r.amount,0);
const daysAgo = n => {const d=new Date(today()+'T12:00:00');d.setDate(d.getDate()-n);return new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,10)};
const seed = () => ({name:'Val Stone',last:'0808',limit:350000,opening:11597,frozen:false,
 entries:[{id:'e1',name:'Studio subscription',amount:10980,kind:'Income',date:daysAgo(1)},{id:'e2',name:'Software subscription',amount:10559,kind:'Expense',date:daysAgo(2)},{id:'e3',name:'Alex Morgan',amount:12000,kind:'Income',date:daysAgo(4)},{id:'e4',name:'Studio subscription',amount:10980,kind:'Expense',date:daysAgo(6)}],
 recipients:[{id:'r1',name:'Alex Morgan',kind:'Recipient',note:'Euro account'},{id:'r2',name:'Sam Rivera',kind:'Recipient',note:'Travel account'},{id:'r3',name:'Travel savings',kind:'My account',note:'Personal account'}],
 holdings:[{id:'h1',name:'Index portfolio',kind:'Investment',amount:800000}],goals:[{id:'g1',name:'First €50,000',amount:5000000}]});
let wallet, cryptoKey, salt, tab=new URLSearchParams(location.search).has('setup')?'Settings':'Wallet', busy=false;
const encoder = new TextEncoder();
const to64 = bytes => btoa(Array.from(new Uint8Array(bytes),n=>String.fromCharCode(n)).join(''));
const from64 = s => Uint8Array.from(atob(s),c=>c.charCodeAt(0));
async function derive(pin,saltValue){
 const material=await crypto.subtle.importKey('raw',encoder.encode(pin),'PBKDF2',false,['deriveKey']);
 return crypto.subtle.deriveKey({name:'PBKDF2',hash:'SHA-256',salt:from64(saltValue),iterations:310000},material,{name:'AES-GCM',length:256},false,['encrypt','decrypt']);
}
async function persist(data,k=cryptoKey,s=salt){
 let stored={data};
 if(k){const iv=crypto.getRandomValues(new Uint8Array(12));const bytes=await crypto.subtle.encrypt({name:'AES-GCM',iv},k,encoder.encode(JSON.stringify(data)));stored={salt:s,iv:to64(iv),cipher:to64(bytes)}}
 localStorage.setItem(keyName,JSON.stringify(stored));
}
const cash = () => wallet.opening+wallet.entries.reduce((v,r)=>v+(r.kind==='Income'?r.amount:-r.amount),0);
const worth = () => cash()+wallet.holdings.reduce((v,r)=>v+(r.kind==='Liability'?-r.amount:r.amount),0);
const spent = () => sum(wallet.entries.filter(r=>r.kind==='Expense'&&r.date.startsWith(today().slice(0,7))));
const btn=(label,action,cls='pill')=>'<button type="button" class="'+cls+'" data-act="'+action+'">'+label+'</button>';
const navItems=[['Wallet','◉'],['Activity','⇄'],['Wealth','◒'],['Settings','☷']];
const mast='<div class="mast"><div class="brand"><img src="./icon.svg" alt="">Wise Wallet</div><span class="badge">Simulator</span></div>';
const nav=()=>'<nav aria-label="Main navigation">'+navItems.map(([name,icon])=>'<button data-tab="'+name+'" '+(tab===name?'class="active" aria-current="page"':'')+'><span aria-hidden="true">'+icon+'</span>'+name+'</button>').join('')+'</nav>';
const track=(v,max)=>'<div class="track"><i style="width:'+Math.min(100,Math.max(0,max?v/max*100:0))+'%"></i></div>';
const stat=(title,v)=>'<div class="stat"><small>'+title+'</small><b>'+money(v)+'</b></div>';
const row=(title,desc,tail,action='')=>'<'+(action?'button type="button" data-act="'+action+'"':'div')+' class="line"><div><b>'+esc(title)+'</b><small>'+esc(desc)+'</small></div><span class="amount">'+tail+'</span></'+(action?'button':'div')+'>';
function card(){return '<article class="card '+(wallet.frozen?'frozen':'')+'" aria-label="Virtual euro card"><div class="spread"><strong>Folio</strong><small>EURO / 01</small></div><div class="chip"></div><div class="cardBottom"><div><small>PERSONAL EDITION</small><b>'+esc(wallet.name)+'</b></div><small>•• '+esc(wallet.last)+'</small></div></article>'}
function entries(limit=Infinity){return [...wallet.entries].sort((a,b)=>b.date.localeCompare(a.date)).slice(0,limit).map(r=>row(r.name,r.kind+' · '+r.date,(r.kind==='Income'?'+':'−')+money(r.amount),'entries/'+r.id)).join('')||'<p class="empty">Add your first transaction in Settings.</p>'}
function dashboard(){return '<h1>My wallet</h1><div class="hero"><p class="kicker">Available balance</p><strong class="money">'+money(cash())+'</strong></div>'+card()+'<div class="actions">'+btn(wallet.frozen?'❄ Unfreeze':'❄ Freeze','freeze')+btn('Card details','details')+btn('Limit','limit')+'</div><div class="panel"><div class="spread"><b>Monthly spending</b><span>'+money(spent())+'</span></div>'+track(spent(),wallet.limit)+'<small class="sub">of '+money(wallet.limit)+' monthly limit</small></div><div class="sectionhead"><h2>Recent activity</h2>'+btn('View all','activity','smallBtn')+'</div>'+entries(3)}
function wealth(){return '<h1>My wealth</h1><div class="hero"><p class="kicker">Net worth</p><b class="money">'+money(worth())+'</b></div><div class="stats">'+stat('Cash',cash())+stat('Investments',sum(wallet.holdings.filter(r=>r.kind==='Investment')))+stat('Other assets',sum(wallet.holdings.filter(r=>r.kind==='Asset')))+stat('Liabilities',sum(wallet.holdings.filter(r=>r.kind==='Liability')))+'</div><div class="sectionhead"><h2>Holdings</h2>'+btn('Add holding','holdings/new','smallBtn')+'</div>'+holdingRows()+'<div class="sectionhead"><h2>Net worth goals</h2>'+btn('Add goal','goals/new','smallBtn')+'</div>'+goalRows()}
function holdingRows(){return wallet.holdings.map(r=>row(r.name,r.kind,money(r.amount),'holdings/'+r.id)).join('')||'<p class="empty">Your holdings will appear here.</p>'}
function goalRows(){return wallet.goals.map(r=>'<div class="panel">'+row(r.name,'Net worth target',money(r.amount),'goals/'+r.id)+track(worth(),r.amount)+'<small class="sub">'+Math.max(0,Math.floor(worth()/r.amount*100))+'% reached</small></div>').join('')||'<p class="empty">Add a goal to track your progress.</p>'}
function settings(){return '<h1>Settings</h1>'+row('Available balance','Set the current cash balance',money(cash()),'balance')+row('Card details',wallet.name,'•• '+esc(wallet.last),'details')+row('Monthly limit','Spending target',money(wallet.limit),'limit')+row('App PIN',cryptoKey?'Enabled · change or remove':'Optional six-digit lock','›','pin')+'<div class="sectionhead"><h2>Transactions</h2>'+btn('Add transaction','entries/new','smallBtn')+'</div>'+entries()+'<div class="sectionhead"><h2>Assets & investments</h2>'+btn('Add holding','holdings/new','smallBtn')+'</div>'+holdingRows()+'<div class="sectionhead"><h2>Goals</h2>'+btn('Add goal','goals/new','smallBtn')+'</div>'+goalRows()+'<p class="sub">Personal simulation · Fictional euro amounts. Changes are saved on this device.</p>'}
function render(){
 walletMotion.clear();
 const pages={Wallet:dashboard,Wealth:wealth,Settings:settings,Activity:()=>'<h1>Activity</h1><div class="stats">'+stat('Total income',sum(wallet.entries.filter(r=>r.kind==='Income')))+stat('Total expenses',sum(wallet.entries.filter(r=>r.kind==='Expense')))+'</div><div class="sectionhead"><h2>Transactions</h2>'+btn('Add entry','entries/new','smallBtn')+'</div>'+entries()};
 applyAppearance();
 if(renderVideoWallet())return;
 const content=pages[tab]();
 app.innerHTML=mast+(tab==='Settings'?content.replace('<h1>Settings</h1>','<h1>Settings</h1>'+extraSettings())+appearanceControls():content)+nav();
}
function input(label,name,value='',options=''){return '<label>'+label+'<input name="'+name+'" value="'+esc(value)+'" required '+options+'></label>'}
const amountInput=(label,value,min=0)=>input(label,'amount',(value/100).toFixed(2),'type="number" inputmode="decimal" step=".01" min="'+min+'" max="999999999999"');
const textInput=(label,value)=>input(label,'name',value,'maxlength="48"');
const select=(label,options,value)=>'<label>'+label+'<select name="kind">'+options.map(s=>'<option '+(s===value?'selected':'')+'>'+s+'</option>').join('')+'</select></label>';
const pinInput=(label,name)=>input(label,name,'','type="password" inputmode="numeric" pattern="[0-9]{6}" maxlength="6" autocomplete="off"');
let editAction, recordId;
function edit(action,id){
 editAction=action;recordId=id;
 const r=wallet[action]?.find?.(x=>x.id===id);
 const fields={
 balance:()=>['Available balance',amountInput('Current balance (€)',cash(),-999999999999)],
 details:()=>['Card details',textInput('Cardholder',wallet.name)+input('Display digits','last',wallet.last,'pattern="[0-9]{4}" inputmode="numeric" maxlength="4"')+input('Simulated card PIN','displayPin',wallet.displayPin||'0000','pattern="[0-9]{4}" inputmode="numeric" maxlength="4"')+'<p class="sub">Use a fictional number for this card.</p>'],
 limit:()=>['Monthly spending limit',amountInput('Limit (€)',wallet.limit,.01)],
 entries:()=>[r?'Edit transaction':'Add transaction',textInput('Description',r?.name||'')+select('Type',['Income','Expense'],r?.kind)+amountInput('Amount (€)',r?.amount||0,.01)+input('Date','date',r?.date||today(),'type="date"')],
 holdings:()=>[r?'Edit holding':'Add holding',textInput('Holding name',r?.name||'')+select('Type',['Investment','Asset','Liability'],r?.kind)+amountInput('Current value (€)',r?.amount||0)],
 goals:()=>[r?'Edit goal':'Add goal',textInput('Goal name',r?.name||'')+amountInput('Target (€)',r?.amount||0,.01)],
 pin:()=>['App PIN','<p class="sub">Locks when you leave the app. Keep your PIN safe. It is needed to open your encrypted wallet.</p>'+(cryptoKey?pinInput('Current PIN','current'):'')+pinInput('New six-digit PIN','pin')+pinInput('Confirm new PIN','confirm')+(cryptoKey?btn('Remove PIN','removePin','smallBtn danger'):'')],
 removePin:()=>['Remove PIN',pinInput('Current PIN','current')]
 };
 const [title,html]=extraFields(action,id,r)||fields[action]();$('#sheetTitle').textContent=title;$('#fields').innerHTML=html+(r?btn('Delete entry','delete','smallBtn danger'):'');$('#error').textContent='';if(!sheet.open)sheet.showModal();
}
async function unlock(pin){
 const stored=JSON.parse(localStorage.getItem(keyName));const k=await derive(pin,stored.salt);
 const bytes=await crypto.subtle.decrypt({name:'AES-GCM',iv:from64(stored.iv)},k,from64(stored.cipher));
 return {data:JSON.parse(new TextDecoder().decode(bytes)),k,s:stored.salt};
}
function lock(){
 walletMotion.clear();
 pageOffsets.clear();
 wallet=null;cryptoKey=null;salt=null;tab='Wallet';customPage='home';viewState.search='';document.querySelectorAll('dialog[open]').forEach(d=>d.close());$('#fields').replaceChildren();
 app.innerHTML=mast+'<form class="lockbox" id="unlock"><h1>Welcome back</h1>'+pinInput('Wallet PIN','pin')+'<p class="err" role="alert"></p><button class="primary">Unlock wallet</button></form>';
 $('#unlock').onsubmit=async e=>{e.preventDefault();const f=e.currentTarget;try{const u=await unlock(f.pin.value);if(document.hidden)return;wallet=u.data;cryptoKey=u.k;salt=u.s;render()}catch{f.querySelector('.err').textContent='Could not unlock. Check your PIN.'}};
}
async function save(remove=false){
 if(busy)return;busy=true;$('#save').disabled=true;
 try{const data=structuredClone(wallet),values=Object.fromEntries(new FormData(form)),amount=Math.round(Number(values.amount)*100);
 let k=cryptoKey,s=salt;
 if(values.name!==undefined&&!values.name.trim()&&!remove)throw Error('Enter a name or description.');
 if(editAction==='pin'||editAction==='removePin'){
 if(k){try{await unlock(values.current)}catch{throw Error('Current PIN is incorrect.')}}
 if(editAction==='pin'){if(values.pin!==values.confirm)throw Error('The new PINs do not match.');s=to64(crypto.getRandomValues(new Uint8Array(16)));k=await derive(values.pin,s)}else{k=null;s=null}
 }else if(editAction==='balance')data.opening+=amount-cash();
 else if(editAction==='details'){data.name=values.name.trim();data.last=values.last;data.displayPin=values.displayPin}
 else if(editAction==='limit')data.limit=amount;
 else if(editAction==='freeze')data.frozen=!data.frozen;
 else if(!saveExtra(editAction,recordId,data,values,amount,remove)){const list=data[editAction],index=list.findIndex(x=>x.id===recordId);
 if(remove){if(index>=0)list.splice(index,1)}
 else{const record={id:recordId==='new'?crypto.randomUUID():recordId,name:values.name.trim(),amount};
 if(values.date)record.date=values.date;if(values.kind)record.kind=values.kind;
 if(index<0)list.unshift(record);else list[index]=record}}
 await persist(data,k,s);wallet=data;cryptoKey=k;salt=s;if(sheet.open)sheet.close();$('#fields').replaceChildren();render();
 }catch(err){if(sheet.open)$('#error').textContent=err.message;else alert('Could not save your change.')}
 finally{busy=false;$('#save').disabled=false;if(document.hidden&&cryptoKey)lock()}
}
function init(){
 try{
  const stored=JSON.parse(localStorage.getItem(keyName)||'null');
  if(stored?.cipher)return lock();
  wallet=stored?.data||seed();
  if(!stored)localStorage.setItem(keyName,JSON.stringify({data:wallet}));
  render();
 }catch{app.textContent='Wallet storage could not be opened. Check Safari website storage and try again.'}
}
sheet.addEventListener('close',()=>$('#fields').replaceChildren());
document.addEventListener('click',e=>{const b=e.target.closest('button');if(!b||busy)return;
 if(b.dataset.tab){tab=b.dataset.tab;render();scrollTo(0,0);return}
 const act=b.dataset.act;if(!act)return;
 if(act==='activity'){tab='Activity';render();scrollTo(0,0)}
 else if(act==='freeze'){editAction='freeze';save()}
 else if(act==='delete'){if(confirm('Delete this entry from your wallet?'))save(true)}
 else edit(...act.split('/'));
});
$('#close').onclick=()=>sheet.close();form.onsubmit=e=>{e.preventDefault();save()};
document.addEventListener('visibilitychange',()=>{if(document.hidden&&cryptoKey&&!busy)lock()});
window.addEventListener('pagehide',()=>{if(cryptoKey&&!busy)lock()});
applyAppearance();
init();
function activateFromAddress(){
 if(location.hash.startsWith('#look='))return openAppearanceLink(location.href,true);
 const stored=localStorage.getItem(appearanceKey+':activation');
 if(personal&&personal.artRevision!==3&&stored)return openAppearanceLink(new URL('./',location.href).href+'#look='+stored,true,true);
}
walletMotion.launch(activateFromAddress());
window.addEventListener('hashchange',activateFromAddress);
if('serviceWorker' in navigator)navigator.serviceWorker.register('./sw.js').catch(()=>console.warn('Offline setup unavailable.'));

