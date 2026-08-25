import { readdir, readFile } from "node:fs/promises";
import { dirname, join, relative, resolve } from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

async function readText(path) {
  return readFile(resolve(projectRoot, path), "utf8");
}

async function readJson(path) {
  return JSON.parse(await readText(path));
}

function requireText(source, expected, label) {
  if (!source.includes(expected)) {
    throw new Error(`${label} does not contain ${expected}.`);
  }
}

function forbidText(source, forbidden, label) {
  if (source.includes(forbidden)) {
    throw new Error(`${label} must not contain ${forbidden}.`);
  }
}

async function collectTextFiles(directory, files = []) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name === ".git") continue;
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      await collectTextFiles(path, files);
      continue;
    }
    if (
      /\.(?:css|d\.ts|html|json|js|md|mjs|ts|tsx|txt|yaml|yml)$/u.test(
        entry.name,
      )
    ) {
      files.push(path);
    }
  }
  return files;
}

const [
  manifest,
  policy,
  extensionManifest,
  readme,
  japaneseReadme,
  englishPage,
  japanesePage,
  license,
] = await Promise.all([
    readJson("package.json"),
    readJson("repo-policy.json"),
    readJson("dist/extension-manifest.json"),
    readText("README.md"),
    readText("README.ja.md"),
    readText("docs/index.html"),
    readText("docs/ja/index.html"),
    readText("LICENSE"),
  ]);

if (policy.profile !== "capability-extension") {
  throw new Error("repo-policy.json has an unexpected profile.");
}
if (policy.packageName !== manifest.name) {
  throw new Error("repo-policy.json packageName must match package.json name.");
}
if (manifest.version !== "0.2.0") {
  throw new Error("package.json version must be 0.2.0.");
}
if (manifest.license !== policy.license) {
  throw new Error("package.json license must match repo-policy.json.");
}
if (manifest.packageManager !== policy.packageManager) {
  throw new Error("package.json packageManager must match repo-policy.json.");
}
if (manifest.engines?.node !== policy.node) {
  throw new Error("package.json engines.node must match repo-policy.json.");
}
if (extensionManifest.id !== policy.extensionId) {
  throw new Error("dist/extension-manifest.json has an unexpected extension ID.");
}

for (const requiredFile of [
  "dist/",
  "README.md",
  "README.ja.md",
  "LICENSE",
]) {
  if (!manifest.files?.includes(requiredFile)) {
    throw new Error(`package.json files must include ${requiredFile}.`);
  }
}

requireText(license, "Mozilla Public License Version 2.0", "LICENSE");
requireText(license, "9. Miscellaneous", "LICENSE");
requireText(readme, "# TurboWarp-Camera-Source", "README.md");
requireText(japaneseReadme, "# TurboWarp-Camera-Source", "README.ja.md");
requireText(englishPage, "TurboWarp-Camera-Source", "docs/index.html");
requireText(japanesePage, "TurboWarp-Camera-Source", "docs/ja/index.html");
requireText(readme, "**English** | [日本語](README.ja.md)", "README.md");
requireText(japaneseReadme, "[English](README.md) | **日本語**", "README.ja.md");
requireText(readme, "SPDX-License-Identifier: MPL-2.0", "README.md");
requireText(
  japaneseReadme,
  "SPDX-License-Identifier: MPL-2.0",
  "README.ja.md",
);

const cdnUrl =
  "https://cdn.jsdelivr.net/npm/@kubohiroya/turbowarp-camera-source@0.2.0/dist/camera-source.js";
requireText(readme, cdnUrl, "README.md");
requireText(japaneseReadme, cdnUrl, "README.ja.md");

const bundle = await readText("dist/camera-source.js");
for (const expected of [
  "Name: Camera Source",
  "ID: kubohiroyacamerasource",
  "License: MPL-2.0",
  "startSharedCamera",
  "stopSharedCamera",
  "acquireCamera",
]) {
  requireText(bundle, expected, "dist/camera-source.js");
}

for (const file of await collectTextFiles(projectRoot)) {
  const relativePath = relative(projectRoot, file);
  if (relativePath === "scripts/check-repo.mjs") continue;
  const source = await readFile(file, "utf8");
  forbidText(source, ["tm", "pose"].join(""), relativePath);
  forbidText(source, ["TM", "Pose"].join(""), relativePath);
  forbidText(source, ["TM", "POSE"].join(""), relativePath);
  forbidText(source, ["turbowarp", "tm", "pose"].join("-"), relativePath);
  forbidText(source, ["README", "ja.md"].join("_"), relativePath);
}

process.stdout.write("Repository policy is aligned.\n");
