const base = new URL('./',self.location.href).href;
const prefix = 'wise-wallet:' + base + ':';
const cacheName = prefix + '1';
const files = ['./','index.html','style.css','app.js','icon.svg','icon.png','manifest.webmanifest'];
self.addEventListener('install', event => event.waitUntil(caches.open(cacheName).then(cache => cache.addAll(files)).then(()=>self.skipWaiting())));
self.addEventListener('activate', event => event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith(prefix)&&k!==cacheName).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch', event=>{
  if(event.request.method!=='GET'||!event.request.url.startsWith(base))return;
  event.respondWith(caches.open(cacheName).then(async cache => (await cache.match(event.request.mode==='navigate'?new URL('index.html',base).href:event.request))||fetch(event.request)));
});
