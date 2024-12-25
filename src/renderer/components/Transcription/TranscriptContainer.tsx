// src/renderer/components/Transcription/TranscriptContainer.tsx
import React, { useEffect, useRef } from 'react';
import { 
  Paper, 
  Box, 
  Typography,
  Chip,
  Divider,
  styled 
} from '@mui/material';
import { Person as PersonIcon, QuestionAnswer as QuestionAnswerIcon } from '@mui/icons-material';

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
  maxHeight: 'calc(100vh - 200px)',
  overflow: 'auto',
  '&::-webkit-scrollbar': {
    width: '8px',
  },
  '&::-webkit-scrollbar-track': {
    background: theme.palette.background.default,
  },
  '&::-webkit-scrollbar-thumb': {
    backgroundColor: theme.palette.primary.light,
    borderRadius: '4px',
  },
}));

const MessageBox = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'isSpeakerA' && prop !== 'isQuestion'
})<{ isSpeakerA: boolean; isQuestion: boolean }>(({ theme, isSpeakerA, isQuestion }) => ({
  padding: theme.spacing(2),
  marginBottom: theme.spacing(2),
  borderRadius: theme.spacing(2),
  maxWidth: '80%',
  marginLeft: isSpeakerA ? 0 : 'auto',
  marginRight: isSpeakerA ? 'auto' : 0,
  backgroundColor: isQuestion 
    ? theme.palette.secondary.light + '20'
    : isSpeakerA 
      ? theme.palette.primary.light + '20'
      : theme.palette.grey[100],
  cursor: isQuestion ? 'pointer' : 'default',
  '&:hover': {
    backgroundColor: isQuestion 
      ? theme.palette.secondary.light + '30'
      : isSpeakerA 
        ? theme.palette.primary.light + '20'
        : theme.palette.grey[100],
  }
}));

interface TranscriptContainerProps {
  messages: TranscriptMessage[];
  onQuestionClick?: (question: string) => void;
}

const TranscriptContainer: React.FC<TranscriptContainerProps> = ({
  messages,
  onQuestionClick
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // 新しいメッセージが追加されたら自動スクロール
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <StyledContainer ref={containerRef} elevation={3}>
      <Typography variant="h6" gutterBottom>
        会話の文字起こし
      </Typography>
      <Divider sx={{ mb: 3 }} />
      
      {messages.map((message, index) => (
        <MessageBox 
          key={message.id}
          isSpeakerA={message.speaker === "Speaker A"}
          isQuestion={message.isQuestion}
          onClick={() => message.isQuestion && onQuestionClick?.(message.content)}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <Chip
              icon={message.isQuestion ? <QuestionAnswerIcon /> : <PersonIcon />}
              label={message.speaker}
              size="small"
              color={message.isQuestion ? "secondary" : "primary"}
              variant="outlined"
            />
            <Typography variant="caption" color="text.secondary" sx={{ ml: 'auto' }}>
              {message.timestamp}
            </Typography>
          </Box>
          
          <Typography variant="body1">
            {message.content}
          </Typography>

          {message.isQuestion && (
            <Typography 
              variant="caption" 
              color="secondary"
              sx={{ display: 'block', mt: 1 }}
            >
              クリックして回答を表示
            </Typography>
          )}
        </MessageBox>
      ))}

      {messages.length === 0 && (
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center',
          minHeight: 200 
        }}>
          <Typography variant="body1" color="text.secondary">
            録音を開始すると、ここに文字起こし結果が表示されます
          </Typography>
        </Box>
      )}
    </StyledContainer>
  );
};

export default TranscriptContainer;
