ALTER TABLE public.requests
  ADD COLUMN IF NOT EXISTS source_ref text,
  ADD COLUMN IF NOT EXISTS manual_rank integer,
  ADD COLUMN IF NOT EXISTS reviewer_rating smallint;