import { Sun, Moon } from "lucide-react";
import { useAppState } from "@/lib/appState";

export function ThemeToggle({ tone = "light" }: { tone?: "light" | "dark" | "council" }) {
  const { theme, toggleTheme } = useAppState();
  const styles =
    tone === "dark"
      ? "bg-white/5 border border-white/10 text-white/70 hover:text-white hover:bg-white/10"
      : tone === "council"
      ? "border border-[hsl(var(--council-line))] text-[hsl(var(--council-text-dim))] hover:text-[hsl(var(--council-gold))]"
      : "border border-[hsl(var(--atlas-line))] bg-white text-[hsl(var(--atlas-ink-dim))] hover:text-[hsl(var(--atlas-ink))]";
  return (
    <button
      onClick={toggleTheme}
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
      title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
      className={`inline-flex h-8 w-8 items-center justify-center rounded-md transition-colors ${styles}`}
    >
      {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}
