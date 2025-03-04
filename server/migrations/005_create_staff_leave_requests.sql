-- Migration: create staff_leave_requests table
-- Run this using your usual migration runner or psql

CREATE TABLE IF NOT EXISTS staff_leave_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  leave_type varchar(64) NOT NULL,
  start_time timestamptz NOT NULL,
  end_time timestamptz NOT NULL,
  partial boolean DEFAULT false,
  partial_start_time timestamptz,
  partial_end_time timestamptz,
  reason text,
  attachments jsonb DEFAULT '[]'::jsonb,
  status varchar(32) NOT NULL DEFAULT 'pending',
  requested_via varchar(64),
  requested_by_device_id integer,
  admin_id integer,
  admin_comment text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_staff_leave_requests_staff_id ON staff_leave_requests (staff_id);
CREATE INDEX IF NOT EXISTS idx_staff_leave_requests_status ON staff_leave_requests (status);
