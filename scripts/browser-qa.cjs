const { chromium } = require("playwright-core");
const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const dist = path.join(root, "dist");
const screenshotDir = path.join(root, "qa", "screenshots");
const resultsPath = path.join(root, "qa", "browser-results.json");
const chromePath = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const viewports = [
  { name: "desktop-1440x1024", width: 1440, height: 1024 },
  { name: "tablet-1024x1366", width: 1024, height: 1366 },
  { name: "mobile-390x844", width: 390, height: 844 },
  { name: "small-mobile-360x800", width: 360, height: 800 },
];

fs.mkdirSync(screenshotDir, { recursive: true });

function contentType(file) {
  const types = {
    ".css": "text/css; charset=utf-8",
    ".html": "text/html; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".png": "image/png",
    ".webp": "image/webp",
    ".woff2": "font/woff2",
  };
  return types[path.extname(file).toLowerCase()] || "application/octet-stream";
}

function startStaticServer() {
  return new Promise((resolve, reject) => {
    const server = http.createServer((request, response) => {
      const pathname = new URL(request.url || "/", "http://localhost").pathname;
      const relative = decodeURIComponent(pathname === "/" ? "index.html" : pathname.slice(1));
      const target = path.resolve(dist, relative);
      if (target !== dist && !target.startsWith(`${dist}${path.sep}`)) {
        response.writeHead(403).end("Forbidden");
        return;
      }
      fs.readFile(target, (error, bytes) => {
        if (error) {
          response.writeHead(error.code === "ENOENT" ? 404 : 500).end("Not found");
          return;
        }
        response.writeHead(200, { "content-type": contentType(target) });
        response.end(bytes);
      });
    });
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const { port } = server.address();
      resolve({ server, baseUrl: `http://127.0.0.1:${port}` });
    });
  });
}

function closeServer(server) {
  return new Promise((resolve, reject) => {
    server.close((error) => error ? reject(error) : resolve());
  });
}

async function installContactStubs(context, baseUrl, postState) {
  await context.addInitScript(() => {
    window.__qaScrollCalls = [];
    const nativeScrollIntoView = Element.prototype.scrollIntoView;
    Element.prototype.scrollIntoView = function scrollIntoView(options) {
      window.__qaScrollCalls.push(options || {});
      return nativeScrollIntoView.call(this, options);
    };

    const widgets = new Map();
    window.turnstile = {
      render(slot, options) {
        const id = `qa-widget-${widgets.size + 1}`;
        widgets.set(id, options);
        const control = document.createElement("button");
        control.type = "button";
        control.dataset.qaTurnstile = "";
        control.textContent = "Security verification";
        slot.append(control);
        window.setTimeout(() => options.callback(`qa-token-${id}`), 0);
        return id;
      },
      reset(id) {
        const options = widgets.get(id);
        window.setTimeout(() => options?.callback(`qa-token-reset-${id}`), 0);
      },
    };
  });

  await context.route(`${baseUrl}/api/contact/config`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        turnstileSiteKey: "1x00000000000000000000AA",
        formSessionToken: "qa-session-token",
        expiresAt: new Date(Date.now() + 3_600_000).toISOString(),
      }),
    });
  });

  await context.route(`${baseUrl}/api/contact`, async (route) => {
    const status = postState.status;
    await route.fulfill({
      status,
      contentType: "application/json",
      body: JSON.stringify(status === 201 || status === 202
        ? { ok: true, requestId: `qa-${status}` }
        : { ok: false, requestId: `qa-${status}`, message: "QA simulated failure" }),
    });
  });
}

async function revealWholePage(page) {
  const reveals = page.locator(".reveal");
  for (let index = 0; index < (await reveals.count()); index += 1) {
    await reveals.nth(index).scrollIntoViewIfNeeded();
    await page.waitForTimeout(50);
  }
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(120);
}

async function waitForFormReady(page) {
  await page.waitForFunction(() => {
    const button = document.querySelector("[data-submit-button]");
    return button && !button.disabled;
  });
}

