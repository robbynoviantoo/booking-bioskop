import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { CheckCircle, XCircle, Info, X } from "lucide-react";

type ToastType = "success" | "error" | "info";
interface Toast {
  id: number;
  type: ToastType;
  message: string;
}
interface ToastCtx {
  toast: (type: ToastType, message: string) => void;
}

const ToastContext = createContext<ToastCtx | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((type: ToastType, message: string) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(
      () => setToasts((prev) => prev.filter((t) => t.id !== id)),
      4000,
    );
  }, []);

  const dismiss = (id: number) =>
    setToasts((prev) => prev.filter((t) => t.id !== id));

  const icons = {
    success: <CheckCircle size={18} />,
    error: <XCircle size={18} />,
    info: <Info size={18} />,
  };

  const getToastColors = (type: ToastType) => {
    switch (type) {
      case "success":
        return "bg-green-50 dark:bg-[#14532d] border-green-200 dark:border-green-500/30 text-green-700 dark:text-[#86efac]";
      case "error":
        return "bg-red-50 dark:bg-[#450a0a] border-red-200 dark:border-red-500/30 text-red-700 dark:text-[#fca5a5]";
      case "info":
        return "bg-violet-50 dark:bg-[#1e0a4a] border-violet-200 dark:border-violet-600/30 text-violet-700 dark:text-[#c4b5fd]";
      default:
        return "";
    }
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-6 right-6 z-[1000] flex flex-col gap-2.5 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto p-3.5 px-5 rounded-xl text-[0.88rem] font-medium flex items-center gap-2.5 min-w-[260px] max-w-[380px] border shadow-lg dark:shadow-[0_4px_32px_rgba(0,0,0,0.4)] animate-[slideInRight_0.3s_ease] ${getToastColors(t.type)}`}
          >
            {icons[t.type]}
            <span className="flex-1 leading-snug">{t.message}</span>
            <button
              onClick={() => dismiss(t.id)}
              className="p-1 -mr-2 opacity-70 hover:opacity-100 transition-opacity"
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be inside ToastProvider");
  return ctx;
}
