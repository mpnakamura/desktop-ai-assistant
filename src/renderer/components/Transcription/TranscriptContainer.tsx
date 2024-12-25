// src/renderer/components/Transcription/TranscriptContainer.tsx
import React from "react";
import { Paper, Box, styled } from "@mui/material";

import { TranscriptMessage as TranscriptMessageType } from "../../types";
import TranscriptMessage from "./TranscriptMessage";

const StyledContainer = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  marginTop: theme.spacing(2),
  marginBottom: theme.spacing(2),
  maxHeight: "calc(100vh - 200px)",
  overflow: "auto",
  "&::-webkit-scrollbar": {
    width: "8px",
  },
  "&::-webkit-scrollbar-track": {
    background: theme.palette.background.default,
  },
  "&::-webkit-scrollbar-thumb": {
    backgroundColor: theme.palette.primary.light,
    borderRadius: "4px",
  },
}));

interface TranscriptContainerProps {
  messages: TranscriptMessageType[];
  onQuestionClick: (question: string) => void;
}

const TranscriptContainer: React.FC<TranscriptContainerProps> = ({
  messages,
  onQuestionClick,
}) => {
  const containerRef = React.useRef<HTMLDivElement>(null);

  // 新しいメッセージが追加されたら自動スクロール
  React.useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <StyledContainer ref={containerRef} elevation={3}>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {messages.map((message) => (
          <TranscriptMessage
            key={message.id}
            message={message}
            onQuestionClick={onQuestionClick}
          />
        ))}
      </Box>
    </StyledContainer>
  );
};

export default TranscriptContainer;
