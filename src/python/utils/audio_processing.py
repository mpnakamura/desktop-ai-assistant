# utils/audio_processing.py
import numpy as np
import soundfile as sf
from typing import Union, Tuple
import io

class AudioProcessor:
    def __init__(self, sample_rate: int = 16000):
        self.sample_rate = sample_rate

    def process_audio_stream(self, audio_data: Union[bytes, np.ndarray]) -> Tuple[np.ndarray, int]:
        """
        音声ストリームを処理し、適切なフォーマットに変換します
        """
        if isinstance(audio_data, bytes):
            # バイトデータをnumpy配列に変換
            with io.BytesIO(audio_data) as buf:
                audio_array, sample_rate = sf.read(buf)
                if sample_rate != self.sample_rate:
                    # リサンプリングが必要な場合の処理
                    # TODO: 必要に応じてリサンプリング処理を実装
                    pass
        else:
            audio_array = audio_data
            
        return audio_array, self.sample_rate

    @staticmethod
    def get_audio_duration(audio_data: np.ndarray, sample_rate: int) -> float:
        """
        音声データの長さを秒単位で計算します
        """
        return len(audio_data) / sample_rate

    @staticmethod
    def normalize_audio(audio_data: np.ndarray) -> np.ndarray:
        """
        音声データを正規化します
        """
        return audio_data / np.max(np.abs(audio_data))

    def convert_to_mono(self, audio_data: np.ndarray) -> np.ndarray:
        """
        ステレオ音声をモノラルに変換します
        """
        if len(audio_data.shape) > 1 and audio_data.shape[1] > 1:
            return np.mean(audio_data, axis=1)
        return audio_data

    def prepare_for_recognition(self, audio_data: Union[bytes, np.ndarray]) -> Tuple[np.ndarray, int]:
        """
        音声認識のための前処理を行います
        """
        # 音声データの変換
        audio_array, sample_rate = self.process_audio_stream(audio_data)
        
        # モノラルに変換
        audio_array = self.convert_to_mono(audio_array)
        
        # 正規化
        audio_array = self.normalize_audio(audio_array)
        
        return audio_array, sample_rate
