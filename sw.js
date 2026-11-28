const base=new URL('./',self.location.href).href;
const prefix='wise-wallet:'+base+':';
const version=prefix+'14-face-id-backdrop';
const shell=['./','index.html','install.html','install.webmanifest','manifest.webmanifest','install-identity.js','video.js','wallet-controls.js','appearance.js','app.js','mobile.js','biometrics.js','style.css','video.css','mobile.css','inter-latin.woff2','icon.svg','icon.png','personal-layout-v3.bin'];
self.addEventListener('install',event=>event.waitUntil((async()=>{
 const cache=await caches.open(version);
 await cache.addAll(shell.map(f=>new Request(new URL(f,base),{cache:'reload'})));
 await self.skipWaiting();
})()));
self.addEventListener('activate',event=>event.waitUntil((async()=>{
 await Promise.all((await caches.keys()).filter(k=>k.startsWith(prefix)&&k!==version).map(k=>caches.delete(k)));
 await self.clients.claim();
})()));
self.addEventListener('fetch',event=>{
 const req=event.request,url=new URL(req.url);
 if(req.method!=='GET'||!url.href.startsWith(base))return;
 if(['personal-touch-v2.png','personal-touch.png'].some(f=>url.href===base+f)){
  event.respondWith((async()=>{const art=await caches.open('local-art:'+base);return (await art.match(base+'personal-touch-v2.png'))||(await art.match(base+'personal-touch.png'))||(await caches.match(base+'icon.png'))||fetch(req)})());return;
 }
 if(req.mode==='navigate'){
  const page=url.pathname===new URL('install.html',base).pathname?'install.html':'index.html';
  event.respondWith(caches.open(version).then(async c=>(await c.match(base+page))||fetch(req)));return;
 }
 event.respondWith(caches.open(version).then(async c=>(await c.match(req))||fetch(req)));
});
