import {
  CONTACT_CONFIG_ENDPOINT,
  CONTACT_SUBMIT_ENDPOINT,
  buildContactPayload,
  fieldsForRole,
  messageForContactResult,
} from "./site-core.js";

let turnstileLoader;

export function loadTurnstile(doc = document, win = window) {
  if (win.turnstile) return Promise.resolve(win.turnstile);
  if (turnstileLoader) return turnstileLoader;
  turnstileLoader = new Promise((resolve, reject) => {
    const script = doc.createElement("script");
    script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    script.async = true;
    script.defer = true;
    script.onload = () => resolve(win.turnstile);
    script.onerror = () => reject(new Error("turnstile_unavailable"));
    doc.head.append(script);
  });
  return turnstileLoader;
}

export function setRole(form, role) {
  for (const panel of form.querySelectorAll("[data-role-fields]")) {
    const active = panel.dataset.roleFields === role;
    panel.hidden = !active;
    panel.setAttribute("aria-hidden", String(!active));
    for (const control of panel.querySelectorAll("input, select, textarea")) {
      control.disabled = !active;
    }
  }
}

function setStatus(element, message, state = "") {
  element.textContent = message;
  if (state) element.dataset.state = state;
  else delete element.dataset.state;
}

async function getConfig(fetchImpl) {
  const response = await fetchImpl(CONTACT_CONFIG_ENDPOINT, {
    headers: { accept: "application/json" },
    credentials: "same-origin",
    cache: "no-store",
  });
  if (!response.ok) throw new Error("contact_config_unavailable");
  const config = await response.json();
  if (!config.turnstileSiteKey || !config.formSessionToken || !config.expiresAt) {
    throw new Error("contact_config_invalid");
  }
  return config;
}

function clearServerErrors(form) {
  for (const control of form.querySelectorAll("input, select, textarea")) {
    control.setCustomValidity("");
  }
}

function applyServerErrors(form, errors = {}) {
  for (const [name, message] of Object.entries(errors)) {
    form.elements.namedItem(name)?.setCustomValidity(String(message));
  }
}

export async function initContactForm({
  doc = document,
  win = window,
  fetchImpl = fetch,
} = {}) {
  const form = doc.querySelector("[data-contact-form]");
  if (!form) return;
  const roleSelect = form.querySelector("[data-role-select]");
  const status = form.querySelector("[data-form-status]");
  const submitButton = form.querySelector("[data-submit-button]");
  const turnstileSlot = form.querySelector("[data-turnstile-slot]");
  const contactSection = doc.querySelector("#contact");
  let formSessionToken = "";
  let sessionExpiresAt = 0;
  let turnstileToken = "";
  let turnstileApi;
  let widgetId;

  function onChallengeToken(token) {
    turnstileToken = token;
    submitButton.disabled = false;
    if (status.dataset.state === "verification") setStatus(status, "");
  }

  async function refreshChallenge() {
    const config = await getConfig(fetchImpl);
    formSessionToken = config.formSessionToken;
    sessionExpiresAt = Date.parse(config.expiresAt);
    turnstileToken = "";
    submitButton.disabled = true;
    turnstileApi ??= await loadTurnstile(doc, win);
    if (widgetId === undefined) {
      widgetId = turnstileApi.render(turnstileSlot, {
        sitekey: config.turnstileSiteKey,
        action: "contact_submit",
        callback: onChallengeToken,
        "expired-callback": () => {
          turnstileToken = "";
          submitButton.disabled = true;
          setStatus(status, "Verification expired. Please complete it again.", "verification");
        },
        "error-callback": () => {
          turnstileToken = "";
          submitButton.disabled = true;
          setStatus(status, "Verification is temporarily unavailable. Please try again.", "error");
        },
      });
    } else {
      turnstileApi.reset(widgetId);
    }
  }

  setRole(form, roleSelect.value);
  roleSelect.addEventListener("change", () => {
    clearServerErrors(form);
    setRole(form, roleSelect.value);
  });
  form.addEventListener("input", (event) => {
    if (typeof event.target?.setCustomValidity === "function") {
      event.target.setCustomValidity("");
    }
  });

  for (const link of doc.querySelectorAll('[data-select-contact-role="creator"]')) {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      roleSelect.value = "creator";
      setRole(form, "creator");
      contactSection?.scrollIntoView({
        behavior: win.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
        block: "start",
      });
      win.setTimeout(() => {
        const firstEmpty = fieldsForRole("creator")
          .map((name) => form.elements.namedItem(name))
          .find((control) => !control?.value.trim());
        firstEmpty?.focus();
      }, 250);
    });
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    clearServerErrors(form);
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }
    if (!turnstileToken || !formSessionToken || Date.now() >= sessionExpiresAt) {
      setStatus(status, "Please complete the verification and try again.", "verification");
      await refreshChallenge().catch(() => {
        setStatus(status, messageForContactResult(503), "error");
      });
      return;
    }

    const data = new FormData(form);
    const values = Object.fromEntries(data.entries());
    const payload = buildContactPayload({
      ...values,
      privacyAccepted: data.has("privacyAccepted"),
      turnstileToken,
      formSessionToken,
    });
    form.setAttribute("aria-busy", "true");
    submitButton.disabled = true;
    setStatus(status, "Sending…");
    let accepted = false;

    try {
      const response = await fetchImpl(CONTACT_SUBMIT_ENDPOINT, {
        method: "POST",
        credentials: "same-origin",
        headers: { "content-type": "application/json", accept: "application/json" },
        body: JSON.stringify(payload),
      });
      const body = await response.json().catch(() => ({}));
      accepted = response.status === 201 || response.status === 202;
      if (accepted) {
        form.reset();
        roleSelect.value = "brand";
        setRole(form, "brand");
        setStatus(status, messageForContactResult(response.status), "success");
      } else {
        applyServerErrors(form, body.errors);
        setStatus(status, messageForContactResult(response.status), "error");
        if (response.status === 400) form.reportValidity();
      }
    } catch {
      setStatus(status, messageForContactResult(503), "error");
    } finally {
      form.removeAttribute("aria-busy");
      await refreshChallenge().catch(() => {
        submitButton.disabled = true;
        if (!accepted) setStatus(status, messageForContactResult(503), "error");
      });
    }
  });

  await refreshChallenge().catch(() => {
    submitButton.disabled = true;
    setStatus(status, messageForContactResult(503), "error");
  });
}
