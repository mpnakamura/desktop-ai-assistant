from transformers import pipeline
import torch
from typing import AsyncGenerator, Dict, Any
import numpy as np

class SpeechRecognizer:
    def __init__(self):
        try:
            print("Initializing SpeechRecognizer...")
            device = "cuda:0" if torch.cuda.is_available() else "cpu"
            print(f"Using device: {device}")
            
            torch_dtype = torch.bfloat16 if torch.cuda.is_available() else torch.float32
            model_kwargs = {"attn_implementation": "sdpa"} if torch.cuda.is_available() else {}

            self.pipe = pipeline(
                "automatic-speech-recognition",
                model="kotoba-tech/kotoba-whisper-v2.0",
                torch_dtype=torch_dtype,
                device=device,
                model_kwargs=model_kwargs
            )
            
            print("Successfully initialized Kotoba-Whisper")
        except Exception as e:
            print(f"Failed to initialize Whisper: {e}")
            import traceback
            print(traceback.format_exc())
            raise

    def process_audio_data(self, audio_data: np.ndarray, sample_rate: int) -> np.ndarray:
        """音声データを処理し、認識用の形式に変換"""
        try:
            print(f"Processing audio data: shape={audio_data.shape}, dtype={audio_data.dtype}")
            # 音声データの正規化（-1.0から1.0の範囲に）
            if np.max(np.abs(audio_data)) > 0:
                audio_data = audio_data / np.max(np.abs(audio_data))
            return audio_data
        except Exception as e:
            print(f"Error in process_audio_data: {e}")
            import traceback
            print(traceback.format_exc())
            raise

    async def transcribe_audio(self, audio_data: np.ndarray) -> AsyncGenerator[Dict[str, Any], None]:
        """音声データから文字起こしを実行し、結果を生成"""
        try:
            print(f"Transcribing audio data: shape={audio_data.shape}, dtype={audio_data.dtype}")
            
            # Whisperモデルに入力するための形式に変換
            audio_dict = {
                "array": audio_data,
                "sampling_rate": 16000
            }

            # 音声認識を実行
            result = self.pipe(
                audio_dict,
                generate_kwargs={"language": "ja", "task": "transcribe"},
                return_timestamps=True
            )
            
            print(f"Recognition result: {result}")
            
            if isinstance(result, dict) and "text" in result:
                yield {
                    "is_final": True,
                    "transcript": result["text"],
                    "confidence": 1.0
                }
            else:
                print(f"Unexpected result format: {result}")
                yield {"error": "Unexpected recognition result format"}

        except Exception as e:
            print(f"Error in transcribe_audio: {e}")
            import traceback
            print(traceback.format_exc())
            yield {"error": f"Recognition error: {str(e)}"}
