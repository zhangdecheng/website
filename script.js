import {
  buildCreatorMailto,
  buildProjectMailto,
  isValidHttpUrl,
} from "./site-core.js";

const header = document.querySelector("[data-header]");
const menuToggle = document.querySelector("[data-menu-toggle]");
const nav = document.querySelector("[data-nav]");
const creatorForm = document.querySelector("[data-creator-form]");
const projectForm = document.querySelector("[data-project-form]");
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

function validateForm(form) {
  const urlField = form.querySelector("[data-url-field]");
  if (urlField) {
    urlField.setCustomValidity(
      urlField.value && !isValidHttpUrl(urlField.value)
        ? "Enter a complete link beginning with http:// or https://."
        : "",
    );
  }

  if (!form.checkValidity()) {
    form.reportValidity();
    return false;
  }

  return true;
}

creatorForm?.addEventListener("input", () => {
  creatorForm.querySelector("[data-url-field]")?.setCustomValidity("");
});

creatorForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!validateForm(creatorForm)) return;
  const data = new FormData(creatorForm);
  window.location.href = buildCreatorMailto({
    name: data.get("creator-name"),
    email: data.get("creator-email"),
    social: data.get("creator-social"),
    region: data.get("creator-region"),
  });
});

projectForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!validateForm(projectForm)) return;
  const data = new FormData(projectForm);
  window.location.href = buildProjectMailto({
    identity: data.get("project-identity"),
    name: data.get("project-name"),
    company: data.get("project-company"),
    email: data.get("project-email"),
    budget: data.get("project-budget"),
    goal: data.get("project-goal"),
  });
});

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
