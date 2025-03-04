BEGIN;

-- Example queries and helpful snippets for working with shifts

-- 1) Weekly roster (replace timestamps)
-- SELECT * FROM public.get_shifts_in_range('2026-04-19T00:00:00Z'::timestamptz, '2026-04-26T00:00:00Z'::timestamptz);

-- 2) Manually create a shift (if not using app API)
-- INSERT INTO shifts (title, description, start_time, end_time, role, area, room_id, created_by, created_at, updated_at)
-- VALUES ('Mess Duty Morning', 'Prepare breakfast', '2026-04-20T06:30:00Z', '2026-04-20T09:30:00Z', 'cook', 'Mess', NULL, 22, NOW(), NOW());

-- 3) Assign a user to a shift (manual insert)
-- INSERT INTO shift_assignments (shift_id, user_id, status, created_at, updated_at) VALUES (1, 26, 'assigned', NOW(), NOW());

-- 4) Make a swap request for an assignment
-- UPDATE shift_assignments SET status = 'swap_requested', requested_swap_by = 26, updated_at = NOW() WHERE id = 5;

-- 5) Mark assignment completed
-- UPDATE shift_assignments SET status = 'completed', updated_at = NOW() WHERE id = 5;

-- 6) Find open shifts in next 7 days
-- SELECT * FROM public.get_shifts_in_range(now(), now() + interval '7 days') WHERE assignment_id IS NULL;

COMMIT;
