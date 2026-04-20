BEGIN;

-- Shifts table: stores shift definitions (time window, role, area)
CREATE TABLE IF NOT EXISTS shifts (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  role VARCHAR(100),
  area VARCHAR(100),
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Assignments: which user is assigned to a shift, and swap requests
CREATE TABLE IF NOT EXISTS shift_assignments (
  id SERIAL PRIMARY KEY,
  shift_id INTEGER REFERENCES shifts(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  status VARCHAR(32) DEFAULT 'assigned', -- assigned | open | swap_requested | completed
  requested_swap_by INTEGER REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Availability (staff can mark availability windows)
CREATE TABLE IF NOT EXISTS staff_availabilities (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  available_from TIMESTAMPTZ NOT NULL,
  available_to TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shifts_start ON shifts (start_time);
CREATE INDEX IF NOT EXISTS idx_shifts_end ON shifts (end_time);
CREATE INDEX IF NOT EXISTS idx_shift_assignments_shift ON shift_assignments (shift_id);

COMMIT;
