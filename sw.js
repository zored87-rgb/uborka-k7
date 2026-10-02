const C="uborka-v1";
const CORE=["./","./index.html","./manifest.webmanifest","./icon-180.png","./icon-192.png","./icon-512.png"];
self.addEventListener("install",e=>{e.waitUntil(caches.open(C).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting()));});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==C).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener("fetch",e=>{
  const r=e.request; if(r.method!=="GET") return;
  if(r.mode==="navigate"){
    // network-first, but fall back to the cached copy after 3 s on a weak signal; never cache error pages
    e.respondWith(new Promise(resolve=>{
      let done=false; const finish=res=>{ if(!done&&res){done=true;resolve(res);} };
      const cached=()=>caches.match("./index.html");
      const t=setTimeout(()=>cached().then(finish),3000);
      fetch(r).then(res=>{
        clearTimeout(t);
        if(res.ok){const cp=res.clone(); caches.open(C).then(c=>c.put("./index.html",cp)); finish(res);}
        else cached().then(c=>finish(c||res));
      }).catch(()=>{ clearTimeout(t); cached().then(c=>finish(c||Response.error())); });
    }));
    return;
  }
  e.respondWith(caches.match(r).then(hit=>hit||fetch(r).then(res=>{ if(res.ok||res.type==="opaque"){const cp=res.clone(); caches.open(C).then(c=>c.put(r,cp));} return res; })));
});
