// 師父講解科判 service worker（由 師父科判網頁.py 產生，版本 da3106893d）
const CACHE = "kepan-da3106893d";
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
  // 頁面與圖示：先用快取秒開，背景再更新
  e.respondWith(caches.open(CACHE).then(c => c.match(e.request, {ignoreSearch: true}).then(hit => {
    const net = fetch(e.request).then(res => { if (res.ok) c.put(e.request, res.clone()); return res; }).catch(() => hit);
    return hit || net;
  })));
});
