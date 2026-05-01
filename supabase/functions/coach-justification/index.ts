const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const raw = await req.text();
    if (!raw) {
      return new Response(JSON.stringify({ strength: "weak", missing: [], suggestion: "" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    let body: { title?: string; description?: string; justification?: string } = {};
    try { body = JSON.parse(raw); } catch { /* ignore */ }
    const { title = "", description = "", justification = "" } = body;
    if (!title && !justification) {
      return new Response(JSON.stringify({ strength: "weak", missing: ["title", "justification"], suggestion: "Add a title and justification." }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) throw new Error("LOVABLE_API_KEY missing");

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          { role: "system", content: "You coach SBU requestors to write strong intake justifications. Identify missing signals (metric impact, strategic alignment, scale, problem framing). Be terse." },
          { role: "user", content: `Title: ${title}\nDescription: ${description}\nJustification: ${justification}` },
        ],
        tools: [{
          type: "function",
          function: {
            name: "coach",
            parameters: {
              type: "object",
              properties: {
                strength: { type: "string", enum: ["strong", "adequate", "weak"] },
                missing: { type: "array", items: { type: "string" }, description: "Short labels of missing signals (max 4)" },
                suggestion: { type: "string", description: "One actionable sentence to improve the justification" },
                estimated_days: { type: "integer", description: "Rough engineering estimate in working days, 1-90", minimum: 1, maximum: 90 },
              },
              required: ["strength", "missing", "suggestion", "estimated_days"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "coach" } },
      }),
    });

    if (!resp.ok) {
      if (resp.status === 429) return new Response(JSON.stringify({ error: "Rate limited" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (resp.status === 402) return new Response(JSON.stringify({ error: "AI credits exhausted" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      return new Response(JSON.stringify({ error: "AI error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const data = await resp.json();
    const args = data.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    return new Response(args ?? "{}", { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("coach error", e);
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
