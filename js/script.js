// --- 0. Модалка з погодженням ---
const config = { saveConsent: true, storageKey: 'mySiteUserConsent' };
const modal = document.getElementById('customModalWrapper');
const content = document.getElementById('customSiteContent');






// --- 0.1 Паралакс для мобільних пристроїв ---

// --- Паралакс для мобільних пристроїв ---
document.addEventListener('DOMContentLoaded', () => {

  const hero = document.querySelector('.top_content_paralax_img');
  const bg = hero?.querySelector('.parallax-bg');

  if (!hero || !bg) return;

  let ticking = false;
  let current = 0;
  let target = 0;

  const isMobileMode = () =>
    window.matchMedia('(max-width:1024px)').matches;

  function updateParallax() {

    const rect = hero.getBoundingClientRect();

    const viewportHeight = window.visualViewport
      ? window.visualViewport.height
      : window.innerHeight;

    // прогрес секції (0 → 1)
    target = Math.min(
      1,
      Math.max(
        0,
        (viewportHeight - rect.top) / (viewportHeight + rect.height)
      )
    );

    ticking = false;
  }

  function animate() {

    // плавність (easing)
    current += (target - current) * 0.08;

    // рух тільки вниз
    const offset = current * 60; // сила паралаксу

    bg.style.transform = `translate3d(0, ${offset}px, 0)`;

    requestAnimationFrame(animate);
  }

  function onScroll() {
    if (ticking) return;
    requestAnimationFrame(updateParallax);
    ticking = true;
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', updateParallax);
  window.addEventListener('orientationchange', updateParallax);

  updateParallax();
  animate();
});




//const track=document.getElementById('track');track.innerHTML+=track.innerHTML;
// --- Блокування взаємодії з сайтом ---
function blockSiteInteraction() {
  document.body.style.pointerEvents = 'none';
  document.body.style.userSelect = 'none';

  // Дозволяємо взаємодію всередині модалки та будь-яких модалок
  document.querySelectorAll('[data-modal]').forEach(m => {
    m.style.pointerEvents = 'auto';
    m.style.userSelect = 'auto';
  });

  window.addEventListener('keydown', blockInteraction, true);
  window.addEventListener('click', blockInteraction, true);
  window.addEventListener('contextmenu', blockInteraction, true);
}

function blockInteraction(e) {
  if (e.target.closest('[data-modal]')) return; // дозволяємо клік у модалках
  e.stopPropagation();
  e.preventDefault();
}

// --- Розблокування сайту ---
function enableSiteInteraction() {
  document.body.style.pointerEvents = '';
  document.body.style.userSelect = '';
  window.removeEventListener('keydown', blockInteraction, true);
  window.removeEventListener('click', blockInteraction, true);
  window.removeEventListener('contextmenu', blockInteraction, true);
}

// --- Запуск при завантаженні ---
window.addEventListener('load', function () {
  if (config.saveConsent && localStorage.getItem(config.storageKey) === 'true') {
    if (modal) modal.style.display = 'none';
    if (content) content.classList.remove('custom-blocked');
    enableSiteInteraction();
    return;
  }
  if (content) content.classList.add('custom-blocked');
  if (modal) modal.style.display = 'flex';
  blockSiteInteraction();
});

// --- Кнопки модалки ---
function customAcceptTerms() {
  if (config.saveConsent) localStorage.setItem(config.storageKey, 'true');
  if (modal) modal.style.display = 'none';
  if (content) content.classList.remove('custom-blocked');
  enableSiteInteraction();
}

function customDenyAccess() {
  alert("Ви не погодились. Доступ заборонено.");
}

// --- 1. Універсальні модалки ---
(function () {
  const modalTriggers = document.querySelectorAll('[data-modal-open]');
  const modals = document.querySelectorAll('[data-modal]');

  // Відкриття модалки
  modalTriggers.forEach(trigger => {
    const targetId = trigger.dataset.modalOpen;
    const modal = document.getElementById(targetId);
    if (!modal) return;

    trigger.addEventListener('click', e => {
      e.preventDefault();
      modal.classList.add('active');
      document.body.style.overflow = 'hidden';
    });
  });

  // Закриття модалки
  modals.forEach(modal => {
    const closeBtn = modal.querySelector('[data-modal-close]');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => closeModal(modal));
    }

    modal.addEventListener('click', e => {
      if (e.target === modal) closeModal(modal);
    });
  });

  // Закриття клавішею Escape
  document.addEventListener('keydown', e => {
    if (e.key === "Escape") {
      modals.forEach(modal => {
        if (modal.classList.contains('active')) closeModal(modal);
      });
    }
  });

  function closeModal(modal) {
    modal.classList.remove('active');

    // Перевіряємо, чи є ще відкриті модалки
    const anyActive = Array.from(modals).some(m => m.classList.contains('active'));
    if (!anyActive) document.body.style.overflow = '';
  }
})();

