const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

const STORAGE = {
  popupDismissed: "sevenforks_popup_dismissed",
};

function setupYear(){
  const el = $("#year");
  if (el) el.textContent = String(new Date().getFullYear());
}

function setupHeaderElevate(){
  const header = document.querySelector("[data-elevate]");
  if (!header) return;

  const onScroll = () => {
    header.classList.toggle("is-elevated", window.scrollY > 6);
  };

  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
}

function setupMobileNav(){
  const btn = $(".nav-toggle");
  const menu = $("#navMenu");
  if (!btn || !menu) return;

  const close = () => {
    menu.classList.remove("is-open");
    btn.classList.remove("is-active");
    btn.setAttribute("aria-expanded", "false");
    document.body.style.overflow = "";
  };

  btn.addEventListener("click", () => {
    const isOpen = menu.classList.toggle("is-open");
    btn.classList.toggle("is-active");
    btn.setAttribute("aria-expanded", String(isOpen));
    document.body.style.overflow = isOpen ? "hidden" : "";
  });

  $$("a", menu).forEach((a) => a.addEventListener("click", close));

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") close();
  });

  document.addEventListener("click", (e) => {
    if (!menu.classList.contains("is-open")) return;
    const target = e.target;
    if (!(target instanceof Element)) return;
    if (menu.contains(target) || btn.contains(target)) return;
    close();
  });
}

function setupPopup(){
  const popup = document.querySelector("[data-popup]");
  if (!popup) return;

  const dismissed = localStorage.getItem(STORAGE.popupDismissed) === "1";
  if (dismissed) return;

  const closeBtns = $$('[data-popup-close]', popup);
  const close = () => {
    popup.setAttribute("hidden", "");
    localStorage.setItem(STORAGE.popupDismissed, "1");
  };

  closeBtns.forEach((b) => b.addEventListener("click", close));

  popup.addEventListener("click", (e) => {
    const target = e.target;
    if (!(target instanceof Element)) return;
    if (target === popup) close();
  });

  document.addEventListener("keydown", (e) => {
    if (!popup.hasAttribute("hidden") && e.key === "Escape") close();
  });

  window.setTimeout(() => {
    popup.removeAttribute("hidden");
  }, 900);
}

function setupReveal(){
  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const revealEls = $$('[data-reveal]');
  const staggerParents = $$('[data-reveal-stagger]');

  if (prefersReduced){
    revealEls.forEach((el) => el.classList.add("revealed"));
    staggerParents.forEach((p) => Array.from(p.children).forEach((c) => c.classList.add("revealed")));
    return;
  }

  const reveal = (el, delay = 0) => {
    const d = Number(delay || 0);
    if (d) el.style.transitionDelay = `${d}ms`;
    el.classList.add("revealed");
  };

  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;

      const el = entry.target;
      const delay = el.getAttribute("data-reveal-delay") || 0;
      reveal(el, delay);
      io.unobserve(el);
    });
  }, { threshold: 0.14 });

  revealEls.forEach((el) => io.observe(el));

  const ioStagger = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;

      const parent = entry.target;
      const kids = Array.from(parent.children);
      kids.forEach((kid, idx) => {
        kid.style.transitionDelay = `${idx * 90}ms`;
        kid.classList.add("revealed");
      });

      ioStagger.unobserve(parent);
    });
  }, { threshold: 0.12 });

  staggerParents.forEach((p) => ioStagger.observe(p));
}

function animateNumber(el, from, to, duration){
  const start = performance.now();
  const fmt = new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 });
  const suffix = el.getAttribute("data-suffix") || "";

  const tick = (now) => {
    const t = Math.min(1, (now - start) / duration);
    const eased = 1 - Math.pow(1 - t, 3);
    const value = Math.round(from + (to - from) * eased);
    el.textContent = `${fmt.format(value)}${suffix}`;
    if (t < 1) requestAnimationFrame(tick);
  };

  requestAnimationFrame(tick);
}

function setupCounters(){
  const els = $$('[data-counter]');
  if (!els.length) return;

  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (prefersReduced){
    els.forEach((el) => {
      const to = Number(el.getAttribute("data-to") || 0);
      const suffix = el.getAttribute("data-suffix") || "";
      el.textContent = `${to}${suffix}`;
    });
    return;
  }

  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const from = Number(el.getAttribute("data-from") || 0);
      const to = Number(el.getAttribute("data-to") || 0);
      animateNumber(el, from, to, 900);
      io.unobserve(el);
    });
  }, { threshold: 0.6 });

  els.forEach((el) => io.observe(el));
}

