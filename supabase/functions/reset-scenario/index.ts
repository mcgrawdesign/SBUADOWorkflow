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

    // Wipe all rows
    await supabase.from("decisions").delete().gt("decided_at", "1900-01-01");
    await supabase.from("audit_events").delete().gt("created_at", "1900-01-01");
    await supabase.from("duplicate_links").delete().gt("created_at", "1900-01-01");
    await supabase.from("request_scores").delete().gt("generated_at", "1900-01-01");
    await supabase.from("requests").delete().gt("created_at", "1900-01-01");

    // Re-seed
    const seedRes = await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/seed-backlog`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
      },
      body: JSON.stringify({}),
    });
    const seed = await seedRes.json().catch(() => ({}));

    return new Response(JSON.stringify({ ok: true, seed }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
