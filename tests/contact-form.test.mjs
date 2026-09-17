import assert from "node:assert/strict";
import test from "node:test";
import { contactRoleFromLocation, scrollContactTargetIntoView } from "../contact-form.js";

test("contactRoleFromLocation reads query role=creator and keeps hash fallbacks", () => {
  assert.equal(
    contactRoleFromLocation({ location: { search: "?role=creator", hash: "#contact" } }),
    "creator",
  );
  assert.equal(
    contactRoleFromLocation({ location: { search: "?role=brand", hash: "#contact" } }),
    "brand",
  );
  assert.equal(
    contactRoleFromLocation({ location: { search: "", hash: "#contact?role=creator" } }),
    "creator",
  );
  assert.equal(
    contactRoleFromLocation({ location: { search: "?utm_source=seo", hash: "#contact" } }),
    null,
  );
  assert.equal(
    contactRoleFromLocation({ location: { search: "?role=admin", hash: "#contact" } }),
    null,
  );
  assert.equal(
    contactRoleFromLocation({ location: { search: "", hash: "#contact" } }),
    null,
  );
});

test("scrollContactTargetIntoView jumps below the sticky header with auto behavior", () => {
  const calls = [];
  const root = { style: { scrollBehavior: "" } };
  const target = {
    scrollIntoView(options) { calls.push(["intoView", options]); },
    getBoundingClientRect() { return { top: 820 }; },
  };
  const win = {
    scrollY: 40,
    document: {
      documentElement: root,
      querySelector() { return null; },
    },
    getComputedStyle() {
      return { getPropertyValue() { return "76px"; } };
    },
    scrollTo(options) { calls.push(["scrollTo", options]); },
  };

  scrollContactTargetIntoView(target, win);
  scrollContactTargetIntoView(null, win);

  assert.deepEqual(calls, [
    ["intoView", { behavior: "auto", block: "start" }],
    ["scrollTo", { top: 768, behavior: "auto" }],
  ]);
  assert.equal(root.style.scrollBehavior, "");
});

test("scrollContactTargetIntoView uses the live header height when present", () => {
  const calls = [];
  const root = { style: { scrollBehavior: "smooth" } };
  const target = {
    scrollIntoView(options) { calls.push(["intoView", options]); },
    getBoundingClientRect() { return { top: 40 }; },
  };
  const win = {
    scrollY: 2000,
    document: {
      documentElement: root,
      querySelector() {
        return { getBoundingClientRect() { return { height: 68 }; } };
      },
    },
    getComputedStyle() {
      return { getPropertyValue() { return "76px"; } };
    },
    scrollTo(options) { calls.push(["scrollTo", options]); },
  };

  scrollContactTargetIntoView(target, win);

  assert.equal(calls[1][0], "scrollTo");
  assert.equal(calls[1][1].top, 2000 + 40 - 68 - 16);
  assert.equal(calls[1][1].behavior, "auto");
  assert.equal(root.style.scrollBehavior, "smooth");
});
