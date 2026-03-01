export interface ConfirmDialogPayload {
  title?: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  confirmColor?: "primary" | "error" | "warning";
}

export interface ConfirmDialogEvent extends ConfirmDialogPayload {
  id: number;
}

type ConfirmDialogListener = (event: ConfirmDialogEvent) => void;

let listeners = new Set<ConfirmDialogListener>();
let confirmationId = 0;
const pendingResolvers = new Map<number, (value: boolean) => void>();

export const confirmService = {
  subscribe(listener: ConfirmDialogListener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  ask(payload: ConfirmDialogPayload) {
    const id = ++confirmationId;
    const event: ConfirmDialogEvent = {
      id,
      title: payload.title ?? "Подтверждение действия",
      description: payload.description,
      confirmText: payload.confirmText ?? "Подтвердить",
      cancelText: payload.cancelText ?? "Отмена",
      confirmColor: payload.confirmColor ?? "primary",
    };

    listeners.forEach((listener) => listener(event));

    return new Promise<boolean>((resolve) => {
      pendingResolvers.set(id, resolve);
    });
  },
  resolve(id: number, value: boolean) {
    const resolver = pendingResolvers.get(id);
    if (!resolver) {
      return;
    }
    resolver(value);
    pendingResolvers.delete(id);
  },
};
