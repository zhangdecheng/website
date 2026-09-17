import { initContactForm, scrollContactTargetIntoView } from "./contact-form.js";

const header = document.querySelector("[data-header]");
const menuToggle = document.querySelector("[data-menu-toggle]");
const nav = document.querySelector("[data-nav]");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function setMenu(open) {
  if (!header || !menuToggle) return;
  header.classList.toggle("menu-active", open);
  document.body.classList.toggle("menu-open", open);
  menuToggle.setAttribute("aria-expanded", String(open));
  menuToggle.querySelector("i")?.classList.toggle("ri-menu-line", !open);
  menuToggle.querySelector("i")?.classList.toggle("ri-close-line", open);
  const label = menuToggle.querySelector(".sr-only");
  if (label) label.textContent = open ? "Close menu" : "Open menu";
}

menuToggle?.addEventListener("click", () => {
  setMenu(menuToggle.getAttribute("aria-expanded") !== "true");
});

nav?.addEventListener("click", (event) => {
  if (event.target.closest("a")) setMenu(false);
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") setMenu(false);
});

window.addEventListener(
  "scroll",
  () => header?.classList.toggle("is-scrolled", window.scrollY > 20),
  { passive: true },
);

initContactForm();

function scrollToLocationHash() {
  const id = decodeURIComponent(String(window.location.hash || "").replace(/^#/, ""));
  if (!id) return;
  const target = document.getElementById(id);
  if (!target) return;
  if (id === "contact") {
    scrollContactTargetIntoView(target);
    return;
  }
  target.scrollIntoView({
    behavior: reducedMotion ? "auto" : "smooth",
    block: "start",
  });
}

function scheduleHashScroll() {
  if (!window.location.hash) return;
  const run = () => scrollToLocationHash();
  run();
  requestAnimationFrame(run);
}

if (window.location.hash === "#contact") {
  if ("scrollRestoration" in history) history.scrollRestoration = "manual";
  document.documentElement.style.scrollBehavior = "auto";
}
scheduleHashScroll();
window.addEventListener("pageshow", scheduleHashScroll);
window.addEventListener("load", () => {
  scheduleHashScroll();
  window.setTimeout(scheduleHashScroll, 50);
  window.setTimeout(() => {
    scheduleHashScroll();
    if (window.location.hash === "#contact") document.documentElement.style.scrollBehavior = "";
  }, 120);
});
window.addEventListener("hashchange", () => {
  scrollToLocationHash();
});

document.addEventListener("click", (event) => {
  if (event.defaultPrevented || event.button !== 0) return;
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  const link = event.target.closest("a[href]");
  if (!link) return;
  let url;
  try {
    url = new URL(link.href, window.location.href);
  } catch {
    return;
  }
  if (url.origin !== window.location.origin || url.hash !== "#contact") return;
  const normalizePath = (path) => path.replace(/\/index\.html$/, "/").replace(/\/+$/, "") || "/";
  if (normalizePath(url.pathname) !== normalizePath(window.location.pathname)) return;
  if (url.search !== window.location.search) return;
  const target = document.getElementById("contact");
  if (!target) return;
  event.preventDefault();
  const roleSelect = document.querySelector("[data-role-select]");
  const requestedRole = new URLSearchParams(url.search).get("role");
  if (roleSelect && (requestedRole === "creator" || requestedRole === "brand")) {
    roleSelect.value = requestedRole;
    roleSelect.dispatchEvent(new Event("change"));
  }
  history.pushState({}, "", `${url.pathname}${url.search}#contact`);
  scrollToLocationHash();
});

function cloneBrandLogoSet() {
  const source = document.querySelector("[data-brand-logo-set]");
  const track = source?.parentElement;
  if (!source || !track || track.querySelector('.brand-logo-set[aria-hidden="true"]')) return;

  const duplicate = source.cloneNode(true);
  duplicate.removeAttribute("data-brand-logo-set");
  duplicate.setAttribute("aria-hidden", "true");
  duplicate.querySelectorAll("img").forEach((image) => image.setAttribute("alt", ""));
  track.append(duplicate);
  track.classList.add("is-ready");
}

cloneBrandLogoSet();

const reveals = document.querySelectorAll(".reveal");

if (reducedMotion || !("IntersectionObserver" in window)) {
  reveals.forEach((element) => element.classList.add("is-visible"));
} else {
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    },
    { rootMargin: "0px 0px 20% 0px", threshold: 0.02 },
  );
  reveals.forEach((element) => {
    const rect = element.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) {
      element.classList.add("is-visible");
      observer.unobserve(element);
    } else {
      observer.observe(element);
    }
  });
}
