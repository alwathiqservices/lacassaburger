/**
 * script.js — صفحة استقبال لاكاسا برجر.
 * لا يوجد أي منطق طلبات أو سلة هنا؛ هذه صفحة روابط فقط.
 */
(function(){
  "use strict";

  const el = (id) => document.getElementById(id);

  const menuBtn        = el("menuBtn");
  const installBtn     = el("installBtn");
  const iosSheet       = el("iosSheet");
  const iosSheetOverlay= el("iosSheetOverlay");
  const iosSheetClose  = el("iosSheetClose");
  const toastEl        = el("toast");

  function showToast(msg){
    toastEl.textContent = msg;
    toastEl.classList.add("show");
    clearTimeout(showToast._t);
    showToast._t = setTimeout(()=> toastEl.classList.remove("show"), 2600);
  }

  /* ---------------------------------------------------------
     زر المنيو: ينتقل لمشروع مستقل (lacasanew) في نفس النافذة.
     إن لم يوجد اتصال بالإنترنت، نمنع الانتقال لرابط ميت
     ونوضّح أن فتح المنيو يحتاج اتصالاً (الصفحة الحالية فقط
     تعمل دون إنترنت، أما المنيو فمشروع خارجي منفصل).
     --------------------------------------------------------- */
  menuBtn.addEventListener("click", (e)=>{
    if(!navigator.onLine){
      e.preventDefault();
      showToast("فتح المنيو يحتاج اتصالاً بالإنترنت");
    }
    // إن كان متصلاً: لا شيء إضافي، الرابط العادي (بدون target) يفتح في نفس النافذة
  });

  /* ---------------------------------------------------------
     هل الصفحة تعمل حالياً بوضع "مثبّت على الشاشة الرئيسية"؟
     --------------------------------------------------------- */
  function isStandalone(){
    return window.matchMedia("(display-mode: standalone)").matches ||
           window.navigator.standalone === true;
  }

  function isIOS(){
    const ua = window.navigator.userAgent || "";
    const iOSDevice = /iPad|iPhone|iPod/.test(ua);
    // iPadOS 13+ يُعرّف نفسه كـ Mac لكنه يدعم اللمس
    const iPadOS13 = navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
    return iOSDevice || iPadOS13;
  }

  let deferredPrompt = null;

  // Chrome/Edge/Android: يوفر المتصفح حدث تثبيت فعلي
  window.addEventListener("beforeinstallprompt", (e)=>{
    e.preventDefault();
    deferredPrompt = e;
    if(!isStandalone()) installBtn.hidden = false;
  });

  window.addEventListener("appinstalled", ()=>{
    installBtn.hidden = true;
    deferredPrompt = null;
  });

  function openIosSheet(){
    iosSheetOverlay.classList.add("show");
    iosSheet.classList.add("open");
  }
  function closeIosSheet(){
    iosSheetOverlay.classList.remove("show");
    iosSheet.classList.remove("open");
  }
  iosSheetClose.addEventListener("click", closeIosSheet);
  iosSheetOverlay.addEventListener("click", closeIosSheet);

  installBtn.addEventListener("click", async ()=>{
    if(deferredPrompt){
      deferredPrompt.prompt();
      try{ await deferredPrompt.userChoice; }catch(e){ /* ignore */ }
      deferredPrompt = null;
      installBtn.hidden = true;
      return;
    }
    if(isIOS()){
      openIosSheet();
      return;
    }
    // لا حدث تثبيت متاح ولا iOS: نكتفي بإخفاء الزر لاحقاً، لا ندّعي تثبيتاً تلقائياً
    showToast("أضف الصفحة يدوياً من قائمة المتصفح للشاشة الرئيسية");
  });

  document.addEventListener("DOMContentLoaded", ()=>{
    // إن كانت الصفحة تعمل بالفعل كتطبيق مثبّت، لا داعي لعرض خيار الإضافة إطلاقاً
    if(isStandalone()){
      installBtn.hidden = true;
    } else if(isIOS()){
      // على iOS لا يوجد حدث beforeinstallprompt؛ نعرض الزر مباشرة (يفتح الإرشاد عند الضغط)
      installBtn.hidden = false;
    }
  });

  /* ---------------------------------------------------------
     تسجيل Service Worker — محصور بنطاق هذا المشروع فقط
     --------------------------------------------------------- */
  if("serviceWorker" in navigator){
    window.addEventListener("load", ()=>{
      navigator.serviceWorker
        .register("/lacassaburger/sw.js", { scope: "/lacassaburger/" })
        .catch(()=>{ /* تجاهل بصمت — لا نمنع استخدام الصفحة إن تعذّر */ });
    });
  }

})();
