BEGIN;

-- View: combined shift + assignment + user + room info for easy queries
CREATE OR REPLACE VIEW public.vw_shift_roster AS
SELECT
  s.id AS shift_id,
  s.title,
  s.description,
  s.start_time,
  s.end_time,
  s.role,
  s.area,
  s.room_id,
  r.room_number,
  r.block,
  sa.id AS assignment_id,
  sa.user_id AS assigned_user_id,
  u.username AS assigned_username,
  u.email AS assigned_email,
  sa.status AS assignment_status,
  sa.requested_swap_by,
  s.created_by,
  s.created_at,
  s.updated_at
FROM shifts s
LEFT JOIN shift_assignments sa ON sa.shift_id = s.id
LEFT JOIN users u ON u.id = sa.user_id
LEFT JOIN rooms r ON r.id = s.room_id;

-- Function: get shifts in a given time-range
CREATE OR REPLACE FUNCTION public.get_shifts_in_range(p_start timestamptz, p_end timestamptz)
RETURNS TABLE(
  shift_id integer,
  title varchar,
  description text,
  start_time timestamptz,
  end_time timestamptz,
  role varchar,
  area varchar,
  room_id integer,
  room_number varchar,
  block varchar,
  assignment_id integer,
  assigned_user_id integer,
  assigned_username varchar,
  assigned_email varchar,
  assignment_status varchar,
  requested_swap_by integer,
  created_by integer,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT shift_id, title, description, start_time, end_time, role, area, room_id, room_number, block, assignment_id, assigned_user_id, assigned_username, assigned_email, assignment_status, requested_swap_by, created_by, created_at, updated_at
  FROM public.vw_shift_roster
  WHERE start_time < p_end AND end_time > p_start
  ORDER BY start_time;
END;
$$;

COMMIT;
