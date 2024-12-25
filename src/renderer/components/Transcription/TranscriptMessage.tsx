// src/renderer/components/Transcription/TranscriptMessage.tsx
import React from "react";
import { Box, Typography, styled } from "@mui/material";
import { QuestionAnswer } from "@mui/icons-material";
import { TranscriptMessageProps } from "../../types";

const MessageContainer = styled(Box, {
  shouldForwardProp: (prop) => prop !== "isQuestion",
})<{ isQuestion: boolean }>(({ theme, isQuestion }) => ({
  marginBottom: theme.spacing(2),
  padding: theme.spacing(2),
  borderRadius: theme.spacing(1),
  backgroundColor: isQuestion
    ? theme.palette.primary.light + "20"
    : "transparent",
  cursor: isQuestion ? "pointer" : "default",
  "&:hover": {
    backgroundColor: isQuestion
      ? theme.palette.primary.light + "40"
      : "transparent",
  },
}));

const Speaker = styled(Typography)(({ theme }) => ({
  fontWeight: "bold",
  color: theme.palette.primary.main,
  marginRight: theme.spacing(1),
}));

const TranscriptMessage: React.FC<TranscriptMessageProps> = ({
  message,
  onQuestionClick,
}) => {
  const handleClick = () => {
    if (message.isQuestion) {
      onQuestionClick(message.content);
    }
  };

  return (
    <MessageContainer isQuestion={message.isQuestion} onClick={handleClick}>
      <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
        <Speaker variant="subtitle1">{message.speaker}:</Speaker>
        {message.isQuestion && (
          <QuestionAnswer fontSize="small" color="primary" sx={{ ml: 1 }} />
        )}
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ ml: "auto" }}
        >
          {message.timestamp}
        </Typography>
      </Box>
      <Typography variant="body1">{message.content}</Typography>
    </MessageContainer>
  );
};

export default TranscriptMessage;
