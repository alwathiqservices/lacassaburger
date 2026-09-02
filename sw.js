/**
 * sw.js — خاص بمشروع "لاكاسا برجر" (صفحة الاستقبال) فقط.
 * نطاق هذا الملف محصور بـ /lacassaburger/ (يُحدَّد عند التسجيل في script.js).
 *
 * قواعد صارمة لعدم التعارض مع مشاريع أخرى تحت نفس النطاق (alwathiqservices.github.io):
 * 1) اسم الكاش يبدأ دائماً بالبادئة الفريدة CACHE_PREFIX الخاصة بهذا المشروع فقط.
 * 2) عند التنظيف، لا يُحذف إلا الكاش الذي يحمل هذه البادئة تحديداً — أي كاش آخر
 *    (تابع لمشروع lacasanew أو غيره) يبقى دون أي مساس.
 * 3) لا اعتراض إلا لطلبات ضمن نفس نطاق هذا المشروع (SCOPE_PATH)؛ أي طلب آخر
 *    (المنيو الخارجي، روابط التواصل، خطوط/أيقونات خارجية) يمر مباشرة للشبكة.
 */
const CACHE_PREFIX = "lacassaburger-shell-";
const CACHE_VERSION = "v1";
const CACHE_NAME = CACHE_PREFIX + CACHE_VERSION;
const SCOPE_PATH = "/lacassaburger/";

const CORE_ASSETS = [
  SCOPE_PATH,
  SCOPE_PATH + "index.html",
  SCOPE_PATH + "style.css",
  SCOPE_PATH + "script.js",
  SCOPE_PATH + "manifest.webmanifest",
  SCOPE_PATH + "assets/images/logo.png",
  SCOPE_PATH + "assets/images/burger-hero.png",
  SCOPE_PATH + "assets/icons/icon-192.png",
  SCOPE_PATH + "assets/icons/icon-512.png",
  SCOPE_PATH + "assets/icons/apple-touch-icon-180.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(CORE_ASSETS))
      .catch(() => { /* تجاهل أي ملف يتعذر تخزينه دون إيقاف التثبيت */ })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k.startsWith(CACHE_PREFIX) && k !== CACHE_NAME) // فقط كاش هذا المشروع القديم
          .map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);

  // لا نعترض إلا طلبات ضمن نطاق هذا المشروع تحديداً (نفس الأصل + نفس المسار الفرعي)
  const isOwnScope = url.origin === self.location.origin && url.pathname.startsWith(SCOPE_PATH);
  if (!isOwnScope) return; // أي شيء آخر (المنيو الخارجي، فيسبوك/إنستغرام/تيك توك، خطوط CDN...) يمر للشبكة مباشرة

  event.respondWith(
    caches.match(req).then((cached) => {
      const network = fetch(req)
        .then((res) => {
          if (res && res.ok) {
            caches.open(CACHE_NAME).then((cache) => cache.put(req, res.clone()));
          }
          return res;
        })
        .catch(() => cached); // بدون إنترنت: نعتمد على النسخة المخزّنة إن وُجدت
      return cached || network;
    })
  );
});