// 1. Універсальні модалки
(function () {
  const modalTriggers = document.querySelectorAll('[data-modal-open]');
  const modals = document.querySelectorAll('[data-modal]');

  // Відкриття модалки
  modalTriggers.forEach(trigger => {
    const targetId = trigger.dataset.modalOpen;
    const modal = document.getElementById(targetId);
    if (!modal) return;

    trigger.addEventListener('click', e => {
      e.preventDefault();
      modal.classList.add('active');
      document.body.style.overflow = 'hidden';
    });
  });

  // Закриття модалки
  modals.forEach(modal => {
    const closeBtn = modal.querySelector('[data-modal-close]');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => closeModal(modal));
    }

    modal.addEventListener('click', e => {
      if (e.target === modal) closeModal(modal);
    });
  });

  // Закриття клавішею Escape
  document.addEventListener('keydown', e => {
    if (e.key === "Escape") {
      modals.forEach(modal => {
        if (modal.classList.contains('active')) closeModal(modal);
      });
    }
  });

  function closeModal(modal) {
    modal.classList.remove('active');

    // Перевіряємо, чи є ще відкриті модалки
    const anyActive = Array.from(modals).some(m => m.classList.contains('active'));
    if (!anyActive) document.body.style.overflow = '';
  }
})();



const topContact = document.querySelector('.top-contact');


window.addEventListener('scroll', () => {
  const scrollY = window.scrollY;

  if (scrollY > 0) {
    // ховаємо верхню контактну панель
    topContact.classList.add('hidden');

    // робимо navbar залипаючим
    navbar.classList.add('sticky');
  } else {
    // якщо на самому верху
    topContact.classList.remove('hidden');
    navbar.classList.remove('sticky');
  }
});

// 2. Бургер-меню
const burger = document.getElementById("burger"),
      menu = document.getElementById("menu"),
      navbar = document.getElementById("navbar"),
      scrollTopBtn = document.getElementById("scrollTopBtn");

burger.addEventListener("click", e => {
  e.stopPropagation();
  const open = burger.classList.toggle("open");
  menu.classList.toggle("open");
  burger.setAttribute("aria-expanded", open);
});

menu.addEventListener("click", e => e.stopPropagation());

menu.querySelectorAll("a").forEach(link => 
  link.addEventListener("click", () => {
    burger.classList.remove("open");
    menu.classList.remove("open");
    burger.setAttribute("aria-expanded", false);
  })
);

document.addEventListener("click", e => {
  if (!menu.classList.contains("open")) return;
  if (e.target.closest('#menu') || e.target.closest('#burger') || e.target.closest('.carousel-btn')) return;
  burger.classList.remove("open");
  menu.classList.remove("open");
  burger.setAttribute("aria-expanded", false);
});

window.addEventListener('scroll', () => {
  const scrollY = window.scrollY;

  if (scrollY > 0) {
    topContact.classList.add('hidden');   // ховаємо верхню панель
    navbar.classList.add('sticky');       // navbar стає залипаючим
  } else {
    topContact.classList.remove('hidden'); // показуємо верхню панель
    navbar.classList.remove('sticky');     // navbar повертається в початкову позицію
  }
});

// 3. Скрол ефекти
window.addEventListener("scroll", () => {
  navbar.classList.toggle("scrolled", window.scrollY > 20);
  scrollTopBtn.classList.toggle("show", window.scrollY > 300);
});

scrollTopBtn.addEventListener("click", () => 
  window.scrollTo({ top: 0, behavior: "smooth" })
);

