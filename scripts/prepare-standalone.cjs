const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");

function copyRecursive(src, dest) {
  if (!fs.existsSync(src)) {
    console.warn(`prepare-standalone: skip (missing): ${src}`);
    return;
  }
  fs.mkdirSync(dest, { recursive: true });
  for (const ent of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, ent.name);
    const d = path.join(dest, ent.name);
    if (ent.isDirectory()) copyRecursive(s, d);
    else fs.copyFileSync(s, d);
  }
}

const staticSrc = path.join(root, ".next", "static");
const staticDest = path.join(root, ".next", "standalone", ".next", "static");
const publicSrc = path.join(root, "public");
const publicDest = path.join(root, ".next", "standalone", "public");

copyRecursive(staticSrc, staticDest);
copyRecursive(publicSrc, publicDest);

const strayDb = path.join(root, ".next", "standalone", "dev.db");
if (fs.existsSync(strayDb)) {
  fs.unlinkSync(strayDb);
  console.log("prepare-standalone: removed traced dev.db from standalone");
}

console.log("prepare-standalone: copied .next/static and public into standalone");
