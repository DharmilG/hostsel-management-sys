BEGIN;

ALTER TABLE IF EXISTS complaints
  ADD COLUMN IF NOT EXISTS severity INTEGER DEFAULT 3;

-- Optional: add index for queries by severity
CREATE INDEX IF NOT EXISTS idx_complaints_severity ON complaints (severity);

COMMIT;
