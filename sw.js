const base = new URL('./',self.location.href).href;
const prefix = 'wise-wallet:' + base + ':';
const cacheName = prefix + '2';
const files = ['./','index.html','style.css','appearance.css','appearance.js','app.js','icon.svg','icon.png','manifest.webmanifest'];
self.addEventListener('install', event => event.waitUntil(caches.open(cacheName).then(cache => cache.addAll(files)).then(()=>self.skipWaiting())));
self.addEventListener('activate', event => event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith(prefix)&&k!==cacheName).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch', event=>{
  if(event.request.method!=='GET'||!event.request.url.startsWith(base))return;
  if(event.request.url===base+'personal-touch.png'){
    event.respondWith(caches.open('local-art:'+base).then(async c=>(await c.match(event.request))||(await caches.match(base+'icon.png'))||fetch(base+'icon.png')));
    return;
  }
  event.respondWith(caches.open(cacheName).then(async cache => (await cache.match(event.request.mode==='navigate'?new URL('index.html',base).href:event.request))||fetch(event.request)));
});
