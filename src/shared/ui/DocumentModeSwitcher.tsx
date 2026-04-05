import { motion } from "framer-motion";
import { Box, Typography } from "@mui/material";
import FolderOutlined from "@mui/icons-material/FolderOutlined";

export type DocumentMode = "storage";

interface DocumentModeSwitcherProps {
  activeMode: DocumentMode;
  onModeChange: (mode: DocumentMode) => void;
}

const modes: { id: DocumentMode; label: string; icon: React.ReactNode }[] = [
  {
    id: "storage",
    label: "Диск",
    icon: <FolderOutlined fontSize="small" />,
  },
];

export function DocumentModeSwitcher({
  activeMode,
  onModeChange,
}: DocumentModeSwitcherProps) {
  const activeIndex = modes.findIndex((m) => m.id === activeMode);

  return (
    <Box
      sx={{
        display: "inline-flex",
        position: "relative",
        background: "rgba(255, 255, 255, 0.5)",
        backdropFilter: "blur(10px)",
        borderRadius: "12px",
        p: 0.5,
        border: "1px solid rgba(255, 255, 255, 0.6)",
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
      }}
      role="tablist"
      aria-orientation="horizontal"
    >
      {/* Animated background */}
      <motion.div
        initial={false}
        animate={{
          x: activeIndex * 100 + "%",
          width: `calc(100% / ${modes.length})`,
        }}
        transition={{
          type: "spring",
          stiffness: 400,
          damping: 30,
          mass: 0.8,
        }}
        style={{
          position: "absolute",
          top: 4,
          left: 4,
          height: "calc(100% - 8px)",
          borderRadius: "10px",
          background: "rgba(255, 255, 255, 0.95)",
          boxShadow: "0 2px 6px rgba(0, 0, 0, 0.08)",
          zIndex: 0,
        }}
      />

      {/* Mode buttons */}
      {modes.map((mode) => {
        const isActive = mode.id === activeMode;
        return (
          <Box
            key={mode.id}
            role="tab"
            aria-selected={isActive}
            aria-controls={`panel-${mode.id}`}
            id={`tab-${mode.id}`}
            onClick={() => onModeChange(mode.id)}
            sx={{
              position: "relative",
              zIndex: 1,
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 1,
              py: 1.25,
              px: 2.5,
              minWidth: 120,
              cursor: "pointer",
              transition: "color 200ms ease, font-weight 200ms ease",
              color: isActive ? "text.primary" : "text.secondary",
              fontWeight: isActive ? 600 : 500,
              fontSize: "0.95rem",
              "&:hover": {
                color: "text.primary",
              },
              "&:focus-visible": {
                outline: "2px solid #4F90FF",
                outlineOffset: "2px",
                borderRadius: "8px",
              },
            }}
          >
            {mode.icon}
            <Typography
              component="span"
              sx={{
                lineHeight: 1,
                fontSize: "inherit",
                fontWeight: "inherit",
                color: "inherit",
              }}
            >
              {mode.label}
            </Typography>
          </Box>
        );
      })}
    </Box>
  );
}
