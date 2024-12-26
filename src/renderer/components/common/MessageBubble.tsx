import React from "react";
import {
  Box,
  Typography,
  Paper,
  IconButton,
  Tooltip,
  useTheme,
} from "@mui/material";
import {
  QuestionAnswer as QuestionAnswerIcon,
  Psychology as PsychologyIcon,
} from "@mui/icons-material";

interface MessageBubbleProps {
  content: string;
  timestamp: string;
  isAI: boolean;
  isQuestion?: boolean;
  confidence?: number | null;
  onMarkAsQuestion?: () => void;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({
  content,
  timestamp,
  isAI,
  isQuestion = false,
  confidence = null,
  onMarkAsQuestion,
}) => {
  const theme = useTheme();

  const confidenceColor = confidence
    ? confidence > 0.8
      ? theme.palette.success.main
      : confidence > 0.6
      ? theme.palette.warning.main
      : theme.palette.error.main
    : undefined;

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: isAI ? "row" : "row-reverse",
        gap: 1,
        mb: 2,
      }}
    >
      <Box
        sx={{
          width: 32,
          height: 32,
          borderRadius: "50%",
          backgroundColor: isAI ? "primary.main" : "secondary.main",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "white",
          flexShrink: 0,
        }}
      >
        {isAI ? <PsychologyIcon /> : "U"}
      </Box>

      <Paper
        elevation={1}
        sx={{
          maxWidth: "70%",
          p: 2,
          borderRadius: 2,
          backgroundColor: isAI ? "grey.100" : "primary.light",
          position: "relative",
          "&::before": {
            content: '""',
            position: "absolute",
            top: 12,
            [isAI ? "left" : "right"]: -10,
            borderStyle: "solid",
            borderWidth: "10px 10px 10px 0",
            borderColor: `transparent ${
              isAI ? theme.palette.grey[100] : theme.palette.primary.light
            } transparent transparent`,
            transform: isAI ? "none" : "scaleX(-1)",
          },
        }}
      >
        <Typography
          variant="body1"
          sx={{
            wordBreak: "break-word",
            color: theme.palette.text.primary,
          }}
        >
          {content}
        </Typography>

        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mt: 1,
          }}
        >
          <Typography variant="caption" color="text.secondary">
            {timestamp}
          </Typography>

          {confidence !== null && (
            <Tooltip title={`認識精度: ${Math.round(confidence * 100)}%`}>
              <Box
                role="presentation"
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  backgroundColor: confidenceColor,
                  ml: 1,
                  cursor: "help",
                }}
              />
            </Tooltip>
          )}

          {!isAI && !isQuestion && onMarkAsQuestion && (
            <Tooltip title="AIに質問として解析させる">
              <IconButton
                size="small"
                onClick={onMarkAsQuestion}
                sx={{
                  ml: 1,
                  color: theme.palette.text.secondary,
                  "&:hover": {
                    color: theme.palette.primary.main,
                  },
                }}
              >
                <QuestionAnswerIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </Paper>
    </Box>
  );
};

export default MessageBubble;
