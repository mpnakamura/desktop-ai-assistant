// src/renderer/hooks/useRecording.ts
import { useState, useCallback, useEffect, useRef } from "react";

interface AudioStream {
  stream: MediaStream | null;
  audioContext: AudioContext | null;
  source: MediaStreamAudioSourceNode | null;
  processor: ScriptProcessorNode | null;
}

export const useRecording = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // BlackHole用とマイク用の別々のストリーム管理
  const blackholeStreamRef = useRef<AudioStream>({
    stream: null,
    audioContext: null,
    source: null,
    processor: null,
  });

  const micStreamRef = useRef<AudioStream>({
    stream: null,
    audioContext: null,
    source: null,
    processor: null,
  });

  const getAudioDevices = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      console.log("All available devices:", devices);

      // BlackHole (相手の音声用)
      const blackholeDevice = devices.find(
        (device) =>
          device.kind === "audioinput" && device.label.includes("BlackHole")
      );

      // デフォルトのマイク (自分の音声用)
      const micDevice = devices.find(
        (device) =>
          device.kind === "audioinput" &&
          !device.label.includes("BlackHole") &&
          !device.label.includes("default")
      );

      console.log("BlackHole device:", blackholeDevice);
      console.log("Microphone device:", micDevice);

      if (!blackholeDevice || !micDevice) {
        throw new Error("必要なオーディオデバイスが見つかりません");
      }

      return {
        blackholeId: blackholeDevice.deviceId,
        micId: micDevice.deviceId,
      };
    } catch (err) {
      console.error("デバイス検索エラー:", err);
      throw err;
    }
  };

  const setupAudioStream = async (
    deviceId: string,
    streamType: "blackhole" | "mic"
  ) => {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        deviceId: { exact: deviceId },
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false,
        sampleRate: 16000,
      },
    });

    const audioContext = new AudioContext({ sampleRate: 16000 });
    const source = audioContext.createMediaStreamSource(stream);
    const processor = audioContext.createScriptProcessor(4096, 1, 1);

    const audioWorkletNode = new AudioWorkletNode(audioContext, 'audio-processor');
    audioWorkletNode.port.onmessage = (event) => {
      const { inputData, level } = event.data;
      console.log(`${streamType} audio level:`, level.toFixed(4));
      // ここにデータ送信処理を追加
    };
    source.connect(audioWorkletNode);
    audioWorkletNode.connect(audioContext.destination);

    return {
      stream,
      audioContext,
      source,
      processor,
    };
  };

  const startRecording = useCallback(async () => {
    try {
      setError(null);
      const { blackholeId, micId } = await getAudioDevices();

      // BlackHoleストリームのセットアップ
      console.log("BlackHoleストリームのセットアップ開始");
      blackholeStreamRef.current = await setupAudioStream(
        blackholeId,
        "blackhole"
      );

      // マイクストリームのセットアップ
      console.log("マイクストリームのセットアップ開始");
      micStreamRef.current = await setupAudioStream(micId, "mic");

      setIsRecording(true);
      console.log("両方の録音開始成功");
    } catch (err: any) {
      console.error("録音エラー:", err);
      setError(err.message);
      setIsRecording(false);
      // エラー時のクリーンアップ
      stopRecording();
    }
  }, []);

  const stopRecording = useCallback(() => {
    console.log("録音停止処理開始");

    // BlackHoleストリームの停止
    if (blackholeStreamRef.current.stream) {
      blackholeStreamRef.current.stream
        .getTracks()
        .forEach((track) => track.stop());
      blackholeStreamRef.current.processor?.disconnect();
      blackholeStreamRef.current.source?.disconnect();
      blackholeStreamRef.current.audioContext?.close().catch(console.error);
      blackholeStreamRef.current = {
        stream: null,
        audioContext: null,
        source: null,
        processor: null,
      };
    }

    // マイクストリームの停止
    if (micStreamRef.current.stream) {
      micStreamRef.current.stream.getTracks().forEach((track) => track.stop());
      micStreamRef.current.processor?.disconnect();
      micStreamRef.current.source?.disconnect();
      micStreamRef.current.audioContext?.close().catch(console.error);
      micStreamRef.current = {
        stream: null,
        audioContext: null,
        source: null,
        processor: null,
      };
    }

    setIsRecording(false);
    console.log("全ての録音停止完了");
  }, []);

  useEffect(() => {
    return () => {
      if (isRecording) {
        stopRecording();
      }
    };
  }, [isRecording, stopRecording]);

  return {
    isRecording,
    error,
    startRecording,
    stopRecording,
  };
};

export default useRecording;
