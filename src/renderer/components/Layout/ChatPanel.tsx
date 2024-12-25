// src/renderer/components/Chat/ChatPanel.tsx
import React, { useEffect, useRef } from "react";
import { Box, Typography, Paper, CircularProgress } from "@mui/material";

interface ChatMessage {
  question: string;
  answer: string;
}

interface ChatPanelProps {
  chatMessages: ChatMessage[];
  loading: boolean;
  error: string | null;
}

const ChatPanel: React.FC<ChatPanelProps> = ({
  chatMessages,
  loading,
  error,
}) => {
  const endOfMessagesRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, loading]);

  return (
    <Paper
      elevation={3}
      sx={{
        height: "70vh",
        padding: 2,
        overflowY: "auto",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Typography variant="h6" gutterBottom>
        AI チャット
      </Typography>
      {chatMessages.map((msg, index) => (
        <Box key={index} sx={{ mb: 2 }}>
          <Typography variant="subtitle2" color="primary">
            あなた: {msg.question}
          </Typography>
          <Typography variant="body1" color="textSecondary">
            AI: {msg.answer}
          </Typography>
        </Box>
      ))}

      {loading && (
        <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
          <CircularProgress size={20} />
          <Typography variant="body2" sx={{ ml: 1 }}>
            AI が回答しています...
          </Typography>
        </Box>
      )}

      {error && (
        <Typography variant="body2" color="error" sx={{ mb: 2 }}>
          エラー: {error}
        </Typography>
      )}

      <div ref={endOfMessagesRef} />
    </Paper>
  );
};

export default ChatPanel;
