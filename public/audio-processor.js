class AudioProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.buffer = [];
    this.bufferSize = 16000; // 1秒分のデータ (16kHz)
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0];
    const channel = input[0];

    if (channel) {
      // バッファにデータを追加
      this.buffer.push(...channel);

      // バッファが指定サイズを超えたら送信
      if (this.buffer.length >= this.bufferSize) {
        // バッファからbufferSizeだけのデータを取り出す
        const audioChunk = this.buffer.slice(0, this.bufferSize);
        this.buffer = this.buffer.slice(this.bufferSize);

        // レベル計算（オプション）
        const level = Math.max(...audioChunk.map(Math.abs));

        // メインスレッドにデータを送信
        this.port.postMessage({
          audioChunk,
          level,
        });
      }
    }

    return true;
  }
}

registerProcessor("audio-processor", AudioProcessor);
