const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const http=require('node:http');
const crypto=require('node:crypto');
const [dir,driver]=process.argv.slice(2);
const {webkit,chromium}=require(driver);
const walletDir=path.join(dir,'wallet');
const dataUri='data:image/png;base64,'+fs.readFileSync(path.join(walletDir,'icon.png')).toString('base64');
const pack={format:'personal-wallet-2',artRevision:3,icon:dataUri,film:Object.fromEntries(['card','lock','explore','partners','launchMark','launchRibbon','travelHeadline'].map(k=>[k,dataUri]))};
const key=crypto.randomBytes(32),iv=crypto.randomBytes(12),aes=crypto.createCipheriv('aes-256-gcm',key,iv);
fs.writeFileSync(path.join(walletDir,'personal-layout-v3.bin'),Buffer.concat([iv,aes.update(JSON.stringify(pack)),aes.final(),aes.getAuthTag()]));
const types={'.js':'application/javascript','.css':'text/css','.html':'text/html','.webmanifest':'application/manifest+json','.png':'image/png','.svg':'image/svg+xml','.woff2':'font/woff2'};
let originAvailable=true;
const srv=http.createServer((req,res)=>{
 if(!originAvailable){req.socket.destroy();return}
 const pathname=new URL(req.url,'http://localhost').pathname;
 const file=path.join(dir,pathname.endsWith('/')?pathname+'index.html':pathname);
 if(!fs.existsSync(file)){res.writeHead(404);res.end();return}
 res.setHeader('Content-Type',types[path.extname(file)]||'application/octet-stream');fs.createReadStream(file).pipe(res);
});
async function test(engine,base){
 const browser=await engine.launch({args:engine===chromium?['--no-sandbox']:[]});
 try{
 const ctx=await browser.newContext({viewport:{width:393,height:852},hasTouch:true,isMobile:true});
 const page=await ctx.newPage(),errors=[];
 await page.addInitScript(()=>{
  window.launchedAnimations=[];
  document.addEventListener('animationstart',e=>window.launchedAnimations.push(e.animationName));
 });
 page.on('pageerror',e=>errors.push(e.message));
 page.on('dialog',async d=>{errors.push(d.message());await d.accept()});
 const url=base+'install.html#look='+key.toString('base64url');
 const click=sel=>page.locator(sel).first().click({timeout:6000});
 const view=id=>click('[data-v="'+id+'"]');
 const edit=async(selector,value)=>page.locator('#editor '+selector).fill(value);
 const save=async()=>{await click('#save');await page.locator('#sheet').waitFor({state:'hidden'})};
 const expectText=async(sel,part)=>{await page.waitForFunction(({sel,part})=>document.querySelector(sel)?.textContent.includes(part),{sel,part},{timeout:7000})};
 await page.goto(url);
 await expectText('.vbalance','130.38 EUR');
 await page.waitForFunction(()=>!document.documentElement.classList.contains('wallet-opening'));
 assert(await page.evaluate(()=>window.launchedAnimations.includes('launch-ribbon-rise')&&window.launchedAnimations.includes('launch-crossfade')));
 assert(await page.evaluate(async()=>{
  await document.fonts.ready;
  return Array.from(document.fonts).some(f=>f.family.includes('Wallet Inter')&&f.status==='loaded')&&getComputedStyle(document.querySelector('.vbalance strong')).fontFamily.includes('Wallet Inter');
 }));
 const zoom=await page.evaluate(()=>{
  const allowed=count=>{const e=new Event('touchmove',{bubbles:true,cancelable:true});Object.defineProperty(e,'touches',{value:Array(count).fill({})});return document.body.dispatchEvent(e)};
  return [document.querySelector('meta[name=viewport]').content.includes('user-scalable=no'),allowed(1),allowed(2),document.body.dispatchEvent(new Event('gesturestart',{bubbles:true,cancelable:true})),visualViewport.scale];
 });
 assert.deepEqual(zoom,[true,true,false,false,1]);
 await page.waitForFunction(()=>!!navigator.serviceWorker.controller);
 await page.waitForFunction(()=>document.querySelector('link[rel=apple-touch-icon]').href.startsWith('data:image/png;base64,'));
 const installed=await page.evaluate(async()=>{
  const manifest=await (await fetch(document.querySelector('link[rel=manifest]').href)).json();
  const icon=await fetch(document.querySelector('link[rel=apple-touch-icon]').href);
  const bytes=Array.from(new Uint8Array(await icon.arrayBuffer()));
  return {manifest,bytes};
 });
 assert.equal(installed.manifest.start_url,url);
 assert.equal(installed.manifest.id,base);
 assert.equal(installed.manifest.display,'standalone');
 assert.deepEqual(Buffer.from(installed.bytes),fs.readFileSync(path.join(walletDir,'icon.png')));
 await view('settings');await click('[data-act="balance"]');await edit('[name=amount]','7500,37');await save();
 await click('[data-tab="Wallet"]');await expectText('.vbalance','7,500.37 EUR');
 await view('cards');await view('freeze');await expectText('.vholder + div','Unfreeze card');
 await view('cardCode');await expectText('.notice','0000');await click('.notice button');
 await view('qr');await expectText('.v-cards h1','Pay with QR code');await view('cardface');await expectText('.v-cards h1','Cards');
 await view('recipients');await page.locator('.wallet-load-track').waitFor();
 await view('payments');await view('recipients');await page.locator('.v-recipients[aria-busy=true]').waitFor();
 await view('person/new');await edit('[name=name]','Test recipient');await save();await view('search');
 await page.locator('#vsearch').fill('Test recipient');await expectText('.v-recipients','Test recipient');
 assert.equal(await page.locator('.v-recipients .vrow').count(),2);
 await view('payments');await view('request');await edit('[name=name]','Practice request');await edit('[name=amount]','22.50');await save();
 await view('plan/Payment requests');await expectText('.vmodal','Practice request');await click('.vmodal [data-close]');
 await view('home');await view('unit/EUR');await expectText('.vacchero','7,500.37 EUR');await view('convert');
 await edit('[name=amount]','100');await save();await expectText('.vacchero','7,400.37 EUR');
 await view('home');await view('unit/USD');await expectText('.vacchero','108.00 USD');await view('home');
 await view('hide');await expectText('.vbalance','••••');await view('hide');
 await view('dismiss/schedule');await page.locator('.vschedule').waitFor({state:'hidden'});
 originAvailable=false;await page.reload();await expectText('.vbalance','7,500.37 EUR');
 await view('cards');await expectText('.vcardactions','Unfreeze card');
 originAvailable=true;
 const fresh=await browser.newContext({viewport:{width:320,height:650},isMobile:true,reducedMotion:'reduce'});
 const second=await fresh.newPage();await second.goto(installed.manifest.start_url);await second.locator('.v-home').waitFor();
 await second.locator('nav [data-v=cards]').click();await second.locator('.v-cards').waitFor();assert.equal(await second.locator('.wallet-load-track').count(),0);
 assert(await second.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 await fresh.close();
 const migrated=await browser.newContext({reducedMotion:'reduce'});
 const existing=await migrated.newPage();
 await existing.addInitScript(({pack,key})=>{
  const prefix='wallet-appearance-v1:/wallet/';
  const legacy={...pack};delete legacy.artRevision;
  localStorage.setItem(prefix,JSON.stringify(legacy));localStorage.setItem(prefix+':activation',key);
  localStorage.setItem('wise-wallet:v1:/wallet/',JSON.stringify({data:{name:'Demo holder',last:'4444',opening:654321,entries:[],goals:[],holdings:[],limit:100000}}));
 },{pack,key:key.toString('base64url')});
 await existing.goto(base);await existing.waitForFunction(()=>JSON.parse(localStorage.getItem('wallet-appearance-v1:/wallet/')).artRevision===3);
 assert.match(await existing.locator('.vbalance').innerText(),/6,543.21 EUR/);await migrated.close();
 await view('home');await view('settings');await click('[data-act="pin"]');await edit('[name=pin]','123456');await edit('[name=confirm]','123456');await save();
 await page.addInitScript(()=>{
  const secret=new Uint8Array(32).fill(17);
  const response=()=>({rawId:Uint8Array.of(1,2,3).buffer,getClientExtensionResults:()=>({prf:{enabled:true,results:{first:secret.buffer}}})});
  Object.defineProperty(window,'PublicKeyCredential',{configurable:true,value:function(){}});
  Object.defineProperty(navigator,'credentials',{configurable:true,value:{create:async()=>response(),get:async()=>response()}});
 });
 await page.reload();await page.locator('#unlock [name=pin]').fill('123456');await click('#unlock button');
 await view('settings');await click('[data-act="face"]');await edit('[name=current]','123456');await save();
 assert(await page.evaluate(()=>!!JSON.parse(localStorage.getItem('wise-wallet:v1:/wallet/')).bio?.wrapped));
 await page.reload();await expectText('.vbalance','7,500.37 EUR');
 await view('settings');await click('[data-act="face"]');await edit('[name=current]','123456');await save();
 await page.reload();
 await page.locator('#unlock [name=pin]').fill('123456');assert.equal(await page.locator('#unlock [name=pin]').inputValue(),'123456');
 await click('#unlock button');await expectText('.vbalance','7,500.37 EUR');
 await page.waitForFunction(()=>!document.documentElement.classList.contains('wallet-opening'));
 assert.deepEqual(errors,[]);
 console.log(engine.name()+' passed installation assets, fresh launch, balance, freeze, QR switching, recipients, requests, currency conversion, offline reload and PIN persistence');
 }finally{await browser.close()}
}
(async()=>{await new Promise(r=>srv.listen(0,'127.0.0.1',r));try{
 const base='http://127.0.0.1:'+srv.address().port+'/wallet/';
 for(const engine of [chromium,webkit])await test(engine,base);
 }finally{srv.close()}})().catch(e=>{console.error(e);process.exitCode=1});