// 4. Карусель
const carousel = document.getElementById('carousel'),
      prevBtn = document.querySelector('.carousel-btn.prev'),
      nextBtn = document.querySelector('.carousel-btn.next');
let index = 0;

function getVisibleCount() {
  if (window.innerWidth <= 768) return 1;
  if (window.innerWidth <= 1024) return 2;
  return 3;
}

function updateCarousel() {
  const item = carousel.querySelector('.item');
  if (!item) return;
  const gap = 10, itemWidth = item.offsetWidth + gap;
  carousel.style.transform = `translateX(-${index * itemWidth}px)`;
}

prevBtn.addEventListener('click', e => {
  e.stopPropagation();
  const visible = getVisibleCount();
  if (index > 0) index--;
  else index = carousel.children.length - visible;
  updateCarousel();
});

nextBtn.addEventListener('click', e => {
  e.stopPropagation();
  const visible = getVisibleCount();
  if (index < carousel.children.length - visible) index++;
  else index = 0;
  updateCarousel();
});

// Автоскрол
let autoScrollTimer = setInterval(() => {
  const visible = getVisibleCount();
  if (index < carousel.children.length - visible) index++;
  else index = 0;
  updateCarousel();
}, 3000);

carousel.addEventListener('mouseenter', () => clearInterval(autoScrollTimer));
carousel.addEventListener('mouseleave', () => {
  autoScrollTimer = setInterval(() => {
    const visible = getVisibleCount();
    if (index < carousel.children.length - visible) index++;
    else index = 0;
    updateCarousel();
  }, 3000);
});

window.addEventListener('resize', updateCarousel);
window.addEventListener('load', updateCarousel);

// 5. Scroll reveal
const reveals = document.querySelectorAll('.scroll-reveal');
function revealOnScroll() {
  const windowHeight = window.innerHeight;
  reveals.forEach(el => {
    const revealTop = el.getBoundingClientRect().top;
    if (revealTop < windowHeight - 100) el.classList.add('visible');
  });
}
window.addEventListener('load', revealOnScroll);

// 6. Аккордіон
const accordions = document.querySelectorAll('.accordion-item');
accordions.forEach(item => {
  const link = item.querySelector('.accordion-link'),
        answer = item.querySelector('.answer');

  link.addEventListener('click', e => {
    e.preventDefault();
    const isActive = item.classList.contains('active');

    // Закриваємо всі відкриті
    accordions.forEach(open => {
      if (open !== item) {
        open.classList.remove('active');
        open.querySelector('.answer').style.maxHeight = null;
      }
    });

    // Відкриваємо/закриваємо поточний
    if (isActive) {
      item.classList.remove('active');
      answer.style.maxHeight = null;
    } else {
      item.classList.add('active');
      answer.style.maxHeight = answer.scrollHeight + 'px';
    }
  });
});



(function(){

const galleries={

interior:[
"image/interier0.png",
"image/interier1.png",
"image/interier2.png",
"image/interier3.png",
"image/interier4.png",
"image/interier5.png"

],

tiles:[
"image/plytka.webp",
"image/plytka0.jpg"
],

wood:[
"image/stolar1.webp",
"image/stolar2.webp",
"image/stolar3.webp",
"image/stolar4.webp"
],

electric:[
"image/elektrika0.jpg"
],

brukiwka:[
"image/brukiwka0.jpg"
],

paint:[
"image/spaklowka0.png",
"image/spaklowka1.png",
"image/spaklowka2.png",
"image/spaklowka3.png",
"image/spaklowka4.png"
]

};


const viewer=document.getElementById("galleryViewer");
const image=document.querySelector(".gallery-image");
const close=document.querySelector(".gallery-close");
const next=document.querySelector(".gallery-next");
const prev=document.querySelector(".gallery-prev");

let current=[];
let index=0;


document.querySelectorAll(".custom-btn-view").forEach(btn=>{

btn.addEventListener("click",e=>{

e.preventDefault();

current=galleries[btn.dataset.gallery]||[];

index=0;

openGallery();

});

});


function openGallery(){

if(!current.length)return;

viewer.classList.add("active");

showImage();

}


function showImage(){

image.src=current[index];

}


next.onclick=function(){

index++;

if(index>=current.length)index=0;

showImage();

};


prev.onclick=function(){

index--;

if(index<0)index=current.length-1;

showImage();

};


close.onclick=function(){

viewer.classList.remove("active");

};


viewer.onclick=function(e){

if(e.target===viewer){

viewer.classList.remove("active");

}

};


document.addEventListener("keydown",e=>{

if(!viewer.classList.contains("active"))return;


if(e.key==="ArrowRight")next.click();

if(e.key==="ArrowLeft")prev.click();

if(e.key==="Escape")close.click();


});


})();





