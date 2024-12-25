// src/renderer/components/Layout/AppHeader.tsx
import React from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  useTheme,
} from "@mui/material";
import {
  DarkMode as DarkModeIcon,
  LightMode as LightModeIcon,
  Settings as SettingsIcon,
} from "@mui/icons-material";

interface AppHeaderProps {
  isDarkMode: boolean;
  onToggleTheme: () => void;
  onOpenSettings?: () => void;
}

const AppHeader: React.FC<AppHeaderProps> = ({
  isDarkMode,
  onToggleTheme,
  onOpenSettings,
}) => {
  const theme = useTheme();

  return (
    <AppBar
      position="static"
      sx={{
        backgroundColor: theme.palette.primary.main,
      }}
    >
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          面接アシスタント
        </Typography>

        <IconButton color="inherit" onClick={onToggleTheme} sx={{ mr: 1 }}>
          {isDarkMode ? <LightModeIcon /> : <DarkModeIcon />}
        </IconButton>

        {onOpenSettings && (
          <IconButton color="inherit" onClick={onOpenSettings}>
            <SettingsIcon />
          </IconButton>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default AppHeader;
