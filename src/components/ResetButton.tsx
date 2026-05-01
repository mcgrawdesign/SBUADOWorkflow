import { useState } from "react";
import { RotateCcw, Loader2 } from "lucide-react";
import { useResetScenario } from "@/lib/useRequests";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

export function ResetButton({ tone = "light" }: { tone?: "light" | "dark" | "council" }) {
  const reset = useResetScenario();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);

  const styles =
    tone === "dark"
      ? "bg-white/5 border border-white/10 hover:bg-white/10 text-primary"
      : tone === "council"
      ? "border border-[hsl(var(--council-line))] text-[hsl(var(--council-text-dim))] hover:text-[hsl(var(--council-gold))]"
      : "border border-[hsl(var(--atlas-line))] bg-white text-[hsl(var(--atlas-ink-dim))] hover:text-[hsl(var(--atlas-ink))]";

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <button
          aria-label="Reset scenario"
          title="Reset scenario"
          className={`inline-flex h-8 items-center gap-1.5 rounded-md px-2.5 text-[11px] font-medium transition-colors ${styles}`}
        >
          {reset.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RotateCcw className="h-3.5 w-3.5" />}
          Reset
        </button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Reset scenario?</AlertDialogTitle>
          <AlertDialogDescription>
            This restores the demo backlog. All submissions, scores, and decisions in this session will be discarded and a fresh AI-seeded backlog will be generated.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={async () => {
              try {
                await reset.mutateAsync();
                toast({ title: "Scenario reset", description: "A fresh AI-seeded backlog is loading." });
              } catch (e) {
                toast({ title: "Reset failed", description: e instanceof Error ? e.message : String(e), variant: "destructive" });
              }
            }}
          >
            Reset
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