// 7. Реклама Carbon Ads fallback (тільки якщо marketing = true)

function marketingEnabled() {
  const saved = localStorage.getItem("cookies_settings");
  if (!saved) return false;

  try {
    return JSON.parse(saved).marketing === true;
  } catch {
    return false;
  }
}

function loadCarbonAds() {

  const container = document.getElementById("carbon-block");

  // ❌ якщо marketing вимкнений — прибираємо і виходимо
  if (!marketingEnabled()) {
    container?.remove();
    return;
  }

  // ❗ якщо контейнера немає — нічого не робимо
  if (!container) return;

  // ❗ щоб не дублювати скрипт
  if (document.getElementById("_carbonads_js")) return;

  try {
    fetch(new Request("", { method: 'HEAD', mode: 'no-cors' }))
      .then(() => true)
      .catch(() => {
        const script = document.createElement("script");
        script.src = "//cdn.carbonads.com/carbon.js?serve=CE7DC2JW&placement=wwwcssscriptcom";
        script.id = "_carbonads_js";

        container.appendChild(script);
      });

  } catch (e) {
    console.error("Помилка реклами:", e);
  }
}

// 🔁 ініціалізація
window.addEventListener("load", loadCarbonAds);

// 🔁 якщо cookies зміняться — можна перевикликати
window.reloadCarbonAds = loadCarbonAds;

// 8. Google Analytics
window.dataLayer = window.dataLayer || [];
function gtag(){ dataLayer.push(arguments); }
gtag('js', new Date());
gtag('config', 'G-LLWL5N9CSM');

// 9. Відправка форми через API
function sendForm(event) {
  event.preventDefault();
  const form = event.target;
  if (form.username && form.username.value.trim() === "") {
    alert('Заповніть Ім\'я');
    return;
  }
  const data = Object.fromEntries(new FormData(form).entries());

  fetch('https://your-api-endpoint.example.com/api/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  .then(res => { if (!res.ok) throw new Error('Помилка'); return res.json(); })
  .then(() => { alert('Успішно!'); form.reset(); })
  .catch(err => alert('Помилка: ' + err.message));
}

// 10 Плавний скрол до всіх внутрішніх посилань
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function(e) {
    const targetId = this.getAttribute('href').slice(1);
    const targetEl = document.getElementById(targetId);
    if (!targetEl) return;

    e.preventDefault();

    // Висота верхньої контактної панелі + navbar
    const topContactHeight = document.querySelector('.top-contact')?.offsetHeight || 0;
    const navbarHeight = document.querySelector('.navbar')?.offsetHeight || 0;
    const offset = topContactHeight + navbarHeight + 10; // +10 для невеликого відступу

    const elementPosition = targetEl.getBoundingClientRect().top + window.scrollY;
    const scrollToPosition = elementPosition - offset;

    window.scrollTo({
      top: scrollToPosition,
      behavior: 'smooth'
    });
  });
});

// 11. Форма збереження коментарів у localStorage
function getRandomIP() {
  return Array(4).fill(0).map(() => Math.floor(Math.random() * 256)).join('.');
}

document.getElementById("feedbackForm").addEventListener("submit", function(e) {
  e.preventDefault();

  const fullName = this.fullName.value.trim();
  const email = this.email.value.trim();
  const message = this.message.value.trim();
  const date = new Date().toLocaleString();

  if (!fullName || !email || !message) {
    alert("Будь ласка, заповніть всі поля.");
    return;
  }

  const ip = getRandomIP();

  let comments = JSON.parse(localStorage.getItem("commentsData") || "[]");
  comments.push({
    id: Date.now(),
    fullName,
    email,
    message,
    date,
    ip
  });

  localStorage.setItem("commentsData", JSON.stringify(comments));

  alert("Дякуємо за ваш коментар!");
  this.reset();
});
// =========================
// 12. COOKIE SYSTEM (FIXED NO-SPAM VERSION)
// =========================

