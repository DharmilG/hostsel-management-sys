BEGIN;

-- Add optional room reference to shifts
ALTER TABLE IF EXISTS shifts
  ADD COLUMN IF NOT EXISTS room_id INTEGER;

-- Add foreign key to rooms (only if not already present)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_name = 'shifts'
      AND kcu.column_name = 'room_id'
  ) THEN
    ALTER TABLE shifts ADD CONSTRAINT fk_shifts_room FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE SET NULL;
  END IF;
END$$;

-- Ensure shift times are sane (end after start)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.check_constraints WHERE constraint_name = 'chk_shift_times') THEN
    ALTER TABLE shifts ADD CONSTRAINT chk_shift_times CHECK (end_time > start_time);
  END IF;
END$$;

-- Add a status CONSRAINT for assignments to keep values predictable
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.check_constraints WHERE constraint_name = 'chk_shift_assignment_status') THEN
    ALTER TABLE shift_assignments ADD CONSTRAINT chk_shift_assignment_status CHECK (status IN ('assigned','open','swap_requested','completed'));
  END IF;
END$$;

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_shift_assignments_user ON shift_assignments (user_id);
CREATE INDEX IF NOT EXISTS idx_shift_assignments_requested_by ON shift_assignments (requested_swap_by);
CREATE INDEX IF NOT EXISTS idx_shifts_room ON shifts (room_id);

COMMIT;
