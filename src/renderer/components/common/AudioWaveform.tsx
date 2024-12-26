import React, { useEffect, useRef } from "react";
import { Box } from "@mui/material";

interface WaveformProps {
  audioLevel: number;
  isRecording: boolean;
}

const AudioWaveform: React.FC<WaveformProps> = ({
  audioLevel,
  isRecording,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const waveformPoints = useRef<number[]>([]);
  const animationRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (!canvasRef.current || !isRecording) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // キャンバスのサイズをセット
    const resize = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };
    resize();
    window.addEventListener("resize", resize);

    // 波形のアニメーション
    const animate = () => {
      if (!ctx) return;

      // 新しい波形ポイントを追加
      waveformPoints.current.push(audioLevel * 50); // 波形の高さを調整
      if (waveformPoints.current.length > 100) {
        // 表示するポイント数
        waveformPoints.current.shift();
      }

      // キャンバスをクリア
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // 波形を描画
      ctx.beginPath();
      ctx.strokeStyle = "#2196f3";
      ctx.lineWidth = 2;

      const width = canvas.offsetWidth;
      const height = canvas.offsetHeight;
      const pointSpacing = width / 100;

      waveformPoints.current.forEach((point, index) => {
        const x = index * pointSpacing;
        const y = height / 2 + point;
        if (index === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });

      ctx.stroke();

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener("resize", resize);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isRecording, audioLevel]);

  return (
    <Box
      sx={{
        width: "100%",
        height: "60px",
        backgroundColor: "background.paper",
        borderRadius: 1,
        overflow: "hidden",
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          width: "100%",
          height: "100%",
        }}
      />
    </Box>
  );
};

export default AudioWaveform;