function setupSlider(){
  const slider = document.querySelector("[data-slider]");
  if (!slider) return;

  const slides = $$(".slide", slider);
  const controls = $$('[data-slide]');
  if (!slides.length) return;

  let idx = slides.findIndex((s) => s.hasAttribute("data-active"));
  if (idx < 0) idx = 0;

  const show = (next) => {
    slides[idx].removeAttribute("data-active");
    idx = (next + slides.length) % slides.length;
    slides[idx].setAttribute("data-active", "");
  };

  controls.forEach((btn) => {
    btn.addEventListener("click", () => {
      const dir = btn.getAttribute("data-slide");
      if (dir === "prev") show(idx - 1);
      if (dir === "next") show(idx + 1);
    });
  });

  let timer = window.setInterval(() => show(idx + 1), 5200);
  slider.addEventListener("mouseenter", () => { window.clearInterval(timer); });
  slider.addEventListener("mouseleave", () => { timer = window.setInterval(() => show(idx + 1), 5200); });
}

function validateEmail(email){
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function showFieldError(input, message){
  const id = input.getAttribute("id");
  if (!id) return;
  const err = document.querySelector(`[data-error-for="${CSS.escape(id)}"]`);
  if (err) err.textContent = message;
}

function clearFieldError(input){
  const id = input.getAttribute("id");
  if (!id) return;
  const err = document.querySelector(`[data-error-for="${CSS.escape(id)}"]`);
  if (err) err.textContent = "";
}

function setupFormValidation(){
  const forms = $$('form[data-validate]');
  forms.forEach((form) => {
    form.addEventListener("input", (e) => {
      const target = e.target;
      if (!(target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement)) return;
      clearFieldError(target);
    });

    form.addEventListener("submit", (e) => {
      e.preventDefault();

      let ok = true;
      const inputs = $$('input, textarea, select', form).filter((el) => el.hasAttribute("required"));
      inputs.forEach((el) => {
        const val = (el.value || "").trim();
        clearFieldError(el);

        if (!val){
          showFieldError(el, "This field is required.");
          ok = false;
          return;
        }

        if (el instanceof HTMLInputElement && el.type === "email" && !validateEmail(val)){
          showFieldError(el, "Enter a valid email address.");
          ok = false;
          return;
        }

        if (el instanceof HTMLInputElement && el.type === "tel"){
          const digits = val.replace(/\D/g, "");
          if (digits.length < 7){
            showFieldError(el, "Enter a valid phone number.");
            ok = false;
          }
        }
      });

      if (!ok) return;

      const note = form.querySelector(".form-note");
      if (note) note.textContent = "Submitted successfully (front‑end demo). Connect to a backend to receive messages.";
      form.reset();
    });
  });
}

function setupGalleryLightbox(){
  const lightbox = $("#galleryLightbox");
  if (!lightbox) return;

  const items = $$("[data-gallery-item]");
  const img = $(".lightbox-img", lightbox);
  const title = $(".lightbox-title", lightbox);
  const desc = $(".lightbox-desc", lightbox);
  const closeBtn = $(".lightbox-close", lightbox);
  const overlay = $(".lightbox-overlay", lightbox);

  const open = (item) => {
    const src = $("img", item).src;
    const t = item.getAttribute("data-title");
    const d = item.getAttribute("data-description");

    img.src = src;
    title.textContent = t;
    desc.textContent = d;

    lightbox.removeAttribute("hidden");
    document.body.style.overflow = "hidden";
  };

  const close = () => {
    lightbox.setAttribute("hidden", "");
    document.body.style.overflow = "";
  };

  items.forEach((item) => {
    item.addEventListener("click", () => open(item));
  });

  [closeBtn, overlay].forEach((el) => {
    if (el) el.addEventListener("click", close);
  });

  document.addEventListener("keydown", (e) => {
    if (!lightbox.hasAttribute("hidden") && e.key === "Escape") close();
  });
}

setupYear();
setupHeaderElevate();
setupMobileNav();
setupReveal();
setupCounters();
setupSlider();
setupFormValidation();
setupPopup();
setupGalleryLightbox();
