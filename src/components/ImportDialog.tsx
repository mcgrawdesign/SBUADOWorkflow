import { useState } from "react";
import { Upload, Link as LinkIcon, FileUp, Loader2, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { importRequests } from "@/lib/useRequests";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { CLASSIFICATIONS, SBUS, TIMELINES, WORK_ITEM_TYPES, type Classification, type SBU, type Timeline, type WorkItemType } from "@/lib/domain";

type Draft = {
  title: string;
  description: string;
  justification: string;
  sbu: SBU;
  work_item_type: WorkItemType;
  classification: Classification;
  target_timeline: Timeline;
  requested_by: string;
  source_ref: string | null;
  ado_id: string | null;
};

export function ImportDialog({ tone = "light" }: { tone?: "light" | "dark" | "council" }) {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [filename, setFilename] = useState("");
  const [content, setContent] = useState("");
  const [busy, setBusy] = useState(false);
  const [drafts, setDrafts] = useState<Draft[] | null>(null);
  const qc = useQueryClient();
  const { toast } = useToast();

  const styles =
    tone === "dark"
      ? "bg-[hsl(var(--signal-accent))]/15 border border-[hsl(var(--signal-accent))]/40 text-[hsl(var(--signal-accent))] hover:bg-[hsl(var(--signal-accent))]/25 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[hsl(var(--signal-accent))]"
      : tone === "council"
      ? "bg-[hsl(var(--council-gold))] text-[hsl(var(--council-ink))] hover:brightness-110 font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[hsl(var(--council-gold))]"
      : "border border-[hsl(var(--atlas-accent))] text-[hsl(var(--atlas-accent))] hover:bg-[hsl(var(--atlas-accent))]/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[hsl(var(--atlas-accent))]";

  const onFile = async (file: File) => {
    if (file.size > 1024 * 1024) {
      toast({ title: "File too large", description: "Max 1MB.", variant: "destructive" });
      return;
    }
    setFilename(file.name);
    const text = await file.text();
    setContent(text);
  };

  const runImport = async (mode: "url" | "file") => {
    setBusy(true);
    try {
      const payload = mode === "url" ? { url } : { filename, content };
      const res = await importRequests(payload);
      if (!res.items?.length) {
        toast({ title: "Nothing extracted", description: "The AI could not find any requests in the source.", variant: "destructive" });
      } else {
        setDrafts(res.items as Draft[]);
      }
    } catch (e) {
      toast({ title: "Import failed", description: e instanceof Error ? e.message : String(e), variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const submitAll = async () => {
    if (!drafts) return;
    setBusy(true);
    try {
      const { error } = await supabase.from("requests").insert(drafts);
      if (error) throw error;
      toast({ title: `Imported ${drafts.length} item${drafts.length === 1 ? "" : "s"}`, description: "Background AI scoring will run when the reviewer view opens." });
      qc.invalidateQueries({ queryKey: ["requests"] });
      setOpen(false);
      setDrafts(null); setUrl(""); setFilename(""); setContent("");
    } catch (e) {
      toast({ title: "Bulk insert failed", description: e instanceof Error ? e.message : String(e), variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className={`inline-flex h-8 items-center gap-1.5 rounded-md px-3 text-[12px] font-medium transition-colors ${styles}`}>
          <Upload className="h-3.5 w-3.5" /> Import
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Import requests</DialogTitle>
        </DialogHeader>

        {!drafts && (
          <Tabs defaultValue="url">
            <TabsList>
              <TabsTrigger value="url"><LinkIcon className="mr-1.5 h-3.5 w-3.5" /> From Azure DevOps</TabsTrigger>
              <TabsTrigger value="file"><FileUp className="mr-1.5 h-3.5 w-3.5" /> From file</TabsTrigger>
            </TabsList>
            <TabsContent value="url" className="space-y-3 pt-3">
              <label className="block text-sm font-medium">ADO work item URL or query link</label>
              <input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://dev.azure.com/org/project/_workitems/edit/12345"
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              />
              <p className="text-xs text-muted-foreground">
                The link is stored as a reference. AI will infer plausible request fields from the URL keywords (no live ADO fetch).
              </p>
              <button
                onClick={() => runImport("url")}
                disabled={!url || busy}
                className="inline-flex items-center gap-2 rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-40"
              >
                {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Extract requests
              </button>
            </TabsContent>
            <TabsContent value="file" className="space-y-3 pt-3">
              <label className="block text-sm font-medium">Upload .csv, .json, .md, or .txt (≤1MB)</label>
              <input
                type="file"
                accept=".csv,.json,.md,.txt"
                onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])}
                className="block w-full text-sm"
              />
              {filename && <div className="text-xs text-muted-foreground">Loaded: <span className="font-mono">{filename}</span> ({content.length} chars)</div>}
              <button
                onClick={() => runImport("file")}
                disabled={!content || busy}
                className="inline-flex items-center gap-2 rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-40"
              >
                {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Extract requests
              </button>
            </TabsContent>
          </Tabs>
        )}

        {drafts && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium">Review extracted ({drafts.length}). Edit any field, then submit.</div>
              <button onClick={() => setDrafts(null)} className="text-xs text-muted-foreground hover:text-foreground"><X className="inline h-3 w-3" /> Start over</button>
            </div>
            <div className="max-h-[55vh] space-y-3 overflow-y-auto pr-1">
              {drafts.map((d, i) => (
                <div key={i} className="rounded-md border p-3 space-y-2">
                  <input
                    className="w-full rounded border bg-background px-2 py-1 text-sm font-medium"
                    value={d.title}
                    onChange={(e) => setDrafts(drafts.map((x, j) => j === i ? { ...x, title: e.target.value } : x))}
                  />
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <select value={d.sbu} onChange={(e) => setDrafts(drafts.map((x, j) => j === i ? { ...x, sbu: e.target.value as SBU } : x))} className="rounded border bg-background px-2 py-1">
                      {SBUS.map((s) => <option key={s}>{s}</option>)}
                    </select>
                    <select value={d.work_item_type} onChange={(e) => setDrafts(drafts.map((x, j) => j === i ? { ...x, work_item_type: e.target.value as WorkItemType } : x))} className="rounded border bg-background px-2 py-1">
                      {WORK_ITEM_TYPES.map((s) => <option key={s}>{s}</option>)}
                    </select>
                    <select value={d.classification} onChange={(e) => setDrafts(drafts.map((x, j) => j === i ? { ...x, classification: e.target.value as Classification } : x))} className="rounded border bg-background px-2 py-1">
                      {CLASSIFICATIONS.map((s) => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                  <textarea
                    className="w-full rounded border bg-background px-2 py-1 text-xs"
                    rows={2}
                    value={d.justification}
                    onChange={(e) => setDrafts(drafts.map((x, j) => j === i ? { ...x, justification: e.target.value } : x))}
                  />
                  <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                    <select value={d.target_timeline} onChange={(e) => setDrafts(drafts.map((x, j) => j === i ? { ...x, target_timeline: e.target.value as Timeline } : x))} className="rounded border bg-background px-2 py-0.5">
                      {TIMELINES.map((s) => <option key={s}>{s}</option>)}
                    </select>
                    <input
                      className="flex-1 rounded border bg-background px-2 py-0.5"
                      placeholder="requested by"
                      value={d.requested_by}
                      onChange={(e) => setDrafts(drafts.map((x, j) => j === i ? { ...x, requested_by: e.target.value } : x))}
                    />
                    {d.source_ref && <span className="truncate">↗ {d.source_ref}</span>}
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={submitAll}
              disabled={busy}
              className="inline-flex items-center gap-2 rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-40"
            >
              {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Submit {drafts.length} item{drafts.length === 1 ? "" : "s"}
            </button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
