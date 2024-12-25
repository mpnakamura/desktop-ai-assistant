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
} from "@mui/material";
import { AnswerDialogProps } from "../../types";

const AnswerDialog: React.FC<AnswerDialogProps> = ({
  open,
  question,
  answer,
  isLoading,
  onClose,
}) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>質問への回答アドバイス</DialogTitle>
      <DialogContent>
        {isLoading ? (
          <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <Typography variant="subtitle1" color="text.secondary" gutterBottom>
              質問: {question}
            </Typography>
            <Typography variant="body1" sx={{ whiteSpace: "pre-line" }}>
              {answer}
            </Typography>
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>閉じる</Button>
      </DialogActions>
    </Dialog>
  );
};

export default AnswerDialog;
