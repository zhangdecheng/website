import { spawn } from "node:child_process";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const npm = process.platform === "win32" ? "npm.cmd" : "npm";
const steps = [
  ["检查补丁格式", "git", ["diff", "--check"]],
  ["构建生产候选包", npm, ["run", "build:artifacts"]],
  [
    "运行核心测试",
    process.execPath,
    [
      "--test",
      "tests/site.test.mjs",
      "tests/release.test.mjs",
      "tests/contact-abuse.test.mjs",
      "tests/contact-service.test.mjs",
    ],
  ],
  ["运行 Chrome 响应式 QA", process.execPath, ["scripts/browser-qa.cjs"]],
];

function run(label, command, args) {
  return new Promise((resolveStep, reject) => {
    console.log(`\n[release-gate] ${label}`);
    const child = spawn(command, args, {
      cwd: root,
      env: { ...process.env, CI: "1" },
      stdio: "inherit",
    });
    child.once("error", reject);
    child.once("close", (code, signal) => {
      if (code === 0) {
        resolveStep();
        return;
      }
      reject(new Error(`${label} failed${signal ? ` (${signal})` : ` (exit ${code})`}`));
    });
  });
}

for (const [label, command, args] of steps) {
  await run(label, command, args);
}

console.log("\n[release-gate] PASS: local release candidate is ready for explicit archive and deployment review.");
