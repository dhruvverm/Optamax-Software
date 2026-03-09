const electron = require("electron");
const { app, BrowserWindow, shell } = electron;
const path = require("path");
const { fork, execFileSync } = require("child_process");
const net = require("net");
const http = require("http");
const fs = require("fs");

let mainWindow;
let nextServer;

const APP_NAME = "SideView";

function isDev() {
  return !app.isPackaged;
}

function getDbPath() {
  const userDir = app.getPath("userData");
  if (!fs.existsSync(userDir)) fs.mkdirSync(userDir, { recursive: true });
  return path.join(userDir, "sideview.db");
}

function findFreePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.listen(0, () => {
      const port = server.address().port;
      server.close(() => resolve(port));
    });
    server.on("error", reject);
  });
}

function getAppRoot() {
  if (isDev()) return path.join(__dirname, "..");
  return path.join(process.resourcesPath, "app");
}

function runMigrations() {
  const dbPath = getDbPath();
  try {
    let cwd, prismaJs;
    if (isDev()) {
      cwd = path.join(__dirname, "..");
      prismaJs = path.join(cwd, "node_modules", "prisma", "build", "index.js");
    } else {
      cwd = path.join(process.resourcesPath, "prisma-data");
      prismaJs = path.join(cwd, "node_modules", "prisma", "build", "index.js");
    }

    if (!fs.existsSync(prismaJs)) {
      console.log("Prisma not found at", prismaJs, "— skipping migration");
      return;
    }

    execFileSync(process.execPath, [prismaJs, "migrate", "deploy"], {
      env: {
        ...process.env,
        DATABASE_URL: `file:${dbPath}`,
        ELECTRON_RUN_AS_NODE: "1",
      },
      cwd,
      stdio: "pipe",
    });
    console.log("Migrations applied successfully to", dbPath);
  } catch (err) {
    console.log("Migration note:", err.stderr?.toString().slice(0, 300) || err.message?.slice(0, 300));
  }
}

async function startNextServer(port) {
  const dbPath = getDbPath();
  const appRoot = getAppRoot();

  const env = {
    ...process.env,
    PORT: String(port),
    HOSTNAME: "127.0.0.1",
    SIDEVIEW_DB_PATH: dbPath,
    DATABASE_URL: `file:${dbPath}`,
    ELECTRON_RUN_AS_NODE: "1",
  };

  if (isDev()) {
    const nextBin = path.join(appRoot, "node_modules", "next", "dist", "bin", "next");
    nextServer = fork(nextBin, ["dev", "-p", String(port)], {
      cwd: appRoot,
      env: { ...env, NODE_ENV: "development" },
      silent: true,
    });
  } else {
    const standaloneDir = path.join(appRoot, ".next", "standalone");
    const serverJs = path.join(standaloneDir, "server.js");

    if (fs.existsSync(serverJs)) {
      nextServer = fork(serverJs, [], {
        cwd: standaloneDir,
        env: { ...env, NODE_ENV: "production" },
        silent: true,
      });
    } else {
      const nextBin = path.join(appRoot, "node_modules", "next", "dist", "bin", "next");
      nextServer = fork(nextBin, ["start", "-p", String(port), "-H", "127.0.0.1"], {
        cwd: appRoot,
        env: { ...env, NODE_ENV: "production" },
        silent: true,
      });
    }
  }

  nextServer.stdout?.on("data", (d) => console.log(`[Next] ${d}`));
  nextServer.stderr?.on("data", (d) => console.error(`[Next] ${d}`));
  nextServer.on("close", (code) => {
    console.log(`Next server exited with code ${code}`);
    if (code !== 0 && code !== null && mainWindow) app.quit();
  });
}

async function waitForServer(port, timeout = 45000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    try {
      await new Promise((resolve, reject) => {
        const req = http.get(`http://127.0.0.1:${port}`, (res) => resolve(res));
        req.on("error", reject);
        req.setTimeout(2000, () => { req.destroy(); reject(new Error("timeout")); });
      });
      return true;
    } catch {
      await new Promise((r) => setTimeout(r, 500));
    }
  }
  throw new Error("Server did not start in time");
}

function createWindow(port) {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    title: APP_NAME,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
    show: false,
    titleBarStyle: "hiddenInset",
    trafficLightPosition: { x: 15, y: 15 },
  });

  mainWindow.loadURL(`http://127.0.0.1:${port}`);

  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
    if (isDev()) mainWindow.webContents.openDevTools();
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  mainWindow.on("closed", () => { mainWindow = null; });
}

app.on("ready", async () => {
  try {
    const port = isDev() ? 3456 : await findFreePort();
    console.log(`Starting ${APP_NAME} on port ${port}...`);
    console.log(`Database: ${getDbPath()}`);

    runMigrations();
    await startNextServer(port);
    await waitForServer(port);
    createWindow(port);
  } catch (err) {
    console.error("Failed to start:", err);
    app.quit();
  }
});

app.on("window-all-closed", () => {
  if (nextServer) nextServer.kill();
  app.quit();
});

app.on("before-quit", () => {
  if (nextServer) nextServer.kill();
});
