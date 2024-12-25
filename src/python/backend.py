# backend.py
from fastapi import FastAPI, WebSocket, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import asyncio
import json
from typing import Dict, List
import logging
from utils.audio_processing import AudioProcessor
from speech_recognition import SpeechRecognizer

app = FastAPI()
audio_processor = AudioProcessor()
speech_recognizer = SpeechRecognizer()

# CORS設定
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 本番環境では適切に制限する
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# WebSocket接続を管理
active_connections: List[WebSocket] = []

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    active_connections.append(websocket)
    try:
        while True:
            # クライアントからの音声データを受信
            data = await websocket.receive_bytes()
            
            # 音声データの前処理
            processed_audio, sample_rate = audio_processor.prepare_for_recognition(data)
            
            # ストリーミング認識の実行
            async for result in speech_recognizer.transcribe_streaming(
                audio_generator=_audio_generator(processed_audio)
            ):
                # 結果をクライアントに送信
                await websocket.send_json(result)
                
    except Exception as e:
        logging.error(f"WebSocket error: {str(e)}")
    finally:
        active_connections.remove(websocket)

async def _audio_generator(audio_data):
    """
    音声データをチャンクに分割してジェネレータとして提供
    """
    chunk_size = 16000  # 1秒分のデータ
    for i in range(0, len(audio_data), chunk_size):
        chunk = audio_data[i:i + chunk_size]
        yield chunk.tobytes()
        await asyncio.sleep(0.1)  # ストリーミングをシミュレート

@app.post("/upload")
async def upload_audio(file: UploadFile = File(...)):
    """
    音声ファイルをアップロードして一括処理
    """
    try:
        contents = await file.read()
        processed_audio, sample_rate = audio_processor.prepare_for_recognition(contents)
        
        # 文字起こしの実行
        transcription_results = []
        async for result in speech_recognizer.transcribe_streaming(
            audio_generator=_audio_generator(processed_audio)
        ):
            if result["is_final"]:
                transcription_results.append(result)
        
        return {"results": transcription_results}
        
    except Exception as e:
        return {"error": str(e)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
