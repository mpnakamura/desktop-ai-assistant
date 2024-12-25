// src/main/audio-capture.ts
import { desktopCapturer } from "electron";

export async function getAudioSources() {
  try {
    const sources = await desktopCapturer.getSources({
      types: ["window", "screen"],
      thumbnailSize: { width: 0, height: 0 },
    });
    return sources;
  } catch (error) {
    console.error("Error getting audio sources:", error);
    throw error;
  }
}
