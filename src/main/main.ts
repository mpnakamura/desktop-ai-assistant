// src/main/main.ts
import { app, BrowserWindow, ipcMain } from "electron";
import path from "path";
import WebSocket from "ws";

let mainWindow: BrowserWindow | null = null;
let wsClient: WebSocket | null = null;

// WebSocketクライアントの初期化
function initializeWebSocket() {
  wsClient = new WebSocket("ws://localhost:8000/ws");

  wsClient.on("open", () => {
    console.log("WebSocket connection established");
  });

  wsClient.on("message", (data) => {
    // Pythonからの応答をレンダラーに転送
    if (mainWindow) {
      mainWindow.webContents.send(
        "transcription-result",
        JSON.parse(data.toString())
      );
    }
  });

  wsClient.on("close", () => {
    console.log("WebSocket connection closed");
    // 再接続を試みる
    setTimeout(initializeWebSocket, 3000);
  });

  wsClient.on("error", (error) => {
    console.error("WebSocket error:", error);
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: true,
      sandbox: false,
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

app.whenReady().then(() => {
  createWindow();
  initializeWebSocket();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    if (wsClient) {
      wsClient.close();
    }
    app.quit();
  }
});

// 音声データの受信と転送
ipcMain.on("audio-data", (event, data) => {
  if (wsClient && wsClient.readyState === WebSocket.OPEN) {
    wsClient.send(
      JSON.stringify({
        type: "audio",
        data: data.buffer,
        sampleRate: data.sampleRate,
      })
    );
  }
});

// デバイス一覧の取得
ipcMain.handle("get-audio-devices", async () => {
  return mainWindow?.webContents.executeJavaScript(`
    navigator.mediaDevices.enumerateDevices()
      .then(devices => devices.filter(device => device.kind === 'audioinput'))
  `);
});
