// src/renderer/hooks/useTranscription.ts
import { useState, useCallback, useEffect } from "react";
import { TranscriptMessage } from "../types";

export const useTranscription = () => {
  const [messages, setMessages] = useState<TranscriptMessage[]>([]);
  const [selectedQuestion, setSelectedQuestion] = useState<string | null>(null);
  const [answer, setAnswer] = useState<string>("");
  const [isLoadingAnswer, setIsLoadingAnswer] = useState(false);

  // 新しいメッセージを追加
  const addMessage = useCallback((message: Omit<TranscriptMessage, "id">) => {
    setMessages((prev) => [
      ...prev,
      {
        ...message,
        id: Date.now(), // 一時的なID生成方法
      },
    ]);
  }, []);

  // 質問クリック時の処理
  const handleQuestionClick = useCallback(async (question: string) => {
    setSelectedQuestion(question);
    setIsLoadingAnswer(true);

    try {
      // TODO: AIサービスを呼び出して回答を取得
      // 仮の実装として、遅延を入れてモック回答を返す
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setAnswer(
        "この質問に対する推奨回答例：\n\n" +
          "1. 経験や実績を具体的に述べる\n" +
          "2. 数値やプロジェクト名を含める\n" +
          "3. 学びや成長について触れる"
      );
    } catch (error) {
      console.error("回答の取得に失敗しました:", error);
      setAnswer("回答の取得に失敗しました。もう一度お試しください。");
    } finally {
      setIsLoadingAnswer(false);
    }
  }, []);

  // 文字起こしの購読設定
  useEffect(() => {
    // TODO: WebSocketまたはIPCで文字起こしストリームを購読
    const cleanup = window.electron.ipcRenderer.on(
      "transcription-result",
      (result: any) => {
        addMessage({
          speaker: result.speaker,
          content: result.text,
          isQuestion: result.isQuestion,
          timestamp: new Date().toLocaleTimeString(),
        });
      }
    );

    return () => {
      cleanup();
    };
  }, [addMessage]);

  return {
    messages,
    selectedQuestion,
    answer,
    isLoadingAnswer,
    handleQuestionClick,
    setSelectedQuestion, // ダイアログを閉じる時などに使用
  };
};

export default useTranscription;
