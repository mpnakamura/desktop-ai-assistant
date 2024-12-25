export interface TranscriptMessage {
  id: number;
  speaker: string;
  content: string;
  isQuestion: boolean;
  timestamp: string;
}

export interface AnswerDialogProps {
  open: boolean;
  question: string | null;
  answer: string;
  isLoading: boolean;
  onClose: () => void;
}

export interface TranscriptMessageProps {
  message: TranscriptMessage;
  onQuestionClick: (question: string) => void;
}

export interface RecordingControlProps {
  isRecording: boolean;
  onToggleRecording: () => void;
}
