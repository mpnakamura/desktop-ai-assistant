# speech_recognition.py
from google.cloud import speech_v1
from google.cloud.speech_v1 import SpeechClient
from typing import AsyncGenerator, Dict, Any
import asyncio
import io

class SpeechRecognizer:
    def __init__(self):
        self.client = speech_v1.SpeechClient()
        self.config = speech_v1.RecognitionConfig(
            encoding=speech_v1.RecognitionConfig.AudioEncoding.LINEAR16,
            sample_rate_hertz=16000,
            language_code="ja-JP",
            enable_automatic_punctuation=True,
            model="latest_long",
            enable_word_time_offsets=True,
            # 話者分離の設定を更新
            diarization_config=speech_v1.SpeakerDiarizationConfig(
                enable_speaker_diarization=True,
                min_speaker_count=1,
                max_speaker_count=2,
            )
        )
        self.streaming_config = speech_v1.StreamingRecognitionConfig(
            config=self.config,
            interim_results=True
        )

    async def transcribe_streaming(self, audio_generator: AsyncGenerator[bytes, None]) -> AsyncGenerator[Dict[str, Any], None]:
        requests = self._create_streaming_requests(audio_generator)
        responses = self.client.streaming_recognize(requests)

        for response in responses:
            if not response.results:
                continue

            result = response.results[0]
            if not result.alternatives:
                continue

            yield {
                "is_final": result.is_final,
                "transcript": result.alternatives[0].transcript,
                "confidence": result.alternatives[0].confidence,
                "timestamp": None  # TODO: タイムスタンプの実装
            }

    async def _create_streaming_requests(self, audio_generator: AsyncGenerator[bytes, None]) -> AsyncGenerator[speech_v1.StreamingRecognizeRequest, None]:
        # 設定を送信
        yield speech_v1.StreamingRecognizeRequest(streaming_config=self.streaming_config)

        # 音声データを送信
        async for content in audio_generator:
            yield speech_v1.StreamingRecognizeRequest(audio_content=content)

    def process_diarization(self, response: speech_v1.StreamingRecognizeResponse) -> Dict[str, Any]:
        if not response.results:
            return None

        result = response.results[-1]
        if not result.alternatives:
            return None

        words_info = []
        if hasattr(result.alternatives[0], 'words'):
            words_info = result.alternatives[0].words

        # 話者ごとにテキストをグループ化
        current_speaker = None
        current_text = []
        speaker_segments = []

        for word_info in words_info:
            if hasattr(word_info, 'speaker_tag'):
                speaker_tag = word_info.speaker_tag
            else:
                speaker_tag = 1  # デフォルトの話者タグ

            if current_speaker != speaker_tag:
                if current_text:
                    speaker_segments.append({
                        "speaker": f"Speaker {current_speaker}",
                        "text": " ".join(current_text)
                    })
                current_speaker = speaker_tag
                current_text = [word_info.word]
            else:
                current_text.append(word_info.word)

        if current_text:
            speaker_segments.append({
                "speaker": f"Speaker {current_speaker}",
                "text": " ".join(current_text)
            })

        return {
            "segments": speaker_segments,
            "is_final": result.is_final
        }
