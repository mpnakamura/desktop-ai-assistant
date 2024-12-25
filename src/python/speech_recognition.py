# speech_recognition.py
from google.cloud import speech_v1
from typing import AsyncGenerator, Dict, Any, List
import asyncio
import numpy as np

class SpeechRecognizer:
    def __init__(self):
        self.client = speech_v1.SpeechClient()
        self.config = speech_v1.RecognitionConfig(
            encoding=speech_v1.RecognitionConfig.AudioEncoding.LINEAR16,
            sample_rate_hertz=16000,
            language_code="ja-JP",
            enable_automatic_punctuation=True,
            enable_word_time_offsets=True,
            model="latest_long",
        )

    async def generate_requests(self, audio_data: bytes) -> AsyncGenerator[speech_v1.StreamingRecognizeRequest, None]:
        # 設定を含む最初のリクエストを生成
        streaming_config = speech_v1.StreamingRecognitionConfig(
            config=self.config,
            interim_results=True
        )
        yield speech_v1.StreamingRecognizeRequest(
            streaming_config=streaming_config
        )

        # 音声データを含むリクエストを生成
        yield speech_v1.StreamingRecognizeRequest(
            audio_content=audio_data
        )

    async def transcribe_audio(self, audio_data: bytes) -> AsyncGenerator[Dict[str, Any], None]:
        requests = self.generate_requests(audio_data)
        
        # リクエストのリストを作成
        request_generator = await self._collect_requests(requests)
        
        try:
            responses = self.client.streaming_recognize(request_generator)
            
            for response in responses:
                for result in response.results:
                    yield {
                        "is_final": result.is_final,
                        "transcript": result.alternatives[0].transcript if result.alternatives else "",
                        "confidence": result.alternatives[0].confidence if result.alternatives else 0.0,
                    }
        except Exception as e:
            print(f"Error in transcribe_audio: {e}")
            yield {
                "error": str(e)
            }

    async def _collect_requests(self, requests_generator: AsyncGenerator) -> List[speech_v1.StreamingRecognizeRequest]:
        requests = []
        async for request in requests_generator:
            requests.append(request)
        return requests

    def process_audio_data(self, audio_data: np.ndarray, sample_rate: int) -> bytes:
        """音声データをバイト列に変換"""
        # 必要に応じてリサンプリング
        if sample_rate != 16000:
            # TODO: リサンプリング処理を実装
            pass
        
        # float32からint16に変換
        audio_data = (audio_data * 32767).astype(np.int16)
        return audio_data.tobytes()
