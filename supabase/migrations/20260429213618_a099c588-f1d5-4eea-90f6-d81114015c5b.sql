
-- Enums
CREATE TYPE public.sbu_enum AS ENUM ('MSS', 'SCIM', 'A&I', 'TPC');
CREATE TYPE public.work_item_type_enum AS ENUM ('Feature', 'Bug', 'User Story', 'Task', 'Epic');
CREATE TYPE public.classification_enum AS ENUM (
  'Automation — Enhancement', 'Automation — New', 'Bug Fix',
  'Data / Reporting', 'Infrastructure', 'Process Improvement', 'Tooling'
);
CREATE TYPE public.timeline_enum AS ENUM (
  'FY27 Semester 1 — Sprint 1',
  'FY27 Semester 1 — Sprint 2',
  'FY27 Semester 1 — Sprint 3',
  'FY27 Semester 2',
  'Backlog'
);
CREATE TYPE public.request_status_enum AS ENUM (
  'submitted', 'scored', 'in_review', 'approved', 'handed_off', 'deferred'
);
CREATE TYPE public.confidence_enum AS ENUM ('high', 'medium', 'low');
CREATE TYPE public.dup_status_enum AS ENUM ('suggested', 'confirmed', 'dismissed');
CREATE TYPE public.outcome_enum AS ENUM ('approved', 'deferred', 'merged');

-- Tables
CREATE TABLE public.requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sbu sbu_enum NOT NULL,
  work_item_type work_item_type_enum NOT NULL,
  title TEXT NOT NULL,
  requested_by TEXT NOT NULL,
  description TEXT NOT NULL,
  justification TEXT NOT NULL,
  classification classification_enum NOT NULL,
  target_timeline timeline_enum NOT NULL,
  status request_status_enum NOT NULL DEFAULT 'submitted',
  sxg_ado_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.request_scores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  request_id UUID NOT NULL REFERENCES public.requests(id) ON DELETE CASCADE UNIQUE,
  impact INTEGER NOT NULL,
  cost_avoidance INTEGER NOT NULL,
  scale INTEGER NOT NULL,
  strategic_alignment INTEGER NOT NULL,
  feasibility INTEGER NOT NULL,
  total INTEGER NOT NULL,
  confidence confidence_enum NOT NULL,
  rationale TEXT NOT NULL,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.duplicate_links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  request_id UUID NOT NULL REFERENCES public.requests(id) ON DELETE CASCADE,
  duplicate_of UUID NOT NULL REFERENCES public.requests(id) ON DELETE CASCADE,
  similarity NUMERIC NOT NULL,
  status dup_status_enum NOT NULL DEFAULT 'suggested',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.decisions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  request_id UUID NOT NULL REFERENCES public.requests(id) ON DELETE CASCADE,
  reviewer_alias TEXT NOT NULL,
  outcome outcome_enum NOT NULL,
  notes TEXT,
  decided_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.audit_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  request_id UUID NOT NULL REFERENCES public.requests(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  payload JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_requests_status ON public.requests(status);
CREATE INDEX idx_requests_sbu ON public.requests(sbu);
CREATE INDEX idx_audit_events_request ON public.audit_events(request_id, created_at DESC);

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;
CREATE TRIGGER trg_requests_updated BEFORE UPDATE ON public.requests
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- RLS (open for prototype)
ALTER TABLE public.requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.request_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.duplicate_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "open all" ON public.requests FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "open all" ON public.request_scores FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "open all" ON public.duplicate_links FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "open all" ON public.decisions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "open all" ON public.audit_events FOR ALL USING (true) WITH CHECK (true);
