import { useEffect, useMemo, useState, type SyntheticEvent } from "react";
import { Alert, Box, LinearProgress, Slide, Snackbar } from "@mui/material";
import type { SlideProps } from "@mui/material/Slide";
import {
  notificationService,
  type NotificationEvent,
} from "../services/notifications";

const DEFAULT_DURATION = 5000;
const EXIT_ANIMATION_MS = 240;

const TransitionUp = (props: SlideProps) => <Slide {...props} direction="up" />;

export function NotificationCenter() {
  const [current, setCurrent] = useState<NotificationEvent | null>(null);
  const [queue, setQueue] = useState<NotificationEvent[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  const duration = useMemo(
    () => current?.autoHideDuration ?? DEFAULT_DURATION,
    [current?.autoHideDuration],
  );

  useEffect(() => {
    return notificationService.subscribe((event) => {
      setQueue((prev) => [...prev, event]);
    });
  }, []);

  useEffect(() => {
    if (!current && queue.length > 0) {
      setCurrent(queue[0]);
      setQueue((prev) => prev.slice(1));
      setIsOpen(true);
    }
  }, [current, queue]);

  useEffect(() => {
    if (!current || !isOpen) {
      return;
    }

    const timer = window.setTimeout(() => {
      setIsOpen(false);
    }, duration);

    return () => window.clearTimeout(timer);
  }, [current, duration, isOpen]);

  useEffect(() => {
    if (isOpen || !current) {
      return;
    }

    const exitTimer = window.setTimeout(() => {
      setCurrent(null);
    }, EXIT_ANIMATION_MS);

    return () => window.clearTimeout(exitTimer);
  }, [isOpen, current]);

  const handleClose = (_event?: SyntheticEvent | Event, reason?: string) => {
    if (reason === "clickaway") {
      return;
    }

    setIsOpen(false);
  };

  return (
    <Snackbar
      key={current?.id}
      open={isOpen}
      onClose={handleClose}
      anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      slots={{ transition: TransitionUp }}
    >
      <Alert
        severity={current?.severity ?? "info"}
        onClose={handleClose}
        variant="filled"
        sx={{
          width: "100%",
          minWidth: 320,
          overflow: "hidden",
          boxShadow: 6,
          "& .MuiAlert-message": {
            width: "100%",
          },
        }}
      >
        <Box>{current?.message}</Box>
        <LinearProgress
          variant="determinate"
          value={100}
          sx={{
            mt: 1,
            height: 3,
            borderRadius: 2,
            bgcolor: "rgba(255,255,255,0.25)",
            "& .MuiLinearProgress-bar": {
              bgcolor: "rgba(255,255,255,0.95)",
              transformOrigin: "left",
              animation: `notification-timer ${duration}ms linear forwards`,
            },
            "@keyframes notification-timer": {
              from: {
                transform: "scaleX(1)",
              },
              to: {
                transform: "scaleX(0)",
              },
            },
          }}
        />
      </Alert>
    </Snackbar>
  );
}
