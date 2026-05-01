import { useAppState } from "@/lib/appState";
import { ROLES, ROLE_LABEL } from "@/lib/domain";

export function RoleSwitcher({ tone = "light" }: { tone?: "light" | "dark" | "council" }) {
  const { role, setRole } = useAppState();
  const styles =
    tone === "dark"
      ? { wrap: "bg-white/5 border border-white/10", btn: "text-white/60 hover:text-white", active: "bg-white/10 text-white" }
      : tone === "council"
      ? { wrap: "bg-[hsl(var(--council-line))]/30 border border-[hsl(var(--council-line))]", btn: "text-[hsl(var(--council-text-dim))] hover:text-[hsl(var(--council-text))]", active: "bg-[hsl(var(--council-gold))]/20 text-[hsl(var(--council-gold))]" }
      : { wrap: "bg-[hsl(var(--atlas-paper))] border border-[hsl(var(--atlas-line))]", btn: "text-[hsl(var(--atlas-ink-dim))] hover:text-[hsl(var(--atlas-ink))]", active: "bg-white text-[hsl(var(--atlas-ink))] shadow-sm" };
  return (
    <div className={`inline-flex items-center gap-1 rounded-md p-1 ${styles.wrap}`}>
      {ROLES.map((r) => (
        <button
          key={r}
          onClick={() => setRole(r)}
          className={`rounded px-2.5 py-1 text-[11px] font-medium tracking-wide transition-colors ${role === r ? styles.active : styles.btn}`}
        >
          {ROLE_LABEL[r]}
        </button>
      ))}
    </div>
  );
}
