// Parses an Azure DevOps URL or uploaded file into one or more request drafts.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SBUS = ["MSS", "SCIM", "A&I", "TPC"];
const WORK_ITEM_TYPES = ["Feature", "Bug", "User Story", "Task", "Epic"];
const CLASSIFICATIONS = [
  "Automation — Enhancement",
  "Automation — New",
  "Bug Fix",
  "Data / Reporting",
  "Infrastructure",
  "Process Improvement",
  "Tooling",
];
const TIMELINES = [
  "FY27 Semester 1 — Sprint 1",
  "FY27 Semester 1 — Sprint 2",
  "FY27 Semester 1 — Sprint 3",
  "FY27 Semester 2",
  "Backlog",
];

const tool = {
  type: "function",
  function: {
    name: "extract_requests",
    description: "Extract one or more technical-debt prioritization requests from imported content.",
    parameters: {
      type: "object",
      properties: {
        items: {
          type: "array",
          items: {
            type: "object",
            properties: {
              title: { type: "string" },
              description: { type: "string" },
              justification: { type: "string" },
              sbu: { type: "string", enum: SBUS },
              work_item_type: { type: "string", enum: WORK_ITEM_TYPES },
              classification: { type: "string", enum: CLASSIFICATIONS },
              target_timeline: { type: "string", enum: TIMELINES },
              requested_by: { type: "string" },
            },
            required: ["title", "description", "justification", "sbu", "work_item_type", "classification", "target_timeline", "requested_by"],
            additionalProperties: false,
          },
        },
      },
      required: ["items"],
      additionalProperties: false,
    },
  },
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { url, filename, content } = await req.json();
    if (!url && !content) {
      return new Response(JSON.stringify({ error: "Provide url or content" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const ctx = url
      ? `Azure DevOps reference URL: ${url}\n(No live API access — infer plausible content from the URL path/IDs/keywords.)`
      : `Filename: ${filename ?? "(unnamed)"}\nContents:\n${String(content).slice(0, 8000)}`;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${Deno.env.get("LOVABLE_API_KEY")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content:
              "You convert imported work items into structured prioritization requests. If the source describes multiple distinct items, return multiple. If only one, return one. Write justifications that include impact metrics, scope, and a strategic angle when possible.",
          },
          { role: "user", content: ctx },
        ],
        tools: [tool],
        tool_choice: { type: "function", function: { name: "extract_requests" } },
      }),
    });

    if (res.status === 429 || res.status === 402) {
      return new Response(JSON.stringify({ error: res.status === 402 ? "credits_exhausted" : "rate_limited" }), {
        status: res.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await res.json();
    const args = data?.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    if (!args) {
      return new Response(JSON.stringify({ items: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const parsed = JSON.parse(args);
    // Extract ADO numeric ID from URL if present (e.g. .../_workitems/edit/12345 or ?id=12345)
    const adoMatch = url ? url.match(/(?:edit\/|id=)(\d+)/i) : null;
    const adoFromUrl = adoMatch ? `ADO-${adoMatch[1]}` : null;
    const items = (parsed.items ?? []).map((it: Record<string, unknown>) => ({
      ...it,
      source_ref: url || filename || null,
      ado_id: adoFromUrl ?? `ADO-${Math.floor(100000 + Math.random() * 899999)}`,
    }));

    return new Response(JSON.stringify({ items }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
