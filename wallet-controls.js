const planRates={EUR:1,USD:1.08,AED:3.97};
function optionsDialog(title,body,items=[]){
 const dialog=document.createElement('dialog');dialog.className='vmodal';
 dialog.innerHTML='<div class="handle"></div><header><h2>'+esc(title)+'</h2><button aria-label="Close" data-close>×</button></header>'+(body?'<p>'+esc(body)+'</p>':'')+items.map(([id,label])=>vRow(id,'right',label)).join('');
 dialog.querySelector('[data-close]').onclick=()=>dialog.close();
 dialog.addEventListener('click',e=>{if(e.target.closest('[data-v]'))dialog.close()});
 dialog.onclose=()=>dialog.remove();document.body.append(dialog);dialog.showModal();
}
function extraSettings(){
 const people=(wallet.recipients||[]).map(r=>row(r.name,r.kind,'›','recipients/'+r.id)).join('');
 const actions=(wallet.plans||[]).map(r=>row(r.name,r.kind+' · '+r.date,money(r.amount),'plans/'+r.id)).join('');
 return '<div class="sectionhead"><h2>Accounts & card</h2></div>'+row('Account label',wallet.referenceLabel||'Main account','›','reference')+row('Card label',wallet.cardLabel||wallet.name,'›','label')+row('Card status',wallet.frozen?'Frozen':'Active','›','freeze')+['AED','USD'].map(u=>row(u+' balance','Local sample balance',number(unitCash(u)),'unitBalance/'+u)).join('')+((wallet.hiddenPromos||[]).length?control('restore','Restore dismissed Home tiles','smallBtn'):'')+'<div class="sectionhead"><h2>Recipients</h2>'+btn('Add recipient','recipients/new','smallBtn')+'</div>'+people+'<div class="sectionhead"><h2>Payment plans</h2>'+btn('Add plan','plans/new','smallBtn')+'</div>'+actions;
}
function extraFields(action,id,r){
 const unit=id||'EUR';
 switch(action){
 case 'reference':return ['Account details',input('Account label','reference',wallet.referenceLabel||'Main account','maxlength="34"')];
 case 'label':return ['Card label','<label>Card label<input name="label" maxlength="48" placeholder="'+esc(wallet.name)+'" value="'+esc(wallet.cardLabel||'')+'"></label>'];
 case 'unitBalance':return ['Edit '+unit+' balance',amountInput('Balance ('+unit+')',unitCash(unit),-999999999999)];
 case 'recipients':return [r?'Edit recipient':'Add recipient',textInput('Recipient name',r?.name||'')+select('List',['Recipient','My account'],r?.kind)+'<label>Account nickname<input name="note" maxlength="60" value="'+esc(r?.note||'')+'"></label>'];
 case 'plans':return [r?'Edit payment plan':'New payment plan',textInput('Description',r?.name||'')+select('Type',Object.keys(plans),r?.kind||viewState.planKind)+amountInput('Amount (€)',r?.amount||0,.01)+input('Date','date',r?.date||today(),'type="date"')+'<p class="sub">A plan is saved locally. It does not move your balance.</p>'];
 case 'conversion':{const sel=(key,val)=>'<label>'+key+'<select name="'+key+'">'+Object.keys(planRates).map(u=>'<option '+(u===val?'selected':'')+'>'+u+'</option>').join('')+'</select></label>';return ['Convert between balances',sel('From',unit)+sel('To',unit==='EUR'?'USD':'EUR')+amountInput('Amount to convert',0,.01)+'<p class="sub">Practice rates · 1 EUR = 1.08 USD = 3.97 AED</p>']}
 case 'fxMove':return [viewState.fxKind==='Income'?'Add money':'Send money',textInput('Description','')+amountInput('Amount ('+unit+')',0,.01)+input('Date','date',today(),'type="date"')];
 case 'invoice':return ['Upload an invoice','<label>Choose an image or PDF<input required type="file" name="invoice" accept="image/*,.pdf"></label>'+amountInput('Amount (€)',0,.01)+'<p class="sub">Saves the filename and amount in local payment plans.</p>'];
 case 'replaceCard':return ['Replace virtual card',input('New display digits','last','','pattern="[0-9]{4}" inputmode="numeric" maxlength="4"')];
 default:return null;
 }
}
function saveExtra(action,id,data,values,amount,remove){
 function move(unit,cents,kind,name,date){
 const list=unit==='EUR'?data.entries:(data.fxEntries??=[]);
 list.unshift({id:crypto.randomUUID(),name,amount:cents,date,kind,unit});
 if(unit!=='EUR'){data.currencies??={};data.currencies[unit]=(data.currencies[unit]||0)+(kind==='Income'?cents:-cents)}
 }
 switch(action){
 case 'reference':data.referenceLabel=values.reference.trim().slice(0,34);break;
 case 'label':data.cardLabel=values.label.trim();break;
 case 'unitBalance':(data.currencies??={})[id]=amount;break;
 case 'replaceCard':data.last=values.last;data.frozen=false;break;
 case 'restore':data.hiddenPromos=[];break;
 case 'dismiss':data.hiddenPromos=[...new Set([...(data.hiddenPromos||[]),id])];break;
 case 'fxMove':move(id,amount,viewState.fxKind,values.name.trim(),values.date);break;
 case 'conversion':{
 const from=values.From,to=values.To;
 if(!planRates[from]||!planRates[to]||from===to)throw Error('Choose two different currencies.');
 if(amount>unitCash(from))throw Error('This balance is too low.');
 const received=Math.round(amount*planRates[to]/planRates[from]);if(received<1)throw Error('Enter an amount large enough to convert.');
 move(from,amount,'Expense','Converted to '+to,today());move(to,received,'Income','Converted from '+from,today());break;}
 case 'invoice':(data.plans??=[]).unshift({id:crypto.randomUUID(),name:values.invoice.name.slice(0,48),kind:'Forward invoices to email',amount,date:today()});break;
 case 'recipients':case 'plans':{
 const list=data[action]??=[];const index=list.findIndex(r=>r.id===id);
 if(remove){if(index>=0)list.splice(index,1);break}
 const record={id:id==='new'?crypto.randomUUID():id,name:values.name.trim(),kind:values.kind};
 if(action==='recipients')record.note=values.note.trim();else{record.date=values.date;record.amount=amount}
 if(index>=0)list[index]=record;else list.unshift(record);break;}
 default:return false;
 }return true;
}
function openPlans(title){
 viewState.planKind=title;
 const items=(wallet.plans||[]).filter(r=>r.kind===title).map(r=>['planItem/'+r.id,r.name+' · '+money(r.amount)]);
 optionsDialog(title,items.length?'':'Your saved plans will appear here.',[['newPlan','Add '+(title==='Payment requests'?'request':'plan')],...items]);
}
function goVideo(raw){
 const [action,id]=raw.split('/');
 if(action==='cardFromHome'){viewState.cardFromHome=true;viewState.qr=false;goLook('cards');return}
 if(['home','cards','recipients','payments'].includes(action)){
  if(action==='cards'){viewState.qr=false;viewState.cardFromHome=false}
  if(action==='home')viewState.homeSlide=0;
  goLook(action);return;
 }
 if(action==='unit'){viewState.accountUnit=id;viewState.accountTab='Transactions';goLook('account');return}
 if(action==='accountTab'){viewState.accountTab=id;render();return}
 if(action==='slide'){const c=$('.vaccounts');c.scrollTo({left:id==='1'?c.children[1].offsetLeft-c.children[0].offsetLeft:0,behavior:'smooth'});return}
 if(action==='search'){viewState.searchOpen=!viewState.searchOpen;viewState.search='';render();$('#vsearch')?.focus();return}
 if(action==='scope'){viewState.recipientScope=id;render();return}
 if(action==='qr'||action==='cardface'){if(action==='cardface'&&!viewState.qr){edit('details');return}viewState.qr=action==='qr';render();return}
 if(action==='income'||action==='expense'){
 if(customPage==='account'&&viewState.accountUnit!=='EUR'){viewState.fxKind=action==='income'?'Income':'Expense';edit('fxMove',viewState.accountUnit)}else goLook(action);return;
 }
 if(action==='plan'){openPlans(id);return}
 if(action==='request'){viewState.planKind='Payment requests';edit('plans','new');return}
 if(action==='newPlan'){edit('plans','new');return}
 const edits={entry:'entries',person:'recipients',planItem:'plans',accountInfo:'reference',label:'label',details:'details',convert:'conversion',upload:'invoice',replace:'replaceCard',limit:'limit'};
 if(edits[action]){edit(edits[action],action==='convert'?(customPage==='account'?viewState.accountUnit:'EUR'):id);return}
 if(action==='fxentry'){const r=(wallet.fxEntries||[]).find(r=>r.id===id);if(r)optionsDialog(r.name,r.kind+' · '+number(r.amount)+' '+r.unit+' · '+r.date);return}
 if(action==='dismiss'||action==='restore'){editAction=action;recordId=id;save();return}
 if(action==='currencyBalance'){edit(viewState.accountUnit==='EUR'?'balance':'unitBalance',viewState.accountUnit);return}
 if(action==='quoteSend'){
  const euros=Number(document.querySelector('[data-calc]')?.value);
  if(!Number.isFinite(euros)||euros<=.83){optionsDialog('Transfer calculator','Enter an amount above the example fee of €0.83.');return}
  recordFlow('Expense','Record a simulated transfer');form.elements.amount.value=euros.toFixed(2);form.elements.name.value='Transfer to CAD';return;
 }
 const choices={
 returns:['Your returns','Track example investments and set your own savings goals.',[['wealth','View investments and goals']]],
 rateUpdates:['Exchange rate updates','The calculator uses the example rate shown in the recording.',[['convert','Convert between local balances']]],
 privacy:['Your wallet data','Entries stay on this device. You can protect them with a six-digit app PIN in Settings.',[['settings','Settings']]],
 wisetag:['Your Wisetag',wallet.name,[['details','Edit cardholder']]],
 more:['Do more','',[['settings','Settings'],['wealth','Wealth & goals'],['unit/EUR','Main account'],['activity','All activity']]],
 cardPlus:['Your card','This wallet has one virtual card.',[['details','Edit card details'],['label','Change card label']]],
 cardControls:['Card controls','',[['freeze',wallet.frozen?'Unfreeze card':'Freeze card'],['limit','Spending limit'],['cardCode','Show virtual PIN']]],
 travel:['Travel hub','Plan your travel spending.',[['convert','Convert balances'],['limit','Spending limit']]],
 invite:['Invite','Add someone to your local recipient list.',[['person/new','Add recipient']]],
 scan:['Scan to pay','QR payments in this wallet are simulated.',[['expense','Record a payment']]],
 qrHelp:['QR payments','Choose Scan to record an example payment in your wallet.',[['scan','Scan']]],
 unblock:['Unblock PIN','Your virtual card PIN is available under Show PIN.',[['details','Change virtual PIN']]],
 activate:['Card activation','Your practice card is active on this device.',[['details','Card details']]],
 watch:['Add to Apple Watch','Apple Pay and Apple Watch provisioning require an eligible card from its issuer.',[]],
 refer:['Earn €100','This is a sample referral offer in your personal wallet.',[]]
 };
 if(choices[action]){optionsDialog(...choices[action]);return}
 goLook(action);
}
document.addEventListener('click',e=>{const el=e.target.closest('[data-v]');if(el&&!busy&&wallet)goVideo(el.dataset.v)});
