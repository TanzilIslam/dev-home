#!/usr/bin/env node
"use strict";

const REQUIRED_NODE = "v24.13.0";
const REQUIRED_PNPM = "10.10.0";

function fail(message) {
  console.error(`\n[env-check] ${message}`);
  console.error(`[env-check] Required: Node.js ${REQUIRED_NODE}, pnpm ${REQUIRED_PNPM}\n`);
  process.exit(1);
}

function getPackageManagerFromUserAgent() {
  const userAgent = process.env.npm_config_user_agent ?? "";
  const firstToken = userAgent.split(" ")[0] ?? "";
  const [name = "unknown", version = "unknown"] = firstToken.split("/");
  return { name, version, raw: userAgent };
}

const { name: pmName, version: pmVersion, raw: userAgent } = getPackageManagerFromUserAgent();

if (process.version !== REQUIRED_NODE) {
  fail(`Unsupported Node.js version: ${process.version}`);
}

if (pmName !== "pnpm") {
  const actual = userAgent || "unknown";
  fail(`Unsupported package manager: ${actual}`);
}

if (pmVersion !== REQUIRED_PNPM) {
  fail(`Unsupported pnpm version: ${pmVersion}`);
}

console.log(`[env-check] OK: Node.js ${process.version}, pnpm ${pmVersion}`);