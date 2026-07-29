import { readdir, stat } from "node:fs/promises";
import { join, relative } from "node:path";

const root = process.cwd();
const maximumBytes = 95 * 1024 * 1024;
const excludedDirectories = new Set([
  ".git",
  "node_modules",
  "dist",
  "electron-release",
  "release-artifacts",
]);
const oversizedFiles = [];

async function scan(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.isDirectory() && excludedDirectories.has(entry.name)) continue;

    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      await scan(path);
      continue;
    }

    if (!entry.isFile()) continue;
    const file = await stat(path);
    if (file.size >= maximumBytes) {
      oversizedFiles.push({ path: relative(root, path), size: file.size });
    }
  }
}

await scan(root);

if (oversizedFiles.length) {
  console.error("\nRepository size guard failed. Move these release artifacts outside the project:\n");
  for (const file of oversizedFiles) {
    console.error(`- ${file.path} (${(file.size / 1024 / 1024).toFixed(2)} MB)`);
  }
  console.error("\nFiles near GitHub's 100 MB limit must not be committed.\n");
  process.exit(1);
}

console.log("Repository size guard passed: no source file is 95 MB or larger.");