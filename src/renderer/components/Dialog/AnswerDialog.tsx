// src/renderer/components/Dialog/AnswerDialog.tsx
import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  CircularProgress,
  Chip,
} from "@mui/material";
import { QuestionAnswer as QuestionAnswerIcon } from "@mui/icons-material";

interface AnswerDialogProps {
  open: boolean;
  question: string | null;
  onClose: () => void;
}

const AnswerDialog: React.FC<AnswerDialogProps> = ({
  open,
  question,
  onClose,
}) => {
  const [isLoading, setIsLoading] = React.useState(true);
  const [answer, setAnswer] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (open && question) {
      setIsLoading(true);
      // ここでGeminiまたは他のAIサービスを呼び出す
      // 今はモックレスポンスを使用
      setTimeout(() => {
        setAnswer(
          "この質問に対する提案回答：\n\n" +
            "1. 具体的な経験や実績を挙げる\n" +
            "2. 数値データを含めて説明する\n" +
            "3. 今後の展望についても触れる\n\n" +
            "例：「前職での○○プロジェクトでは、チーム10名をリードし、売上を前年比120%に向上させました。」"
        );
        setIsLoading(false);
      }, 1500);
    }
  }, [open, question]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          minHeight: "40vh",
        },
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <QuestionAnswerIcon color="primary" />
          <Typography variant="h6">質問への回答アドバイス</Typography>
        </Box>
      </DialogTitle>
      <DialogContent dividers>
        {question && (
          <Box sx={{ mb: 3 }}>
            <Chip
              label="質問内容"
              color="primary"
              size="small"
              sx={{ mb: 1 }}
            />
            <Typography
              variant="subtitle1"
              sx={{
                p: 2,
                backgroundColor: (theme) => theme.palette.grey[50],
                borderRadius: 1,
              }}
            >
              {question}
            </Typography>
          </Box>
        )}

        {isLoading ? (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              minHeight: "200px",
            }}
          >
            <CircularProgress />
          </Box>
        ) : (
          <Box>
            <Chip
              label="提案回答"
              color="secondary"
              size="small"
              sx={{ mb: 1 }}
            />
            <Typography
              variant="body1"
              sx={{
                whiteSpace: "pre-line",
                p: 2,
                backgroundColor: (theme) => theme.palette.background.default,
                borderRadius: 1,
              }}
            >
              {answer}
            </Typography>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} variant="contained" color="primary">
          閉じる
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AnswerDialog;
