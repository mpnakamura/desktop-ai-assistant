// src/renderer/types/electron.d.ts
export interface IElectronAPI {
  ipcRenderer: {
    send: (channel: string, ...args: any[]) => void;
    on: (channel: string, func: (...args: any[]) => void) => () => void;
    once: (channel: string, func: (...args: any[]) => void) => void;
    invoke: (channel: string, ...args: any[]) => Promise<any>;
    getAudioSources: () => Promise<
      Array<{
        id: string;
        name: string;
        thumbnail: Electron.NativeImage;
      }>
    >;
  };
}

declare global {
  interface Window {
    electron: IElectronAPI;
  }
}

// AudioRecording関連の型定義
export interface RecordingState {
  isRecording: boolean;
  error: string | null;
  audioData: Blob | null;
  duration: number;
}

export interface AudioSource {
  id: string;
  name: string;
  thumbnail?: Electron.NativeImage;
}
