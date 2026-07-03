// Creates git tags and GitHub Releases for freshly published packages, using a
// scope-stripped tag name (e.g. `router@1.1.0` instead of
// `@effector/router@1.1.0`). Release notes are taken from each package's
// CHANGELOG.md section for the published version.
//
// Consumes the `publishedPackages` output of changesets/action via the
// PUBLISHED_PACKAGES env var: a JSON array of { name, version }.
// Requires GITHUB_TOKEN in the environment (used by the `gh` CLI).

import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";

const published = JSON.parse(process.env.PUBLISHED_PACKAGES || "[]");

if (published.length === 0) {
  console.log("No published packages — nothing to release.");
  process.exit(0);
}

// Map package name -> directory by scanning the workspace packages.
const packagesRoot = "packages";
const nameToDir = {};
for (const entry of readdirSync(packagesRoot)) {
  const manifest = path.join(packagesRoot, entry, "package.json");
  if (!existsSync(manifest)) continue;
  const { name } = JSON.parse(readFileSync(manifest, "utf8"));
  if (name) nameToDir[name] = path.join(packagesRoot, entry);
}

function extractNotes(dir, version) {
  const changelog = path.join(dir, "CHANGELOG.md");
  if (!existsSync(changelog)) return "";
  const lines = readFileSync(changelog, "utf8").split("\n");
  const start = lines.findIndex((line) => line.trim() === `## ${version}`);
  if (start === -1) return "";
  let end = lines.length;
  for (let i = start + 1; i < lines.length; i++) {
    if (lines[i].startsWith("## ")) {
      end = i;
      break;
    }
  }
  return lines.slice(start + 1, end).join("\n").trim();
}

function git(args) {
  return execFileSync("git", args, { encoding: "utf8" }).trim();
}

function tagExists(tag) {
  try {
    git(["rev-parse", "-q", "--verify", `refs/tags/${tag}`]);
    return true;
  } catch {
    return false;
  }
}

function releaseExists(tag) {
  try {
    execFileSync("gh", ["release", "view", tag], { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

for (const { name, version } of published) {
  const short = name.replace(/^@[^/]+\//, ""); // strip the npm scope
  const tag = `${short}@${version}`;
  const dir = nameToDir[name];
  const notes = dir ? extractNotes(dir, version) : "";

  if (tagExists(tag)) {
    console.log(`Tag ${tag} already exists — skipping tag creation.`);
  } else {
    git(["tag", tag]);
    git(["push", "origin", tag]);
    console.log(`Created and pushed tag ${tag}.`);
  }

  if (releaseExists(tag)) {
    console.log(`Release ${tag} already exists — skipping.`);
    continue;
  }

  execFileSync(
    "gh",
    ["release", "create", tag, "--title", tag, "--notes-file", "-"],
    { input: notes || `${name}@${version}`, stdio: ["pipe", "inherit", "inherit"] },
  );
  console.log(`Created GitHub release ${tag}.`);
}
