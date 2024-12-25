// src/renderer/App.tsx
import React, { useState, useEffect } from "react";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import {
  CssBaseline,
  Box,
  Container,
  useMediaQuery,
  Grid,
} from "@mui/material";
import AppHeader from "./components/Layout/AppHeader";
import RecordingControl from "./components/Recording/RecordingControl";
import TranscriptContainer from "./components/Transcription/TranscriptContainer";

import { useRecording } from "./hooks/useRecording";
import { useGemini } from "./hooks/useGemini";
import ChatPanel from "./components/Layout/ChatPanel";

interface ChatMessage {
  question: string;
  answer: string;
}

interface TranscriptMessage {
  id: number;
  speaker: string;
  content: string;
  timestamp: string;
  isQuestion: boolean;
}

const App: React.FC = () => {
  const prefersDarkMode = useMediaQuery("(prefers-color-scheme: dark)");
  const [isDarkMode, setIsDarkMode] = useState(prefersDarkMode);
  const [messages, setMessages] = useState<TranscriptMessage[]>([]);
  const { isRecording, error, startRecording, stopRecording } = useRecording();
  const { answer, loading, error: apiError, fetchAnswer } = useGemini();

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<{
    id: number;
    content: string;
  } | null>(null);
  const [loadingQuestions, setLoadingQuestions] = useState<number[]>([]);

  // WebSocket からの文字起こし結果を受信
  useEffect(() => {
    const handleTranscriptionResult = (result: any) => {
      if (result.type === "transcription") {
        setMessages((prevMessages) => [
          ...prevMessages,
          {
            id: result.id || Date.now(), // 一意のIDを使用
            speaker: result.data.speaker,
            content: result.data.text,
            timestamp: new Date().toLocaleTimeString(),
            isQuestion: false, // 自動検出を無効化
          },
        ]);
      }
    };

    if (window.electron) {
      const cleanup = window.electron.ipcRenderer.on(
        "transcription-result",
        handleTranscriptionResult
      );

      return () => {
        cleanup();
      };
    }
  }, []);

  // 質問がクリックされたときのハンドラー
  const handleQuestionClick = (question: string) => {
    // すでに質問としてマークされている場合は無視
    // もしくは、ここで再度回答を取得する処理を追加
  };

  // 質問としてマークされたメッセージのハンドラー
  const handleQuestionMark = (messageId: number, question: string) => {
    // メッセージを質問としてマーク
    setMessages((prevMessages) =>
      prevMessages.map((msg) =>
        msg.id === messageId ? { ...msg, isQuestion: true } : msg
      )
    );

    // 現在質問中のメッセージIDを追加
    setLoadingQuestions((prev) => [...prev, messageId]);

    // AIに質問を送信
    setCurrentQuestion({ id: messageId, content: question });
    fetchAnswer(question);
  };

  // fetchAnswer が完了したら chatMessages に追加
  useEffect(() => {
    if (currentQuestion && answer) {
      setChatMessages((prevChats) => [
        ...prevChats,
        { question: currentQuestion.content, answer: answer },
      ]);
      setLoadingQuestions((prev) =>
        prev.filter((qid) => qid !== currentQuestion.id)
      );
      setCurrentQuestion(null);
    } else if (currentQuestion && apiError) {
      // エラーの場合も同様に処理
      setChatMessages((prevChats) => [
        ...prevChats,
        {
          question: currentQuestion.content,
          answer: "回答の取得に失敗しました。",
        },
      ]);
      setLoadingQuestions((prev) =>
        prev.filter((qid) => qid !== currentQuestion.id)
      );
      setCurrentQuestion(null);
    }
  }, [answer, apiError, currentQuestion]);

  const theme = createTheme({
    palette: {
      mode: isDarkMode ? "dark" : "light",
      primary: {
        main: "#1976d2",
      },
      secondary: {
        main: "#dc004e",
      },
    },
  });

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box
        sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}
      >
        <AppHeader
          isDarkMode={isDarkMode}
          onToggleTheme={() => setIsDarkMode(!isDarkMode)}
        />

        <Container
          maxWidth="xl"
          sx={{
            flexGrow: 1,
            py: 3,
            display: "flex",
            flexDirection: "column",
            gap: 2,
          }}
        >
          <RecordingControl
            isRecording={isRecording}
            onStartRecording={startRecording}
            onStopRecording={stopRecording}
            error={error}
          />

          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TranscriptContainer
                messages={messages}
                onQuestionClick={handleQuestionClick}
                onQuestionMark={handleQuestionMark}
                loadingQuestions={loadingQuestions}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <ChatPanel
                chatMessages={chatMessages}
                loading={loading}
                error={apiError}
              />
            </Grid>
          </Grid>
        </Container>
      </Box>
    </ThemeProvider>
  );
};

export default App;