(function(){

const CONSENT_KEY='cookies_consent';
const STATE_KEY='cookies_settings';
const FIRST_VISIT_KEY='cookies_first_visit';
const MODAL_SHOWN_KEY='cookies_modal_shown';
const MODAL_ID='filesModal';
const FIRST_DELAY=15*60*1000; // 15 хв

const now=()=>Date.now();

function getModal(){
  return document.getElementById(MODAL_ID);
}

// =========================
// STATE
// =========================

function getState(){
  try{
    return JSON.parse(localStorage.getItem(STATE_KEY)||"{}");
  }catch{
    return {};
  }
}

function saveState(state){
  localStorage.setItem(
    STATE_KEY,
    JSON.stringify(state)
  );
}

function defaultState(){
  return{
    analytics:false,
    marketing:false
  };
}

function mergeState(partial){

  const state={
    ...defaultState(),
    ...getState(),
    ...partial
  };

  saveState(state);

  return state;
}

function markModalShown(){

  localStorage.setItem(
    MODAL_SHOWN_KEY,
    String(now())
  );

}

// =========================
// STATUS
// =========================

function isResolved(){

  const value=localStorage.getItem(
    CONSENT_KEY
  );

  return(
    value==='accepted'||
    value==='declined'
  );

}

function isDeclined(){

  return(
    localStorage.getItem(
      CONSENT_KEY
    )==='declined'
  );

}

// =========================
// MODAL CONTROL
// =========================

function openCookies(){

  if(isResolved())return;

  const modal=getModal();

  if(!modal)return;

  if(
    modal.classList.contains('active')
  ){
    return;
  }

  modal.classList.add(
    'active'
  );

  document.body.style.overflow='hidden';

  markModalShown();

}

function closeCookies(){

  const modal=getModal();

  if(!modal)return;

  modal.classList.remove(
    'active'
  );

  document.body.style.overflow='';

}

// =========================
// ACTIONS
// =========================

function acceptCookies(){

  localStorage.setItem(
    CONSENT_KEY,
    'accepted'
  );

  mergeState({
    analytics:true,
    marketing:true
  });

  markModalShown();

  closeCookies();

}

function declineCookies(){

  localStorage.setItem(
    CONSENT_KEY,
    'declined'
  );

  mergeState({
    analytics:false,
    marketing:false
  });

  markModalShown();

  closeCookies();

}

function dismissCookies(){

  markModalShown();

  closeCookies();

}

// =========================
// SAFE TIMER
// =========================

function startCookiesTimer(){

  if(isResolved())return;

  const firstVisit=Number(
    localStorage.getItem(
      FIRST_VISIT_KEY
    )||0
  );

  if(!firstVisit){

    localStorage.setItem(
      FIRST_VISIT_KEY,
      String(now())
    );

    setTimeout(()=>{

      if(!isResolved()){
        openCookies();
      }

    },FIRST_DELAY);

    return;

  }

  if(
    now()-firstVisit>=FIRST_DELAY
  ){

    if(
      localStorage.getItem(
        MODAL_SHOWN_KEY
      )
    ){
      return;
    }

    openCookies();

  }

}

// =========================
// INIT
// =========================

window.addEventListener(
  'load',
  startCookiesTimer
);

window.openCookies=openCookies;
window.closeCookies=closeCookies;
window.acceptCookies=acceptCookies;
window.declineCookies=declineCookies;
window.dismissCookies=dismissCookies;

})();

// =========================
// 13. АНАЛІТИКА ТА КЕРУВАННЯ СЕСІЯМИ (COOKIES STATE)
// =========================

