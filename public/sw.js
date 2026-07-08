// EduConnect service worker — суулгах боломж + энгийн offline fallback
const CACHE = "educonnect-v1";

self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  // Зөвхөн ижил origin-ийн GET (API нь өөр origin тул хүрэхгүй — хуучин дата эрсдэлгүй)
  if (req.method !== "GET") return;
  if (new URL(req.url).origin !== self.location.origin) return;

  // Network-first: шинэ агуулга эхэнд, оффлайн үед кэшнээс
  event.respondWith(
    fetch(req)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
        return res;
      })
      .catch(() => caches.match(req)),
  );
});