function check(results, condition, message) {
  if (!condition) results.failures.push(message);
  return Boolean(condition);
}

function isOrdered(sequence, expected) {
  let previous = -1;
  for (const item of expected) {
    const index = sequence.indexOf(item);
    if (index <= previous) return false;
    previous = index;
  }
  return true;
}

async function collectFocusOrder(page) {
  await page.locator('[name="role"]').focus();
  const sequence = ["role"];
  for (let index = 0; index < 12; index += 1) {
    await page.keyboard.press("Tab");
    sequence.push(await page.evaluate(() => {
      const active = document.activeElement;
      if (active?.dataset.qaTurnstile !== undefined) return "turnstile";
      if (active?.dataset.submitButton !== undefined) return "submit";
      if (active?.matches('.privacy-consent a')) return "privacy-link";
      return active?.getAttribute("name") || active?.tagName?.toLowerCase() || "unknown";
    }));
  }
  return sequence;
}

async function exerciseViewport({ browser, baseUrl, viewport, results }) {
  const postState = { status: 201 };
  const context = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
    reducedMotion: "no-preference",
  });
  await installContactStubs(context, baseUrl, postState);
  const page = await context.newPage();
  const consoleErrors = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => consoleErrors.push(error.message));

  await page.goto(`${baseUrl}/`, { waitUntil: "networkidle" });
  await waitForFormReady(page);
  const defaultState = await page.evaluate(() => {
    const brand = document.querySelector('[data-role-fields="brand"]');
    const creator = document.querySelector('[data-role-fields="creator"]');
    return {
      role: document.querySelector('[name="role"]')?.value,
      brandVisible: !brand.hidden && [...brand.querySelectorAll("input, select, textarea")]
        .every((control) => !control.disabled),
      creatorHidden: creator.hidden && [...creator.querySelectorAll("input, select, textarea")]
        .every((control) => control.disabled),
      horizontalOverflow:
        document.documentElement.scrollWidth > document.documentElement.clientWidth,
      hiddenRevealCount: [...document.querySelectorAll(".reveal")]
        .filter((element) => getComputedStyle(element).opacity === "0").length,
    };
  });

  await page.locator('[name="role"]').selectOption("creator");
  const creatorState = await page.evaluate(() => {
    const brand = document.querySelector('[data-role-fields="brand"]');
    const creator = document.querySelector('[data-role-fields="creator"]');
    return {
      role: document.querySelector('[name="role"]')?.value,
      brandHidden: brand.hidden && [...brand.querySelectorAll("input, select, textarea")]
        .every((control) => control.disabled),
      creatorVisible: !creator.hidden && [...creator.querySelectorAll("input, select, textarea")]
        .every((control) => !control.disabled),
    };
  });

  await page.locator('[name="role"]').selectOption("brand");
  await revealWholePage(page);
  await page.addStyleTag({
    content: ".site-header{position:absolute!important}.skip-link{display:none!important}",
  });
  const screenshotPath = path.join(screenshotDir, `contact-${viewport.name}.png`);
  await page.screenshot({ path: screenshotPath, fullPage: true });
  const baselineConsoleErrorCount = consoleErrors.length;

  await page.locator('[data-select-contact-role="creator"]').click();
  await page.waitForTimeout(300);
  const joinCta = await page.evaluate(() => {
    const rect = document.querySelector("#contact")?.getBoundingClientRect();
    return {
      role: document.querySelector('[name="role"]')?.value,
      contactVisible: Boolean(rect && rect.top < window.innerHeight && rect.bottom > 0),
    };
  });

  await page.locator('[name="role"]').selectOption("brand");
  const focusOrder = await collectFocusOrder(page);

  await page.locator('[name="name"]').fill("QA Brand Contact");
  await page.locator('[name="email"]').fill("qa@example.com");
  await page.locator('[name="company"]').fill("QA North Star");
  await page.locator('[name="budget"]').selectOption({ label: "$30,000–$100,000" });
  await page.locator('[name="growthObjectives"]').fill(
    "Validate that a simulated delivery failure preserves every entered field.",
  );
  await page.locator('[name="privacyAccepted"]').check();
  postState.status = 502;
  await waitForFormReady(page);
  await page.locator("[data-submit-button]").click();
  await page.locator('[data-form-status][data-state="error"]').waitFor();
  const failureState = await page.evaluate(() => ({
    name: document.querySelector('[name="name"]')?.value,
    email: document.querySelector('[name="email"]')?.value,
    company: document.querySelector('[name="company"]')?.value,
    budget: document.querySelector('[name="budget"]')?.value,
    growthObjectives: document.querySelector('[name="growthObjectives"]')?.value,
    privacyAccepted: document.querySelector('[name="privacyAccepted"]')?.checked,
    status: document.querySelector("[data-form-status]")?.textContent,
  }));

  postState.status = 201;
  await waitForFormReady(page);
  await page.locator("[data-submit-button]").click();
  await page.locator('[data-form-status][data-state="success"]').waitFor();
  const successState = await page.evaluate(() => ({
    role: document.querySelector('[name="role"]')?.value,
    name: document.querySelector('[name="name"]')?.value,
    company: document.querySelector('[name="company"]')?.value,
    privacyAccepted: document.querySelector('[name="privacyAccepted"]')?.checked,
    status: document.querySelector("[data-form-status]")?.textContent,
  }));

  let mobileMenu = null;
  if (viewport.width <= 390) {
    const toggle = page.locator("[data-menu-toggle]");
    await toggle.click();
    const opened = await toggle.getAttribute("aria-expanded");
    const bodyLocked = await page.locator("body").evaluate((body) => body.classList.contains("menu-open"));
    await page.keyboard.press("Escape");
    mobileMenu = {
      opens: opened === "true" && bodyLocked,
      closesWithEscape: await toggle.getAttribute("aria-expanded") === "false",
    };
  }

  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.reload({ waitUntil: "networkidle" });
  await waitForFormReady(page);
  await page.locator('[data-select-contact-role="creator"]').click();
  await page.waitForTimeout(50);
  const reducedMotion = await page.evaluate(() => ({
    mediaMatches: matchMedia("(prefers-reduced-motion: reduce)").matches,
    scrollBehavior: window.__qaScrollCalls.at(-1)?.behavior,
    htmlScrollBehavior: getComputedStyle(document.documentElement).scrollBehavior,
    hiddenRevealCount: [...document.querySelectorAll(".reveal")]
      .filter((element) => getComputedStyle(element).opacity === "0").length,
  }));

  await page.goto(`${baseUrl}/privacy.html`, { waitUntil: "networkidle" });
  const privacy = await page.evaluate(() => {
    const article = document.querySelector(".privacy-article");
    const rect = article?.getBoundingClientRect();
    return {
      horizontalOverflow:
        document.documentElement.scrollWidth > document.documentElement.clientWidth,
      articleWidth: rect ? Math.round(rect.width) : null,
      bodyFontSize: article ? Number.parseFloat(getComputedStyle(article.querySelector("p")).fontSize) : null,
      hasTurnstileDisclosure: document.body.textContent.includes("Cloudflare Turnstile"),
    };
  });

  const expectedFailureConsoleSignals = consoleErrors.filter((error) =>
    /status of 502|502 \(Bad Gateway\)/u.test(error),
  );
  const unexpectedConsoleErrors = consoleErrors.filter((error) =>
    !/status of 502|502 \(Bad Gateway\)/u.test(error),
  );
  const report = {
    viewport: { width: viewport.width, height: viewport.height },
    screenshot: path.relative(root, screenshotPath),
    defaultState,
    creatorState,
    joinCta,
    focusOrder,
    failureState,
    successState,
    mobileMenu,
    reducedMotion,
    privacy,
    baselineConsoleErrorCount,
    expectedFailureConsoleSignals,
    unexpectedConsoleErrors,
    checks: {},
  };
  const prefix = viewport.name;
  report.checks.defaultBrand = check(
    results,
    defaultState.role === "brand" && defaultState.brandVisible && defaultState.creatorHidden,
    `${prefix}: Brand default field state is incorrect`,
  );
  report.checks.creatorSwitch = check(
    results,
    creatorState.role === "creator" && creatorState.brandHidden && creatorState.creatorVisible,
    `${prefix}: Creator field state is incorrect`,
  );
  report.checks.joinCta = check(
    results,
    joinCta.role === "creator" && joinCta.contactVisible,
    `${prefix}: Join Our Roster did not select Creator and reveal Contact`,
  );
  report.checks.keyboardOrder = check(
    results,
    isOrdered(focusOrder, [
      "role",
      "name",
      "email",
      "company",
      "budget",
      "growthObjectives",
      "privacyAccepted",
      "turnstile",
      "submit",
    ]),
    `${prefix}: form keyboard order is incorrect (${focusOrder.join(" → ")})`,
  );
  report.checks.failurePreservesValues = check(
    results,
    failureState.name === "QA Brand Contact"
      && failureState.email === "qa@example.com"
      && failureState.company === "QA North Star"
      && failureState.budget === "$30,000–$100,000"
      && failureState.growthObjectives.includes("simulated delivery failure")
      && failureState.privacyAccepted
      && failureState.status.includes("couldn’t send"),
    `${prefix}: 502 response did not preserve values and safe status`,
  );
  report.checks.successResetsValues = check(
    results,
    successState.role === "brand"
      && successState.name === ""
      && successState.company === ""
      && !successState.privacyAccepted
      && successState.status.includes("received"),
    `${prefix}: 201 response did not reset only after acceptance`,
  );
  report.checks.noHorizontalOverflow = check(
    results,
    !defaultState.horizontalOverflow && !privacy.horizontalOverflow,
    `${prefix}: horizontal overflow detected`,
  );
  report.checks.reducedMotion = check(
    results,
    reducedMotion.mediaMatches
      && reducedMotion.scrollBehavior === "auto"
      && reducedMotion.htmlScrollBehavior === "auto"
      && reducedMotion.hiddenRevealCount === 0,
    `${prefix}: reduced-motion behavior is incomplete`,
  );
  report.checks.privacyReadable = check(
    results,
    privacy.articleWidth > 0
      && privacy.articleWidth <= 760
      && privacy.bodyFontSize >= 15
      && privacy.hasTurnstileDisclosure,
    `${prefix}: Privacy Notice is not readable or complete`,
  );
  report.checks.noConsoleErrors = check(
    results,
    baselineConsoleErrorCount === 0 && unexpectedConsoleErrors.length === 0,
    `${prefix}: unexpected browser console errors: ${unexpectedConsoleErrors.join(" | ")}`,
  );
  if (mobileMenu) {
    report.checks.mobileMenu = check(
      results,
      mobileMenu.opens && mobileMenu.closesWithEscape,
      `${prefix}: mobile menu interaction failed`,
    );
  }

  results.viewports[viewport.name] = report;
  await context.close();
}

(async () => {
  const results = {
    generatedAt: new Date().toISOString(),
    browser: "System Google Chrome via playwright-core 1.62.1",
    viewports: {},
    failures: [],
  };
  let localServer;
  let browser;

  try {
    localServer = await startStaticServer();
    browser = await chromium.launch({ headless: true, executablePath: chromePath });
    for (const viewport of viewports) {
      await exerciseViewport({
        browser,
        baseUrl: localServer.baseUrl,
        viewport,
        results,
      });
    }
  } catch (error) {
    results.failures.push(`Unexpected QA error: ${error.stack || error.message}`);
  } finally {
    if (browser) await browser.close();
    if (localServer) await closeServer(localServer.server);
    fs.writeFileSync(resultsPath, `${JSON.stringify(results, null, 2)}\n`);
    process.stdout.write(`${JSON.stringify(results, null, 2)}\n`);
  }

  if (results.failures.length) {
    throw new Error(`Browser QA failed:\n${results.failures.join("\n")}`);
  }
})().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
