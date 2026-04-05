import { useEffect, useState } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Fade,
} from "@mui/material";
import { confirmService, type ConfirmDialogEvent } from "../services/confirm";

export function ConfirmDialog() {
  const [current, setCurrent] = useState<ConfirmDialogEvent | null>(null);
  const [queue, setQueue] = useState<ConfirmDialogEvent[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = confirmService.subscribe((event) => {
      setQueue((prev) => [...prev, event]);
    });
    return () => {
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!current && queue.length > 0) {
      setCurrent(queue[0]);
      setQueue((prev) => prev.slice(1));
      setOpen(true);
    }
  }, [current, queue]);

  const resolveCurrent = (value: boolean) => {
    if (!current) {
      return;
    }
    confirmService.resolve(current.id, value);
    setOpen(false);
    setCurrent(null);
  };

  return (
    <Dialog
      open={open}
      onClose={() => resolveCurrent(false)}
      maxWidth="xs"
      fullWidth
      slots={{ transition: Fade }}
    >
      <DialogTitle>{current?.title}</DialogTitle>
      <DialogContent>
        <DialogContentText>{current?.description}</DialogContentText>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button variant="outlined" onClick={() => resolveCurrent(false)}>
          {current?.cancelText}
        </Button>
        <Button
          variant="contained"
          color={current?.confirmColor ?? "primary"}
          onClick={() => resolveCurrent(true)}
          autoFocus
        >
          {current?.confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
