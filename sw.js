const CACHE='mural-trace-v5-3-1-full-frame';
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(c=>c.addAll(['./','./index.html','./style.css','./app.js','./browser-vtracer.js','./vendor/vtracer/index.js','./vendor/vtracer/worker.js','./vendor/vtracer/vtracer_bg.wasm']))));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k))))));
self.addEventListener('fetch',event=>{if(event.request.method==='GET'&&new URL(event.request.url).origin===location.origin)event.respondWith(caches.match(event.request).then(c=>c||fetch(event.request)))});
