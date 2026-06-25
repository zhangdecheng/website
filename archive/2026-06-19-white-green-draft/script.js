const header = document.querySelector("[data-header]");
const menuButton = document.querySelector("[data-menu-button]");
const nav = document.querySelector("[data-nav]");
const form = document.querySelector("[data-form]");
const note = document.querySelector("[data-form-note]");

menuButton?.addEventListener("click", () => {
  const isOpen = header.classList.toggle("is-open");
  menuButton.setAttribute("aria-label", isOpen ? "关闭导航" : "打开导航");
});

nav?.addEventListener("click", (event) => {
  if (event.target.matches("a")) {
    header.classList.remove("is-open");
  }
});

form?.addEventListener("submit", (event) => {
  event.preventDefault();
  note.textContent = "已记录合作意向。正式上线时这里可以接入表单、企业微信或 CRM。";
  note.classList.add("is-success");
});
