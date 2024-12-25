// src/hooks/useGemini.ts
import { useState } from "react";

interface UseGeminiReturn {
  answer: string | null;
  loading: boolean;
  error: string | null;
  fetchAnswer: (question: string) => Promise<void>;
}

export const useGemini = (): UseGeminiReturn => {
  const [answer, setAnswer] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAnswer = async (question: string) => {
    setLoading(true);
    setError(null);
    setAnswer(null);
    try {
      if (window.electron) {
        const result = await window.electron.ipcRenderer.invoke(
          "fetch-gemini-answer",
          question
        );
        if (result.answer) {
          setAnswer(result.answer);
        } else {
          setError(result.error || "回答の取得に失敗しました");
        }
      } else {
        setError("ElectronのIPCが利用できません");
      }
    } catch (err: any) {
      setError("回答の取得中にエラーが発生しました");
    } finally {
      setLoading(false);
    }
  };

  return { answer, loading, error, fetchAnswer };
};
