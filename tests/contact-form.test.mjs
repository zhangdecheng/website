import assert from "node:assert/strict";
import test from "node:test";
import { contactRoleFromLocation } from "../contact-form.js";

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
