"use client";

import { useEffect, useState } from "react";
import { X, CheckCircle2, AlertCircle, Info, AlertTriangle } from "lucide-react";
import { useToastStore, type Toast as ToastType } from "@/stores/toast-store";

const TOAST_ICONS = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
  warning: AlertTriangle,
};

const TOAST_STYLES = {
  success: {
    bg: "bg-gv-success/10 border-gv-success/30",
    icon: "text-gv-success",
    progress: "bg-gv-success",
  },
  error: {
    bg: "bg-gv-error/10 border-gv-error/30",
    icon: "text-gv-error",
    progress: "bg-gv-error",
  },
  info: {
    bg: "bg-gv-info/10 border-gv-info/30",
    icon: "text-gv-info",
    progress: "bg-gv-info",
  },
  warning: {
    bg: "bg-gv-warning-500/10 border-gv-warning-500/30",
    icon: "text-gv-warning-500",
    progress: "bg-gv-warning-500",
  },
};

interface ToastProps {
  toast: ToastType;
  onDismiss: () => void;
}

function Toast({ toast, onDismiss }: ToastProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [progress, setProgress] = useState(100);

  const Icon = TOAST_ICONS[toast.type];
  const styles = TOAST_STYLES[toast.type];

  useEffect(() => {
    // Trigger enter animation
    requestAnimationFrame(() => setIsVisible(true));

    // Animate progress bar
    if (toast.duration && toast.duration > 0) {
      const startTime = Date.now();
      const interval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(0, 100 - (elapsed / toast.duration!) * 100);
        setProgress(remaining);

        if (remaining <= 0) {
          clearInterval(interval);
        }
      }, 50);

      return () => clearInterval(interval);
    }
  }, [toast.duration]);

  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(onDismiss, 200); // Wait for exit animation
  };

  return (
    <div
      className={`
        relative overflow-hidden
        max-w-sm w-full pointer-events-auto
        border rounded-gv shadow-lg
        transform transition-all duration-200 ease-out
        ${styles.bg}
        ${isVisible ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"}
      `}
    >
      <div className="p-4 flex items-start gap-3">
        <Icon className={`h-5 w-5 flex-shrink-0 mt-0.5 ${styles.icon}`} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white">{toast.title}</p>
          {toast.message && (
            <p className="text-sm text-gv-neutral-400 mt-1">{toast.message}</p>
          )}
        </div>
        <button
          onClick={handleDismiss}
          className="flex-shrink-0 p-1 text-gv-neutral-400 hover:text-white transition-colors rounded"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Progress bar */}
      {toast.duration && toast.duration > 0 && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gv-neutral-800">
          <div
            className={`h-full transition-all duration-100 ease-linear ${styles.progress}`}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
}

export function ToastContainer() {
  const { toasts, removeToast } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          toast={toast}
          onDismiss={() => removeToast(toast.id)}
        />
      ))}
    </div>
  );
}
