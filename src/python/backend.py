# src/python/backend.py
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import logging
from typing import List, Dict, Any
import numpy as np
from utils.audio_processing import AudioProcessor
from speech_recognition import SpeechRecognizer

# ロギング設定
logging.basicConfig(
    level=logging.DEBUG,  # より詳細なログを有効化
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = FastAPI()
audio_processor = AudioProcessor()
speech_recognizer = SpeechRecognizer()

# CORS設定
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# WebSocket接続管理
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []
        
    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info("New WebSocket connection established")
        
    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)
        logger.info("WebSocket connection closed")

manager = ConnectionManager()

# 音声バッファ管理
class DualAudioBuffer:
    def __init__(self):
        self.blackhole_buffer = []
        self.mic_buffer = []
        self.CHUNK_SIZE = 16000  # 1秒分のデータ

    def add_data(self, data: List[float], source: str) -> tuple:
        if source == 'blackhole':
            self.blackhole_buffer.extend(data)
            if len(self.blackhole_buffer) >= self.CHUNK_SIZE:
                chunk = np.array(self.blackhole_buffer[:self.CHUNK_SIZE], dtype=np.float32)
                self.blackhole_buffer = self.blackhole_buffer[self.CHUNK_SIZE:]
                return chunk, 'blackhole'
        else:  # mic
            self.mic_buffer.extend(data)
            if len(self.mic_buffer) >= self.CHUNK_SIZE:
                chunk = np.array(self.mic_buffer[:self.CHUNK_SIZE], dtype=np.float32)
                self.mic_buffer = self.mic_buffer[self.CHUNK_SIZE:]
                return chunk, 'mic'
        return None, None

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    audio_buffer = DualAudioBuffer()
    connection_id = id(websocket)
    logger.debug(f"New connection established. ID: {connection_id}")
    
    try:
        while True:
            # 受信データのデバッグ出力
            raw_data = await websocket.receive_json()
            logger.debug(f"Raw data received: {str(raw_data)[:100]}...")  # データの先頭100文字だけ表示
            
            if raw_data.get("type") == "audio":
                try:
                    # データ構造の検証
                    if "audioBuffer" not in raw_data:
                        logger.error(f"Missing audioBuffer in data: {raw_data.keys()}")
                        continue
                        
                    # 音声データの処理
                    audio_data = np.array(raw_data["audioBuffer"], dtype=np.float32)
                    sample_rate = raw_data.get("sampleRate", 16000)
                    source = raw_data.get("source", "unknown")
                    level = raw_data.get("level", 0.0)

                    logger.debug(f"Processing audio - Source: {source}, Length: {len(audio_data)}, "
                               f"Sample Rate: {sample_rate}, Level: {level}")

                    # バッファにデータを追加
                    chunk, chunk_source = audio_buffer.add_data(audio_data.tolist(), source)
                    if chunk is not None:
                        logger.debug(f"Chunk ready from {chunk_source} - Length: {len(chunk)}")
                        
                        # 音声認識の処理をここに追加予定
                        
                        response_data = {
                            "type": "transcription",
                            "data": {
                                "text": f"Audio from {chunk_source}",
                                "source": chunk_source,
                                "level": float(level),
                                "timestamp": raw_data.get("timestamp", 0)
                            }
                        }
                        await websocket.send_json(response_data)
                        
                except Exception as e:
                    logger.error(f"Error processing audio data: {str(e)}")
                    logger.exception(e)
                    continue
    
    except WebSocketDisconnect:
        logger.info(f"Connection {connection_id} disconnected normally")
    except Exception as e:
        logger.error(f"Error in connection {connection_id}: {str(e)}")
        logger.exception(e)
    finally:
        manager.disconnect(websocket)
        logger.debug(f"Connection {connection_id} cleanup complete")

if __name__ == "__main__":
    # サーバー設定
    config = uvicorn.Config(
        app=app,
        host="0.0.0.0",
        port=8000,
        log_level="debug",  # より詳細なログを有効化
        reload=True  # 開発時のホットリロード
    )
    
    # サーバー起動
    server = uvicorn.Server(config)
    try:
        server.run()
    except KeyboardInterrupt:
        logger.info("Server shutting down...")