(function(){

const KEY='cookies_settings';
const ANALYTICS_KEY="site_analytics_v2";
const MODAL_SHOWN_KEY='cookies_modal_shown';

let state=getDefaultState();

function getDefaultState(){

return{
  analytics:false,
  marketing:false
};

}

let analyticsData={
  visits:0,
  sessions:[],
  lastReset:Date.now()
};

let session=null;

// =========================
// АНАЛІТИКА
// =========================

function loadAnalytics(){

const saved=localStorage.getItem(
  ANALYTICS_KEY
);

if(saved){

try{

analyticsData=JSON.parse(saved);

}catch{

console.warn(
  "Помилка парсингу аналітики"
);

}

}

const DAY=24*60*60*1000;

if(
Date.now()-analyticsData.lastReset>DAY
){

analyticsData.visits=0;
analyticsData.sessions=[];
analyticsData.lastReset=Date.now();

}

startSession();
saveAnalytics();

}

function saveAnalytics(){

localStorage.setItem(
  ANALYTICS_KEY,
  JSON.stringify(analyticsData)
);

}

// =========================
// СЕСІЯ
// =========================

function startSession(){

session={
  start:Date.now(),
  end:null
};

analyticsData.visits++;

analyticsData.sessions.push(
  session
);

console.log(
  "🟢 Вхід:",
  new Date(
    session.start
  ).toLocaleString()
);

}

function endSession(){

if(!session)return;

session.end=Date.now();

const duration=Math.floor(
(
session.end-session.start
)/1000
);

console.log(
  "🔴 Вихід із сайту"
);

console.log(
  "⏱️ Тривалість:",
  duration,
  "сек"
);

saveAnalytics();

session=null;

}

// =========================
// COOKIE СИСТЕМА
// =========================

function loadCookies(){

const saved=localStorage.getItem(
  KEY
);

if(saved){

try{

state={
  ...getDefaultState(),
  ...JSON.parse(saved)
};

}catch{

console.warn(
  "Помилка парсингу cookies"
);

state=getDefaultState();

}

}else{

state=getDefaultState();

}

applyToUI();
applyServices();

}

function applyToUI(){

const analytics=document.getElementById(
  'cookie-analytics'
);

const marketing=document.getElementById(
  'cookie-marketing'
);

if(analytics){

analytics.checked=state.analytics;

}

if(marketing){

marketing.checked=state.marketing;

}

}

function saveCookies(){

state.analytics=document.getElementById(
  'cookie-analytics'
).checked;

state.marketing=document.getElementById(
  'cookie-marketing'
).checked;

localStorage.setItem(
  KEY,
  JSON.stringify(state)
);

localStorage.setItem(
  MODAL_SHOWN_KEY,
  String(Date.now())
);

applyServices();

if(state.marketing){

window.reloadCarbonAds?.();

}

closeCookies();

}

function declineCookies(){

state={
  analytics:false,
  marketing:false
};

localStorage.setItem(
  KEY,
  JSON.stringify(state)
);

localStorage.setItem(
  MODAL_SHOWN_KEY,
  String(Date.now())
);

applyToUI();
applyServices();

document
.getElementById("leftAd")
?.remove();

document
.getElementById("rightAd")
?.remove();

document
.getElementById("carbon-block")
?.remove();

closeCookies();

}

function openCookies(){

const modal=document.getElementById(
  'filesModal'
);

if(!modal)return;

modal.classList.add(
  'active'
);

document.body.style.overflow='hidden';

localStorage.setItem(
  MODAL_SHOWN_KEY,
  String(Date.now())
);

}

function closeCookies(){

const modal=document.getElementById(
  'filesModal'
);

if(!modal)return;

modal.classList.remove(
  'active'
);

document.body.style.overflow='';

}

function dismissCookies(){

localStorage.setItem(
  MODAL_SHOWN_KEY,
  String(Date.now())
);

closeCookies();

}

// =========================
// SERVICES
// =========================

function applyServices(){

if(state.analytics){

console.log(
  "📊 Аналітика: УВІМКНЕНА"
);

if(!session){

loadAnalytics();

}

}else{

console.log(
  "📊 Аналітика: ВИМКНЕНА"
);

endSession();

}

if(state.marketing){

console.log(
  "📢 Маркетинг: УВІМКНЕНИЙ"
);

window.reloadCarbonAds?.();

}

}

window.addEventListener(
"beforeunload",
()=>{

if(state?.analytics){

endSession();

}

}
);

window.addEventListener(
'load',
()=>{

loadCookies();

}
);

let analyticsDebug=false;

window.analytics=function(mode){

if(mode===true){

analyticsDebug=true;

console.log(
"🟢 DEBUG аналітики УВІМКНЕНО"
);

return;

}

if(mode===false){

analyticsDebug=false;

console.log(
"🔴 DEBUG аналітики ВИМКНЕНО"
);

return;

}

if(!analyticsDebug){

console.log(
"⚠️ DEBUG вимкнено. Використай analytics(true)"
);

return;

}

const data=analyticsData;
const now=Date.now();

console.log(
"📊 ЗВІТ:",
data.visits,
data.sessions.length
);

data.sessions.forEach((s,i)=>{

const end=s.end||now;

const duration=Math.floor(
(
end-s.start
)/1000
);

console.log(
`#${i+1}`,
duration+"s"
);

});

};

window.saveCookies=saveCookies;
window.declineCookies=declineCookies;
window.dismissCookies=dismissCookies;
window.openCookies=openCookies;

})();


