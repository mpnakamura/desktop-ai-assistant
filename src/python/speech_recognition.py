from google.cloud.speech_v2 import SpeechClient
from google.cloud.speech_v2.types import cloud_speech
from typing import AsyncGenerator, Dict, Any, Generator
import numpy as np

class SpeechRecognizer:
    def __init__(self):
        try:
            self.client = SpeechClient()
            self.project_id = "matomel-432915"
            print("Successfully initialized Speech-to-Text client")
            
            # 基本設定
            self.config = cloud_speech.RecognitionConfig(
                explicit_decoding_config=cloud_speech.ExplicitDecodingConfig(
                    encoding=cloud_speech.ExplicitDecodingConfig.AudioEncoding.LINEAR16,
                    sample_rate_hertz=16000,
                    audio_channel_count=1,
                ),
                language_codes=["ja-JP"],
                model="long",
            )
        except Exception as e:
            print(f"Failed to initialize client: {e}")
            raise

    def process_audio_data(self, audio_data: np.ndarray, sample_rate: int) -> bytes:
        """音声データをバイト列に変換"""
        # 音声データの正規化（-1.0から1.0の範囲に）
        max_value = np.max(np.abs(audio_data))
        if max_value > 0:
            audio_data = audio_data / max_value
            
        # float32からint16に変換
        audio_data = (audio_data * 32767).astype(np.int16)
        return audio_data.tobytes()

    async def transcribe_audio(self, audio_bytes: bytes) -> AsyncGenerator[Dict[str, Any], None]:
        """音声データから文字起こしを実行"""
        try:
            print(f"Processing audio data of size: {len(audio_bytes)} bytes")
            
            # 認識リクエストを作成
            request = cloud_speech.RecognizeRequest(
                recognizer=f"projects/{self.project_id}/locations/global/recognizers/_",
                config=self.config,
                content=audio_bytes,
            )

            # 音声認識を実行
            print("Sending recognition request...")
            response = self.client.recognize(request=request)
            print("Received recognition response")
            
            # 結果を処理
            results_count = 0
            for result in response.results:
                results_count += 1
                if result.alternatives:
                    print(f"Transcription result: {result.alternatives[0].transcript}")
                    yield {
                        "is_final": True,
                        "transcript": result.alternatives[0].transcript,
                        "confidence": result.alternatives[0].confidence
                    }
            
            print(f"Processed {results_count} results")

        except Exception as e:
            import traceback
            print(f"Error details: {traceback.format_exc()}")
            yield {
                "error": f"Recognition error: {str(e)}"
            }
