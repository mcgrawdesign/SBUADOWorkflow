import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { role = "stakeholder" } = await req.json().catch(() => ({}));

    const [{ data: requests }, { data: scores }, { data: decisions }] = await Promise.all([
      supabase.from("requests").select("*").order("created_at", { ascending: false }),
      supabase.from("request_scores").select("*"),
      supabase.from("decisions").select("*").order("decided_at", { ascending: false }),
    ]);

    const scoreById = new Map((scores ?? []).map((s) => [s.request_id, s]));
    const enriched = (requests ?? []).map((r) => ({ ...r, score: scoreById.get(r.id) ?? null }));

    const counts: Record<string, number> = {};
    enriched.forEach((r) => { counts[r.status] = (counts[r.status] ?? 0) + 1; });

    const sbuCounts: Record<string, number> = {};
    enriched.forEach((r) => { sbuCounts[r.sbu] = (sbuCounts[r.sbu] ?? 0) + 1; });

    const ranked = [...enriched].sort((a, b) => {
      const am = a.manual_rank, bm = b.manual_rank;
      if (am != null && bm != null) return am - bm;
      if (am != null) return -1;
      if (bm != null) return 1;
      return (b.score?.total ?? -1) - (a.score?.total ?? -1);
    });

    const top = ranked.slice(0, 10);
    const deferred = enriched.filter((r) => r.status === "deferred");
    const handedOff = enriched.filter((r) => r.status === "handed_off");

    return new Response(JSON.stringify({
      generated_at: new Date().toISOString(),
      role,
      totals: {
        all: enriched.length,
        by_status: counts,
        by_sbu: sbuCounts,
      },
      top,
      deferred,
      handed_off: handedOff,
      decisions: decisions ?? [],
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
