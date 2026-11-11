// 師父講解科判 service worker（由 師父科判網頁.py 產生，版本 a9617d96dc）
const CACHE = "kepan-a9617d96dc";
const SHELL = ["./", "index.html", "manifest.webmanifest", "icons/icon-192.png", "icons/icon-512.png",
               "icons/maskable-512.png", "icons/apple-touch-icon.png", "icons/favicon-32.png"];
self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith("kepan-") && k !== CACHE && k !== "kepan-fonts")
    .map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const u = new URL(e.request.url);
  if (e.request.method !== "GET") return;
  if (/\.mp3$/i.test(u.pathname)) return;               // 音檔走網路（瀏覽器要分段讀）
  if (/fonts\.(googleapis|gstatic)\.com$/.test(u.hostname)) {   // 字型：有就用快取
    e.respondWith(caches.open("kepan-fonts").then(c => c.match(e.request).then(r => r || fetch(e.request).then(res => {
      c.put(e.request, res.clone()); return res; }))));
    return;
  }
  if (u.origin !== location.origin) return;
  // 頁面：有網路就拿最新版（3 秒內沒回應才用快取），沒網路用快取——改了網頁手機立刻看得到
  const isPage = e.request.mode === "navigate" || /\/$|\.html$|\.webmanifest$/.test(u.pathname);
  if (isPage) {
    e.respondWith(caches.open(CACHE).then(c => {
      const net = fetch(e.request, {cache: "no-store"}).then(res => { if (res.ok) c.put(e.request, res.clone()); return res; });
      const slow = new Promise(r => setTimeout(() => c.match(e.request, {ignoreSearch: true}).then(h => h && r(h)), 3000));
      return Promise.race([net, slow]).catch(() => c.match(e.request, {ignoreSearch: true}));
    }));
    return;
  }
  // 圖示、投影片圖：先用快取，背景再更新
  e.respondWith(caches.open(CACHE).then(c => c.match(e.request, {ignoreSearch: true}).then(hit => {
    const net = fetch(e.request).then(res => { if (res.ok) c.put(e.request, res.clone()); return res; }).catch(() => hit);
    return hit || net;
  })));
});
