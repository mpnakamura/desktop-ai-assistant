import React, { useState, useEffect, useRef } from "react";
import { Box, Typography, Paper, CircularProgress } from "@mui/material";

interface AIResponseProps {
  content: string;
  isTyping: boolean;
  typingSpeed?: number; // milliseconds per character
}

const AIResponse: React.FC<AIResponseProps> = ({
  content,
  isTyping,
  typingSpeed = 30,
}) => {
  const [displayedContent, setDisplayedContent] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const contentRef = useRef(content);

  useEffect(() => {
    if (content !== contentRef.current) {
      setCurrentIndex(0);
      setDisplayedContent("");
      contentRef.current = content;
    }
  }, [content]);

  useEffect(() => {
    if (!isTyping || currentIndex >= content.length) return;

    const timer = setTimeout(() => {
      setDisplayedContent((prev) => prev + content[currentIndex]);
      setCurrentIndex((prev) => prev + 1);
    }, typingSpeed);

    return () => clearTimeout(timer);
  }, [isTyping, currentIndex, content, typingSpeed]);

  return (
    <Paper
      elevation={1}
      sx={{
        p: 2,
        backgroundColor: "grey.50",
        borderRadius: 2,
        minHeight: 100,
      }}
    >
      <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2 }}>
        <Typography
          variant="body1"
          sx={{
            fontFamily: "monospace",
            whiteSpace: "pre-wrap",
            flex: 1,
          }}
        >
          {displayedContent}
          {isTyping && currentIndex < content.length && (
            <Box
              component="span"
              sx={{
                display: "inline-block",
                width: 8,
                height: 16,
                backgroundColor: "primary.main",
                ml: 0.5,
                animation: "blink 1s step-end infinite",
                "@keyframes blink": {
                  "from, to": { opacity: 1 },
                  "50%": { opacity: 0 },
                },
              }}
            />
          )}
        </Typography>

        {isTyping && currentIndex < content.length && (
          <CircularProgress size={20} thickness={6} />
        )}
      </Box>
    </Paper>
  );
};

export default AIResponse;
