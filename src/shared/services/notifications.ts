export type NotificationSeverity = "success" | "info" | "warning" | "error";

export interface NotificationPayload {
  message: string;
  severity?: NotificationSeverity;
  autoHideDuration?: number;
}

export interface NotificationEvent extends NotificationPayload {
  id: number;
  severity: NotificationSeverity;
}

type NotificationListener = (event: NotificationEvent) => void;

let listeners = new Set<NotificationListener>();
let notificationId = 0;

const emit = (payload: NotificationPayload) => {
  const event: NotificationEvent = {
    id: ++notificationId,
    severity: payload.severity ?? "info",
    autoHideDuration: payload.autoHideDuration,
    message: payload.message,
  };

  listeners.forEach((listener) => listener(event));
};

export const notificationService = {
  subscribe(listener: NotificationListener) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
  notify(payload: NotificationPayload) {
    emit(payload);
  },
  success(message: string, autoHideDuration?: number) {
    emit({ message, severity: "success", autoHideDuration });
  },
  info(message: string, autoHideDuration?: number) {
    emit({ message, severity: "info", autoHideDuration });
  },
  warning(message: string, autoHideDuration?: number) {
    emit({ message, severity: "warning", autoHideDuration });
  },
  error(message: string, autoHideDuration?: number) {
    emit({ message, severity: "error", autoHideDuration });
  },
};
