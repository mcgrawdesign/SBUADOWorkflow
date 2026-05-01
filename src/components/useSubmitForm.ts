import { useEffect, useMemo, useState } from "react";
import { CLASSIFICATIONS, SBUS, TIMELINES, WORK_ITEM_TYPES, type Classification, type SBU, type Timeline, type WorkItemType } from "@/lib/domain";
import { coachJustification, useCreateRequest } from "@/lib/useRequests";
import { useToast } from "@/hooks/use-toast";

type Coach = { strength: "strong" | "adequate" | "weak"; missing: string[]; suggestion: string; estimated_days?: number } | null;

export type FormState = {
  sbu: SBU; work_item_type: WorkItemType; title: string; requested_by: string;
  description: string; justification: string; classification: Classification; target_timeline: Timeline;
  estimated_days: number | null;
};

const initial: FormState = {
  sbu: "MSS", work_item_type: "Feature", title: "", requested_by: "",
  description: "", justification: "", classification: "Process Improvement", target_timeline: "Backlog",
  estimated_days: null,
};

export function useSubmitForm() {
  const [form, setForm] = useState<FormState>(initial);
  const [coach, setCoach] = useState<Coach>(null);
  const [coaching, setCoaching] = useState(false);
  const [aiSuggestedDays, setAiSuggestedDays] = useState<number | null>(null);
  const create = useCreateRequest();
  const { toast } = useToast();

  // Required-field gating
  const errors = useMemo(() => {
    const e: Partial<Record<keyof FormState, string>> = {};
    if (!form.title.trim()) e.title = "Required";
    if (form.title.length > 120) e.title = "Keep under 120 chars";
    if (!form.requested_by.trim()) e.requested_by = "Required";
    if (form.description.trim().length < 20) e.description = "Add more context (≥20 chars)";
    if (form.justification.trim().length < 20) e.justification = "Explain the business impact (≥20 chars)";
    if (form.estimated_days != null && (form.estimated_days < 1 || form.estimated_days > 365)) e.estimated_days = "1–365 days";
    return e;
  }, [form]);

  const canSubmit = Object.keys(errors).length === 0 && !create.isPending;

  // Debounced AI coaching
  useEffect(() => {
    if (form.justification.trim().length < 20 || form.title.trim().length === 0) {
      setCoach(null);
      setAiSuggestedDays(null);
      return;
    }
    const t = setTimeout(async () => {
      setCoaching(true);
      try {
        const r = await coachJustification({ title: form.title, description: form.description, justification: form.justification });
        setCoach(r);
        if (typeof r.estimated_days === "number" && r.estimated_days > 0) {
          setAiSuggestedDays(r.estimated_days);
        }
      } catch (e: unknown) {
        // silently ignore
      } finally {
        setCoaching(false);
      }
    }, 900);
    return () => clearTimeout(t);
  }, [form.title, form.description, form.justification]);

  const acceptAiDays = () => {
    if (aiSuggestedDays != null) setForm((s) => ({ ...s, estimated_days: aiSuggestedDays }));
  };

  const submit = async () => {
    try {
      await create.mutateAsync({ ...form, estimated_days: form.estimated_days ?? aiSuggestedDays ?? null });
      toast({ title: "Submitted", description: "Your request entered the centralized backlog and will be scored shortly." });
      setForm(initial);
      setCoach(null);
      setAiSuggestedDays(null);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Submission failed";
      toast({ title: "Couldn't submit", description: msg, variant: "destructive" });
    }
  };

  return { form, setForm, errors, canSubmit, submit, isSubmitting: create.isPending, coach, coaching, aiSuggestedDays, acceptAiDays };
}

// Re-export enums for convenience
export { CLASSIFICATIONS, SBUS, TIMELINES, WORK_ITEM_TYPES };
