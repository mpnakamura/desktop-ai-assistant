import React, { useState, useEffect, useRef } from "react";
import {
  Box,
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Paper,
  Drawer,
  useTheme,
  Fab,
  Badge,
  Collapse,
  Zoom,
  Tooltip,
  ThemeProvider,
  createTheme,
  CssBaseline,
  useMediaQuery,
} from "@mui/material";
import {
  Mic as MicIcon,
  Stop as StopIcon,
  QuestionAnswer as QuestionAnswerIcon,
  Close as CloseIcon,
  Settings as SettingsIcon,
  DarkMode as DarkModeIcon,
  LightMode as LightModeIcon,
} from "@mui/icons-material";

import AudioWaveform from "./components/common/AudioWaveform";
import MessageBubble from "./components/common/MessageBubble";
import AIResponse from "./components/common/AIResponse";
import { useRecording } from "./hooks/useRecording";
import { useGemini } from "./hooks/useGemini";

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

const ImprovedApp = () => {
  // Theme and Dark Mode
  const prefersDarkMode = useMediaQuery("(prefers-color-scheme: dark)");
  const [isDarkMode, setIsDarkMode] = useState(prefersDarkMode);

  // States
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [showFullTranscript, setShowFullTranscript] = useState(true);
  const [messages, setMessages] = useState<TranscriptMessage[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<{
    id: number;
    content: string;
  } | null>(null);
  const [loadingQuestions, setLoadingQuestions] = useState<number[]>([]);
  const [audioLevel, setAudioLevel] = useState(0);

  // Hooks
  const { isRecording, error, startRecording, stopRecording } = useRecording();
  const {
    answer,
    loading: aiLoading,
    error: apiError,
    fetchAnswer,
  } = useGemini();

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Audio level simulation when recording
  useEffect(() => {
    if (!isRecording) return;
    const interval = setInterval(() => {
      setAudioLevel(Math.random() * 0.5 + 0.1);
    }, 100);
    return () => clearInterval(interval);
  }, [isRecording]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, chatMessages]);

  // WebSocket transcription results handler
  useEffect(() => {
    const handleTranscriptionResult = (result: any) => {
      if (result.type === "transcription") {
        setMessages((prevMessages) => [
          ...prevMessages,
          {
            id: result.id || Date.now(),
            speaker: result.data.speaker,
            content: result.data.text,
            timestamp: new Date().toLocaleTimeString(),
            isQuestion: false,
          },
        ]);
      }
    };

    if (window.electron) {
      const cleanup = window.electron.ipcRenderer.on(
        "transcription-result",
        handleTranscriptionResult
      );
      return () => cleanup();
    }
  }, []);

  // Handle question marking
  const handleQuestionMark = (messageId: number, question: string) => {
    setMessages((prevMessages) =>
      prevMessages.map((msg) =>
        msg.id === messageId ? { ...msg, isQuestion: true } : msg
      )
    );
    setLoadingQuestions((prev) => [...prev, messageId]);
    setCurrentQuestion({ id: messageId, content: question });
    fetchAnswer(question);
  };

  // Handle AI answer updates
  useEffect(() => {
    if (currentQuestion && (answer || apiError)) {
      setChatMessages((prevChats) => [
        ...prevChats,
        {
          question: currentQuestion.content,
          answer: answer || "回答の取得に失敗しました。",
        },
      ]);
      setLoadingQuestions((prev) =>
        prev.filter((qid) => qid !== currentQuestion.id)
      );
      setCurrentQuestion(null);
      setDrawerOpen(true); // Open drawer to show new answer
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
      <Box sx={{ display: "flex", height: "100vh", overflow: "hidden" }}>
        <AppBar
          position="fixed"
          sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}
        >
          <Toolbar sx={{ justifyContent: "space-between" }}>
            <Typography variant="h6">面接アシスタント</Typography>

            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              {isRecording && (
                <Typography
                  variant="body2"
                  sx={{
                    animation: "pulse 1.5s infinite",
                    "@keyframes pulse": {
                      "0%": { opacity: 1 },
                      "50%": { opacity: 0.5 },
                      "100%": { opacity: 1 },
                    },
                  }}
                >
                  録音中...
                </Typography>
              )}
              <Tooltip title={isRecording ? "録音停止" : "録音開始"}>
                <IconButton
                  color="inherit"
                  onClick={isRecording ? stopRecording : startRecording}
                  disabled={!!error}
                >
                  {isRecording ? <StopIcon /> : <MicIcon />}
                </IconButton>
              </Tooltip>
              <IconButton
                color="inherit"
                onClick={() => setIsDarkMode(!isDarkMode)}
              >
                {isDarkMode ? <LightModeIcon /> : <DarkModeIcon />}
              </IconButton>
            </Box>
          </Toolbar>
        </AppBar>

        <Box
          sx={{
            flexGrow: 1,
            height: "100%",
            pt: "64px",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Audio Waveform */}
          {isRecording && (
            <Box sx={{ p: 2 }}>
              <AudioWaveform
                audioLevel={audioLevel}
                isRecording={isRecording}
              />
            </Box>
          )}

          {/* Messages Area */}
          <Paper
            sx={{
              flex: 1,
              m: 2,
              p: 2,
              overflow: "auto",
            }}
          >
            {messages.map((message) => (
              <MessageBubble
                key={message.id}
                content={message.content}
                timestamp={message.timestamp}
                isAI={false}
                isQuestion={message.isQuestion}
                confidence={0.9} // Add actual confidence from transcription
                onMarkAsQuestion={() =>
                  handleQuestionMark(message.id, message.content)
                }
              />
            ))}
            <div ref={messagesEndRef} />
          </Paper>
        </Box>

        {/* AI Chat Drawer Button */}
        <Zoom in={!drawerOpen && chatMessages.length > 0}>
          <Badge
            badgeContent={chatMessages.length}
            color="secondary"
            sx={{ position: "fixed", right: 20, bottom: 20 }}
          >
            <Fab color="primary" onClick={() => setDrawerOpen(true)}>
              <QuestionAnswerIcon />
            </Fab>
          </Badge>
        </Zoom>

        {/* AI Chat Drawer */}
        <Drawer
          anchor="right"
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          sx={{
            width: 400,
            flexShrink: 0,
            "& .MuiDrawer-paper": {
              width: 400,
            },
          }}
        >
          <Toolbar />
          <Box
            sx={{
              p: 2,
              height: "100%",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 2,
              }}
            >
              <Typography variant="h6">AI アシスタント</Typography>
              <IconButton onClick={() => setDrawerOpen(false)}>
                <CloseIcon />
              </IconButton>
            </Box>

            <Box sx={{ flex: 1, overflow: "auto" }}>
              {chatMessages.map((chat, index) => (
                <Box key={index} sx={{ mb: 3 }}>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 1 }}
                  >
                    質問: {chat.question}
                  </Typography>
                  <AIResponse
                    content={chat.answer}
                    isTyping={aiLoading && index === chatMessages.length - 1}
                  />
                </Box>
              ))}
            </Box>
          </Box>
        </Drawer>

        {error && (
          <Typography
            color="error"
            sx={{ position: "fixed", bottom: 16, left: 16 }}
          >
            エラー: {error}
          </Typography>
        )}
      </Box>
    </ThemeProvider>
  );
};

export default ImprovedApp;