// =========================
// 14. РЕКЛАМА (РОТАЦІЯ + UI)
// =========================

(function(){

const AD_ROTATION_KEY="ads_rotation_index";
const ROTATE_INTERVAL=12000;
const SHOW_AT=640;
const HIDE_AT=600;

let rotationTimer=null;
let adsVisible=false;

const ads=document.querySelectorAll(
'.floating-ad'
);

const adsData=[
{
left:{
img:"partners/Hvost.webp",
link:"#1"
},
right:{
img:"partners/iq.webp",
link:"#2"
}
},
{
left:{
img:"partners/iq.webp",
link:"#3"
},
right:{
img:"partners/Hvost.webp",
link:"#4"
}
}
];

function getCookiesState(){

try{

return JSON.parse(
localStorage.getItem(
"cookies_settings"
)||"{}"
);

}catch{

return {};

}

}

function marketingEnabled(){

return(
getCookiesState()
.marketing===true
);

}

function getIndex(){

return Number(
localStorage.getItem(
AD_ROTATION_KEY
)||0
);

}

function setIndex(i){

localStorage.setItem(
AD_ROTATION_KEY,
String(i)
);

}

function initState(){

ads.forEach(ad=>{

ad.classList.add(
'hidden'
);

ad.classList.remove(
'show'
);

});

adsVisible=false;

}

function updateAdsVisibility(){

const y=window.scrollY;

let shouldShow=
!adsVisible
?y>SHOW_AT
:y>HIDE_AT;

if(shouldShow===adsVisible){

return;

}

adsVisible=shouldShow;

ads.forEach(ad=>{

ad.classList.toggle(
'show',
shouldShow
);

ad.classList.toggle(
'hidden',
!shouldShow
);

});

}

function renderAds(){

if(!marketingEnabled()){

stopRotation();

ads.forEach(
ad=>ad.remove()
);

return;

}

const i=getIndex()%adsData.length;
const pack=adsData[i];

const leftImg=document.getElementById(
"leftAdImage"
);

const leftLink=document.getElementById(
"leftAdLink"
);

const rightImg=document.getElementById(
"rightAdImage"
);

const rightLink=document.getElementById(
"rightAdLink"
);

if(leftImg&&leftLink){

fadeSwap(
leftImg,
pack.left.img
);

leftLink.href=pack.left.link;

}

if(rightImg&&rightLink){

fadeSwap(
rightImg,
pack.right.img
);

rightLink.href=pack.right.link;

}

}

function fadeSwap(imgEl,newSrc){

if(!imgEl)return;

imgEl.classList.add(
"fade-out"
);

setTimeout(()=>{

imgEl.src=newSrc;

requestAnimationFrame(()=>{

imgEl.classList.remove(
"fade-out"
);

});

},300);

}

window.hideAd=id=>
document
.getElementById(id)
?.remove();

window.nextAd=function(){

setIndex(
getIndex()+1
);

renderAds();

};

function startRotation(){

if(!marketingEnabled()){

return;

}

stopRotation();

rotationTimer=setInterval(()=>{

setIndex(
getIndex()+1
);

renderAds();

},ROTATE_INTERVAL);

}

function stopRotation(){

clearInterval(
rotationTimer
);

rotationTimer=null;

}

window.addEventListener(
"load",
()=>{

renderAds();

initState();

startRotation();

updateAdsVisibility();

}
);

window.addEventListener(
"scroll",
()=>{

requestAnimationFrame(
updateAdsVisibility
);

}
);

})();