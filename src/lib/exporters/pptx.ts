import pptxgen from "pptxgenjs";

type ReportData = {
  generated_at: string;
  role: string;
  totals: { all: number; by_status: Record<string, number>; by_sbu: Record<string, number> };
  top: Array<{ id: string; title: string; sbu: string; status: string; score?: { total: number; confidence: string; rationale: string } | null }>;
  deferred: Array<{ id: string; title: string; sbu: string }>;
  handed_off: Array<{ id: string; title: string; sbu: string; sxg_ado_id: string | null }>;
  decisions: Array<{ request_id: string; outcome: string; reviewer_alias: string; decided_at: string; notes: string | null }>;
};

const NAVY = "1E2761";
const ICE = "CADCFC";
const GOLD = "C9A227";
const INK = "0F172A";

export function exportReportPPT(d: ReportData) {
  const p = new pptxgen();
  p.layout = "LAYOUT_WIDE"; // 13.33 x 7.5

  // Cover
  let s = p.addSlide();
  s.background = { color: NAVY };
  s.addText("Cross-SBU Tech Debt", { x: 0.6, y: 2.4, w: 12, h: 1, color: "FFFFFF", fontSize: 44, bold: true, fontFace: "Calibri" });
  s.addText("Prioritization Report", { x: 0.6, y: 3.3, w: 12, h: 0.7, color: ICE, fontSize: 32, fontFace: "Calibri" });
  s.addShape(p.ShapeType.line, { x: 0.6, y: 4.2, w: 4, h: 0, line: { color: GOLD, width: 2 } });
  s.addText(`${new Date(d.generated_at).toLocaleString()} · ${d.role.toUpperCase()}`, { x: 0.6, y: 4.4, w: 12, h: 0.4, color: ICE, fontSize: 14, fontFace: "Calibri" });

  // Status overview
  s = p.addSlide();
  s.background = { color: "FFFFFF" };
  s.addText("Pipeline overview", { x: 0.5, y: 0.4, w: 12, h: 0.6, fontSize: 28, bold: true, color: INK, fontFace: "Calibri" });
  s.addShape(p.ShapeType.line, { x: 0.5, y: 1.05, w: 2, h: 0, line: { color: GOLD, width: 2 } });

  const statuses = Object.entries(d.totals.by_status);
  const cardW = 1.9, gap = 0.15;
  statuses.forEach(([k, v], i) => {
    const x = 0.5 + i * (cardW + gap);
    s.addShape(p.ShapeType.rect, { x, y: 1.5, w: cardW, h: 1.4, fill: { color: ICE }, line: { color: NAVY, width: 0 } });
    s.addText(String(v), { x, y: 1.6, w: cardW, h: 0.7, fontSize: 36, bold: true, align: "center", color: NAVY, fontFace: "Calibri" });
    s.addText(k.replace("_", " "), { x, y: 2.4, w: cardW, h: 0.4, fontSize: 11, align: "center", color: INK, fontFace: "Calibri" });
  });

  s.addText("By SBU", { x: 0.5, y: 3.3, w: 12, h: 0.5, fontSize: 18, bold: true, color: INK, fontFace: "Calibri" });
  const sbuRows = Object.entries(d.totals.by_sbu).map(([k, v]) => [
    { text: k, options: { bold: true, color: NAVY } },
    { text: String(v), options: { align: "right" as const } },
  ]);
  s.addTable(sbuRows, { x: 0.5, y: 3.85, w: 4, fontSize: 12, fontFace: "Calibri", border: { type: "solid", color: "E5E7EB", pt: 1 } });

  // Top 10 by score
  s = p.addSlide();
  s.background = { color: "FFFFFF" };
  s.addText("Top 10 by score", { x: 0.5, y: 0.4, w: 12, h: 0.6, fontSize: 28, bold: true, color: INK, fontFace: "Calibri" });
  s.addShape(p.ShapeType.line, { x: 0.5, y: 1.05, w: 2, h: 0, line: { color: GOLD, width: 2 } });
  const topRows = [
    [
      { text: "#", options: { bold: true, color: "FFFFFF", fill: { color: NAVY } } },
      { text: "Title", options: { bold: true, color: "FFFFFF", fill: { color: NAVY } } },
      { text: "SBU", options: { bold: true, color: "FFFFFF", fill: { color: NAVY } } },
      { text: "Status", options: { bold: true, color: "FFFFFF", fill: { color: NAVY } } },
      { text: "Score", options: { bold: true, color: "FFFFFF", fill: { color: NAVY } } },
    ],
    ...d.top.map((r, i) => [
      { text: String(i + 1) },
      { text: r.title.length > 60 ? r.title.slice(0, 60) + "…" : r.title },
      { text: r.sbu },
      { text: r.status },
      { text: r.score ? String(r.score.total) : "—" },
    ]),
  ];
  s.addTable(topRows, { x: 0.5, y: 1.4, w: 12.3, fontSize: 11, fontFace: "Calibri", colW: [0.6, 7.5, 1.2, 1.8, 1.2], border: { type: "solid", color: "E5E7EB", pt: 1 } });

  // Decisions
  if (d.decisions.length) {
    s = p.addSlide();
    s.background = { color: "FFFFFF" };
    s.addText("Decisions log", { x: 0.5, y: 0.4, w: 12, h: 0.6, fontSize: 28, bold: true, color: INK, fontFace: "Calibri" });
    s.addShape(p.ShapeType.line, { x: 0.5, y: 1.05, w: 2, h: 0, line: { color: GOLD, width: 2 } });
    const decRows = [
      [
        { text: "Date", options: { bold: true, color: "FFFFFF", fill: { color: NAVY } } },
        { text: "Outcome", options: { bold: true, color: "FFFFFF", fill: { color: NAVY } } },
        { text: "Reviewer", options: { bold: true, color: "FFFFFF", fill: { color: NAVY } } },
        { text: "Notes", options: { bold: true, color: "FFFFFF", fill: { color: NAVY } } },
      ],
      ...d.decisions.slice(0, 12).map((dec) => [
        { text: new Date(dec.decided_at).toLocaleDateString() },
        { text: dec.outcome },
        { text: dec.reviewer_alias },
        { text: (dec.notes ?? "").slice(0, 80) },
      ]),
    ];
    s.addTable(decRows, { x: 0.5, y: 1.4, w: 12.3, fontSize: 11, fontFace: "Calibri", colW: [1.5, 1.5, 2, 7.3], border: { type: "solid", color: "E5E7EB", pt: 1 } });
  }

  // Deferred
  if (d.deferred.length) {
    s = p.addSlide();
    s.background = { color: "FFFFFF" };
    s.addText(`Deferred (${d.deferred.length})`, { x: 0.5, y: 0.4, w: 12, h: 0.6, fontSize: 28, bold: true, color: INK, fontFace: "Calibri" });
    s.addShape(p.ShapeType.line, { x: 0.5, y: 1.05, w: 2, h: 0, line: { color: GOLD, width: 2 } });
    const defRows = [
      [
        { text: "Title", options: { bold: true, color: "FFFFFF", fill: { color: NAVY } } },
        { text: "SBU", options: { bold: true, color: "FFFFFF", fill: { color: NAVY } } },
      ],
      ...d.deferred.slice(0, 16).map((r) => [{ text: r.title.slice(0, 90) }, { text: r.sbu }]),
    ];
    s.addTable(defRows, { x: 0.5, y: 1.4, w: 12.3, fontSize: 11, fontFace: "Calibri", colW: [10.3, 2], border: { type: "solid", color: "E5E7EB", pt: 1 } });
  }

  p.writeFile({ fileName: `tech-debt-prioritization-${Date.now()}.pptx` });
}
