// Seed the backlog with ~50 realistic requests, idempotent (skips if rows already exist)
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
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const { count } = await supabase.from("requests").select("*", { count: "exact", head: true });
    if ((count ?? 0) >= 30) {
      return new Response(JSON.stringify({ skipped: true, count }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) throw new Error("LOVABLE_API_KEY missing");

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "You generate realistic enterprise technical-debt backlog entries for a cross-SBU prioritization program. Mix bug fixes, automation, infra, tooling, data/reporting, process improvements. Include 2-3 near-duplicates across SBUs. Be concrete and varied." },
          { role: "user", content: "Generate 40 realistic backlog items." },
        ],
        tools: [{
          type: "function",
          function: {
            name: "emit_items",
            parameters: {
              type: "object",
              properties: {
                items: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      sbu: { type: "string", enum: ["MSS", "SCIM", "A&I", "TPC"] },
                      work_item_type: { type: "string", enum: ["Feature", "Bug", "User Story", "Task", "Epic"] },
                      title: { type: "string" },
                      requested_by: { type: "string", description: "alias like 'jdoe'" },
                      description: { type: "string" },
                      justification: { type: "string" },
                      classification: { type: "string", enum: ["Automation — Enhancement", "Automation — New", "Bug Fix", "Data / Reporting", "Infrastructure", "Process Improvement", "Tooling"] },
                      target_timeline: { type: "string", enum: ["FY27 Semester 1 — Sprint 1", "FY27 Semester 1 — Sprint 2", "FY27 Semester 1 — Sprint 3", "FY27 Semester 2", "Backlog"] },
                    },
                    required: ["sbu", "work_item_type", "title", "requested_by", "description", "justification", "classification", "target_timeline"],
                    additionalProperties: false,
                  },
                },
              },
              required: ["items"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "emit_items" } },
      }),
    });

    if (!aiResp.ok) {
      const t = await aiResp.text();
      console.error("seed AI error", aiResp.status, t);
      return new Response(JSON.stringify({ error: "AI error", detail: t }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const data = await aiResp.json();
    const args = data.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    const { items } = JSON.parse(args);

    const { data: inserted, error } = await supabase.from("requests").insert(items).select("id");
    if (error) throw error;

    // Mark all as 'submitted' (default) — let scoring happen on demand from the client.
    return new Response(JSON.stringify({ inserted: inserted?.length ?? 0 }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("seed-backlog", e);
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
