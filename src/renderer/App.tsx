// src/renderer/App.tsx
import React, { useState } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import {
  CssBaseline,
  Box,
  Container,
  useMediaQuery
} from '@mui/material';
import AppHeader from './components/Layout/AppHeader';
import RecordingControl from './components/Recording/RecordingControl';
import TranscriptContainer from './components/Transcription/TranscriptContainer';
import AnswerDialog from './components/Dialog/AnswerDialog';
import { useTranscription } from './hooks/useTranscription';

const App: React.FC = () => {
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
  const [isDarkMode, setIsDarkMode] = useState(prefersDarkMode);
  
  const {
    messages,
    selectedQuestion,
    answer,
    isLoadingAnswer,
    handleQuestionClick,
    setSelectedQuestion
  } = useTranscription();

  // テーマの設定
  const theme = createTheme({
    palette: {
      mode: isDarkMode ? 'dark' : 'light',
      primary: {
        main: '#1976d2',
      },
      secondary: {
        main: '#dc004e',
      },
    },
  });

  const handleCloseDialog = () => {
    setSelectedQuestion(null);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <AppHeader
          isDarkMode={isDarkMode}
          onToggleTheme={() => setIsDarkMode(!isDarkMode)}
        />

        <Container 
          maxWidth="lg" 
          sx={{ 
            flexGrow: 1, 
            py: 3,
            display: 'flex',
            flexDirection: 'column',
            gap: 2
          }}
        >
          <RecordingControl />

          <TranscriptContainer
            messages={messages}
            onQuestionClick={handleQuestionClick}
          />
        </Container>

        <AnswerDialog
          open={selectedQuestion !== null}
          question={selectedQuestion}
          answer={answer}
          isLoading={isLoadingAnswer}
          onClose={handleCloseDialog}
        />
      </Box>
    </ThemeProvider>
  );
};

export default App;
