const appearanceKey='wallet-appearance-v1:'+new URL('./',location.href).pathname;
let personal=null, customPage='home', concealed=false;
const pageOffsets=new Map();
const personalActions=new Set(['home','cards','account','settings','wealth','activity','income','expense','request','freeze','details','limit','pin','cardCode','hide','accountInfo','watch','travel','refer','dismiss','import','resources','recipients','payments','options','back','upload','currency','activate']);
const valueNames=new Set(['cash','eur','holder','initials','frozen','accountId']);
const maxThemeBytes=2500000;
function checkAppearance(t){
 const art=v=>typeof v==='string'&&/^data:image\/(?:png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(v);
 if(t?.format==='personal-wallet-2'&&art(t.icon)&&['card','lock','explore','partners'].every(name=>art(t.film?.[name]))){
  if(['launchMark','launchRibbon','travelHeadline'].some(k=>t.film[k]!==undefined&&!art(t.film[k])))throw Error('Invalid appearance artwork.');
  return t;
 }
 if(t?.format!=='personal-wallet-1'||!art(t.icon))throw Error('Select a wallet appearance file.');
 for(const name of ['home','cards','account']){
  const p=t[name];
  if(!p||!art(p.background)||!art(p.nav)||!Array.isArray(p.regions)||p.regions.length>60||!Number.isFinite(p.height)||p.height<100||p.height>3000)throw Error('Invalid screen.');
  for(const r of p.regions){
   if(![r.x,r.y,r.w,r.h].every(n=>Number.isFinite(n)&&n>=0&&n<=3000)||typeof r.label!=='string'||r.label.length>100||r.action&&!personalActions.has(r.action)||r.value&&!valueNames.has(r.value))throw Error('Invalid screen control.');
   if(r.value&&(!Number.isFinite(r.size)||r.size<12||r.size>150))throw Error('Invalid text size.');
  }
 }return t;
}
try{const storedTheme=localStorage.getItem(appearanceKey);if(storedTheme)personal=checkAppearance(JSON.parse(storedTheme))}catch{}
async function importAppearance(file){
 if(!file)return;
 try{if(file.size>maxThemeBytes)throw Error('Appearance file is too large.');
 await installPersonalAppearance(await file.text())}
 catch(e){alert(e.message)}finally{document.querySelector('#appearance-file').value=''}
}
async function installPersonalAppearance(json){
 const theme=checkAppearance(JSON.parse(json));
 localStorage.setItem(appearanceKey,JSON.stringify(theme));
 personal=theme;
 customPage='home';
 tab='Wallet';
 if(wallet){render();scrollTo(0,0)}else{applyAppearance()}
 await cachePersonalIcon(theme.icon);
}
async function openAppearanceLink(link,fromAddressBar=false,silentUpgrade=false){
 try{
  const url=new URL(link), own=new URL('./',location.href);
  const match=/^#look=([A-Za-z0-9_-]{43})$/.exec(url.hash);
  if(!match||url.origin!==own.origin||![own.pathname,own.pathname+'install.html',own.pathname+'index.html'].includes(url.pathname))throw Error('Paste the complete private setup link.');
  const raw=Uint8Array.from(atob(match[1].replace(/-/g,'+').replace(/_/g,'/')+'='),c=>c.charCodeAt(0));
  const key=await crypto.subtle.importKey('raw',raw,'AES-GCM',false,['decrypt']);
  if(fromAddressBar&&personal?.artRevision===3&&localStorage.getItem(appearanceKey+':activation')===match[1])return;
  const response=await fetch('./personal-layout-v3.bin',{credentials:'omit',referrerPolicy:'no-referrer'});
  if(!response.ok)throw Error('The appearance could not be loaded. Reopen the link while online.');
  const bytes=new Uint8Array(await response.arrayBuffer());
  if(bytes.length<29||bytes.length>maxThemeBytes+28)throw Error('Invalid appearance package.');
  const plain=await crypto.subtle.decrypt({name:'AES-GCM',iv:bytes.slice(0,12)},key,bytes.slice(12));
  await installPersonalAppearance(new TextDecoder().decode(plain));
  localStorage.setItem(appearanceKey+':activation',match[1]);
  if(!fromAddressBar)history.replaceState(null,'',own.pathname+'install.html'+url.hash);
  applyAppearance();
 }catch(error){if(!silentUpgrade)alert(error.name==='OperationError'?'The private link is incomplete or incorrect.':error.message)}
}
function downloadAppearance(){
 if(!personal)return;
 const blob=new Blob([JSON.stringify(personal)],{type:'application/json'});
 const url=URL.createObjectURL(blob),anchor=document.createElement('a');
 anchor.href=url;anchor.download='Wise-Personal.json';document.body.append(anchor);anchor.click();anchor.remove();
 setTimeout(()=>URL.revokeObjectURL(url),60000);
}
function applyAppearance(){
 walletMotion.assets(personal);
 document.body.classList.toggle('personal',!!personal);
 document.documentElement.classList.toggle('video-wallet',!!personal);
 walletMotion.updateThemeColor();
 document.querySelector('meta[name=apple-mobile-web-app-title]').content=personal?'Wise':'Wise Wallet';
 if(personal)applyInstallIdentity();
 else if(!location.pathname.endsWith('/install.html')&&!location.hash.startsWith('#look='))document.querySelector('link[rel=apple-touch-icon]').href='./icon.png';
}
let iconCached=false;
async function cachePersonalIcon(url){
 try{
  const cache=await caches.open('local-art:'+new URL('./',location.href).href);
  const bytes=Uint8Array.from(atob(url.split(',')[1]),c=>c.charCodeAt(0));
  await cache.put('./personal-touch-v2.png',new Response(bytes,{headers:{'Content-Type':'image/png'}}));
  if(personal?.icon===url){iconCached=true;applyAppearance()}
 }catch{}
}
if(personal)cachePersonalIcon(personal.icon);
function appearanceControls(){return '<div class="sectionhead"><h2>Appearance</h2></div><button class="line" data-look="pasteLink">Use private setup link　›</button><button class="line" data-look="import">Import personal appearance file　›</button>'+(personal?'<button class="line" data-look="download">Save appearance file　↓</button><a class="line" download="Wallet-Icon.png" href="'+personal.icon+'">Save Home Screen icon　↓</a><button class="line" data-look="default">Use default appearance　›</button>':'')}
function regionHTML(r,height){
 const values={cash:concealed?'••••':money(cash()),eur:concealed?'••••':money(cash()).replace('€','')+' EUR',holder:wallet.name+'　•••• '+wallet.last,initials:wallet.name.trim().split(/\s+/).slice(0,2).map(s=>s[0]).join('').toUpperCase(),frozen:wallet.frozen?'Unfreeze card':'Freeze card',accountId:wallet.referenceLabel||'Account details'};
 const style='left:'+r.x/944*100+'%;top:'+r.y/height*100+'%;width:'+r.w/944*100+'%;height:'+r.h/height*100+'%;'+(r.value?'font-size:'+r.size/944*100+'cqw;justify-content:'+(r.center?'center':'flex-start')+';':'');
 const cls='region'+(r.value?' live-label':'')+(r.accent?' accent':'');
 return r.action?'<button class="'+cls+'" style="'+style+'" data-look="'+r.action+'" aria-label="'+esc(r.label)+'">'+(r.value?esc(values[r.value]):'')+'</button>':'<span class="'+cls+'" style="'+style+'">'+esc(values[r.value]||'')+'</span>';
}
function personalNav(){
 const links=[['home','⌂','Home'],['cards','▭','Cards'],['recipients','♧','Recipients'],['payments','⇄','Payments']];
 return '<nav class="glassnav" aria-label="Main navigation">'+links.map(([id,glyph,name])=>'<button data-look="'+id+'" '+(customPage===id?'aria-current="page"':'')+'><span>'+glyph+'</span>'+name+'</button>').join('')+'</nav>';
}
function personalScreen(){
 if(!personal||tab!=='Wallet')return false;
 if(customPage==='recipients'||customPage==='payments'){
 const people=[...new Set(wallet.entries.map(r=>r.name))];
 app.innerHTML='<div class="extra-screen"><button class="pill" data-look="home">← Home</button><h1>'+(customPage==='payments'?'Payments':'Recipients')+'</h1>'+(customPage==='payments'?'<button class="pill" data-look="expense">Send</button> <button class="pill" data-look="request">Request</button>'+entries():people.map(name=>'<div class="line">'+esc(name)+'</div>').join(''))+'</div>'+personalNav();return true;
 }
 const p=personal[customPage]||personal.home;
 const hero='<section class="ref-panel" aria-label="'+customPage+'" style="aspect-ratio:944/'+p.height+'"><img class="reference-art" alt="" src="'+p.background+'">'+p.regions.map(r=>regionHTML(r,p.height)).join('')+'</section>';
 const tx=customPage==='account'?'<section class="ref-ledger" aria-label="Transactions">'+entries()+'</section>':'';
 const bar=customPage==='account'?'<nav class="glassnav accountbar"><button data-look="income"><span>＋</span>Add</button><button data-look="currency"><span>⇄</span>Convert</button><button data-look="expense"><span>↑</span>Send</button><button data-look="request"><span>↓</span>Request</button></nav>':personalNav();
 app.innerHTML='<div class="phoneview">'+hero+tx+'</div>'+bar;
 const dock=app.querySelector('nav');dock.classList.add('artdock');dock.style.backgroundImage='url('+p.nav+')';
 requestAnimationFrame(()=>{
  for(const el of app.querySelectorAll('.live-label')){
   if(el.clientWidth&&el.scrollWidth>el.clientWidth){el.style.fontSize=(parseFloat(getComputedStyle(el).fontSize)*el.clientWidth/el.scrollWidth)+'px'}
  }
 });
 return true;
}
function message(title,body){
 const d=document.createElement('dialog');d.className='notice';const h=document.createElement('h2'),p=document.createElement('p'),b=document.createElement('button');
 h.textContent=title;p.textContent=body;b.textContent='Done';b.className='primary';d.append(h,p,b);document.body.append(d);b.onclick=()=>d.close();d.onclose=()=>d.remove();d.showModal();
}
function recordFlow(kind,title){
 edit('entries','new');document.querySelector('#sheetTitle').textContent=title;form.elements.kind.value=kind;previewAmount();
}
function goLook(a){
 if(a==='pasteLink'){const link=prompt('Paste your private wallet setup link');if(link)openAppearanceLink(link.trim());return}
 if(a==='download'){downloadAppearance();return}
 if(['home','cards','account','payments','recipients'].includes(a)){
  const from=tab==='Wallet'?customPage:null;
  const detail=a==='account'||a==='cards'&&viewState.cardFromHome;
  const style=detail?'forward':from==='account'||from==='cards'&&a==='home'&&viewState.cardFromHome?'back':'tab';
  if(from)pageOffsets.set(from,scrollY);
  const offset=from===a||detail?0:pageOffsets.get(a)||0;
  const outgoing=style==='tab'?null:app.querySelector(':scope > .vscreen');
  const oldScroll=scrollY;
  tab='Wallet';customPage=a;render();scrollTo(0,offset);walletMotion.transition(from,a,style,outgoing,oldScroll);return;
 }
 if(['settings','wealth','activity','resources','options','back'].includes(a)){tab=({wealth:'Wealth',activity:'Activity',back:'Wallet'})[a]||'Settings';customPage='home';render();scrollTo(0,0);return}
 if(a==='import'||a==='upload'){document.querySelector('#appearance-file').click();return}
 if(a==='default'){localStorage.removeItem(appearanceKey);localStorage.removeItem(appearanceKey+':activation');history.replaceState(null,'',new URL('./',location.href).pathname);personal=null;iconCached=false;identityToken='';document.querySelector('link[rel=manifest]').href='./manifest.webmanifest';if('caches' in window)caches.delete('local-art:'+new URL('./',location.href).href);render();return}
 if(a==='hide'){concealed=!concealed;render();return}
 if(a==='income'||a==='expense'){recordFlow(a==='income'?'Income':'Expense',a==='income'?'Add money':'Record a payment');return}
 if(a==='request'){recordFlow('Income','Record a simulated request received');return}
 if(a==='cardCode'){message('Virtual card PIN',wallet.displayPin||'0000');return}
 if(a==='freeze'){editAction='freeze';save();return}
 if(['limit','details','pin'].includes(a)){edit(a);return}
 if(a==='accountInfo'){
 const ref=prompt('Personal account label',wallet.referenceLabel||'');if(ref!==null){const copy={...wallet,referenceLabel:ref.trim().slice(0,34)};persist(copy).then(()=>{if(wallet){wallet=copy;render()}}).catch(()=>alert('Could not save account label.'))}return}
 const notes={cardCode:['Card PIN','This virtual card has no payment PIN. You can set your app lock under Settings.'],watch:['Apple Watch','Apple Pay provisioning requires a card issued by a supported bank.'],travel:['Travel hub','Your wallet uses euros. View activity to review travel spending.'],refer:['Rewards','Promotions in this personal preview are illustrative.'],currency:['Currency','This wallet is denominated in euros.'],activate:['Virtual card','Your personal virtual card is ready to use in the simulator.'],dismiss:['Goals','Open Wealth to edit your goals and holdings.']};if(notes[a])message(...notes[a]);
}
document.addEventListener('click',e=>{const b=e.target.closest('[data-look]');if(b&&!busy)goLook(b.dataset.look)});
document.querySelector('#appearance-file').addEventListener('change',e=>importAppearance(e.target.files[0]));

