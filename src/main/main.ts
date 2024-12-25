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
    // WebSocket接続が確立されたときの処理
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
    // WebSocket接続が閉じられたときの処理
    // 再接続を試みる
    setTimeout(initializeWebSocket, 3000);
  });

  wsClient.on("error", (error) => {
    // WebSocketエラー時の処理
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
// main.ts の該当部分
ipcMain.on("send-audio-data", (event, data) => {
  if (wsClient && wsClient.readyState === WebSocket.OPEN) {
    const audioFloat32 = new Float32Array(data.audioBuffer);
    const audioList = Array.from(audioFloat32);

    wsClient.send(
      JSON.stringify({
        type: "audio",
        audioBuffer: audioList,
        sampleRate: 16000,
        source: data.source,
        level: 0.0,
        timestamp: Date.now(),
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
