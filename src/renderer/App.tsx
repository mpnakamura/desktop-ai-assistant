// src/renderer/App.tsx
import React, { useState, useEffect } from "react";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { CssBaseline, Box, Container, useMediaQuery } from "@mui/material";
import AppHeader from "./components/Layout/AppHeader";
import RecordingControl from "./components/Recording/RecordingControl";
import TranscriptContainer from "./components/Transcription/TranscriptContainer";
import AnswerDialog from "./components/Dialog/AnswerDialog";
import { useRecording } from "./hooks/useRecording";


const App: React.FC = () => {
  const prefersDarkMode = useMediaQuery("(prefers-color-scheme: dark)");
  const [isDarkMode, setIsDarkMode] = useState(prefersDarkMode);
  const [messages, setMessages] = useState<any[]>([]);
  const [selectedQuestion, setSelectedQuestion] = useState<string | null>(null);
  const { isRecording, error, startRecording, stopRecording } = useRecording();

  // WebSocket からの文字起こし結果を受信
  useEffect(() => {
    const handleTranscriptionResult = (result: any) => {
      if (result.type === "transcription") {
        // 新しいメッセージを追加
        setMessages((prevMessages) => [
          ...prevMessages,
          {
            id: Date.now(),
            speaker: result.data.speaker,
            content: result.data.text,
            timestamp: new Date().toLocaleTimeString(),
            isQuestion:
              result.data.text.endsWith("?") || result.data.text.endsWith("？"),
          },
        ]);
      }
    };

    // WebSocket メッセージのリスナーを設定
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
          maxWidth="lg"
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

          <TranscriptContainer
            messages={messages}
            onQuestionClick={(question) => setSelectedQuestion(question)}
          />
        </Container>

        <AnswerDialog
          open={selectedQuestion !== null}
          question={selectedQuestion}
          onClose={() => setSelectedQuestion(null)}
        />
      </Box>
    </ThemeProvider>
  );
};

export default App;
