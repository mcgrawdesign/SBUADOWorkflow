// Score a single request via Lovable AI (structured output)
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { request } = await req.json();
    if (!request?.title) {
      return new Response(JSON.stringify({ error: "request required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) throw new Error("LOVABLE_API_KEY missing");

    const systemPrompt = `You are an enterprise prioritization analyst for a cross-SBU technical-debt program.
Score the given work request across 5 criteria, each an INTEGER between 2 and 18 (inclusive). Use the full range — be willing to assign low scores (2-6) for weak signals and high scores (15-18) for exceptional ones.
- impact (CSAT, TNT, customer outcome)
- cost_avoidance (saved hours/$)
- scale (number of teams/customers reached)
- strategic_alignment (FY27 goals fit)
- feasibility (clear scope, low risk)
Total = sum (range 10-89). Bands: High 67-89, Medium 40-66, Low 10-39. Set confidence (high/medium/low) based on input quality.
Write a one-paragraph rationale (~40 words) explaining the ranking signals.`;

    const userPrompt = `SBU: ${request.sbu}
Type: ${request.work_item_type}
Title: ${request.title}
Classification: ${request.classification}
Target: ${request.target_timeline}
Description: ${request.description}
Justification: ${request.justification}`;

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [{
          type: "function",
          function: {
            name: "submit_score",
            description: "Return the structured score",
            parameters: {
              type: "object",
              properties: {
                impact: { type: "integer", minimum: 2, maximum: 18 },
                cost_avoidance: { type: "integer", minimum: 2, maximum: 18 },
                scale: { type: "integer", minimum: 2, maximum: 18 },
                strategic_alignment: { type: "integer", minimum: 2, maximum: 18 },
                feasibility: { type: "integer", minimum: 2, maximum: 18 },
                confidence: { type: "string", enum: ["high", "medium", "low"] },
                rationale: { type: "string" },
              },
              required: ["impact", "cost_avoidance", "scale", "strategic_alignment", "feasibility", "confidence", "rationale"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "submit_score" } },
      }),
    });

    if (!resp.ok) {
      if (resp.status === 429) return new Response(JSON.stringify({ error: "Rate limited, please retry" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (resp.status === 402) return new Response(JSON.stringify({ error: "AI credits exhausted. Add credits in Workspace → Usage." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const t = await resp.text();
      console.error("AI error", resp.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const data = await resp.json();
    const args = data.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    const score = JSON.parse(args);
    score.total = score.impact + score.cost_avoidance + score.scale + score.strategic_alignment + score.feasibility;
    return new Response(JSON.stringify({ score }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("score-request error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
