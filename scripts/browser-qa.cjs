const { chromium } = require("playwright");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const screenshotDir = path.join(root, "qa", "screenshots");
fs.mkdirSync(screenshotDir, { recursive: true });

const chromePath = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const viewports = [
  { name: "wide-1920x1080", width: 1920, height: 1080 },
  { name: "desktop-1440x1024", width: 1440, height: 1024 },
  { name: "tablet-1024x1366", width: 1024, height: 1366 },
  { name: "mobile-390x844", width: 390, height: 844 },
  { name: "small-mobile-360x800", width: 360, height: 800 },
];

async function revealWholePage(page) {
  const reveals = page.locator(".reveal");
  for (let index = 0; index < (await reveals.count()); index += 1) {
    await reveals.nth(index).scrollIntoViewIfNeeded();
    await page.waitForTimeout(90);
  }
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(180);
}

(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: chromePath,
  });
  const results = {
    generatedAt: new Date().toISOString(),
    browser: "Google Chrome via Playwright",
    viewports: {},
    interaction: {},
    accessibility: {},
    consoleErrors: [],
  };

  for (const viewport of viewports) {
    const context = await browser.newContext({
      viewport: { width: viewport.width, height: viewport.height },
      reducedMotion: "no-preference",
    });
    const page = await context.newPage();
    const errors = [];
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });
    page.on("pageerror", (error) => errors.push(error.message));

    await page.goto("http://127.0.0.1:4173/", { waitUntil: "networkidle" });
    await revealWholePage(page);

    const report = await page.evaluate(() => {
      const ids = ["services", "talent", "about", "contact"];
      const missingAlt = [...document.querySelectorAll("img")].filter(
        (image) => !image.hasAttribute("alt"),
      ).length;
      const visibleButtons = [...document.querySelectorAll("button")].filter(
        (button) => button.getClientRects().length,
      );
      return {
        title: document.title,
        h1: document.querySelector("h1")?.textContent.trim(),
        anchorsPresent: Object.fromEntries(ids.map((id) => [id, Boolean(document.getElementById(id))])),
        horizontalOverflow:
          document.documentElement.scrollWidth > document.documentElement.clientWidth,
        dimensions: {
          scrollWidth: document.documentElement.scrollWidth,
          clientWidth: document.documentElement.clientWidth,
          scrollHeight: document.documentElement.scrollHeight,
        },
        sections: Object.fromEntries(
          Object.entries({
            hero: "#top",
            logos: ".logo-strip",
            bridge: ".bridge",
            services: "#services",
            talent: "#talent",
            about: "#about",
            contact: "#contact",
            footer: ".site-footer",
          }).map(([name, selector]) => {
            const rect = document.querySelector(selector)?.getBoundingClientRect();
            return [
              name,
              rect
                ? {
                    top: Math.round(rect.top + window.scrollY),
                    width: Math.round(rect.width),
                    height: Math.round(rect.height),
                  }
                : null,
            ];
          }),
        ),
        missingAlt,
        visibleButtonSizes: visibleButtons.map((button) => {
          const rect = button.getBoundingClientRect();
          return {
            text: button.textContent.trim(),
            width: Math.round(rect.width),
            height: Math.round(rect.height),
          };
        }),
        hiddenRevealCount: [...document.querySelectorAll(".reveal")].filter(
          (element) => getComputedStyle(element).opacity === "0",
        ).length,
      };
    });

    await page.addStyleTag({
      content: ".site-header{position:absolute!important}.skip-link{display:none!important}",
    });
    await page.screenshot({
      path: path.join(screenshotDir, `${viewport.name}.png`),
      fullPage: true,
    });
    report.consoleErrors = errors;
    results.viewports[viewport.name] = report;
    results.consoleErrors.push(...errors.map((error) => `${viewport.name}: ${error}`));
    await context.close();
  }

  const mobileContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const mobilePage = await mobileContext.newPage();
  await mobilePage.goto("http://127.0.0.1:4173/", { waitUntil: "networkidle" });
  const toggle = mobilePage.locator("[data-menu-toggle]");
  await toggle.click();
  const openState = await toggle.getAttribute("aria-expanded");
  const bodyLocked = await mobilePage.locator("body").evaluate((body) =>
    body.classList.contains("menu-open"),
  );
  await mobilePage.keyboard.press("Escape");
  const escapeState = await toggle.getAttribute("aria-expanded");

  await mobilePage.locator('[name="creator-name"]').fill("Test Creator");
  await mobilePage.locator('[name="creator-email"]').fill("creator@example.com");
  await mobilePage.locator('[name="creator-social"]').fill("not-a-link");
  await mobilePage.locator('[name="creator-region"]').fill("Europe / UK");
  await mobilePage.locator("[data-creator-form] button").click();
  const creatorUrlMessage = await mobilePage
    .locator('[name="creator-social"]')
    .evaluate((input) => input.validationMessage);

  await mobilePage.locator("[data-project-form] button").click();
  const invalidProjectFields = await mobilePage
    .locator("[data-project-form] :invalid")
    .count();

  await mobilePage.reload({ waitUntil: "networkidle" });
  await mobilePage.keyboard.press("Tab");
  const focused = await mobilePage.evaluate(() => {
    const element = document.activeElement;
    const style = getComputedStyle(element);
    return {
      tag: element?.tagName,
      label: element?.textContent?.trim() || element?.getAttribute("aria-label"),
      outlineStyle: style.outlineStyle,
      outlineWidth: style.outlineWidth,
    };
  });

  results.interaction = {
    mobileMenuOpens: openState === "true" && bodyLocked,
    mobileMenuClosesWithEscape: escapeState === "false",
    creatorInvalidUrlMessage: creatorUrlMessage,
    projectRequiredInvalidCount: invalidProjectFields,
  };
  results.accessibility.keyboardFocus = focused;
  await mobileContext.close();

  const reducedContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    reducedMotion: "reduce",
  });
  const reducedPage = await reducedContext.newPage();
  await reducedPage.goto("http://127.0.0.1:4173/", { waitUntil: "networkidle" });
  results.accessibility.reducedMotion = await reducedPage.evaluate(() => ({
    mediaMatches: matchMedia("(prefers-reduced-motion: reduce)").matches,
    hiddenRevealCount: [...document.querySelectorAll(".reveal")].filter(
      (element) => getComputedStyle(element).opacity === "0",
    ).length,
    htmlScrollBehavior: getComputedStyle(document.documentElement).scrollBehavior,
  }));
  await reducedContext.close();

  await browser.close();
  fs.writeFileSync(
    path.join(root, "qa", "browser-results.json"),
    `${JSON.stringify(results, null, 2)}\n`,
  );
  process.stdout.write(`${JSON.stringify(results, null, 2)}\n`);
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
