// SmartEco desktop shell (Electron).
// The app is server-rendered (AI classification runs on the server), so the
// desktop window loads the deployed site instead of a static bundle.
const { app, BrowserWindow, shell, session } = require("electron");
const path = require("path");

const APP_URL = process.env.SMARTECO_URL || "https://sort-smart-mobile.lovable.app";
const APP_ORIGIN = new URL(APP_URL).origin;

let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 820,
    minWidth: 420,
    minHeight: 620,
    backgroundColor: "#0b1120",
    title: "SmartEco",
    icon: path.join(__dirname, "icon.png"),
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  mainWindow.loadURL(APP_URL);

  // Open external links in the system browser, keep the app in-window.
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (!url.startsWith(APP_ORIGIN)) {
      void shell.openExternal(url);
      return { action: "deny" };
    }
    return { action: "allow" };
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  // Grant camera (and only camera/media) to our own origin so the scanner works.
  session.defaultSession.setPermissionRequestHandler((wc, permission, callback) => {
    const from = wc.getURL() || "";
    const allowed = permission === "media" || permission === "camera";
    callback(allowed && from.startsWith(APP_ORIGIN));
  });

  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
