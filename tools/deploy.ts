// Publishes the built site, site/dist, to the gh-pages branch, which GitHub Pages serves at its own domain,
// https://delineate.appautomaton.com/. The branch holds the latest build alone, one commit replaced on
// every deploy, so the repository never carries each build's drawings. The site is built here, not by GitHub:
// Collage's drawings and the portraits' planes are made from sources kept on this machine.
//
//   npm run deploy        (builds the site, then publishes it)
//
// Pushing main runs it, through .githooks/pre-push, which npm install turns on.

import { execFileSync } from "node:child_process";
import { cpSync, existsSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("../", import.meta.url));
// The domain Pages serves the site at; it lives in the branch's CNAME file, so every deploy writes it again.
const DOMAIN = "delineate.appautomaton.com";
const DIST = join(ROOT, "site/dist");
// The pre-push hook runs this with git's own variables set, and from a worktree GIT_DIR is absolute: left in place,
// the git init below would reach past its scratch directory into the repository itself.
for (const key of ["GIT_DIR", "GIT_WORK_TREE", "GIT_INDEX_FILE", "GIT_COMMON_DIR", "GIT_OBJECT_DIRECTORY", "GIT_PREFIX"]) {
  delete process.env[key];
}
const git = (cwd: string, ...args: string[]) => execFileSync("git", args, { cwd, encoding: "utf8" }).trim();

if (!existsSync(join(DIST, "index.html"))) throw new Error("site/dist is empty: run npm run site first");
// A build is published only from a commit, so what is served can always be traced to its source.
if (git(ROOT, "status", "--porcelain")) throw new Error("commit or set aside your changes first, so the build matches a commit");

const source = git(ROOT, "rev-parse", "--short", "HEAD");
const who = ["-c", `user.name=${git(ROOT, "config", "user.name")}`, "-c", `user.email=${git(ROOT, "config", "user.email")}`];
const dir = mkdtempSync(join(tmpdir(), "delineate-pages-"));
try {
  cpSync(DIST, dir, { recursive: true });
  // Served as it stands: without this, Pages would run the files through Jekyll first.
  writeFileSync(join(dir, ".nojekyll"), "");
  writeFileSync(join(dir, "CNAME"), `${DOMAIN}\n`);
  git(dir, "init", "-q", "-b", "gh-pages");
  git(dir, "add", "-A");
  git(dir, ...who, "commit", "-q", "-m", `The site, as built from ${source}`);
  execFileSync("git", ["push", "-q", "-f", git(ROOT, "remote", "get-url", "origin"), "gh-pages"], { cwd: dir, stdio: "inherit" });
  console.log(`published ${source} to gh-pages: https://${DOMAIN}/`);
} finally {
  rmSync(dir, { recursive: true, force: true });
}
