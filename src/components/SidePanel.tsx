import { motion } from "framer-motion";
import { X } from "lucide-react";

export function SidePanel({
  children,
  onClose,
  tone = "light",
}: {
  children: React.ReactNode;
  onClose: () => void;
  tone?: "light" | "dark" | "signal";
}) {
  const panelClass =
    tone === "signal"
      ? "bg-[hsl(var(--signal-surface))] text-[hsl(var(--signal-text))]"
      : tone === "dark"
      ? "bg-neutral-900 text-white"
      : "bg-white text-foreground";
  return (
    <div className="fixed inset-0 z-40 flex justify-end" onClick={onClose} role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/40" />
      <motion.div
        initial={{ x: 40, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.18 }}
        onClick={(e) => e.stopPropagation()}
        className={`relative h-full w-full max-w-lg overflow-y-auto p-8 shadow-xl ${panelClass}`}
      >
        <button
          onClick={onClose}
          aria-label="Close panel"
          className="absolute right-4 top-4 rounded p-1.5 opacity-60 hover:opacity-100"
        >
          <X className="h-4 w-4" />
        </button>
        {children}
      </motion.div>
    </div>
  );
}
