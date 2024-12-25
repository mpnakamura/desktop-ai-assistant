// src/renderer/components/Transcription/TranscriptContainer.tsx
import React, { useEffect, useRef } from "react";
import {
  Paper,
  Box,
  Typography,
  Chip,
  Divider,
  styled,
  IconButton,
  Tooltip,
} from "@mui/material";
import {
  Person as PersonIcon,
  QuestionAnswer as QuestionAnswerIcon,
  HelpOutline as HelpOutlineIcon,
} from "@mui/icons-material";

interface TranscriptMessage {
  id: number;
  speaker: string;
  content: string;
  timestamp: string;
  isQuestion: boolean;
}

const StyledContainer = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  marginTop: theme.spacing(2),
  marginBottom: theme.spacing(2),
  maxHeight: "calc(100vh - 200px)",
  overflowY: "auto",
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

const MessageBox = styled(Box, {
  shouldForwardProp: (prop) =>
    prop !== "isSpeakerA" && prop !== "isQuestion" && prop !== "isLoading",
})<{ isSpeakerA: boolean; isQuestion: boolean; isLoading: boolean }>(
  ({ theme, isSpeakerA, isQuestion, isLoading }) => ({
    padding: theme.spacing(2),
    marginBottom: theme.spacing(2),
    borderRadius: theme.spacing(2),
    maxWidth: "80%",
    marginLeft: isSpeakerA ? 0 : "auto",
    marginRight: isSpeakerA ? "auto" : 0,
    backgroundColor: isQuestion
      ? theme.palette.secondary.light + (isLoading ? "40" : "20")
      : isSpeakerA
      ? theme.palette.primary.light + "20"
      : theme.palette.grey[100],
    cursor: isQuestion ? "default" : "pointer",
    opacity: isLoading ? 0.6 : 1,
    transition: "background-color 0.3s, opacity 0.3s",
    "&:hover": {
      backgroundColor: isQuestion
        ? theme.palette.secondary.light + (isLoading ? "40" : "30")
        : isSpeakerA
        ? theme.palette.primary.light + "20"
        : theme.palette.grey[100],
    },
  })
);

interface TranscriptContainerProps {
  messages: TranscriptMessage[];
  onQuestionClick?: (question: string) => void;
  onQuestionMark?: (messageId: number, question: string) => void;
  loadingQuestions?: number[]; // IDs of questions currently loading
}

const TranscriptContainer: React.FC<TranscriptContainerProps> = ({
  messages,
  onQuestionClick,
  onQuestionMark,
  loadingQuestions = [],
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // 新しいメッセージが追加されたら自動スクロール
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [messages]);

  // キーボード操作で質問をクリック可能にする
  const handleKeyPress = (
    event: React.KeyboardEvent<HTMLDivElement>,
    message: TranscriptMessage
  ) => {
    if (message.isQuestion && (event.key === "Enter" || event.key === " ")) {
      onQuestionClick?.(message.content);
    }
  };

  return (
    <StyledContainer ref={containerRef} elevation={3}>
      <Typography variant="h6" gutterBottom>
        会話の文字起こし
      </Typography>
      <Divider sx={{ mb: 3 }} />

      {messages.map((message) => {
        const isLoading = loadingQuestions.includes(message.id);
        return (
          <MessageBox
            key={message.id}
            isSpeakerA={message.speaker === "Speaker A"}
            isQuestion={message.isQuestion}
            isLoading={isLoading}
            onClick={() => {
              if (message.isQuestion && !isLoading) {
                onQuestionClick?.(message.content);
              }
            }}
            tabIndex={message.isQuestion ? 0 : -1} // フォーカス可能にする
            role={message.isQuestion ? "button" : undefined}
            aria-pressed={message.isQuestion ? false : undefined}
            onKeyPress={(event) => handleKeyPress(event, message)}
          >
            <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
              <Chip
                icon={
                  message.isQuestion ? <QuestionAnswerIcon /> : <PersonIcon />
                }
                label={message.speaker}
                size="small"
                color={message.isQuestion ? "secondary" : "primary"}
                variant="outlined"
              />
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ ml: "auto" }}
              >
                {message.timestamp}
              </Typography>
            </Box>

            <Typography variant="body1">{message.content}</Typography>

            {message.isQuestion ? null : (
              <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 1 }}>
                <Tooltip title="このメッセージを質問としてマーク">
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation(); // メッセージクリックを防ぐ
                      onQuestionMark?.(message.id, message.content);
                    }}
                    disabled={isLoading}
                  >
                    <HelpOutlineIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
            )}
          </MessageBox>
        );
      })}

      {messages.length === 0 && (
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: 200,
          }}
        >
          <Typography variant="body1" color="text.secondary">
            録音を開始すると、ここに文字起こし結果が表示されます
          </Typography>
        </Box>
      )}
    </StyledContainer>
  );
};

export default TranscriptContainer;
