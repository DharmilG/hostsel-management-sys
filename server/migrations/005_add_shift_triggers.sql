BEGIN;

-- Generic timestamp updater used by several tables
CREATE OR REPLACE FUNCTION public.update_timestamp() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

-- Create triggers that keep updated_at in sync on update
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_update_shift_timestamp') THEN
    CREATE TRIGGER trg_update_shift_timestamp BEFORE UPDATE ON public.shifts FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_update_shift_assignment_timestamp') THEN
    CREATE TRIGGER trg_update_shift_assignment_timestamp BEFORE UPDATE ON public.shift_assignments FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();
  END IF;
END$$;

COMMIT;
