const icons = {
 home:'<path d="m3 10 9-7 9 7v11H3z"/>',cards:'<path d="M2 5h20v5q-3 2 0 4v5H2z"/><path d="M5 8h2"/>',
 recipients:'<circle cx="9" cy="8" r="4"/><path d="M2 21c0-9 14-9 14 0M16 4a4 4 0 0 1 0 8m1 2q5 0 5 6"/>',
 payments:'<path d="M10 4a8 8 0 0 1 9 5M20 14a8 8 0 0 1-8 6M6 18a8 8 0 0 1-1-9"/><circle cx="9" cy="4" r="2"/><circle cx="20" cy="12" r="2"/><circle cx="7" cy="19" r="2"/>',
 left:'<path d="M21 12H3m8-8-8 8 8 8"/>',right:'<path d="m9 5 7 7-7 7"/>',more:'<circle cx="5" cy="12" r="1" fill="currentColor"/><circle cx="12" cy="12" r="1" fill="currentColor"/><circle cx="19" cy="12" r="1" fill="currentColor"/>',
 up:'<path d="M12 21V3m-8 8 8-8 8 8"/>',down:'<path d="M12 3v18m-8-8 8 8 8-8"/>',plus:'<path d="M12 3v18M3 12h18"/>',swap:'<path d="M2 12h20M8 6l-6 6 6 6m8-12 6 6-6 6"/>',
 eye:'<path d="M3 10q9 10 18 0M5 13l-2 2m6-1-1 3m6-3 1 3m4-4 2 2"/>',chart:'<path d="M3 21h18M6 17v-4m5 4V9m5 8V4"/>',
 bank:'<path d="m2 9 10-6 10 6H2Zm3 1v9m7-9v9m7-9v9M2 21h20"/>',qr:'<path d="M3 9V4h5m8 0h5v5M3 15v5h5m8 0h5v-5"/><rect x="8" y="8" width="8" height="8" rx="2"/>',
 snow:'<path d="M12 2v20M3 7l18 10M3 17 21 7M9 4l3 3 3-3m-6 16 3-3 3 3M4 10l4-1-1-4m13 9-4 1 1 4M4 14l4 1-1 4m13-9-4-1 1-4"/>',
 credit:'<rect x="2" y="4" width="20" height="16" rx="2"/><path d="M5 15h9M5 12h3"/>',travel:'<rect x="5" y="5" width="14" height="15" rx="3"/><path d="M9 5V2h6v3M6 11h12M7 20v2m10-2v2"/>',
 pin:Array.from({length:10},(_,i)=>'<circle fill="currentColor" stroke="none" cx="'+(i===9?12:6+i%3*6)+'" cy="'+(i===9?21:4+Math.floor(i/3)*5.6)+'" r="2"/>').join(''),
 search:'<circle cx="10" cy="10" r="6"/><path d="m15 15 6 6"/>',gear:'<path d="m9 2-1 3-3 1-2 3 2 3-1 3 2 3 3 1 2 3 3-1 2-3 3-1 2-3-2-3V7l-3-2-3 1z"/><circle cx="12" cy="12" r="3"/>',
 list:'<path d="M8 5h13M8 12h13M8 19h13M3 5h.1M3 12h.1M3 19h.1"/>',clock:'<circle cx="12" cy="12" r="9"/><path d="M12 6v6l4 2"/>',close:'<path d="m5 5 14 14m0-14L5 19"/>',lock:'<rect x="4" y="10" width="16" height="11" rx="2"/><path d="M7 10V7a5 5 0 0 1 10 0v3"/>'
};
const svg = k => '<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">'+(icons[k]||icons.right)+'</svg>';
const control=(action,label,cls='',name='')=>'<button type="button" class="'+cls+'" data-v="'+esc(action)+'"'+(name?' aria-label="'+esc(name)+'"':'')+'>'+label+'</button>';
const bubble=(action,k,label)=>control(action,svg(k),'vbubble',label);
const chip=(action,label,kind='')=>control(action,label,'vchip '+kind);
const actRound=(action,k,label)=>control(action,'<i>'+svg(k)+'</i>'+label,'vround');
const viewState={qr:false,accountTab:'Transactions',recipientScope:'All',search:'',searchOpen:false,accountUnit:'EUR',planKind:'',homeSlide:0};
function flag(unit){
 const stars=unit==='EUR'?Array.from({length:12},(_,i)=>'<i style="--turn:'+i*30+'deg"></i>').join(''):'';
 return '<i class="vflag flag-'+unit+'" role="img" aria-label="'+unit+'">'+stars+'</i>';
}
const unitCash=unit=>unit==='EUR'?cash():(wallet.currencies?.[unit]||0);
const homeTotal=()=>cash()+['USD','AED'].reduce((sum,u)=>sum+Math.round(unitCash(u)/planRates[u]),0);
const number=cents=>(cents/100).toLocaleString('en-IE',{minimumFractionDigits:2,maximumFractionDigits:2});
const visibleAmount=(value,unit,symbol=false)=>concealed?'••••':symbol?({EUR:'€',USD:'$',AED:''}[unit])+number(value)+(unit==='AED'?' د.إ':''):number(value)+' '+unit;
const initials=name=>name.trim().split(/\s+/).slice(0,2).map(s=>s[0]).join('').toUpperCase();
const film=name=>personal?.film?.[name];
function navVideo(){
 const account=customPage==='account';
 const links=account?[['income','plus','Add'],['convert','swap','Convert'],['expense','up','Send'],['request','down','Request']]:[['home','home','Home'],['cards','cards','Cards'],['recipients','recipients','Recipients'],['payments','payments','Payments']];
 return '<nav class="vdock '+(account?'vaccdock':'')+'" aria-label="'+(account?'Account actions':'Main navigation')+'">'+links.map(([id,k,name])=>'<button data-v="'+id+'" '+(customPage===id?'aria-current="page"':'')+'>'+svg(k)+'<span>'+name+'</span></button>').join('')+'</nav>';
}
function vRow(action,k,title,sub='',tail=''){
 return control(action,'<i class="vleading">'+svg(k)+'</i><span><b>'+esc(title)+'</b>'+(sub?'<small>'+esc(sub)+'</small>':'')+'</span>'+(tail||svg('right')),'vrow');
}
function txList(unit='EUR',limit=Infinity){
 const items=(unit==='EUR'?wallet.entries:(wallet.fxEntries||[]).filter(r=>r.unit===unit)).slice().sort((a,b)=>b.date.localeCompare(a.date)).slice(0,limit);
 return items.map(r=>{
 const incoming=r.kind==='Income';const date=new Date(r.date+'T12:00:00').toLocaleDateString('en-GB',{day:'numeric',month:'short'});
 return control(unit==='EUR'?'entry/'+r.id:'fxentry/'+r.id,'<i class="vleading">'+(incoming?svg('down'):esc(initials(r.name)))+'</i><span><b>'+esc(r.name)+'</b><small>'+esc(date)+'</small></span><strong class="'+(incoming?'vcredit':'')+'">'+(incoming?'+ ':'- ')+visibleAmount(r.amount,unit)+'</strong>','vrow vtx');
 }).join('')||'<p class="vempty">Your transactions will appear here.</p>';
}
function videoTop(left,right){return '<div class="vtop">'+left+'<div>'+right+'</div></div>'}
function home(){
 const bal=visibleAmount(homeTotal(),'EUR',true), eur=visibleAmount(homeTotal(),'EUR');
 const balances=['EUR','AED','USD'].map(u=>control('unit/'+u,flag(u)+'<b>'+visibleAmount(unitCash(u),u,true)+'</b>'+svg('right'),'vcurrency')).join('');
 const tile='<div class="vacct"><button class="vstrip" data-v="cardFromHome">Your card '+svg('right')+'<i class="vmark"></i></button><button class="vmain" data-v="unit/EUR"><strong>Main account</strong><b>'+bal+'</b>'+svg('right')+'</button><div class="vcurrencies">'+balances+'</div>'+chip('accountInfo',svg('bank')+' Account details','vsmall')+'</div>';
 const schedule=wallet.hiddenPromos?.includes('schedule')?'':'<section class="vschedule">'+bubble('dismiss/schedule','close','Dismiss schedule offer')+'<div>'+svg('up')+'<span><b>Schedule a transfer</b><small>Get your money moving at a time of your choice.</small></span></div>'+chip('plan/Scheduled transfers','Schedule')+'</section>';
 const headline=film('travelHeadline')?'<h3 class="has-art"><img src="'+film('travelHeadline')+'" alt="The travel eSIM has landed"></h3>':'<h3>The travel eSIM<br>has landed</h3>';
 const explore=wallet.hiddenPromos?.includes('explore')?'':'<h2>Explore</h2><section class="vexplore">'+bubble('dismiss/explore','close','Dismiss travel eSIM')+headline+'<p>Get reliable data in over 150 destinations from the moment you arrive.</p>'+(film('explore')?'<img alt="" src="'+film('explore')+'">':'')+bubble('travel','right','Explore travel hub')+'</section>';
 return videoTop(control('settings',esc(initials(wallet.name)),'vavatar','Settings'),chip('refer','Earn €100','vgreen')+chip('more','Do more '+svg('plus'),'vsurface'))+'<div class="vbalance"><b>Total balance</b><div><strong>'+eur+'</strong>'+bubble('hide','eye',concealed?'Show balance':'Hide balance')+bubble('wealth','chart','View wealth')+'</div></div><div class="vactions">'+chip('expense','Send','vgreen')+chip('income','Add money')+chip('request','Request')+chip('upload',svg('qr')+' Upload')+'</div><div class="vaccounts" aria-label="Accounts"><div>'+tile+'</div><div><section class="vgoal"><strong>Savings goals</strong>'+chip('wealth','View goals')+'</section></div></div><div class="vdots">'+[0,1].map(i=>control('slide/'+i,'<i></i>',viewState.homeSlide===i?'on':'','Show '+(i?'goals':'account'))).join('')+'</div>'+schedule+'<div class="vheading"><h2>Transactions</h2>'+chip('unit/EUR','See all','vtext')+'</div>'+txList('EUR',3)+'<div class="vheading"><h2>Your returns</h2>'+chip('returns','Explore','vtext')+'</div><p class="vprovided">Provided by Wise Assets Europe</p>'+vRow('returns','chart','Start earning a return','Explore example returns on your balances.')+explore+'<h2>Transfer calculator</h2>'+calculator();
}
function calculator(){return '<div class="vcalc"><svg viewBox="0 0 320 96" role="img" aria-label="Illustrative exchange rate chart"><path fill="none" stroke="#173606" stroke-width="2" d="m0 83 18-3 12 4 12-15 23-2 9-12 20 1 7-26 16 1 17 26 21 1 13 5 21-5 8 2 15-4 26 2 7 16 9-3 11 5 25-4 8 5"/></svg><div class="vchartaxis"><span>27 Oct</span><span>Today</span></div><small>1 EUR = 1.5611 CAD · Example rate</small><div class="vquotes"><label>You send · EUR<input data-calc type="number" step=".01" min="0" value="16" inputmode="decimal"></label><label>Recipient gets · CAD<output id="vconverted">23.68</output></label></div><div class="vquoteinfo"><span>Includes fees<b>0.83 EUR</b></span><span>Should arrive<b>By Friday</b></span></div>'+chip('quoteSend','Send','vgreen')+'</div>'+vRow('rateUpdates','chart','Get exchange rate updates')+'<div class="vprotect">'+svg('lock')+'<h3>Your money, protected</h3><p>Learn how your personal wallet stores its data.</p>'+chip('privacy','Learn more')+'</div>'}
function manageCard(){return '<p class="vgroup">Manage card</p>'+[['unit/EUR','list','View recent card transactions'],['cardControls','gear','Card controls'],['unblock','lock','Unblock PIN'],['label','credit','Card label'],['limit','chart','Your spending limits'],['replace','cards','Replace card']].map(r=>vRow(...r)).join('')}
function cards(){
 const qr=viewState.qr;
 const art=film('card')?'<img src="'+film('card')+'" alt="Green Visa card">':'<div class="vlegacycard" role="img" aria-label="Green card"></div>';
 return videoTop(viewState.cardFromHome?bubble('home','left','Back to Home'):chip('travel',svg('travel')+' Travel hub','vsurface'),chip('cardPlus','Card '+svg('plus'),'vgreen'))+'<h1>'+(qr?'Pay with QR code':'Cards')+'</h1><div class="vdeck '+(qr?'showqr':'')+'" aria-label="Card carousel"><button class="vqrslide" data-v="qr" aria-label="Show QR payments">'+svg('qr')+'</button><button class="vcardslide '+(wallet.frozen?'isfrozen':'')+'" data-v="cardface" aria-label="Show card">'+art+(wallet.frozen?'<span>❄ Frozen</span>':'')+'</button></div>'+(qr?'<div class="vcardactions solo">'+actRound('scan','qr','Scan')+'</div><p>Scan to pay with a QR code supporting</p>'+(film('partners')?'<img class="vpartners" alt="Alipay+, DuitNow, PayNow and QR Ph" src="'+film('partners')+'">':'')+'<p class="vgroup">Manage QR payments</p>'+vRow('qrHelp','gear','How does this work?'):'<div class="vholder">'+esc(wallet.cardLabel||wallet.name)+'　•••• '+esc(wallet.last)+'</div><div class="vcardactions">'+actRound('cardCode','pin','Show PIN')+actRound('details','credit','Card details')+actRound('freeze','snow',wallet.frozen?'Unfreeze card':'Freeze card')+'</div>'+control('watch','<b class="vpay"> Pay</b><b>Add to Apple Watch</b>'+svg('right'),'vwatch')+'<button class="vactivate" data-v="activate">'+(film('lock')?'<img src="'+film('lock')+'" alt="">':'')+'<span>Activate your physical card by entering your PIN at a card reader or by using an ATM.</span></button>'+manageCard());
}
function recipients(){
 const all=wallet.recipients||[], filtered=all.filter(r=>(viewState.recipientScope!=='My accounts'||r.kind==='My account')&&r.name.toLowerCase().includes(viewState.search.toLowerCase()));
 const rows=rs=>rs.map(r=>control('person/'+r.id,'<i class="vleading">'+esc(initials(r.name))+'</i><span><b>'+esc(r.name)+'</b><small>'+esc(r.note||r.kind)+'</small></span>'+svg('right'),'vrow')).join('');
 return videoTop(chip('invite','♧ Invite','vsurface'),chip('person/new',svg('plus')+' Add','vgreen')+chip('upload',svg('qr')+' Upload','vsurface'))+'<h1>Recipients</h1><div class="vfilters">'+['All','My accounts'].map(s=>chip('scope/'+s,s,viewState.recipientScope===s?'vselected':'voutline')).join('')+chip('search',svg('search')+' Search','vsearch')+'</div>'+(viewState.searchOpen?'<input id="vsearch" type="search" placeholder="Search recipients" aria-label="Search recipients" value="'+esc(viewState.search)+'">':'')+(filtered.length?'<small>Recents</small>'+rows(filtered.slice(0,3))+'<small>All</small>'+rows(filtered):'<p class="vempty">'+(all.length?'No matching recipients.':'Add a recipient to start your list.')+'</p>');
}
const plans={'Recurring card payments':['credit','Review your recurring card payments.'],'Scheduled transfers':['clock','Set up a transfer to send at a later date.'],'Direct Debits':['payments','Set up and manage regular payments.'],'Payment requests':['down','Create and manage payments you’ve requested.'],'Forward invoices to email':['list','Organise invoices in your wallet.'],'Auto Conversions':['swap','Set a target rate for a conversion.'],'Auto top-ups':['up','Plan a top-up when your account is low.']};
function payments(){return '<div class="vtitlebar"><b>Payments</b></div><h1>Payments</h1><div class="vactions">'+chip('expense','Send','vgreen')+chip('request','Request')+'</div><div class="vpayments">'+Object.entries(plans).slice(0,5).map(([title,[k,desc]])=>vRow('plan/'+title,k,title,desc)).join('')+'</div><h2>Payment tools</h2><div class="vpayments">'+vRow('wisetag','recipients','Your Wisetag','Your local wallet nickname')+vRow('plan/Payment requests','down','Send via link','Manage practice payment requests.')+Object.entries(plans).slice(5).map(([title,[k,desc]])=>vRow('plan/'+title,k,title,desc)).join('')+'</div><h2>Account details</h2>'+['EUR','USD','AED'].map(u=>control('unit/'+u,flag(u)+'<b>'+({EUR:'Euro',USD:'US Dollar',AED:'United Arab Emirates Dirham'})[u]+'</b>'+svg('right'),'vrow vaccountrow')).join('')}
function account(){
 const unit=viewState.accountUnit, amt=visibleAmount(unitCash(unit),unit), tx=viewState.accountTab==='Transactions';
 return '<div class="vaccbar">'+videoTop(bubble('home','left','Back to Home')+'<strong class="vsticky"><i class="vbranddot"><i class="vmark"></i></i>'+flag(unit)+unit+'</strong>',bubble('more','more','More options'))+'</div><header class="vacchero"><div><i class="vbranddot"><i class="vmark"></i></i>'+flag(unit)+'<b>Main account / '+unit+'</b></div><h1>'+amt+'</h1>'+chip('accountInfo',svg('bank')+' '+esc(wallet.referenceLabel||'Account details')+' '+svg('right'))+'</header><div class="vseg">'+['Transactions','Options'].map(s=>control('accountTab/'+s,s,viewState.accountTab===s?'on':'')).join('')+'</div>'+(tx?txList(unit):vRow('accountInfo','bank','Account details')+vRow('currencyBalance','credit','Edit balance')+vRow('settings','gear','Wallet settings'));
}
function renderVideoWallet(){
 if(!personal||tab!=='Wallet')return false;
 const oldDeck=app.querySelector('.vdeck');
 const previousPositions=oldDeck&&customPage==='cards'&&oldDeck.classList.contains('showqr')!==viewState.qr?Array.from(oldDeck.children,el=>el.getBoundingClientRect().left):null;
 const pages={home,cards,recipients,payments,account};
 app.innerHTML='<div class="vscreen v-'+esc(customPage)+'">'+(pages[customPage]||home)()+'</div>'+navVideo();
 if(customPage==='home'){
 const carousel=app.querySelector('.vaccounts');
 if(viewState.homeSlide)carousel.scrollLeft=carousel.children[1].offsetLeft-carousel.children[0].offsetLeft;
 carousel.onscroll=()=>{viewState.homeSlide=Number(carousel.scrollLeft>carousel.clientWidth*.45);app.querySelectorAll('.vdots button').forEach((b,i)=>b.classList.toggle('on',i===viewState.homeSlide))};
 }
 if(customPage==='account')updateCompact();
 if(previousPositions&&!matchMedia('(prefers-reduced-motion: reduce)').matches){
  Array.from(app.querySelector('.vdeck').children).forEach((slide,i)=>{
   const distance=previousPositions[i]-slide.getBoundingClientRect().left;
   slide.animate([{transform:'translateX('+distance+'px)'},{transform:'translateX(0)'}],{duration:260,easing:'cubic-bezier(.2,.75,.2,1)'});
  });
 }
 return true;
}
function updateCompact(){app.querySelector('.vaccbar')?.classList.toggle('compact',scrollY>110);app.querySelector('.vtitlebar')?.classList.toggle('compact',scrollY>48)}
window.addEventListener('scroll',updateCompact,{passive:true});
let deckDrag=null;
document.addEventListener('pointerdown',e=>{
 const deck=e.target.closest('.vdeck');
 if(!deck||!e.isPrimary||e.button!==0)return;
 deckDrag={deck,id:e.pointerId,x:e.clientX,y:e.clientY,active:false};
});
document.addEventListener('pointermove',e=>{
 if(!deckDrag||e.pointerId!==deckDrag.id)return;
 const dx=e.clientX-deckDrag.x,dy=e.clientY-deckDrag.y;
 if(!deckDrag.active){
  if(Math.abs(dy)>8&&Math.abs(dy)>Math.abs(dx)){deckDrag=null;return}
  if(Math.abs(dx)<8)return;
  deckDrag.active=true;deckDrag.deck.setPointerCapture(e.pointerId);
 }
 const max=deckDrag.deck.clientWidth*.6;
 const distance=viewState.qr?Math.max(-max,Math.min(0,dx)):Math.min(max,Math.max(0,dx));
 for(const slide of deckDrag.deck.children)slide.style.transform='translateX('+distance+'px)';
});
function finishDeckDrag(e){
 if(!deckDrag||e.pointerId!==deckDrag.id)return;
 const drag=deckDrag;deckDrag=null;
 if(!drag.active)return;
 const dx=e.clientX-drag.x;
 if(e.type==='pointerup'&&Math.abs(dx)>35&&viewState.qr!==(dx>0)){
  viewState.qr=dx>0;render();
 }else{
  for(const slide of drag.deck.children){
   const previous=slide.style.transform;slide.style.transform='';
   if(!matchMedia('(prefers-reduced-motion: reduce)').matches)slide.animate([{transform:previous},{transform:'translateX(0)'}],{duration:160,easing:'ease-out'});
  }
 }
}
document.addEventListener('pointerup',finishDeckDrag);
document.addEventListener('pointercancel',finishDeckDrag);
document.addEventListener('input',e=>{
 if(e.target.matches('[data-calc]'))$('#vconverted').textContent=(Math.max(0,(Number(e.target.value)||0)-.83)*1.5611).toLocaleString('en-IE',{minimumFractionDigits:2,maximumFractionDigits:2});
 if(e.target.id==='vsearch'){viewState.search=e.target.value;const pos=e.target.selectionStart;render();const field=$('#vsearch');field.focus();if(pos!==null)field.setSelectionRange(pos,pos)}
});

