"use client";

import { cn } from "@/lib/utils";
import { HTMLAttributes, forwardRef, useCallback, useState } from "react";
import { X } from "lucide-react";

export interface Toast {
  id: string;
  title?: string;
  description?: string;
  variant?: "default" | "destructive";
}

let toastListeners: Array<(toast: Toast) => void> = [];

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback(
    (toast: Omit<Toast, "id">) => {
      const id = Math.random().toString(36).substring(2, 9);
      const newToast = { ...toast, id };
      setToasts((prev) => [...prev, newToast]);

      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 3000);
    },
    []
  );

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return { toasts, toast: addToast, dismissToast };
}

const ToastItem = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement> & { toast: Toast; onDismiss: (id: string) => void }>(
  ({ className, toast, onDismiss, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "pointer-events-auto relative flex w-full items-center justify-between space-x-2 overflow-hidden rounded-md border p-4 shadow-lg transition-all",
        toast.variant === "destructive"
          ? "border-destructive bg-destructive text-destructive-foreground"
          : "border bg-background text-foreground",
        className
      )}
      {...props}
    >
      <div className="flex flex-col gap-1">
        {toast.title && (
          <div className="text-sm font-semibold">{toast.title}</div>
        )}
        {toast.description && (
          <div className="text-sm opacity-90">{toast.description}</div>
        )}
      </div>
      <button
        onClick={() => onDismiss(toast.id)}
        className="rounded-md p-1 opacity-70 hover:opacity-100 transition-opacity"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
);
ToastItem.displayName = "ToastItem";

const ToastContainer = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement> & { toasts: Toast[]; onDismiss: (id: string) => void }
>(({ className, toasts, onDismiss, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "fixed top-4 right-4 z-50 flex flex-col gap-2 w-[360px]",
      className
    )}
    {...props}
  >
    {toasts.map((toast) => (
      <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
    ))}
  </div>
));
ToastContainer.displayName = "ToastContainer";

export { ToastContainer, ToastItem };
