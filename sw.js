// TOPIK1671 service worker — オフライン対応
// index.htmlはネット優先(更新が自動反映)、オフライン時はキャッシュで動く
const CACHE = 'topik1671-v1';
const ASSETS = ['./', './index.html', './apple-touch-icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => Promise.allSettled(ASSETS.map(a => c.add(a))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  if (req.mode === 'navigate' || req.destination === 'document') {
    // ページ本体：ネット優先 → 失敗したらキャッシュ
    e.respondWith(
      fetch(req).then(res => {
        const cp = res.clone();
        caches.open(CACHE).then(c => { c.put('./', cp); });
        return res;
      }).catch(() =>
        caches.match('./').then(r => r || caches.match('./index.html'))
      )
    );
  } else {
    // その他（アイコン等）：キャッシュ優先
    e.respondWith(
      caches.match(req).then(r => r || fetch(req).then(res => {
        const cp = res.clone();
        caches.open(CACHE).then(c => { c.put(req, cp); });
        return res;
      }))
    );
  }
});
