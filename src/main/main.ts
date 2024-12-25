// src/main/main.ts
import { app, BrowserWindow, ipcMain, desktopCapturer } from "electron";
import path from "path";

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: true,
      sandbox: false, // desktopCapturerを使用するために必要
      preload: path.join(__dirname, "preload.js"),
    },
  });

  if (process.env.NODE_ENV === "development") {
    mainWindow.loadURL("http://localhost:5173");
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, "../renderer/index.html"));
  }

  return mainWindow;
}

// デスクトップキャプチャのソース取得用ハンドラー
ipcMain.handle("get-audio-sources", async () => {
  try {
    const sources = await desktopCapturer.getSources({
      types: ["window", "screen"],
      thumbnailSize: { width: 0, height: 0 },
    });
    return sources;
  } catch (error) {
    console.error("Error getting audio sources:", error);
    throw error;
  }
});

// 録音状態の管理用ハンドラー
ipcMain.on("recording-status-change", (event, status) => {
  console.log("Recording status:", status);
  if (mainWindow) {
    mainWindow.webContents.send("recording-status-update", status);
  }
});

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
