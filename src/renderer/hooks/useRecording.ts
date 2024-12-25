import { useState, useCallback, useEffect, useRef } from "react";

interface AudioStream {
  stream: MediaStream | null;
  audioContext: AudioContext | null;
  source: MediaStreamAudioSourceNode | null;
  processor: AudioWorkletNode | null;
}

export const useRecording = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const micStreamRef = useRef<AudioStream>({
    stream: null,
    audioContext: null,
    source: null,
    processor: null,
  });

  const getAudioDevices = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      console.log("Available devices:", devices);

      // マイク (入力用)
      const micDevice = devices.find(
        (device) =>
          device.kind === "audioinput" && !device.label.includes("default")
      );

      if (!micDevice) {
        throw new Error("マイクデバイスが見つかりません");
      }

      console.log("Selected mic device:", micDevice);
      return { micId: micDevice.deviceId };
    } catch (err) {
      console.error("Device enumeration error:", err);
      throw err;
    }
  };

  const setupAudioStream = async (deviceId: string) => {
    console.log("Setting up audio stream for device:", deviceId);

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

    try {
      await audioContext.audioWorklet.addModule("./audio-processor.js");
      console.log("Audio worklet module loaded");
    } catch (err) {
      console.error("Failed to load audio worklet:", err);
      throw err;
    }

    const source = audioContext.createMediaStreamSource(stream);
    const audioWorkletNode = new AudioWorkletNode(
      audioContext,
      "audio-processor"
    );

    audioWorkletNode.port.onmessage = (event) => {
      const { level, audioChunk } = event.data;

      if (audioChunk && Array.isArray(audioChunk)) {
        console.log("Sending audio data:", {
          chunkLength: audioChunk.length,
          timestamp: Date.now(),
        });

        if (window.electron && window.electron.ipcRenderer) {
          window.electron.ipcRenderer.send("send-audio-data", {
            audioBuffer: audioChunk,
            source: "mic",
          });
        }
      }
    };

    source.connect(audioWorkletNode);
    audioWorkletNode.connect(audioContext.destination);

    return {
      stream,
      audioContext,
      source,
      processor: audioWorkletNode,
    };
  };

  const startRecording = useCallback(async () => {
    try {
      setError(null);
      const { micId } = await getAudioDevices();

      // マイクストリームのセットアップ
      micStreamRef.current = await setupAudioStream(micId);
      console.log("Recording started successfully");

      setIsRecording(true);
    } catch (err: any) {
      console.error("Failed to start recording:", err);
      setError(err.message);
      setIsRecording(false);
      stopRecording();
    }
  }, []);

  const stopRecording = useCallback(() => {
    console.log("Stopping recording");

    if (micStreamRef.current.stream) {
      micStreamRef.current.stream.getTracks().forEach((track) => track.stop());
      micStreamRef.current.processor?.disconnect();
      micStreamRef.current.source?.disconnect();
      micStreamRef.current.audioContext?.close().catch(() => {});
      micStreamRef.current = {
        stream: null,
        audioContext: null,
        source: null,
        processor: null,
      };
    }

    setIsRecording(false);
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
