from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from typing import List, Dict, Any, Tuple
import numpy as np
from collections import deque
import time
from utils.audio_processing import AudioProcessor
from speech_recognizer import SpeechRecognizer

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
        
    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

manager = ConnectionManager()

# 音声バッファ管理
class DualAudioBuffer:
    def __init__(self):
        self.mic_buffer = []
        self.text_buffer = deque(maxlen=5)  # 最近の5つの文字起こし結果を保持
        self.last_chunk_time = time.time()
        
        # バッファサイズの設定
        self.MIN_CHUNK_SIZE = 16000   # 1秒
        self.MAX_CHUNK_SIZE = 48000   # 3秒
        self.current_chunk_size = self.MIN_CHUNK_SIZE
        
        # 無音検出のパラメータ
        self.silence_threshold = 0.01
        self.min_chunk_interval = 1.0  # 最小チャンク間隔（秒）
        
    def is_silence(self, data: List[float]) -> bool:
        """無音区間を検出"""
        return np.mean(np.abs(data)) < self.silence_threshold
    
    def should_process_chunk(self) -> bool:
        """チャンク処理のタイミングを判断"""
        current_time = time.time()
        if current_time - self.last_chunk_time < self.min_chunk_interval:
            return False
        return True

    def add_data(self, data: List[float], source: str) -> Tuple[np.ndarray, str]:
        """音声データをバッファに追加し、必要に応じてチャンクを返す"""
        if source == 'mic':
            self.mic_buffer.extend(data)
            
            # バッファサイズと時間間隔の両方を確認
            if len(self.mic_buffer) >= self.current_chunk_size and self.should_process_chunk():
                chunk = np.array(self.mic_buffer[:self.current_chunk_size], dtype=np.float32)
                self.mic_buffer = self.mic_buffer[self.current_chunk_size:]
                self.last_chunk_time = time.time()
                
                duration = len(chunk) / 16000
                print(f"Processing chunk: {duration:.2f} seconds")
                return chunk, 'mic'
                
        return None, None

    def add_transcription(self, text: str) -> str:
        """文字起こし結果を追加し、コンテキストを考慮した結果を返す"""
        if not text:
            return ""
            
        self.text_buffer.append(text)
        
        # 最近の結果を結合して重複を除去
        combined_text = " ".join(self.text_buffer)
        words = combined_text.split()
        unique_words = []
        
        for word in words:
            if not unique_words or word != unique_words[-1]:
                unique_words.append(word)
                
        return " ".join(unique_words)

    def get_current_duration(self) -> float:
        """現在のチャンクサイズの秒数を返す"""
        return self.current_chunk_size / 16000

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    audio_buffer = DualAudioBuffer()
    print("New WebSocket connection established")
    
    try:
        while True:
            raw_data = await websocket.receive_json()
            
            if raw_data.get("type") == "audio":
                try:
                    if "audioBuffer" not in raw_data:
                        print("Missing audioBuffer in data")
                        continue
                        
                    audio_data = np.array(raw_data["audioBuffer"], dtype=np.float32)
                    sample_rate = raw_data.get("sampleRate", 16000)
                    source = raw_data.get("source", "unknown")
                    level = raw_data.get("level", 0.0)

                    print(f"Received audio chunk: length={len(audio_data)}, source={source}")
                    
                    chunk, chunk_source = audio_buffer.add_data(audio_data.tolist(), source)
                    if chunk is not None:
                        print(f"Processing chunk of size: {len(chunk)}")
                        processed_audio = speech_recognizer.process_audio_data(chunk, sample_rate)
                        
                        async for result in speech_recognizer.transcribe_audio(processed_audio):
                            if "error" in result:
                                print(f"Transcription error: {result['error']}")
                                transcription_text = "[Error in transcription]"
                            else:
                                transcription_text = result["transcript"]
                                print(f"Raw transcription result: {transcription_text}")
                            
                            if transcription_text and not transcription_text.startswith("[Error"):
                                # コンテキストを考慮した文字起こし結果を取得
                                context_aware_text = audio_buffer.add_transcription(transcription_text)
                                print(f"Context-aware transcription: {context_aware_text}")
                                
                                response_data = {
                                    "type": "transcription",
                                    "data": {
                                        "text": context_aware_text,
                                        "source": chunk_source,
                                        "level": float(level),
                                        "timestamp": raw_data.get("timestamp", 0)
                                    }
                                }
                                await websocket.send_json(response_data)
                        
                except Exception as e:
                    import traceback
                    print(f"Error processing audio: {str(e)}")
                    print(traceback.format_exc())
                    continue
    
    except WebSocketDisconnect:
        print("WebSocket disconnected")
    except Exception as e:
        print(f"WebSocket error: {str(e)}")
    finally:
        manager.disconnect(websocket)
        print("WebSocket connection closed")

if __name__ == "__main__":
    config = uvicorn.Config(
        app=app,
        host="0.0.0.0",
        port=8000,
        log_level="info",
        reload=True
    )
    
    server = uvicorn.Server(config)
    try:
        server.run()
    except KeyboardInterrupt:
        pass
