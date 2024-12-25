// src/renderer/components/Recording/RecordingControl.tsx
import React from "react";
import {
  IconButton,
  Tooltip,
  Paper,
  Box,
  Typography,
  CircularProgress,
  Alert,
  Snackbar,
} from "@mui/material";
import {
  Mic as MicIcon,
  Stop as StopIcon,
  Error as ErrorIcon,
} from "@mui/icons-material";

interface RecordingControlProps {
  isRecording: boolean;
  error: string | null;
  onStartRecording: () => void;
  onStopRecording: () => void;
}

const RecordingControl: React.FC<RecordingControlProps> = ({
  isRecording,
  error,
  onStartRecording,
  onStopRecording,
}) => {
  const [showError, setShowError] = React.useState(false);

  React.useEffect(() => {
    if (error) {
      setShowError(true);
    }
  }, [error]);

  const handleCloseError = () => {
    setShowError(false);
  };

  const handleToggleRecording = () => {
    if (isRecording) {
      onStopRecording();
    } else {
      onStartRecording();
    }
  };

  return (
    <>
      <Paper
        elevation={3}
        sx={{
          p: 2,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          mb: 3,
          position: "sticky",
          top: 0,
          zIndex: 1,
          backgroundColor: (theme) =>
            isRecording
              ? theme.palette.error.light + "20"
              : theme.palette.background.paper,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Tooltip title={isRecording ? "録音を停止" : "録音を開始"}>
            <IconButton
              color={isRecording ? "error" : "primary"}
              onClick={handleToggleRecording}
              size="large"
              sx={{
                position: "relative",
                "&:hover": {
                  backgroundColor: (theme) =>
                    isRecording
                      ? theme.palette.error.light + "20"
                      : theme.palette.primary.light + "20",
                },
              }}
            >
              {isRecording ? <StopIcon /> : <MicIcon />}
              {isRecording && (
                <CircularProgress
                  size={48}
                  sx={{
                    position: "absolute",
                    color: (theme) => theme.palette.error.main,
                  }}
                />
              )}
            </IconButton>
          </Tooltip>
          <Typography
            variant="h6"
            color={isRecording ? "error" : "textPrimary"}
          >
            {isRecording ? "録音中..." : "録音待機中"}
          </Typography>
        </Box>
      </Paper>

      <Snackbar
        open={showError}
        autoHideDuration={6000}
        onClose={handleCloseError}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          severity="error"
          onClose={handleCloseError}
          icon={<ErrorIcon />}
          sx={{ width: "100%" }}
        >
          {error}
        </Alert>
      </Snackbar>
    </>
  );
};

export default RecordingControl;
