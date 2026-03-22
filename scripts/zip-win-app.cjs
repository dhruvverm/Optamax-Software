const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const root = path.join(__dirname, "..");
const unpacked = path.join(root, "dist-electron", "win-unpacked");
const out = path.join(root, "dist-electron", "SideView-Windows-x64.zip");

if (!fs.existsSync(path.join(unpacked, "SideView.exe"))) {
  console.error("zip-win-app: dist-electron/win-unpacked/SideView.exe not found.");
  console.error("Run: npm run electron:build:win:dir");
  process.exit(1);
}

if (fs.existsSync(out)) fs.unlinkSync(out);

if (process.platform === "win32") {
  execSync(`tar.exe -a -c -f "${out}" -C "${unpacked}" .`, {
    stdio: "inherit",
    cwd: root,
  });
} else {
  execSync(`zip -r -q "${out}" .`, { cwd: unpacked, stdio: "inherit" });
}

const mb = (fs.statSync(out).size / (1024 * 1024)).toFixed(1);
console.log(`zip-win-app: ${out} (${mb} MB)`);
console.log("Share this zip. On Windows: extract all → double-click SideView.exe");
