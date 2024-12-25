// src/renderer/hooks/useRecording.ts
import { useState, useCallback, useEffect, useRef } from "react";

export const useRecording = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  const startRecording = useCallback(async () => {
    try {
      setError(null);

      // オーディオソースの取得
      const sources = await window.electron.ipcRenderer.getAudioSources();
      console.log("Available sources:", sources);

      // システムオーディオまたは必要なウィンドウを探す
      const targetSource = sources.find(
        (source) =>
          source.name === "System Audio" ||
          source.name.includes("Google Meet") ||
          source.name.includes("Zoom")
      );

      if (!targetSource) {
        throw new Error("適切なオーディオソースが見つかりませんでした");
      }

      // オーディオストリームの取得
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          // @ts-ignore - Electronの特殊な設定
          mandatory: {
            chromeMediaSource: "desktop",
            chromeMediaSourceId: targetSource.id,
          },
        },
        video: false,
      });

      streamRef.current = stream;

      // MediaRecorderの設定
      const recorder = new MediaRecorder(stream, {
        mimeType: "audio/webm;codecs=opus",
      });

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
          handleAudioData(event.data);
        }
      };

      recorder.onstart = () => {
        audioChunksRef.current = [];
        setIsRecording(true);
        window.electron.ipcRenderer.send("recording-status-change", "started");
      };

      recorder.onstop = () => {
        setIsRecording(false);
        window.electron.ipcRenderer.send("recording-status-change", "stopped");

        if (audioChunksRef.current.length > 0) {
          const audioBlob = new Blob(audioChunksRef.current, {
            type: "audio/webm;codecs=opus",
          });
          handleFinalAudio(audioBlob);
        }
      };

      mediaRecorderRef.current = recorder;
      recorder.start(1000); // 1秒ごとにデータを取得
    } catch (err: any) {
      console.error("録音の開始に失敗しました:", err);
      setError(err.message);
      setIsRecording(false);
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state === "recording"
    ) {
      mediaRecorderRef.current.stop();

      // ストリームのトラックを停止
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    }
  }, []);

  const handleAudioData = async (audioBlob: Blob) => {
    try {
      // ここで1秒ごとの音声データを処理
      // 例: 音声認識APIにストリーミング
      const arrayBuffer = await audioBlob.arrayBuffer();
      console.log("Received audio chunk:", arrayBuffer.byteLength, "bytes");
    } catch (err: any) {
      console.error("音声データの処理中にエラーが発生しました:", err);
    }
  };

  const handleFinalAudio = async (audioBlob: Blob) => {
    try {
      // 録音終了時の完全な音声データを処理
      const arrayBuffer = await audioBlob.arrayBuffer();
      console.log("Final audio size:", arrayBuffer.byteLength, "bytes");
      // TODO: 必要に応じてバックエンドに送信
    } catch (err: any) {
      console.error("最終音声データの処理中にエラーが発生しました:", err);
    }
  };

  // クリーンアップ
  useEffect(() => {
    return () => {
      if (
        mediaRecorderRef.current &&
        mediaRecorderRef.current.state === "recording"
      ) {
        mediaRecorderRef.current.stop();
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  return {
    isRecording,
    error,
    startRecording,
    stopRecording,
  };
};

export default useRecording;
