# Staff Features — Announcements & Permissions

This document describes two staff-facing features requested: **Announcements** and **Permission (Leave) Requests** — with detailed workflows, data models, UI and permission notes. It also contains additional feature ideas, a suggested access matrix, and display recommendations for students and admin.

---

## Announcements & Broadcasts — Detailed specification

Overview
- Purpose: allow admins and staff to create targeted, scheduled, and auditable broadcasts to users (students, staff, or custom groups) with flexible delivery channels (in-app, push, email, SMS, webhooks).
- Value: centralised operational communication for time-sensitive notices (mess/menu changes, maintenance closures, safety alerts) and targeted operational messages for staff teams.

Actors & permissions
- Staff: depending on sub-role and policy may create drafts, request approval, or publish directly. Granular permission flags: `announcements:create`, `announcements:publish`, `announcements:manage`. Staff create/publish actions use the same shared announcements API path (`/api/announcements`) as admins; announcements authored by staff are visible in the same feeds consumed by students and admins. Announcements should include `author_id` and `author_role` (e.g., `admin` | `staff`) in their metadata so clients can surface the source.
- Admin / Moderator: approve/reject, schedule, pin, archive, bulk actions, view delivery analytics and resend failed deliveries. Admins use the same `/api/announcements` endpoints to create and moderate messages and may perform elevated actions (approve/reject/pin) on announcements authored by staff.
- System: background worker role that processes scheduled sends and delivery retries.
- Student / Staff (viewer): receive announcements that match audience filters and configured channels. Consumers use the unified `GET /api/announcements` feed (and `GET /api/announcements/:id`) to retrieve announcements regardless of whether the author is admin or staff.

Audience & targeting model
- Audience types:
  - `all` — every active user.
  - `role` — users with a role (students, staff, maintenance, admin).
  - `area` — floor/block/room filters.
  - `custom` — saved user lists or ad-hoc selectors (CSV import, group selectors).
  - `dynamic` — query-based groups (e.g., students in floor 3, staff with role `cook`).
- Audience filters stored as structured JSON: {type: 'role'|'area'|'custom', filters: {...}} and normalized to a resolved recipient set at publish time.

Data model (suggested)
- announcements
  - id uuid
  - author_id uuid
  - title varchar
  - body text (store raw markdown + sanitized_html)
  - audience json -- structured audience filters
  - audience_count int nullable -- cached number of targeted recipients after resolution
  - status enum(draft|pending|scheduled|publishing|published|archived|rejected)
  - publish_at timestamptz nullable
  - expire_at timestamptz nullable
  - require_approval boolean default true
  - approved_by uuid nullable
  - approved_at timestamptz nullable
  - is_pinned boolean default false
  - is_featured boolean default false
  - allow_replies boolean default false
  - attachments json nullable -- lightweight refs
  - meta json nullable -- misc (tags, categories)
  - created_at timestamptz, updated_at timestamptz

- announcement_attachments
  - id uuid, announcement_id uuid, uploaded_by uuid nullable, file_ref varchar, thumb_ref varchar nullable, meta json, uploaded_at

- announcement_templates
  - id uuid, name, subject_template varchar, body_template text, created_by, created_at, updated_at

- announcement_deliveries (broadcast log)
  - id uuid, announcement_id uuid, user_id uuid, channel enum(in_app|push|email|sms|webhook), status enum(pending|sent|failed|skipped), delivered_at timestamptz nullable, read_at timestamptz nullable, error text nullable

- announcement_metrics (aggregated)
  - announcement_id, delivered_count, sent_count, failed_count, read_count, clicked_count, aggregated_at

API endpoints (examples)
- POST /api/announcements — create announcement (roles: `admin`, `staff` with `announcements:create`; support `preview=true` to render templates). When a staff author creates an announcement the `require_approval` flag and configured approval rules determine if the announcement goes to a moderation queue or publishes immediately.
- GET /api/announcements?status=&audience=&author= — list (roles: authenticated users; students/staff/admin; list respects per-item visibility filters and audience targeting). Staff-authored announcements are returned here alongside admin-authored items.
- GET /api/announcements/:id — full details + metrics (metrics fields limited to admin/owner where appropriate; non-admins receive content and delivery status where allowed).
- PUT /api/announcements/:id — edit (author or admin, restrictions when published)
- POST /api/announcements/:id/schedule — schedule a publish job (admin or staff with scheduling permission)
- POST /api/announcements/:id/approve — admin approval (admin-only; used to approve staff-created pending announcements)
- POST /api/announcements/:id/reject — admin rejection (with reason)
- POST /api/announcements/:id/pin — pin/unpin (admin)
- POST /api/announcements/:id/resend — resend to failed recipients (admin or staff with `announcements:manage`)
- POST /api/announcements/templates — manage templates (admin)

Note: Use a unified `/api/announcements` surface for both creation and consumption so that announcements from `admin` and `staff` appear in the same feeds for students and staff; include `author_role` and `author_id` in responses so UIs can clearly show the source and apply any role-specific UI affordances (e.g., show "Posted by Staff" badge).

UI / UX flows
- Create flow (staff): compact form with title, body (markdown editor), audience builder (role, area, custom), attachments, publish options (immediate / schedule / draft), and `preview as` selector to preview for a sample user.
- Moderation (admin): queue view for `pending` announcements with diff preview, attached media, audience summary, estimated reach, and single-click approve/reject. Bulk operations for efficiency.
- Student feed: ordered by pinned + priority + publish_at. Each item supports `dismiss` and `save` actions. Feed respects `expire_at` and audience filters.
- Banner / urgent mode: admins can mark `is_featured` to show a persistent banner notification across the app (dismissible or mandatory ack depending on policy).

Delivery architecture & scheduling
- Background worker queue (e.g., Bull, Agenda): scheduled jobs enqueue announcement delivery tasks; worker resolves recipient lists in batches and emits channel-specific deliveries.
- Fan-out strategy: for large audiences, batch into N-sized chunks, parallel workers, and record `announcement_deliveries` per user to track status and prevent duplicate sends.
- Idempotency: mark announcements with `publishing` state and use job ids; ensure retry-safe by checking `announcement_deliveries` existence before sending.
- Rate limits & throttling: per-channel throttles (e.g., emails/sec, SMS/min), global sender limits, and per-origin rate-limits to prevent abuse.

Channels & integrations
- In-app: push via WebSocket/Socket.io or server-sent events; create notification records and increment unread counters.
- Push: FCM/APNs for mobile push; store device tokens and send with collapse keys for repeat notices.
- Email: transactional provider (SendGrid/Postmark) using templating; send batches and track bounces.
- SMS: Twilio or similar, with opt-in checks and cost-aware batching.
- Webhooks: call external endpoints for third-party integrations (careful with retries and backoff).
- Templates: support template variables (Mustache/Handlebars-like) and preflight sanitization.

Moderation & safety
- Auto-approval rules: configurable by admin (e.g., allow `cook` role to auto-publish low-priority notices); otherwise route to moderation queue.
- Spam prevention: rate limits per user/device, blocklist keywords, and attachment scanning.
- Content sanitization: sanitize markdown to safe HTML and remove disallowed tags/attributes; apply link-rel=nofollow and target policies.

Auditing & compliance
- Record all moderation actions in `audit_logs` with actor, device_id, reason, and diff of content.
- Keep `announcement_deliveries` for X days (configurable) for troubleshooting; aggregate metrics in `announcement_metrics` for dashboards.

Analytics & metrics
- Track: estimated reach, actual delivered, failures, read/ack rates, click-through on links, per-audience breakdown, and time-to-read distributions.
- Dashboards: admin dashboard with top-performing announcements, delivery failure trends, and audience engagement heatmaps.

Edge cases & validations
- Timezones: store `publish_at` in UTC, allow scheduling in user's local timezone with conversion at schedule creation.
- Overlapping announcements: provide prioritisation (pinned > featured > normal) and UI to resolve conflicts when multiple banners apply.
- Large audiences: use asynchronous fan-out and provide progress UI showing batches processed / remaining.

Attachments & security
- Scan uploads for malware; generate thumbnails; enforce attachment size limits and allowed mime-types.
- Use signed URLs for access and short-lived tokens for downloads.

Testing plan
- Unit tests: audience filter resolution, template rendering and sanitization, approval policy checks.
- Integration tests: scheduled publish job -> delivery enqueue -> per-channel send simulations, and delivery log persistence.
- E2E: staff creates announcement -> admin approves -> recipients get in-app + email -> metrics update.

Migration & models to add
- Add migration `008_create_announcements_tables.sql` to `server/migrations/` to create `announcements`, `announcement_attachments`, `announcement_templates`, `announcement_deliveries`, and `announcement_metrics` tables.
- Add server models: `Announcement.js`, `AnnouncementAttachment.js`, `AnnouncementTemplate.js`, `AnnouncementDelivery.js`, `AnnouncementMetrics.js` in `server/models/`.

Phased MVP (recommended)
1. Core announce: create/publish in-app announcements, moderation queue, and simple audience filters (role/area).
2. Scheduling + attachments + worker-based delivery logs + basic email channel.
3. Push/SMS channels, advanced templates, analytics dashboards, and auto-approval rules.

Estimated implementation tasks
- DB migration & models: 0.5–1 day
- Server controllers, scheduling & worker integration: 1–2 days
- Client create/moderation UI + preview: 1–2 days
- Email/push wiring & delivery reliability: 1–2 days
- Tests & analytics UI: 1–2 days

Deliverables
- Migration file(s) and models
- Server endpoints for announce CRUD, scheduling, moderation and delivery monitoring
- Worker scripts / queue setup for scheduled sends
- Client components: `CreateAnnouncement.jsx`, `AnnouncementQueue.jsx`, `AnnouncementFeed.jsx`, `AnnouncementDetail.jsx`
- Tests and documentation updates in `doc/staff-features.md`

Questions / decisions needed
- Which channels should be supported at launch (in-app, email, SMS, push)? Recommended: in-app + email first.
- Default approval rules: auto-approve for selected staff roles or require admin approval for all non-admin authors?
- Maximum attachment size and retention policy (recommended 5MB, retain delivery logs 90 days).

---

## 2) Permission (Leave) Requests

Overview
- Purpose: let staff request time off (sick, personal, emergency, short leave) from shared or personal devices, provide a clear approval workflow for admins, and automatically adjust rosters/coverage where required.
- Goal: make requesting and approving leave simple and auditable, provide replacement workflows, attach evidence (medical certificates), and surface coverage impact to admins before approval.

Actors & permissions
- Staff (shared-device or individual): create, view, cancel their own requests; attach documents; request replacements or propose temporary coverage.
- Admin: view and manage all leave requests, approve/deny, assign replacements, view coverage impact, and enforce leave policies (blackout dates, max consecutive days).
- Students: no direct visibility to leave requests; admin or staff can create announcements to notify students when appropriate.

Workflows / user stories
- Staff creates a leave request: choose leave type, start/end date & time, partial/full-day, reason, optional attachments, and optional replacement suggestion. On shared devices the staff selects their profile before submitting.
- Validation: client validates required fields and attachment size/type; server re-validates and stores a `pending` request.
- Admin review: admin reviews request, coverage impact (conflicts with scheduled shifts), attached documents, and either `approve`, `deny`, or `request more info` (comment).
- After approval: the request status changes to `approved`, the roster/shift assignments are updated (either automatically reassign to a replacement or flagged as unassigned), and notifications are sent.
- Cancelling & corrections: staff may cancel pending requests; admin may create manual adjustments for historical leaves (creates an audit trace).

Detailed state machine (example)
- draft -> pending (submitted)
- pending -> approved | denied | more_info_requested | cancelled
- approved -> cancelled (if admin or staff revokes) or completed (after end date)
- denied -> pending (if staff re-submits with changes)

Data model (suggested, extended)
- staff_leave_requests
  - id (uuid)
  - staff_id (uuid) -- requester
  - leave_type (enum: sick | personal | emergency | unpaid | other)
  - start_at (timestamp)
  - end_at (timestamp)
  - partial_day (boolean)
  - partial_start_time (time nullable) -- for partial days
  - partial_end_time (time nullable)
  - reason (text)
  - attachments (json array) -- file refs
  - replacement_staff_id (uuid nullable) -- suggested replacement
  - auto_assigned_replacement_id (uuid nullable) -- replacement assigned by admin/system
  - status (enum: draft | pending | approved | denied | cancelled | more_info_requested)
  - requested_by_device_id (uuid nullable) -- device metadata for shared-devices
  - requested_via (enum: shared_device | individual_account | admin_tool)
  - requested_at, responded_by (uuid nullable), responded_at (timestamp nullable)
  - admin_comment (text nullable)
  - coverage_impact (json nullable) -- computed summary of affected shifts/rooms
  - created_at, updated_at

- leave_policies (optional)
  - id (uuid)
  - name, max_consecutive_days, min_notice_hours, blackout_dates (json), auto_approve_rules (json)

API endpoints (examples, extended)
- POST /api/staff/leave-requests — create request (staff/device) (body: leave details + attachments)
- GET /api/staff/leave-requests — list own requests (staff)
- GET /api/staff/leave-requests?status=pending — admin: list pending requests
- GET /api/staff/leave-requests/:id — view request details, including coverage impact
- POST /api/staff/leave-requests/:id/approve — admin approves (optionally assign replacement)
- POST /api/staff/leave-requests/:id/deny — admin denies (with reason)
- POST /api/staff/leave-requests/:id/request-more-info — admin requests clarification
- POST /api/staff/leave-requests/:id/cancel — staff or admin cancels request
- POST /api/staff/leave-requests/:id/assign-replacement — admin assigns replacement staff or device
- POST /api/staff/leave-requests/bulk-approve — admin convenience endpoint

Client & device flows
- Staff UI (client/src/pages/staff/LeaveRequests.jsx)
  - Create Request form with date/time pickers, leave type selector, file attachments, optional replacement suggestion (select from available staff).
  - My Requests list with status badges, admin comments, and cancel action for pending requests.
  - Request history and downloadable attachments.

- Shared-device flow (client/src/components/DeviceLeavePanel.jsx)
  - On shared devices show a `Request Leave` action after staff selects their profile. The device caches the staff identity and creates the request with `requested_via=shared_device` and `requested_by_device_id` set.
  - For offline devices, queue request and attempt upload when online; show sync status and conflict resolution options.

- Admin UI (pages/admin/LeaveAdmin.jsx)
  - Pending requests queue with filters (date range, role, area, leave_type, staff). View coverage impact cards showing affected shifts and suggested replacements.
  - Inline approve/deny/assign replacement actions with audit comments. Bulk actions for efficiency.

Coverage & auto-assignment logic
- Compute coverage_impact by checking `shift_assignments` for overlapping shifts; surface count of affected shifts and windows without coverage.
- Auto-assignment strategies (configurable):
  - Suggest available staff with matching role and no overlapping assignments.
  - Fallback to device/role-level assignment when no staff available.
  - If no replacement found, flag shift(s) as `unassigned` and escalate to admin.
- When admin chooses auto-assign, update `shift_assignments` and record `auto_assigned_replacement_id` on the leave request for audit.

Approval policies & automation
- Admin-configurable auto-approval: small leave requests under `min_notice_hours` or certain types (e.g., short sick leave) may be auto-approved if policy allows and replacement coverage is present.
- Blackout dates: prevent approval or require explicit override.

Attachments & security
- Allow attachments (images, PDFs). Enforce file size limits (e.g., 5–10MB) and scan uploads for malware where possible.
- Store file references in secure storage (S3 or server uploads) with access control; do not expose raw URLs to unauthenticated users.

Notifications & events
- On submission: notify admins on duty and assigned managers; send confirmation to staff.
- On approval/denial: notify staff with admin comments; if approved and replacement assigned, notify replacement staff.
- On cancellation: notify affected parties and update roster/coverage displays.

Edge cases & offline behavior
- Offline request submission: allow queuing on device and sync when online; ensure attachments can be uploaded later or use local references until sync.
- Overlapping/duplicate requests: detect and warn staff at submit time; admin tools show merged/conflicting requests.
- Partial-day handling: ensure partial_start_time and partial_end_time are used to compute coverage impact and timesheet adjustments.

Audit & security
- All actions (create, approve, deny, assign replacement, cancel) must be logged in `audit_logs` with actor, device_id, timestamp, and reason.
- Restricted edits: only admins with `leave:manage` can edit approved/denied historical requests; such edits create `manual_adjustment` audit entries.

Integration with attendance & shifts
- On approval, call shift management routines to mark assignments as replaced or unassigned; optionally create calendar events for new assignments.
- On denial, optionally create an internal note on the affected shifts so the system can re-evaluate coverage.

Testing plan
- Unit tests for policy checks, coverage impact calculation, and assignment suggestions.
- Integration tests for end-to-end workflow: request -> admin approve -> shift update -> notifications.
- E2E tests for shared-device creation and offline sync scenarios.

Migration & models to add
- Add migration `005_create_leave_requests.sql` in `server/migrations/` to create `staff_leave_requests` and optionally `leave_policies` tables.
- Add `server/models/StaffLeaveRequest.js` that maps to the table and includes helper methods to compute coverage impact and status transitions.

Phased MVP (recommended)
1. Basic request submission + admin approval/denial + roster flagging (no auto-assignment).
2. Coverage calculation + replacement suggestion UI + offline device support.
3. Auto-assignment rules + calendar sync + bulk admin actions.

Estimated implementation tasks
- DB migration & models: 0.5–1 day
- Server controllers & policy validation: 1–2 days
- Client staff form + admin queue UI: 2–3 days
- Shared-device queueing & offline sync: 1–2 days
- Tests & notifications wiring: 1–2 days

Deliverables
- Migration file(s) and models
- Server endpoints for leave CRUD and approvals
- Client components: `DeviceLeavePanel.jsx`, `LeaveRequests.jsx`, and admin pages
- Tests, documentation updates in [doc/staff-features.md](doc/staff-features.md#L1)

Questions / decisions needed
- Replacement preference: should admins be allowed to assign staff from other areas when matching role is unavailable?
- Policy defaults: max consecutive days and min notice — should I set sane defaults (e.g., max 14 consecutive days, min 24 hours)?

Next steps
- If you approve, I can generate the SQL migration and model files now, then scaffold server controllers and client pages in sequence. Which step should I start with?

---

## Additional staff feature ideas (short list)
- Shift scheduling & roster management — assign shifts, display staff rota.
- Staff attendance & timesheets — clock-in/out and exportable reports.
- Task assignments & checklists — assign cleaning/maintenance tasks with completion check.
- Inventory & mess management — allow cook to update menu and stock levels.
- Incident / security reports — security staff can file incidents with evidence.
- Room maintenance & repair logs — staff can log repair requests and completion status.
- Staff directory & contact cards — public (to students) or internal view with role, shift, contact.
- Staff chat / messaging — internal channel for staff coordination (optionally restricted by role).

## Internal Chat / Messaging — Detailed specification

Overview
- Purpose: provide a persistent, auditable internal chat system for staff coordination with support for role/area-targeted channels, hostel-wide groups, and one-to-one personal chats. Chats are stored in the database, surfaced in real-time via WebSocket, and automatically purged after 90 days (3 months) per retention policy.
- Value: fast operational coordination, quick escalation, evidence trail for decisions, and searchable conversation history while enforcing privacy and retention rules.

Core requirements (from your brief)
- Chats must be saved (persisted) on the server.
- Messages older than 3 months must be deleted automatically.
- Pre-created groups: `hostel_all` (all members), `staff_admin` (staff + admin), `admin_students` (admin + students).
- Personal (direct) chats must be supported (e.g., staff -> admin direct message).
- Do NOT use Axios in examples — use the existing `fetch` or the project's `fetchClient.js` and WebSocket for realtime.

Actors & permissions
- Admin: full channel management, create system channels, add/remove members, moderate messages, view audit logs.
- Staff: create/join allowed channels, send/read messages, create 1:1 chats with permitted users.
- Student: member of specified channels (e.g., `admin_students`, `hostel_all` if allowed) — access limited by per-channel visibility.

Channel & message model (suggested SQL)
```sql
-- Channels
CREATE TABLE chat_channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE,
  type VARCHAR(32) NOT NULL, -- 'group'|'direct'|'system'
  group_type VARCHAR(64), -- 'hostel_all'|'staff_admin'|'admin_students' etc.
  created_by UUID,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Channel members
CREATE TABLE chat_channel_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID REFERENCES chat_channels(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(32) DEFAULT 'member', -- member|moderator|owner
  joined_at TIMESTAMPTZ DEFAULT now()
);

-- Messages
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID REFERENCES chat_channels(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES users(id),
  content TEXT,
  content_json JSONB,
  attachments JSONB, -- [{file_ref, thumb_ref, meta}]
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_chat_messages_channel_created_at ON chat_messages (channel_id, created_at DESC);
CREATE INDEX idx_chat_messages_tsv ON chat_messages USING gin (to_tsvector('english', coalesce(content,'')));

-- Reads
CREATE TABLE chat_message_reads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID REFERENCES chat_messages(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  read_at TIMESTAMPTZ DEFAULT now()
);
```

Retention policy (3 months)
- Persist messages normally in `chat_messages` and attachments in S3 (or configured storage). A scheduled background job (daily) runs:
```sql
DELETE FROM chat_messages WHERE created_at < now() - interval '90 days';
```
- Before deletion the job should:
  - Optionally export aggregated metadata for audit/analytics.
  - Delete referenced attachments from storage (S3) using the file refs contained in `attachments` JSON.
  - Write an `audit_logs` entry recording retention purges (who/when/job-id).
- Implementation note: perform deletes in batches (e.g., 1000 messages per batch) to avoid long transactions.

Channel types & default groups to create on install
- `hostel_all`: all registered hostel members (students + staff + admin) — read-only for students if desired.
- `staff_admin`: members with roles `staff` OR `admin` (used for operational coordination).
- `admin_students`: admin + students for announcements requiring admin+student dialog.
- `direct` channels: personal 1:1 channels created when two users first message each other (unique pair constraint recommended).

API endpoints (examples — use `fetchClient.js` or native `fetch`, not Axios)
- POST /api/chat/channels — create channel (body: {name,type,group_type,members:[]})
- GET /api/chat/channels — list channels the user is a member of
- GET /api/chat/channels/:id/messages?limit=50&before=<ts|messageId> — fetch history (pagination)
- POST /api/chat/channels/:id/messages — send message (body: {content,content_json,attachments:[]})
- POST /api/chat/channels/:id/typing — emit typing indicator (for realtime only)
- POST /api/chat/channels/:id/read — mark messages read (body: {message_id})
- POST /api/chat/channels/:id/members — add member (admin/moderator)
- DELETE /api/chat/channels/:id/members/:memberId — remove member
- GET /api/chat/search?q= — search across allowed channels (auth-per-channel)

Realtime events (WebSocket / Socket.io recommendations)
- Use a server-side socket gateway (Socket.io or ws + authentication). Example events:
  - `connect` (auth)
  - `subscribe.channel` (join channel room)
  - `message.created` (payload: message)
  - `message.delivered` (ack)
  - `message.read` (user_id,message_id)
  - `typing` (channel_id,user_id)
  - `channel.member_added` / `channel.member_removed`
- Client responsibilities: open websocket connection after auth, subscribe to active channels, fall back to polling if websockets unavailable.

Message persistence & delivery guarantees
- Write-to-store before broadcast: server persists `chat_messages` and then emits `message.created` to channel subscribers (ensures durable delivery).
- For mobile/offline clients: accept messages offline and sync on reconnect; resolve conflicts using server timestamps and message ids.

Search & indexing
- For small scale, use Postgres full-text (`to_tsvector`) with GIN index. For larger scale or advanced search, index messages into Elasticsearch/Opensearch.
- Respect per-channel visibility during search: only return hits in channels where the requester is a member or has access.

Attachments & storage
- Upload attachments to signed S3 URLs via `/api/uploads/sign` (multipart/resumable flows) and include `attachments` metadata in `chat_messages`.
- Clean-up attachments on message deletion as part of the retention job.

Moderation & audit
- Message moderation: admins/moderators can delete/flag messages — record all moderation actions in `audit_logs` with actor and reason.
- Provide `chat_message_flags` table to record user-reported messages.

Personal (1:1) chats
- Create `direct` channel with deterministic slug (e.g., sorted-userids `dm:uid1:uid2`) to ensure a single channel exists per pair.
- Permissions: only the two members (plus admin/moderator with audit permissions) may access content.

Privacy & encryption
- Transport encryption: require TLS for WebSocket and REST.
- At-rest: encrypt attachments in storage; encrypt sensitive fields as required.
- End-to-end encryption is out-of-scope for the initial MVP — consider later when regulatory or privacy needs demand it.

Retention, exports & legal holds
- Default retention: 90 days. A special `legal_hold` flag on channels or messages prevents deletion while set.
- Provide an export endpoint for admins to export conversation bundles (messages + attachments + audit logs) prior to scheduled deletion.

Testing plan
- Unit tests: channel creation, membership enforcement, message CRUD, read receipts, retention job logic.
- Integration tests: websocket message flow (send -> persist -> broadcast -> read ack), search permission checks.
- E2E tests: create default groups, staff sends DM to admin, admin responds, verify messages persist and are deleted after retention job run (using test clock).

Deliverables
- Migration: `server/migrations/00X_create_chat_tables.sql` (channels, members, messages, reads, flags)
- Models: `ChatChannel.js`, `ChatMessage.js`, `ChatMember.js`, `ChatMessageRead.js`, `ChatFlag.js`
- Routes/controllers: `server/src/routes/chatRouter.js`, `server/src/controllers/chatController.js` (REST) and `server/src/ws/chatSocket.js` (websocket gateway)
- Client components: `client/src/components/ChatList.jsx`, `client/src/components/ChatWindow.jsx`, `client/src/components/ChannelSettings.jsx` and `client/src/components/DirectMessageButton.jsx`.

Notes / constraints
- Do not use Axios in the client implementation; prefer the project's `client/src/api/fetchClient.js` or native `fetch` for REST calls and WebSocket for realtime messages.
- Implement retention deletion as a safe background job with batching and audit logging.

If you'd like, I can scaffold the chat migration and models next, or implement the websocket gateway and a minimal chat UI. Which should I start with?

## Suggested staff access fields & permissions (high-level)
- Staff profile fields: job_title (cook/cleaner/security), assigned_area (floor/blocks), contact_phone, shift_pattern, certifications.
- Data access by staff: own profile, their leave requests, tasks assigned to them, announcements created or targeted to them, limited student location info (room/floor) when necessary for tasks.
- Sensitive data: staff should NOT see student personal info (phone, email) unless explicitly needed and approved; prefer room/floor identifiers.

## How to show staff details to Students and Admin
- Admin UI
  - Staff Management page: list staff, add/edit profiles, set sub-role, view pending leave requests, roster & coverage view.
  - Moderation queues for announcements and incident reports.
- Student UI
  - Staff Directory (public): show name, role, assigned area, contact method (phone/hostel extension or in-app contact). Mark staff with role badge (e.g., "Security", "Cook").
  - Announcement feed: show announcements filtered to student audience; show source (Admin/Staff) and timestamp.
- Staff UI
  - Staff Dashboard: shortcuts to "Request Leave", "Create Announcement" (if allowed), "My Tasks", and upcoming shift/roster.

## Next steps / recommended implementation plan
1. Add `staff` to roles (DB migration) and create optional `staff_profiles` table for job-specific fields.
2. Update `roleMiddleware` to include `staff` with appropriate permissions.
3. Add endpoints & server-side validation for announcements and leave requests; reuse existing notification system for alerts.
4. Build small UI components: staff dashboard card, create-announcement modal, leave-request form, admin moderation queues.
5. Add tests for RBAC, announcement visibility filters, and leave-request lifecycle.

---

If you want, I can now: add the DB migration and model for `staff_profiles`, update RBAC middleware to include `staff`, or implement the client UI forms for these features. Tell me which next step you prefer.

---

## All Tasks — Names & Brief Details

Below is a consolidated list of the tasks/features we discussed, with a short description for each. These are written so you can pick which to implement first.

- Shift Scheduling & Roster Management: create and publish weekly/monthly shift rosters, allow shift swaps and self-service availability, and export or sync shifts to calendars (Google Calendar).
- Attendance & Clock-in/Clock-out: device-based clocking (QR/PIN/button) with per-device logs, timesheet generation, and payroll export.
- Leave & Permission Requests: staff submit leave/permission from device; admin reviews, approves/denies, and the roster/coverage adjusts automatically.
- Tasks & Checklists: create recurring or one-off tasks (cleaning, mess prep), assign to staff or device, attach photos on completion, and mark verification.
- Maintenance & Repair Tickets: students or staff open repair tickets, attach photos, assign maintenance staff, set priority and track completion.
- Announcements & Broadcasts: staff/admin create targeted announcements (students, staff, floors), with optional admin approval and scheduling.
- Incident & Security Reporting: security staff record incidents with severity, location, and multimedia evidence; enable escalation to admin.
- Inventory & Mess Management: manage stock levels for mess/kitchen, record consumption, notify for low-stock, and handle purchase requests.
- Staff Directory & Profiles: structured staff profiles (role, assigned area, contact info, certifications) visible to students and admins per privacy settings.
- Shift Coverage Alerts & Analytics: real-time alerts for understaffed shifts and dashboards with coverage, attendance, incidents, and operational KPIs.
- Task Verification (QR Proof): place QR tags in zones or rooms; staff scan to verify task completion and create an auditable trail.
- Internal Chat / Messaging: staff-only channels for quick coordination and targeted messages per role or area.
- Reports & Exports: CSV/PDF exports for attendance, payroll, maintenance logs, incidents, and inventory reports.
 - Reports & Exports: CSV/PDF exports for attendance, payroll, maintenance logs, incidents, and inventory reports.

## Reports & Exports — Detailed specification

Overview
- Purpose: provide reliable CSV/PDF exports and scheduled reports for operational data (attendance, payroll, maintenance tickets, incidents, inventory, and combined KPI bundles). Exports must be auditable, respect RBAC, support large datasets (streaming/batched generation), and optionally deliver results via signed download links or email.

Core concepts
- `export_jobs` record: user requests an export -> background worker generates the file (CSV/PDF) -> stores it (S3 or server storage) -> job completes with `file_ref` (signed URL) and expiry.
- Streaming vs batch: use streaming DB exports (COPY / cursor-based streaming) for CSVs or chunked generation for extremely large data sets.
- Scheduled reports: support recurring exports (cron-like schedule) and recipient lists.

Suggested export_jobs migration
```sql
CREATE TABLE export_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_type VARCHAR(64) NOT NULL, -- e.g., attendance_csv, payroll_pdf
  filters JSONB DEFAULT '{}'::jsonb,
  format VARCHAR(16) NOT NULL, -- csv|pdf|xlsx
  status VARCHAR(32) DEFAULT 'pending', -- pending|running|completed|failed
  requested_by UUID REFERENCES users(id),
  file_ref VARCHAR(2048), -- S3 path or server path
  file_size BIGINT,
  expires_at TIMESTAMPTZ,
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);
CREATE INDEX idx_export_jobs_status ON export_jobs(status);
```

API endpoints (examples)
- POST /api/exports — create export job (body: {job_type, format, filters, schedule?})
  - Response: `{ job_id, status }` (201)
- GET /api/exports/:id — job status & metadata (auth and RBAC)
- GET /api/exports/:id/download — redirect to signed URL or stream file (only if job completed and user has rights)
- GET /api/exports?status=&job_type=&requested_by= — admin listing of export jobs
- POST /api/exports/:id/cancel — cancel pending/running job

Background worker responsibilities
- Validate filters and RBAC, then generate export using streaming query or template rendering.
- Write output to temporary file or stream directly to S3 using multipart upload.
- On success update `export_jobs` with `file_ref`, `file_size`, `status=completed`, `completed_at`, and set `expires_at` (e.g., now()+7 days).
- On failure record error and notify requester.

Delivery & retention
- Provide signed download URLs with short TTL for downloads (e.g., 24 hours), and store `file_ref` until `expires_at`.
- Retain exported files for a configurable period (default: 7 days) and then delete: scheduled cleanup job will remove expired file_refs and set `file_ref` to NULL, plus update `status=expired`.

RBAC & masking
- Sensitive exports (payroll, student PII) restricted to roles: `payroll:export`, `admin`, or `finance`.
- Masking rules: export generators must apply `isVisibleTo`/masking rules for fields (e.g., mask phone/email if requester lacks permission).
- All export requests must be logged in `audit_logs` with `filters`, `requested_by`, and `job_id`.

Example CSV schemas
- Attendance CSV (`attendance_csv`):
  - Columns: staff_id, staff_name, date, clock_in_utc, clock_out_utc, duration_seconds, device_id, shift_id, notes
- Payroll CSV (`payroll_csv`):
  - Columns: staff_id, staff_name, pay_period_start, pay_period_end, regular_hours, overtime_hours, breaks_hours, pay_rate, gross_pay, deductions, net_pay
- Maintenance tickets CSV (`tickets_csv`):
  - Columns: ticket_id, reporter_id, reporter_type, title, category, priority, status, assigned_to, created_at, resolved_at, cost_estimate
- Incidents CSV (`incidents_csv`):
  - Columns: incident_id, reporter_id, category, severity, occurred_at, reported_at, assigned_to, status, closed_at
- Inventory CSV (`inventory_csv`):
  - Columns: item_id, sku, name, category, unit, on_hand, reserved, par_level, reorder_point, last_received_at

PDF/Report generation
- For rich PDF reports (dashboards, combined KPI reports) render HTML templates server-side and convert to PDF using headless browser (Puppeteer) or a PDF library; ensure async job generation and streaming to storage.

Scheduling & recurring reports
- Support recurring jobs configuration: `{cron: '0 2 * * 1', recipients: ['ops@...'], job_type:'attendance_csv', filters:{...}}`.
- Store schedule metadata and next_run in `export_jobs_schedule` (separate table) and enqueue jobs via scheduler service.

Large datasets & performance
- Use DB COPY (Postgres) for CSV exports when possible. For complex joins/transformations, use cursor-based streaming (e.g., node-postgres cursor) to write rows incrementally.
- For exports involving media (attachments), provide CSV with file_refs and optionally bundle attachments into a ZIP stored alongside the CSV, or provide manifest for selective download.

Searchable reports & on-demand filters
- Provide a UI to preview export row counts (estimate) by running a `COUNT(*)` with identical filters before generating large exports.

Audit & compliance
- Record each export request and its filters in `audit_logs` and store a checksum (SHA256) of generated files for integrity checks when required.

Testing plan
- Unit tests: filter validation, RBAC enforcement, CSV schema correctness, masking rules.
- Integration tests: job lifecycle (pending -> running -> completed -> download), scheduled recurring job enqueue & run.
- E2E: request payroll export -> worker generates CSV -> user downloads -> verify masked fields for non-privileged user.

Deliverables
- Migration: `server/migrations/00X_create_export_jobs.sql`.
- Model: `server/models/ExportJob.js`.
- Controller/routes: `server/src/routes/exportRouter.js`, `server/src/controllers/exportController.js` (endpoints above).
- Worker: `server/src/workers/exportWorker.js` that handles job execution and storage upload.
- Client UI: `client/src/pages/admin/Exports.jsx` to request exports, list jobs, and download results.

Operational notes
- Set sensible defaults: exported files expire after 7 days; retention/deletion windows configurable via env vars.
- Monitor export job errors and queue backpressure; provide rate limits to prevent abuse.

If you'd like, I can scaffold the migration and model for `export_jobs` next, or implement the export job worker and endpoints. Which should I start with?
 - Integrations: Google Calendar sync for shifts/events; optional SMS/email gateways for escalations and reminders.

## Integrations — Google Calendar, SMS & Email Gateways (expanded)

Overview
- Purpose: provide reliable integrations for calendar sync (shifts/events) and outbound communications (SMS/email) used for reminders, escalations, and notifications. Integrations are pluggable, secure, auditable, and respect RBAC and user preferences.

1) Google Calendar sync (shifts & events)

Goals & mapping
- Sync published rosters and individual `shift` objects to Google Calendar so staff (when they have emails) and shared calendars receive events. Map `shift` -> calendar event with fields: summary, description, start/end (with timezone), location, attendees, reminders.

Architecture options
- Service account (recommended for shared hostels): use a service account to manage a shared hostel calendar (no per-user OAuth). Best when you sync to a single organisational calendar or per-hostel calendars.
- OAuth consent (per-admin): allow per-hostel admin to connect via OAuth to their Google account when per-user calendar invites or personal attendee updates are required.

Data mapping example (event fields)
```json
{
  "summary": "Morning Cook - Block A",
  "description": "Shift ID: <shift_id>\nAssigned: Ramesh Kumar",
  "start": {"dateTime":"2026-05-01T07:00:00","timeZone":"Asia/Kolkata"},
  "end": {"dateTime":"2026-05-01T11:00:00","timeZone":"Asia/Kolkata"},
  "location": "Block A - Kitchen",
  "attendees": [{"email":"ramesh@example.com","displayName":"Ramesh Kumar"}],
  "reminders": {"useDefault":false,"overrides":[{"method":"email","minutes":60}]}
}
```

Mapping persistence
- Store remote event ids and mapping in `calendar_event_mappings` table so updates/deletes map to the correct Google event id.

Suggested DDL (calendar mapping)
```sql
CREATE TABLE calendar_event_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shift_id UUID UNIQUE REFERENCES shifts(id) ON DELETE CASCADE,
  calendar_id VARCHAR(255), -- Google calendar id
  remote_event_id VARCHAR(255), -- Google event id
  provider VARCHAR(32) DEFAULT 'google',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ
);
```

Endpoints & flows
- `POST /api/integrations/google/calendar/connect` — start OAuth (per-hostel admin) or accept service-account config in admin UI.
- `POST /api/integrations/google/calendar/sync` — trigger manual sync for a roster/shift range (enqueue worker job).
- `GET /api/integrations/google/calendar/status` — show sync status, quotas, last-run.

Worker & reliability
- `calendarSyncWorker` listens for `shift.published`, `shift.updated`, `shift.deleted`, and `staff.email.updated` events and enqueues sync tasks. Use exponential backoff for transient errors and persist failures to a DLQ for manual review.
- Use remote event ETag/versioning where possible to detect conflicts.

Error handling & quotas
- Respect Google API quotas: batch events, use exponential backoff with jitter, monitor `X-RateLimit-*` and `Retry-After` headers.
- Log API failures to `integration_errors` and surface admin dashboard warnings.

Security
- Store OAuth refresh tokens or service-account keys encrypted (use KMS or env secrets). Limit token scope to calendar events and do not persist full user credentials.

Deliverables for Calendar sync
- Migration: `server/migrations/00X_create_calendar_event_mappings.sql`.
- Model: `server/models/CalendarEventMapping.js`.
- Controller: `server/src/controllers/googleCalendarController.js` and routes under `server/src/routes/integrationsRouter.js`.
- Worker: `server/src/workers/calendarSyncWorker.js`.
- Client: Admin UI to connect account and manual sync controls: `client/src/pages/admin/Integrations/GoogleCalendar.jsx`.

2) SMS & Email gateways (reminders & escalations)

Goals
- Provide reliable outbound channels for critical alerts (SMS) and informational messages (email). Support provider fallbacks, batching, templating, scheduled sends, retry/backoff, and per-user opt-in preferences.

Provider abstraction
- Implement `NotificationProvider` interface with methods: `sendEmail(payload)`, `sendSms(payload)`, `sendPush(payload)`.
- Implement adapters for providers (SendGrid/Postmark/Amazon SES for email; Twilio/MessageBird/Nexmo for SMS). Allow multiple providers for failover.

Suggested DDL (outbound messages)
```sql
CREATE TABLE outbound_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider VARCHAR(64),
  channel VARCHAR(16), -- email|sms|push
  recipient VARCHAR(255),
  subject VARCHAR(512),
  body TEXT,
  payload JSONB,
  status VARCHAR(32) DEFAULT 'pending', -- pending|queued|sent|failed
  attempts INT DEFAULT 0,
  last_error TEXT,
  provider_message_id VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT now(),
  sent_at TIMESTAMPTZ
);
CREATE INDEX idx_outbound_messages_status ON outbound_messages(status);
```

APIs & admin controls
- `POST /api/integrations/notifications/send` — enqueue an outbound message (filters, template vars). Auth: `notifications:send` or system service.
- `GET /api/integrations/notifications/:id` — status and logs.
- `POST /api/integrations/notifications/providers` — admin config for API keys and provider preferences (store encrypted).
- `GET /api/integrations/notifications/providers` — list configured providers.

Workers & delivery
- `notificationWorker` picks `outbound_messages` rows, calls provider adapter, updates status, and retries transient failures with exponential backoff. On repeated permanent failures send to DLQ and notify admins.
- Batching: for email send large audiences use provider batching APIs or templates to minimize cost and improve throughput.

Templates & personalization
- Store templates in `notification_templates` with variables (Mustache-like). Allow `preview` rendering via `POST /api/integrations/notifications/preview`.

Opt-in / preferences
- `notification_preferences` table to record per-user opt-ins (email, sms). Respect preferences when queuing messages and provide an admin override for critical alerts (e.g., safety incidents) with a documented audit trail.

Escalations
- Integrate with coverage alerts and incident workflows to automatically enqueue outbound messages to on-call lists or escalation chains. Use throttling and deduplication to avoid spamming recipients.

Compliance & costs
- SMS requires explicit consent; implement opt-in flows and store consent timestamps.
- Track cost metrics per-provider and per-message for budgeting.

Monitoring & observability
- Export metrics: messages_sent, messages_failed, avg_delivery_time, provider_errors; add alerts for provider failure rates.

Security
- Store provider keys in env or KMS and never in repo. Limit access to admin UI for provider configuration.

Deliverables for Notifications
- Migration: `server/migrations/00X_create_outbound_messages.sql`, `notification_templates`, `notification_preferences`.
- Models: `OutboundMessage.js`, `NotificationTemplate.js`, `NotificationPreference.js`.
- Controllers/routes: `server/src/routes/notificationsRouter.js`, `server/src/controllers/notificationsController.js`.
- Worker: `server/src/workers/notificationWorker.js`.
- Client: Admin provider config UI `client/src/pages/admin/Integrations/Notifications.jsx` and template management UI.

3) Misc & cross-cutting notes
- Rate-limits & throttling: implement application-level throttling for outbound sends and calendar sync, with configurable per-hostel limits.
- Backoff & DLQ: use exponential backoff and a dead-letter queue for permanent failures.
- Auditing: log all integration actions in `audit_logs` (who triggered, filters, payload summary).
- Testing: use provider sandbox/test credentials for automated integration tests; mock providers for CI.

If you'd like, I can scaffold the migrations and model files for calendar mappings and outbound messages next, or implement the `notificationWorker` and `calendarSyncWorker`. Which should I start with?
- RBAC & Audit Logs: define roles (admin, staff sub-roles), permissions, and store audit logs for critical actions and approvals.
- Mobile/PWA & Offline Support: build mobile-first interfaces or PWA with offline queues so staff can use devices with intermittent connectivity.

## Tasks & Checklists — Detailed specification

Overview
- Purpose: provide a flexible task management system for operational routines (cleaning rounds, mess prep, sanitation checks) and ad-hoc work. Tasks must be assignable to staff or devices, support checklists, collect photographic evidence, and provide verifier workflows for quality control.
- Goal: reduce missed tasks, create auditable proof-of-work, enable reminders/escalations, and surface operational metrics to admins.

Core concepts
- Task Template: reusable definitions with checklist schema, default assignees/roles, recurrence rules and estimated duration.
- Task Instance: scheduled occurrence with due window, assignment, and checklist items derived from a template or created ad-hoc.
- Checklist Item: typed step (boolean/checkbox, text note, numeric value, photo required) that can be completed individually.
- Verification: supervisor or automated rules that accept or reject a completed task instance.

Actors & permissions
- Admin: create/edit templates, schedule/bulk-create instances, reassign tasks, verify or reject completions, view reports.
- Staff (individual or via shared-device): view assigned tasks, mark checklist items complete, upload photos and notes, request verification, and report issues.
- Verifier (supervisor/admin): review submitted evidence, accept/reject with comments, and escalate if required.

Suggested data model (SQL)
- task_templates
  - id (uuid), title, description, default_role, default_area, checklist_schema (json), default_recurrence (json), estimated_seconds
- task_instances
  - id (uuid), template_id (uuid nullable), title, description, area, assigned_staff_id (uuid nullable), assigned_device_id (uuid nullable), shift_assignment_id (uuid nullable), due_at (timestamp), start_window (timestamp), end_window (timestamp), status (enum: assigned|in_progress|completed|verified|overdue|rejected), created_by, created_at, updated_at
- checklist_items
  - id (uuid), instance_id (uuid), position (int), type (enum: checkbox|text|number|photo), label, required (boolean), value_text (text nullable), value_number (numeric nullable), photo_refs (json array), completed_by (uuid nullable), completed_at (timestamp nullable)
- task_verifications
  - id (uuid), instance_id (uuid), verifier_id (uuid), status (enum: approved|rejected|needs_changes), comments (text), verified_at (timestamp)
- task_attachments
  - id (uuid), instance_id (uuid), uploaded_by (uuid), file_ref (string), thumb_ref (string nullable), uploaded_at

API endpoints (examples)
- POST /api/tasks/templates — create template (admin)
- GET /api/tasks/templates — list templates
- POST /api/tasks — create instance (admin or scheduled job)
- GET /api/tasks?staff_id=&device_id=&status= — list instances
- POST /api/tasks/:id/checklist/:item_id/complete — complete checklist item (body: value or photo ref)
- POST /api/tasks/:id/attach — upload evidence photo
- POST /api/tasks/:id/verify — verifier approves/rejects with comments
- POST /api/tasks/bulk-schedule — expand recurrence templates into instances for a date range

Client UI flows
- Admin UI: Template editor (title, checklist builder with item types), Scheduler (pick date range, recurrence, assignees), Monitoring board (kanban-style or list with filters by area/role/status), bulk reassign and export.
- Staff device panel: Assigned tasks list for current day/shift; task detail page with checklist items, big touch targets for completion, built-in camera/photo widget, notes, and one-tap "Request verification".
- Verifier UI: Task review modal showing photos (with zoom), timestamps, device/staff metadata, and approve/reject buttons with required comment on rejection.

Operational features
- Recurrence & exceptions: support RFC5545-like recurrence with exception dates and one-off edits to instances without altering template.
- Assignment strategies: manual assign, round-robin among available staff, least-recently-used, or based on proximity to area (if GPS/device location available).
- Reminders & escalations: configurable reminders before `due_at`, and escalation chain (notify replacement or admin) when overdue.
  - Task Verification (QR Proof): optional QR tags (physical stickers) placed in zones or rooms. Scanning the QR when completing a checklist item links the `task_instance` to a physical location and creates an auditable verification record. The design below expands QR verification with data model, payload formats, API surface, client flows, security, offline behaviour, tests and deliverables.
    - QR tag model & migration (`qr_tags`): store tag metadata and admin controls.
      - Example fields: `id UUID`, `tag_code VARCHAR` (short human-readable), `area VARCHAR`, `location_text VARCHAR`, `enabled BOOLEAN`, `created_by UUID`, `created_at TIMESTAMPTZ`.
    - Verification scans (`verification_scans`) table: records each scan and associated evidence.
      - Example fields: `id UUID`, `task_instance_id UUID REFERENCES task_instances(id)`, `staff_id UUID`, `device_id UUID`, `qr_tag_id UUID REFERENCES qr_tags(id)`, `qr_payload JSONB`, `geo JSONB NULLABLE`, `evidence_refs JSONB NULLABLE`, `verified BOOLEAN DEFAULT FALSE`, `reason TEXT NULLABLE`, `created_at TIMESTAMPTZ DEFAULT now()`.
    - QR payload formats (options):
      - Option A (lookup): QR contains `TAG:{tag_code}`; server looks up `tag_code` → tag record.
      - Option B (signed token): QR contains `qr:{tag_id}:{expires}:{hmac}`; server verifies HMAC-SHA256 over `{tag_id}:{expires}` with a server secret and checks expiry.
    - Endpoints (examples):
      - `POST /api/tasks/:id/verify-qr` — body: `{ qr_payload, device_id, geo?, evidence_refs? }` — validates QR, creates `verification_scans`, and marks checklist items complete according to verification rules. Auth: staff or device.
      - `GET /api/tasks/:id/verification` — list verification scans for admins/owners.
      - `POST /api/tasks/:id/verification/:scan_id/resolve` — admin accepts/rejects or overrides a scan.
    - Client flow:
      - Staff opens a task instance → taps `Scan QR` → app scans QR (camera) → app POSTs `qr_payload` + `device_id` + optional photo/geo to `POST /api/tasks/:id/verify-qr`.
      - Server validates tag (and HMAC/expiry if signed), optionally checks geo proximity, creates `verification_scans` and returns success; client updates checklist state.
      - Offline: queue verification locally (store local temp id + evidence); upload and reconcile when online.
    - Security & anti-spoofing:
      - Prefer signed tokens (Option B) for tamper resistance. Use short expiry windows and rotate HMAC secrets periodically.
      - Apply rate limits per device and per staff to prevent abuse.
      - Optionally require photo evidence and/or geolocation to strengthen proof-of-presence and reduce replay attacks.
      - Consider single-use or time-windowed tokens to reduce replays (server records recent scan hashes and rejects duplicates within configured window).
    - Audit & evidence:
      - Store raw `qr_payload`, device metadata, staff_id, photos and geo in `verification_scans` and `audit_logs` for chain-of-custody.
      - Admin UI must be able to view/download full evidence packages for investigations.
    - Acceptance criteria & tests:
      - Unit tests: HMAC verification, expiry handling, duplicate-scan prevention, geo-match tolerance.
      - Integration tests: camera-scan → `POST /api/tasks/:id/verify-qr` → `verification_scans` created → checklist item state changed.
      - E2E: offline scan queued on device → sync when online → server validates and marks verified.
    - Deliverables (concrete files to implement):
      - Migration: `server/migrations/00X_create_qr_tags_and_verification_scans.sql`.
      - Models: `server/models/QrTag.js`, `server/models/VerificationScan.js`.
      - Routes/controllers: add `POST /api/tasks/:id/verify-qr`, `GET /api/tasks/:id/verification`, and `POST /api/tasks/:id/verification/:scan_id/resolve` in `taskRouter`/`taskController`.
      - Client components: `client/src/components/TaskQrScanner.jsx`, `client/src/components/VerificationHistory.jsx`, and UI for offline queue handling.
    - Implementation notes & best practices:
      - Keep printed QR content short (prefer encoded token instead of long URLs) to improve scan reliability.
      - For shared devices require the operator to confirm their selected staff profile before scanning.
      - Provide an admin UI to deactivate/replace lost tags and rotate signing keys.
    - Operational considerations:
      - Mask candidate contact details in public views; reveal full contact only to assigned staff/admins per `visibility` rules.
      - Log all verification actions and admin overrides to `audit_logs` including device_id and operator metadata.
  - Proof-of-work rules: configure required evidence per checklist item (e.g., at least one photo, minimum resolution, or multiple photos for multi-step tasks).
- Signatures: optional signature capture for high-criticality tasks (store as image + signer id).

Offline & sync behavior
- Devices must cache assigned tasks and checklist schemas locally. Completed items and photos queue for background upload when online.
- Photo uploads: use chunked uploads and resumable flows to handle poor connectivity; store temporary local references until server confirms and returns stable `file_ref`.
- Conflict handling: if two operators attempt to complete the same checklist item, use optimistic locking (version numbers) and present conflict resolution to verifier/admin.

Storage, media handling & privacy
- Store originals and generate optimized thumbnails on upload. Apply server-side image resizing and compression to reduce bandwidth and storage.
- Enforce per-hostel retention policy and provide admin controls to purge or archive attachments after X days.
- Protect attachments behind authenticated endpoints; generate short-lived signed URLs for downloads.

Verification & quality rules
- Default verification rule: all required checklist items must be completed and at least one required photo exists (if configured) before a task is eligible for `verified` status.
- Auto-verify heuristics: for low-risk tasks, allow auto-verify when client device is paired and metadata matches expected area and checklist items are complete.
- Rejection workflow: verifier rejects with comments; task moves to `assigned` or `in_progress` for reassignment or rework.

Integration points
- Link tasks to `shift_assignments` so task instances created for a roster period show on device panels during assigned shifts.
- When a task requires consumables, optionally create an inventory reserve/request and link the `task_instance` to the inventory record.
- Allow creating a maintenance ticket from a failed verification (link to `tickets` table).

Analytics & reporting
- Metrics: completion_rate, avg_time_to_complete, overdue_rate, photo_coverage_rate, per-staff productivity, area heatmaps.
- Expose CSV/PDF exports and admin dashboards with date-range filters and drill-down by area/role.

Testing plan
- Unit tests: checklist item validation, recurrence expansion, assignment algorithms, and verification rules.
- Integration tests: device offline queue sync, photo upload flow, conflict scenarios, and verifier actions.
- E2E: admin schedules recurring tasks → instances created → staff completes with photos → verifier approves → metrics update.

Migration & models to add
- Add migration `006_create_tasks_tables.sql` in `server/migrations/` to create `task_templates`, `task_instances`, `checklist_items`, `task_verifications`, and `task_attachments` tables.
- Add server models: `TaskTemplate.js`, `TaskInstance.js`, `ChecklistItem.js`, `TaskVerification.js`, and `TaskAttachment.js` in `server/models/`.

Phased MVP (recommended)
1. Templates + single-instance creation + staff checklist flow + photo upload + admin monitor.
2. Recurrence expansion + reminders/escalations + verifier approval workflow.
3. QR verification + assignment strategies + analytics and exports.

Estimated implementation tasks
- DB migration & models: 0.5–1 day
- Server controllers & task business logic: 1–2 days
- Client task UI + device panel: 2–4 days
- Photo upload/resumable sync + offline reliability: 1–2 days
- Tests & analytics dashboards: 1–2 days

Deliverables
- Migration file(s) and models
- Server endpoints for template/instance CRUD, checklist completion, attachments, and verification
- Client components: `TaskTemplates.jsx`, `TaskBoard.jsx`, `DeviceTaskPanel.jsx`, `TaskDetail.jsx`
- Tests and documentation updates in [doc/staff-features.md](doc/staff-features.md#L1)

Questions / decisions needed
- Require photo evidence by default for cleaning tasks? (recommended for high-sensitivity areas)
- Maximum attachment size and image formats to support (default 5MB, jpg/png/pdf).

## Maintenance & Repair Tickets — Detailed specification

Overview
- Purpose: provide a simple, auditable repair ticketing system so students, staff and admin can report, triage, assign, and resolve physical maintenance issues (plumbing, electrical, furniture, HVAC, pest control, etc.).
- Value: faster resolution, clear accountability, evidence-based verification, and operational analytics to reduce repeat problems and track costs.

Actors & permissions
- Reporter (student or staff): create tickets, attach photos, view their ticket status, receive notifications.
- Maintenance staff (individuals or teams): claim/accept tickets, update progress, log parts used and labor, request additional approvals, and mark resolved.
- Admin / Supervisor: triage incoming tickets, set priority/SLA, assign to staff or teams, escalate, approve purchases, and close tickets.
- Requester-anonymous (shared-device): allow quick reporting from kiosks with minimal identity; admin later links a follow-up staff contact.

Workflows / user stories
- Reporter creates ticket: select category, area/room, short description, optional severity suggestion, attach photos, and submit.
- Triage: ticket lands in the admin/triage queue for priority setting and assignment (automatic rules may set low/medium/high). Admin may convert report to a maintenance task or escalate to external vendor.
- Assignment & schedule: assign to a maintenance staff or team; assignee accepts and schedules a visit (with proposed ETA) or marks as `pending_parts` if parts are required.
- Work & evidence: maintenance staff updates progress, attaches before/after photos, logs parts used and labor minutes/hours.
- Verification & close: reporter or verifier (supervisor) confirms work quality; system marks ticket `resolved` then `closed` after verification or auto-closes after configured window.

State machine (suggested)
- new -> triaged -> assigned -> in_progress -> pending_parts -> resolved -> closed
- new -> rejected (spam / invalid) | escalated -> external_vendor -> closed

Suggested data model (SQL)
- tickets
  - id (uuid)
  - reporter_id (uuid nullable) -- user who reported
  - reporter_type (enum: student|staff|device|anonymous)
  - title (varchar)
  - description (text)
  - category (varchar) -- plumbing/electrical/furniture/other
  - area (varchar) -- block/floor/room
  - location_metadata (json nullable) -- gps, QR tag id, image-derived metadata
  - severity (enum: low|medium|high|critical)
  - priority (int) -- numeric priority or SLA bucket
  - status (enum: new|triaged|assigned|in_progress|pending_parts|resolved|closed|rejected|escalated)
  - assigned_to (uuid nullable) -- user id or team id
  - assigned_group (varchar nullable) -- team or skill tag
  - sla_response_by (timestamp nullable)
  - sla_resolve_by (timestamp nullable)
  - estimated_minutes (int nullable)
  - parts_required (boolean default false)
  - parts_list (json nullable) -- [{part_id, qty, cost_estimate}]
  - cost_estimate (numeric nullable)
  - resolved_at (timestamp nullable)
  - closed_at (timestamp nullable)
  - created_by_device_id (uuid nullable)
  - reported_at, updated_at

- ticket_attachments
  - id (uuid), ticket_id (uuid), uploaded_by (uuid nullable), file_ref (string), thumb_ref (string nullable), meta (json), uploaded_at

- ticket_comments
  - id (uuid), ticket_id (uuid), commenter_id (uuid nullable), comment (text), internal (boolean default false), created_at

- ticket_assignments
  - id (uuid), ticket_id (uuid), assigned_to (uuid), assigned_by (uuid), assigned_at, accepted_at (timestamp nullable), status (enum: assigned|accepted|declined)

- ticket_audit
  - id (uuid), ticket_id (uuid), action (varchar), actor_id (uuid nullable), actor_device_id (uuid nullable), data (json), created_at

API endpoints (examples)
- POST /api/tickets — create ticket (body: title, description, category, area, attachments, optional location/QR)
- GET /api/tickets?reporter_id=&status=&area=&category=&assigned_to= — list (filters + RBAC)
- GET /api/tickets/:id — ticket details with attachments, comments, audit trail
- POST /api/tickets/:id/comment — add comment (internal flag allowed for staff/admin)
- POST /api/tickets/:id/assign — assign to staff/team (admin)
- POST /api/tickets/:id/claim — maintenance staff claims/accepts assignment
- POST /api/tickets/:id/status — update status (in_progress|pending_parts|resolved|closed)
- POST /api/tickets/:id/attach — upload attachment (photo or document)
- POST /api/tickets/:id/parts — reserve/consume inventory parts
- POST /api/tickets/:id/escalate — escalate to admin or external vendor
- POST /api/tickets/bulk-assign — admin bulk assignment endpoint

Client UI flows
- Reporter UI (student/staff)
  - Simple Report form (category, area/room, description, 1–5 photos). Provide quick-capture camera flow and optional QR/room selector.
  - My Reports list with status badges, comments, expected ETA and `Add more info` action.

- Maintenance staff UI (client/src/pages/maintenance/Dashboard.jsx)
  - Assigned tickets list sorted by priority/SLA. Ticket view shows photos, comments, parts list, and `Start work` / `Mark resolved` actions.
  - Parts & labor log form: record parts used (link to inventory), hours worked, and upload after-photos.

- Admin / Supervisor UI (pages/admin/MaintenanceAdmin.jsx)
  - Triage queue with filters (area, category, severity, SLA). Bulk triage/assign, set SLA windows, and monitor open/overdue tickets.
  - Vendor management: create external vendor records, dispatch vendor tickets, and store vendor quotes/invoices.

Assignment & dispatch strategies
- Manual assignment by admin (triage operator).
- Auto-assign rules: round-robin within skill group, nearest-available via device last-seen metadata, or based on workload (least open tickets).
- On-call rotations: integrate with `shift_assignments` so on-duty maintenance receives priority dispatch.

Priorities & SLAs
- Priority buckets: Critical (P0) — immediate response (<=1 hour), High (P1) — respond within 4 hours, Medium (P2) — respond within 24 hours, Low (P3) — respond within 72 hours.
- SLA fields: `sla_response_by`, `sla_resolve_by` computed at triage. Auto-escalate when `sla_response_by` passes without acceptance.

Parts, procurement & inventory integration
- Link parts consumption to `inventory` records: reserve on assignment, decrement on completion, and create purchase requests when stock insufficient.
- Track part cost per ticket for operational cost reporting and vendor invoicing.

Attachments & media handling
- Support multiple photos per ticket. Use chunked/resumable uploads for reliability. Generate thumbnails and store optimized derivatives.
- For privacy, blur or redact student-identifying info on images when flagged. Provide an internal-only view toggle for sensitive attachments.

Offline & shared-device behavior
- Allow kiosks/shared devices to create tickets offline with local temporary refs for photos and sync when online.
- For anonymous reporters on shared devices, persist a `device_report_token` to allow later follow-ups without requiring a full account.

Verification, QA & closure
- Verification flows: after assignee marks `resolved`, a verifier or the original reporter can confirm. If confirmed, ticket moves to `closed`. If rejected, it reopens with comments.
- Auto-closure: tickets resolved and unchallenged for N days auto-close (configurable).

Notifications & communication
- Notify on create (admins/triage), on assignment (assignee), on status change (reporter & watchers), and on comment (subscribers).
- Channels: in-app notifications; email/SMS optional via notification system.

Audit & security
- Log all changes to `ticket_audit` with actor, device_id, and payload. Sensitive fields changes require elevated permission and create `manual_adjustment` audit entries.

Search, filters & reporting
- Provide admin filters (status, SLA, area, category, assigned_to, reporter) and full-text search on title/description.
- Reporting: open ticket counts, MTTR (mean time to repair), backlog by area, repeat-failure hotspots, vendor lead-times, and parts cost aggregation.

Testing plan
- Unit tests: ticket creation validation, SLA calculation, assignment rules and parts reservation logic.
- Integration tests: attachment upload/resume, offline sync, assignment/claim, and parts-to-inventory flow.
- E2E: reporter creates ticket → triage/assign → maintenance accepts → completes with photos → verifier approves → ticket closed and metrics updated.

Migration & models to add
- Add migration `007_create_maintenance_tickets.sql` to `server/migrations/` to create `tickets`, `ticket_attachments`, `ticket_comments`, `ticket_assignments`, and `ticket_audit` tables.
- Add server models: `Ticket.js`, `TicketAttachment.js`, `TicketComment.js`, `TicketAssignment.js`, and `TicketAudit.js` in `server/models/`.

Phased MVP (recommended)
1. Basic reporter form + ticket listing + admin triage + manual assign + assignee accepts and resolves.
2. Photo attachments + parts logging + SLA buckets + notifications.
3. Inventory integration + vendor dispatch + analytics dashboards.

Estimated implementation tasks
- DB migration & models: 0.5–1 day
- Server controllers & business logic: 1–2 days
- Client reporter form + maintenance dashboard: 2–3 days
- Photo upload/resumable + offline support: 1–2 days
- Inventory & vendor integration: 2–3 days
- Tests & reports: 1–2 days

Deliverables
- Migration file(s) and models
- Server endpoints for ticket CRUD, attachments, comments, assignments and SLA/escalation rules
- Client components: `ReportIssue.jsx`, `TicketList.jsx`, `TicketDetail.jsx`, `MaintenanceDashboard.jsx`
- Tests and documentation updates in `doc/staff-features.md`


Questions / decisions needed
- Can students create tickets directly or should student reports route through staff/admin moderation first? (recommended: allow direct reports but flag unverified student reports for triage)
- Default SLA windows and priority mapping preferences?
- Attachment retention policy and maximum upload size (default 5–10MB per image)?

## Incident & Security Reporting — Detailed specification

Overview
- Purpose: let security staff and authorised reporters record incidents (safety, theft, assault, medical, fire, vandalism) with structured data, multimedia evidence, and an auditable investigation workflow. Support rapid escalation, response dispatch, and long-term analytics for prevention.
- Value: faster response, clear accountability, legally defensible evidence handling, and operational insights (hotspots, repeat incidents, average response times).

Actors & permissions
- Reporter (student, staff, or anonymous/shared-device): file an incident report with optional photos/audio, location, and witness info.
- Security officer / Responder: claim incidents, record response actions (arrival, actions taken), upload evidence, and mark incident status updates.
- Investigator / Supervisor: triage incidents, assign investigators, request evidence preservation (CCTV), produce reports, and close incidents.
- Admin / External: escalate to external agencies (police, fire, vendor), manage access and retention policies.

Workflows / user stories
- Quick-report (emergency): one-tap flow on devices for critical incidents with immediate notify-to-on-duty flow (SMS/push/email) and option to call emergency services.
- Structured report: reporter fills category, severity, location (QR/gps/room selector), time, description, witness list, and attachments (photos, audio, short video).
- Triage: security supervisor reviews `reported` incidents, sets severity/SLA, assigns investigator and response team, or marks as `escalated` to external agency.
- Investigation: assigned investigator logs actions (interviews, CCTV requests, evidence collection), updates status to `investigating` → `resolved` → `closed` with resolution summary and follow-up actions.

Severity, triage & state machine
- Severity enum: `info` | `low` | `medium` | `high` | `critical`.
- Suggested state machine:
  - reported -> triaged -> investigating -> resolved -> closed
  - reported -> rejected
  - any -> escalated -> external_investigation -> closed

Suggested data model (SQL)
- incidents
  - id (uuid)
  - reporter_id (uuid nullable)
  - reporter_type (enum: student|staff|device|anonymous)
  - category (varchar) -- e.g., safety|theft|assault|medical|fire|vandalism|other
  - title (varchar nullable)
  - description (text)
  - severity (enum)
  - status (enum: reported|triaged|investigating|resolved|closed|rejected|escalated)
  - occurred_at (timestamptz nullable)
  - reported_at (timestamptz)
  - location_text (varchar nullable)
  - location_metadata (json nullable) -- {gps, qr_id, room}
  - immediate_actions (json nullable) -- e.g., {evacuated:true, first_aid:true}
  - assigned_to (uuid nullable) -- responder or investigator
  - investigator_id (uuid nullable)
  - witness_ids (json nullable)
  - evidence_refs (json nullable) -- array of evidence ids
  - resolution_summary (text nullable)
  - closed_at (timestamptz nullable)
  - created_at, updated_at

- incident_evidence
  - id (uuid), incident_id (uuid), uploaded_by (uuid nullable), file_ref (string), thumb_ref (string nullable), metadata (json -- {camera_ts, device_id, geolocation, hash}), uploaded_at

- incident_responses
  - id (uuid), incident_id (uuid), responder_id (uuid), role (varchar), action_taken (text), response_time (timestamptz), notes (text)

- incident_comments
  - id (uuid), incident_id (uuid), commenter_id (uuid nullable), comment (text), internal (boolean default false), created_at

- incident_audit
  - id (uuid), incident_id (uuid), action (varchar), actor_id (uuid nullable), actor_device_id (uuid nullable), data (json), created_at

API endpoints (examples)
- POST /api/incidents — create incident (body: category, severity, occurred_at, description, location, attachments)
- GET /api/incidents?status=&severity=&area=&reporter= — list incidents (RBAC)
- GET /api/incidents/:id — incident detail + timeline + evidence
- POST /api/incidents/:id/triage — set severity/status/assign investigator
- POST /api/incidents/:id/respond — log responder action (arrival, action taken)
- POST /api/incidents/:id/evidence — upload evidence (metadata required)
- POST /api/incidents/:id/escalate — escalate to external agency or vendor
- POST /api/incidents/:id/close — close incident with resolution summary

Client UI flows
- Quick-report UI (shared devices & staff): minimal fields for emergencies (category, brief note, auto-location), immediate notify-on-duty toggle, optional microphone/photo capture, and `submit and call` action.
- Reporter dashboard: list of my reports with statuses and ability to add follow-up info or witness statements.
- Responder/Investigator dashboard (client/src/pages/security/Incidents.jsx): filtered queue by severity/SLA, timeline view, map overlay of active incidents, evidence gallery with metadata, chain-of-custody viewer, and action buttons (claim, respond, request CCTV, escalate, close).
- Admin UI (pages/admin/IncidentsAdmin.jsx): triage queue, bulk escalation tools, SLA monitoring, export evidence package tool (ZIP + manifest), and analytics widgets.

Evidence handling & chain-of-custody
- Record uploader device_id, capture timestamp, geolocation, and SHA256 hash for integrity on upload into `metadata`.
- Provide evidence transfer logs in `incident_audit` to preserve chain-of-custody for legal purposes.
- Add secure export function: package selected evidence files with manifest (hashes, uploader meta, audit entries) for external agencies.

Privacy, access control & redaction
- Restrict access to incident details and evidence by role and need-to-know. Sensitive images (students/personally-identifiable) should be flagged and viewable only by authorised roles.
- Support redaction workflows: blur faces or redact identifiers on export, with redaction metadata stored in `evidence.metadata`.

Notifications & escalation rules
- Define escalation chains by severity and SLA: e.g., `critical` -> immediate push/SMS to on-duty security + admin + optional phone call; `high` -> notify on-duty security + admin within X minutes.
- Auto-escalate if no responder accepts within `sla_response_by` window.

Integrations
- CCTV: add links/requests for CCTV preservation with a `cctv_request` record (store camera id, clip range) and integration webhook to video system to preserve clips.
- Attendance/shift: use `shift_assignments` to determine on-duty responders and notify them.
- Maintenance/Tickets: allow creating a maintenance ticket automatically when property damage is recorded.

Offline & shared-device behavior
- Allow offline report creation with local encrypted storage of media; on reconnect, resume resumable uploads and attach server evidence ids. Use `device_report_token` to link anonymous reports back to accounts.

Search, reporting & analytics
- Provide text search on title/description, filters by category, severity, area, assigned_to, date ranges, and status. Analytics: incident-rate per area, avg response times, time-to-close, repeat offenders, peak hours and heatmaps.

Security, audit & compliance
- Log all incident lifecycle actions in `incident_audit` with actor, device_id, and payload. Mark any edits to closed incidents as `manual_adjustment` and require elevated permission.
- Evidence tamper-detection via stored hashes; alert if evidence integrity mismatch is detected.

Testing plan
- Unit tests: validation of incident creation, severity escalation rules, evidence hashing, and access control checks.
- Integration tests: resumable uploads, offline-to-online sync, CCTV preservation requests, and escalation notifications.
- E2E: submit incident -> triage -> assign -> respond -> close -> export evidence package.

Migration & models to add
- Add migration `009_create_incidents_tables.sql` in `server/migrations/` to create `incidents`, `incident_evidence`, `incident_responses`, `incident_comments`, and `incident_audit` tables.
- Add server models: `Incident.js`, `IncidentEvidence.js`, `IncidentResponse.js`, `IncidentComment.js`, `IncidentAudit.js` in `server/models/`.

Phased MVP (recommended)
1. Basic reporting (reporter form + evidence upload) + admin triage + assign/claim + resolve/close.
2. Escalation rules, responder timeline, evidence chain-of-custody, and CCTV preservation requests.
3. Advanced analytics, redaction/export tooling, and external agency integrations (police/fire webhooks).

Estimated implementation tasks
- DB migration & models: 0.5–1 day
- Server controllers & business logic: 1–2 days
- Client quick-report + investigator dashboard: 2–4 days
- Resumable media upload & offline reliability: 1–2 days
- CCTV & external integration wiring: 1–2 days
- Tests & export tools: 1–2 days

Deliverables
- Migration file(s) and models
- Server endpoints for incident CRUD, evidence upload, triage, response logging, and export
- Client components: `ReportIncident.jsx`, `IncidentsQueue.jsx`, `IncidentDetail.jsx`, `InvestigatorDashboard.jsx`
- Tests and documentation updates in `doc/staff-features.md`

Questions / decisions needed
- Anonymous reporting: allow by default but flag for triage? (recommended: allow, but require follow-up for serious incidents)
- Retention policy for evidence and closed incident records (recommended: evidence 1 year, delivery logs 90 days, configurable per-hostel)
- External integrations: do we have preferred CCTV/video systems or emergency dispatch providers to integrate with?

---

## Inventory & Mess Management — Detailed specification

Overview
- Purpose: manage kitchen/mess inventory, record consumption per-service/recipe, track stock levels and costs, automate low-stock alerts, and streamline purchase requests and supplier management.
- Value: reduce stockouts and waste, improve forecasting, centralize procurement, and provide audit trails for food/consumable usage and costs.

Actors & permissions
- Mess Manager / Kitchen Supervisor: manage stock counts, approve requisitions, create purchase orders, set par levels and recipes, view reports.
- Cook / Kitchen Staff: record consumption, request items, use prep checklists, log daily usage and wastage.
- Storekeeper / Inventory Clerk: receive deliveries, perform counts, adjust stock, reconcile variances.
- Admin / Finance: view budgets, approve large POs, integrate with accounting.
- Supplier: external vendor records (managed via admin UI); optional supplier portal for PO acceptance/updates.

Core concepts
- Inventory Item: SKU-like record with `sku`, `name`, `category`, `unit` (kg|pcs|ltr), `reorder_point`, `par_level`, `cost_per_unit`, `preferred_supplier`, `expiry_tracking_flag`.
- Stock Ledger / Movements: immutable log of stock movements (inbound, consumption, wastage, adjustment) for audit. Each movement records `previous_balance`, `quantity`, `new_balance`, `reason`, `reference_type`/`reference_id`, `created_by`, `device_id`, `timestamp`.
- Purchase Requisition & Purchase Order: request→approve→purchase flow with PO lineage, expected delivery, partial receipts, and invoice matching.
- Stock Batch & Expiry: optional batch tracking for perishable items to enable FIFO/FEFO consumption and expiry alerts.
- Recipe / Menu Item: ingredient lines with quantity per serving to auto-calc consumption when meals are served.
- Consumption Log: records usage per-service/shift (menu/day), linked to recipe/menu item and `shift_assignment` or device.
- Cycle & Full Counts: scheduled physical counts, variance reconciliation, and audit trails.

Suggested data model (SQL)
- inventory_items
  - id (uuid), sku varchar, name varchar, category varchar, unit varchar, par_level numeric, reorder_point numeric, cost_per_unit numeric, preferred_supplier_id uuid nullable, track_expiry boolean default false, location varchar nullable, created_by uuid, created_at, updated_at

- inventory_batches
  - id (uuid), item_id uuid, batch_no varchar nullable, quantity numeric, received_at timestamptz, expiry_at timestamptz nullable, location varchar nullable, created_at

- stock_movements
  - id (uuid), item_id uuid, batch_id uuid nullable, type enum(in|consumption|wastage|adjustment|transfer|reserved), quantity numeric, unit_cost numeric nullable, previous_balance numeric, new_balance numeric, reason varchar nullable, reference_type varchar nullable, reference_id uuid nullable, created_by uuid nullable, device_id uuid nullable, created_at timestamptz

- purchase_requisitions
  - id (uuid), requested_by uuid, items json ([{item_id, qty, unit, notes}]), status enum(requested|approved|rejected|converted), approver_id uuid nullable, approved_at timestamptz nullable, created_at, updated_at

- purchase_orders
  - id (uuid), po_number varchar, supplier_id uuid, created_by uuid, status enum(draft|sent|acknowledged|partial_received|received|cancelled), expected_delivery_date timestamptz nullable, items json ([{item_id, qty, unit, price}]), total_amount numeric, created_at, updated_at

- stock_reservations
  - id (uuid), item_id uuid, qty numeric, reserved_for_type enum(shift|menu|requisition), reserved_for_id uuid, expires_at timestamptz nullable, created_at

- recipes
  - id (uuid), name varchar, servings numeric, ingredients json ([{item_id, qty_per_serving, unit}]), created_by uuid, created_at, updated_at

- consumption_logs
  - id (uuid), recipe_id uuid nullable, item_lines json ([{item_id, qty, batch_id?}]), served_count numeric, recorded_by uuid, recorded_via enum(device|manual|batch), shift_assignment_id uuid nullable, notes text nullable, created_at

- suppliers
  - id (uuid), name varchar, contact json, payment_terms varchar, default_lead_days int, created_at, updated_at

API endpoints (examples)
- POST /api/inventory/items — create/update catalog item (admin)
- GET /api/inventory/items?query=&category= — list/search items
- POST /api/inventory/receive — receive delivery (body: po_id?, items[])
- POST /api/inventory/movements — record movement (consumption/wastage/adjustment)
- GET /api/inventory/movements?item_id=&start=&end= — ledger view
- POST /api/inventory/recipes — manage recipes
- POST /api/inventory/consume — record consumption for a served recipe or manual lines
- POST /api/inventory/cycle-counts — submit physical count and create reconciliation entries
- POST /api/inventory/requisitions — create purchase requisition
- POST /api/inventory/purchase-orders — create/approve/acknowledge PO
- GET /api/inventory/alerts — list low-stock and expiry alerts

Client UI flows
- Inventory Dashboard (pages/admin/InventoryDashboard.jsx): stock overview, low-stock alerts, expiry alerts, value-on-hand, quick-receive and count actions, supplier quick-links and PO creation.
- Item Editor (client/src/components/InventoryItemEditor.jsx): create item, set par/reorder levels, enable expiry tracking, link preferred suppliers and default units.
- Receive Flow (client/src/pages/admin/Receive.jsx): match incoming delivery to PO, allocate to batches, record costs, and update stock_movements.
- Consumption / Kitchen Panel (client/src/pages/kitchen/KitchenInventoryPanel.jsx): for each service/shift allow cooks to record served counts by selecting a recipe (auto-deduct ingredient quantities), manual consumption lines, and quick wastage reporting.
- Cycle Count UI (client/src/pages/admin/StockCount.jsx): guided count UI with scan support (barcode/QR), variance highlight, create adjustment movements and approval workflow.
- Requisition & PO: staff create requisitions; mess manager approves and converts to PO; supplier communication panel to send POs and record acknowledgements/partial deliveries.
- Reports & Exports: cost-of-goods-sold for date ranges, usage by recipe, wastage trends, vendor performance, and inventory valuation.

Inventory valuation & accounting
- Support common valuation methods: FIFO (default for perishables), weighted-average for non-perishables, and optional LIFO if required by policy. Store `unit_cost` on `stock_movements` for retrospective valuation and audit.
- Provide export-ready CSV for accounting with mapping to GL codes and cost-centres.

Business rules & validations
- Prevent consumption that would create negative available balance unless an `allow_negative` flag is set for emergencies (creates immediate audit and notification).
- Enforce expiry-first consumption for `track_expiry` items (FEFO/FIFO selection of batches).
- Allow soft-reserve of stock for published menus/shifts to prevent last-minute stockouts.

Integrations
- Supplier / Procurement: email/SFTP or webhook to vendor systems for POs; optionally integrate with procurement/ERP via middleware.
- Accounting: export POs/invoices and inventory valuation for payroll & accounting packages.
- Point-of-Sale / Mess Billing: deduct stock when meals are billed and reconcile daily consumption with sales.

Offline & shared-device behavior
- Kitchen devices may be offline; record consumption logs locally and sync movements and photos (receipts) when online. Use idempotent movement ids to de-duplicate on server.
- For shared devices, require staff selection/verification and store `operator` metadata on all movements.

Counting, reconciliation & audit
- Maintain `stock_movements` as the single source of truth; create `adjustment` movements for reconciliation with audit reason and approver.
- Schedule periodic cycle counts with variance thresholds that auto-generate requisition or adjustment workflows for review.

Notifications & alerts
- Low-stock alerts: trigger when `available_balance <= reorder_point` and notify mess manager and storekeeper via in-app + email/SMS (configurable throttling).
- Expiry alerts: configurable window before expiry to notify kitchen and prevent usage in menus.
- PO delivery alerts and mismatch alerts when received quantity differs from PO.

Testing plan
- Unit tests: recipe ingredient expansion, stock movement math, batch expiry selection, and negative-balance prevention.
- Integration tests: receive->movement->consumption pipeline, PO lifecycle (requisition->PO->receive), and offline sync reconciliation.
- E2E: create recipe, publish menu for shift, record served counts on kitchen device, reconcile against stock movements and cycle counts.

Migration & models to add
- Add migration `010_create_inventory_tables.sql` in `server/migrations/` to create `inventory_items`, `inventory_batches`, `stock_movements`, `purchase_requisitions`, `purchase_orders`, `recipes`, `consumption_logs`, `suppliers`, and `stock_reservations` tables.
- Add server models: `InventoryItem.js`, `InventoryBatch.js`, `StockMovement.js`, `PurchaseRequisition.js`, `PurchaseOrder.js`, `Recipe.js`, `ConsumptionLog.js`, `Supplier.js`, `StockReservation.js` in `server/models/`.

Phased MVP (recommended)
1. Core catalog + stock movements + basic receive + manual consumption logging + low-stock alerts.
2. Recipes + kitchen auto-consumption + PO/requisition flow + batch/expiry tracking.
3. Accounting integration, cycle-count automation, vendor portal, and advanced forecasting.

Estimated implementation tasks
- DB migration & models: 0.5–1 day
- Server controllers & business logic (movements, PO lifecycle, recipe consumption): 1–2 days
- Client inventory UIs + kitchen panel + receive/cycle-count flows: 2–4 days
- Offline sync + photo receipts + scan support: 1–2 days
- Accounting & POS integrations: 1–2 days
- Tests & reporting dashboards: 1–2 days

Deliverables
- Migration file(s) and models
- Server endpoints for inventory CRUD, movements, requisitions, PO lifecycle, recipes, consumption logging, and alerts
- Client components: `InventoryDashboard.jsx`, `InventoryItemEditor.jsx`, `StockCount.jsx`, `PurchaseRequisition.jsx`, `PurchaseOrder.jsx`, `KitchenInventoryPanel.jsx`, `RecipeEditor.jsx`, `SupplierManagement.jsx`
- Tests and documentation updates in `doc/staff-features.md`

Questions / decisions needed
- Centralized vs per-mess inventory: should each hostel/mess have independent inventories or a shared central inventory with locations? (recommended: per-mess with optional central procurement pool)
- Default reorder policy: simple `reorder_point` or demand-driven forecasting? (recommended: start with `reorder_point`+`par_level`)
- Barcode/QR support: do you want barcode labels for items/batches from day one?

---

## Scope & Device / Account Model

We will support two operational modes so the product can fit different hostel budgets and policies:

- Shared-device (role/device-focused):
  - Devices are owned by the hostel or a department and assigned to a role/area (e.g., "Kitchen Tablet #1").
  - Staff authenticate with a short PIN, select their name from a cached list, or scan a personal QR/ID to attribute actions.
  - Pros: low onboarding cost, minimal account management.
  - Cons: less individual accountability unless devices prompt operators to identify themselves.

- Individual accounts (per-staff users):
  - Each staff member has a personal account (email/phone or numeric ID + PIN). Actions are tied to a unique user account.
  - Pros: full accountability, personal notifications, better reporting.
  - Cons: higher management and support overhead; requires device access for login.

- Hybrid approach (recommended):
  - Support both modes: default to shared-device for quick rollout, and allow conversion/migration to individual accounts later.
  - Store optional `operator` metadata on every action (device_id, selected_staff_id, session_type) so auditability improves when staff IDs are used.

Security & auth notes:
- Use device pairing tokens and short-lived sessions for shared devices; require admin approval to register new devices.
- For PIN/QR-based attribution, always store the selected staff identifier alongside device id and timestamp for audits.
- Ensure sensitive student data is hidden when devices operate in shared mode.

## Student Visibility & Privacy

- Per your request, students will be able to view staff profiles and contact details. Add admin-configurable visibility settings so fields can be toggled (e.g., phone, email, certifications, shifts visible).
- Recommended: surface name, role, assigned area, primary contact method (phone or in-app message), and working hours/shift window. Optionally show certifications and a short bio.

## Google Calendar (Shifts & Events)

- Use Google Calendar API (service account or OAuth) to create and sync shift events to a shared hostel calendar.
- Allow admins to enable sync per-roster; on shift create/update/delete, sync events and optionally add staff emails as attendees (if individual accounts exist).

## Questions / Clarifications

- How many distinct staff sub-roles do you expect initially (e.g., Cook, Kitchen-helper, Cleaner, Security, Maintenance)?
- Do you want students to contact staff directly (phone/in-app) or always route via admin for official requests?
- How many devices per hostel/department do you expect in the roll-out (estimate)?

---

## Decisions & Answers (added per your responses)

- Roles and role management:
  - Admins can create and remove staff sub-roles through the Admin UI. Roles are fully customizable.
  - Default roles provided on first install: `Cook`, `Cleaner`, `Security`.
  - Implementation hint: create a `roles` table (name, slug, permissions JSON, default_flags) and a small Role management UI under Admin settings.

- Student contact to staff:
  - Students can contact staff directly via in-app messaging and via the phone numbers listed on staff profiles.
  - Add a `contact_preference` field to staff profiles (e.g., `in_app`, `phone`, `both`) and an admin toggle to hide/show phone numbers for privacy.

- Devices per hostel:
  - Support from 0 up to many devices per hostel. Device count and distribution are configurable by each admin/hostel.
  - Implementation hint: add a `devices` table (device_id, name, assigned_area, paired_by_admin_id, last_seen, device_type).

- Shared-device authentication options:
  - Provide both PIN and QR-based operator identification. Make the preference configurable in Settings.
  - On shared devices show staff `photo` cards and names; staff tap their photo to select themselves and authenticate with PIN/QR as configured.

- Profiles & profile editing rules:
  - Provide separate profile sections for `Student`, `Staff`, and `Admin`.
  - `Admin` should be able to create new profiles for both `Student` and `Staff` via the Admin UI.
  - Safety measures and recommended guardrails:
    - Only admin users with explicit `user:create` permission can create profiles.
    - Log all profile creation and edits in an `audit_logs` table with who/when/what changed.
    - Require elevated confirmation (admin password or 2FA) for editing sensitive staff fields (phone, role, assigned_area, certifications).
    - For shared devices, restrict profile editing: allow viewing and selecting profiles but only permit edits through the secure Admin portal or after a privileged admin login.
    - Allow staff to edit non-sensitive fields for their own profile (bio, availability), but require 2FA or admin approval to change contact or role.

- Profile visibility and privacy controls:
  - Add admin-configurable visibility toggles per-field (phone, email, certifications, shifts). Default: phone visible, email hidden.
  - Students can view staff profiles via the `Profile` button in the navbar; the displayed fields respect visibility settings.

- Additional implementation notes
  - Track `operator` metadata on device actions: store `device_id`, `selected_staff_id` (nullable), `session_type` (`shared`|`individual`), and `auth_method` (`pin`|`qr`|`oauth`).
  - Devices should be pairable using a secure token; require admin approval for new devices.
  - Provide an Admin-only "Device Management" page to revoke or reassign devices.

If this looks good, I will mark this update complete. Next I can: generate the DB migration for `roles`, `staff_profiles`, and `devices`; scaffold models and API routes; or implement the Admin UI for role and device management. Which would you like me to start with?

---

## Staff Directory & Profiles — Detailed specification

Overview
- Purpose: provide a canonical, searchable staff directory and structured staff profiles (job/title, assigned area, contact methods, certifications, shift preferences) with configurable visibility rules so students, staff and admins can discover and contact the right person while preserving privacy and auditability.
- Value: improves operational communication, simplifies onboarding, surfaces certification/qualification data for safety/compliance, and ties into shift/attendance/task workflows.

Actors & permissions
- Admin / HR: create/edit/delete profiles, manage visibility rules, perform bulk imports/exports, and approve certification documents.
- Staff (self): edit non-sensitive fields (bio, availability, languages), upload certifications/documents, set contact preferences, and manage profile photo.
- Staff (manager): edit role/assigned_area and confirm certifications; view profile audit history.
- Student / Public: read-only directory access limited by per-field visibility settings.

Core profile model & fields
- `staff_profiles` (canonical):
  - `id` uuid
  - `user_id` uuid nullable (link to central `users` if individual accounts exist)
  - `display_name` varchar
  - `first_name`, `last_name` varchar
  - `job_title` varchar
  - `sub_role` varchar (cook|cleaner|security|maintenance|other)
  - `assigned_area` varchar (block/floor/room)
  - `contact_phone` varchar
  - `contact_phone_verified` boolean default false
  - `email` varchar
  - `email_verified` boolean default false
  - `contact_preference` enum(in_app|phone|both) default `in_app`
  - `photo_ref` varchar nullable
  - `bio` text nullable
  - `shift_pattern` json nullable (e.g., recurring shift rules)
  - `availability` json nullable (days/hours)
  - `languages` json nullable
  - `emergency_contact` json nullable ({name, relation, phone})
  - `status` enum(active|inactive|suspended|terminated)
  - `created_by`, `created_at`, `updated_at`

- `staff_certifications`
  - `id`, `staff_id`, `name`, `issuer`, `cert_number` nullable, `issued_at` date nullable, `expires_at` date nullable, `document_ref` nullable, `verified` boolean default false, `verified_by` uuid nullable, `verified_at` timestamptz nullable

- `staff_documents`
  - id, staff_id, type (id_card|contract|other), file_ref, meta json, uploaded_by, uploaded_at

- `staff_devices`
  - id, staff_id, device_id, assigned_at, assigned_by, notes (useful for shared-device mappings)

- `staff_contacts` (optional normalized contacts)
  - id, staff_id, type (phone|alt_phone|personal_email|messenger), value, verified, created_at

Suggested UX & API endpoints
-- Public / Student endpoints (respecting visibility):
  - GET /api/staff — paginated searchable directory with filters (`role`, `area`, `available_now`)
  - GET /api/staff/:id — profile detail (only visible fields returned)

-- Admin / Staff endpoints:
  - GET /api/staff/profile — get the profile for the currently authenticated staff user (staff or admin). Returns same structure as `GET /api/staff/:id` for the authenticated user.
  - PUT /api/staff/profile — update the authenticated staff user's profile (owner or admin; non-sensitive fields editable by owner, sensitive fields require elevated permissions).
  - POST /api/staff — create profile (admin)
  - PUT /api/staff/:id — update profile (admin or owner for non-sensitive fields)
  - POST /api/staff/:id/photo — upload/update profile photo (multipart)
  - POST /api/staff/import — bulk CSV import with validation preview
  - GET /api/staff/export — CSV/JSON export (admin)
  - POST /api/staff/:id/certifications — add certification (file + metadata)
  - POST /api/staff/:id/certifications/:cid/verify — mark certification verified (admin)
  - POST /api/staff/:id/visibility — update per-field visibility (admin or owner with constraints)
  - GET /api/staff/search?q= — text search endpoint with fuzzy matching and role/area facets

Client UI flows
- Admin / HR UI (pages/admin/StaffManagement.jsx)
  - Staff list with filters (role, area, status), bulk import/CSV preview, single-click promote/demote role, certification table with expiry alerts, and audit history viewer.
  - Profile editor form: core fields, contact methods, emergency contacts, assigned devices, and documents upload with verification actions.

- Student Directory (client/src/pages/Student/StaffDirectory.jsx)
  - Search bar, filter chips (role, area), result cards showing visible fields only (photo, name, role, area, contact method as allowed), click-through to `StaffProfile.jsx` with more public info.

- Staff Self-Service (client/src/pages/staff/MyProfile.jsx)
  - Edit bio, availability/shift preferences, upload certifications and documents, set `contact_preference`, and view verification status and audit entries.

- Shared-device flow (client/src/components/DeviceStaffSelector.jsx)
  - Cached staff cards for device; when staff selects themselves, the action records `operator` metadata (`selected_staff_id`) and allows quick profile view or limited edits per policy.

Privacy, visibility & policies
- Per-field visibility toggles: `phone`, `email`, `photo`, `certifications`, `shift_pattern`. Admins set global defaults; individual owners may override limited fields.
- Masking: when `phone` is not visible to students, show masked version (`+91-98XXXX1234`) and provide an in-app `Contact` button that routes messages without exposing raw numbers.
- Sensitive docs (ID, contracts): only visible to HR/authorized roles; downloads require elevated permission and are logged in `audit_logs`.

Certifications, reminders & lifecycle
- Admins can upload or verify certification documents; system stores `expires_at` and sends reminder notifications at configurable intervals (e.g., 30/14/7 days before expiry).
- Provide bulk reminder dashboard for expiring certifications and ability to bulk-request re-submission.

Search, filters & discovery
- Index commonly searched fields (name, role, assigned_area, skills/tags) and support faceted search (role, area, availability, certification status).
- Provide `available_now` filter using `availability` + current time + shift assignments.

Bulk import / sync
- CSV import template: `user_id,email,display_name,job_title,sub_role,assigned_area,phone,contact_preference,shift_pattern,hire_date`.
- Import flow: upload CSV → preview validations (missing required fields, duplicate phones/emails, invalid role) → map columns → dry-run import → import and generate `audit_logs` entries.

Integrations
- Link to `users` table for staff who have accounts so authentication, personal notifications and calendar invites work.
- Integrate with shift scheduling to show who is on-duty; with attendance to reconcile staff identity; with announcements to target staff-specific broadcasts.
- Optionally sync to external HR systems or Google Contacts via export job.

Offline & shared-device considerations
- Devices cache staff directory (select fields) for fast selection; staff selection updates include `operator` metadata and must be reconciled on sync.
- Allow staff to edit non-sensitive fields offline; queue changes for reconciliation and conflict resolution where necessary.

Security, audit & compliance
- All profile create/update/delete actions recorded in `audit_logs` with actor, device_id, changed_fields, and timestamp. Edits to sensitive fields require elevated permission and produce `manual_adjustment` audit entries.
- Rate-limit API endpoints for public directory access to prevent scraping; add per-hostel visibility rules and admin opt-out for public exposure.

Migration & models to add
- Add migration `011_create_staff_profiles_tables.sql` to `server/migrations/` to create `staff_profiles`, `staff_certifications`, `staff_documents`, `staff_devices`, `staff_contacts`, and related indexes (email, phone, assigned_area).
- Add server models: `StaffProfile.js`, `StaffCertification.js`, `StaffDocument.js`, `StaffDevice.js`, `StaffContact.js` in `server/models/` with helper methods: `isVisibleTo(user)`, `upcomingCertificationExpiries()`, and `mergeFromCsvRow()`.

Phased MVP (recommended)
1. Basic `staff_profiles` + admin CRUD UI + Student Directory read-only listing + profile photo upload + per-field visibility toggles.
2. Certification uploads and verification + expiry reminders + bulk import/export + device mapping.
3. Deep integrations: availability->shift matching, attendance reconciliation, HR sync, and external directory exports.

Testing plan
- Unit tests: profile validation, visibility rules (`isVisibleTo`), certification expiry logic, CSV import validation.
- Integration tests: create/edit/profile photo upload flows, bulk import dry-run and import, visibility filters for student vs admin.
- E2E: admin creates profiles via CSV import -> staff logs in/upload certs -> admin verifies -> student directory shows expected fields.

Deliverables
- Migration file(s) and models
- Server endpoints for profile CRUD, search, photo/cert upload, bulk import/export, and visibility management
- Client components: `StaffDirectory.jsx`, `StaffProfile.jsx`, `StaffAdmin.jsx`, `StaffBulkImport.jsx`, `DeviceStaffSelector.jsx`
- Tests and documentation updates in `doc/staff-features.md`

Questions / decisions needed
- Should every staff member have a linked `users` account, or support pure shared-device-only profiles? (recommended: support both, map to `users` when available)
- Default public visibility: should `phone` be masked by default to students? (recommended: mask by default, with admin override)
- CSV import columns and required fields for initial seed?

---

### Implementation details — Staff Directory & Profiles (expanded)

This section provides implementation-level details you can copy into migrations, models, controllers and client code. It expands the `Staff Directory & Profiles` section above with DDL, example API requests/responses, RBAC mappings, model helper patterns, frontend routes/components, search/indexing recommendations, bulk-import validation rules, and acceptance criteria.

1) Example Postgres DDL (migration `011_create_staff_profiles_tables.sql`)

```sql
-- NOTE: ensure `pgcrypto` or `uuid-ossp` is available for UUID generation in migrations,
-- or create UUIDs in application code.
CREATE TABLE staff_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  display_name VARCHAR(255) NOT NULL,
  first_name VARCHAR(128),
  last_name VARCHAR(128),
  job_title VARCHAR(128),
  sub_role VARCHAR(64),
  assigned_area VARCHAR(128),
  contact_phone VARCHAR(32),
  contact_phone_verified BOOLEAN DEFAULT FALSE,
  email VARCHAR(255),
  email_verified BOOLEAN DEFAULT FALSE,
  contact_preference VARCHAR(16) DEFAULT 'in_app',
  photo_ref VARCHAR(1024),
  bio TEXT,
  shift_pattern JSONB,
  availability JSONB,
  languages JSONB,
  emergency_contact JSONB,
  status VARCHAR(16) DEFAULT 'active',
  visibility JSONB DEFAULT '{}'::jsonb,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_staff_profiles_assigned_area ON staff_profiles (assigned_area);
CREATE INDEX idx_staff_profiles_display_name ON staff_profiles USING gin (to_tsvector('english', display_name));

CREATE TABLE staff_certifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID REFERENCES staff_profiles(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  issuer VARCHAR(255),
  cert_number VARCHAR(128),
  issued_at DATE,
  expires_at DATE,
  document_ref VARCHAR(1024),
  verified BOOLEAN DEFAULT FALSE,
  verified_by UUID,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE staff_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID REFERENCES staff_profiles(id) ON DELETE CASCADE,
  type VARCHAR(64),
  file_ref VARCHAR(1024),
  meta JSONB,
  uploaded_by UUID,
  uploaded_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE staff_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID REFERENCES staff_profiles(id) ON DELETE SET NULL,
  device_id UUID,
  assigned_at TIMESTAMPTZ,
  assigned_by UUID,
  notes TEXT
);

CREATE TABLE staff_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID REFERENCES staff_profiles(id) ON DELETE CASCADE,
  type VARCHAR(32), -- phone|alt_phone|personal_email|messenger
  value VARCHAR(255),
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

2) API examples (request & response)

- GET /api/staff/profile — authenticated staff

Request: (Auth required)

Response 200:
```json
{
  "id": "uuid",
  "display_name": "Ramesh Kumar",
  "first_name": "Ramesh",
  "last_name": "Kumar",
  "job_title": "Cook",
  "sub_role": "cook",
  "assigned_area": "Block A - Kitchen",
  "contact_phone": "+91-9812345678",
  "contact_preference": "in_app",
  "photo_ref": "s3://bucket/photos/uuid.jpg",
  "bio": "Experienced cook...",
  "visibility": {"phone":"masked_to_students","email":"admin_only","certifications":"admin_only"}
}
```

- PUT /api/staff/profile — update own profile

Request body (only allowed fields for owner):
```json
{
  "display_name":"R. Kumar",
  "bio":"Updated bio",
  "availability": {"mon":["08:00-12:00"]}
}
```

Rules: if the request attempts to change `contact_phone` or `sub_role` the server should require elevated permission or an admin approval flow.

- GET /api/staff — public/student directory (paginated)

Query: `GET /api/staff?q=Cook&role=cook&area=Block%20A&page=1&limit=20`

Response: list of profiles where each profile is already filtered by visibility rules for the requesting user.

3) Visibility & masking behavior (exact rules)
- `visibility` JSON controls per-field exposure. Example values: `public`, `students`, `staff`, `admin`, `owner`, `masked_to_students`.
- Resolution algorithm (server-side):
  - If viewer.role === 'admin' -> return full record.
  - else for each field: evaluate visibility[field] against viewer.role and viewer.id. If `masked_to_students` return masked string: replace middle digits with `X` preserving country code and last 3 digits.
  - For `owner` only fields, return full value if viewer.id === profile.user_id.

Mask example implementation (pseudo):
```js
function maskPhone(phone){
  // +CC-AABBCCDDE -> +CC-AAXXXXXDE
  return phone.replace(/(\+\d{2}\-\d{2})\d+(\d{2})$/, '$1XXXXX$2');
}
```

4) RBAC & permission strings (recommended)
- `staff:read_profile` — view own/public profiles (granted to staff, admin, students as appropriate)
- `staff:update_profile` — update own non-sensitive fields
- `staff:manage_profiles` — create/update/delete any profile (admin/HR)
- `staff:verify_certification` — verify certification documents (admin/HR)
- `staff:bulk_import` — run imports (admin)

Endpoints mapping:
- `GET /api/staff` => `staff:read_profile` (filtered results)
- `GET /api/staff/:id` => `staff:read_profile` (with visibility enforcement)
- `GET/PUT /api/staff/profile` => `staff:read_profile`, `staff:update_profile`
- `POST /api/staff` => `staff:manage_profiles`

5) Model helper patterns (server-side)
- `StaffProfile.isVisibleTo(viewer)` — returns visibility map for a given viewer (use to prune fields before serializing)
- `StaffProfile.toPublicJson(viewer)` — returns JSON safe to send to a given viewer (applies masking and removes sensitive fields).

Example (pseudo):
```js
class StaffProfile {
  toPublicJson(viewer){
    const out = {id:this.id, display_name:this.display_name, job_title:this.job_title};
    if(this.isVisible('phone', viewer)) out.contact_phone = this.contact_phone;
    else if(this.isMasked('phone', viewer)) out.contact_phone = maskPhone(this.contact_phone);
    // other fields...
    return out;
  }
}
```

6) Frontend components & canonical routes (suggested files)
- `client/src/pages/Student/StaffDirectory.jsx` — directory listing (search + filters)
- `client/src/pages/Staff/MyProfile.jsx` — staff self-service profile page (GET/PUT `/api/staff/profile`)
- `client/src/pages/Admin/StaffManagement.jsx` — admin CRUD UI and import/export
- `client/src/components/DeviceStaffSelector.jsx` — cached staff cards for shared-device flows
- `client/src/components/StaffProfileCard.jsx` — reusable card used across student/admin/staff pages

7) Search & indexing recommendations
- For small deployments use Postgres `to_tsvector` on `display_name`, `job_title`, `assigned_area` and a GIN index.
- For larger datasets, use Elasticsearch/Opensearch and index availability, certifications (tags), and role facets. Keep `available_now` as a computed boolean indexed daily or maintained via a materialized view.

8) Bulk import CSV rules and validation
- Template columns: `user_id,email,display_name,first_name,last_name,job_title,sub_role,assigned_area,phone,contact_preference,shift_pattern,hire_date`.
- Validation steps: schema validation, duplicate phone/email check, role validity check, required fields check, and preview step returning a `dry_run` CSV with errors/warnings.
- Import transaction: wrap insert/updates in a DB transaction; produce `audit_logs` entries for created/updated rows.

9) Testing checklist (expanded)
- Unit tests: `isVisibleTo` permutations (admin/student/owner), phone masking, CSV row -> model mapping, certification expiry utility.
- Integration tests: create profile (admin) -> student GET sees expected fields; staff updates own profile -> subsequent GET returns updated values; bulk import dry-run -> errors report.
- E2E tests: admin imports 10 staff via CSV -> staff appear in `/api/staff` list; staff updates photo -> student sees photo if visible.

10) Acceptance criteria (example)
- GET `/api/staff` returns paginated results and respects per-field visibility for student viewers.
- GET `/api/staff/profile` and PUT `/api/staff/profile` are functional for staff users and enforce owner- vs admin-only field restrictions.
- Bulk CSV import supports dry-run validation and produces audit entries for imports.

11) Deliverables (concrete files to implement)
- Migration: `server/migrations/011_create_staff_profiles_tables.sql` (DDL above)
- Models: `server/models/StaffProfile.js`, `server/models/StaffCertification.js`, `server/models/StaffDocument.js`, `server/models/StaffDevice.js`, `server/models/StaffContact.js`
- Routes/controllers: `server/src/routes/staffRouter.js` and `server/src/controllers/staffController.js` implementing the endpoints above and using `roleMiddleware`/`authMiddleware`.
- Client pages/components listed in section 6.

If you want, I can scaffold the migration and model files next, then add `server/src/routes/staffRouter.js` and `server/src/controllers/staffController.js` that implement `GET/PUT /api/staff/profile` and the admin CRUD endpoints. Tell me which to start with.

## Shift Scheduling & Roster Management — Detailed specification

Overview
- Purpose: provide a complete shift scheduling and roster system so admins can plan staff coverage, staff can view their upcoming shifts, and shared/individual devices can clock staff in/out and verify task completion.
- Goal: reduce understaffing, make shift assignments transparent, enable simple swap/leave workflows, and allow calendar sync (Google Calendar) for schedules.

Core concepts
- Shift: a scheduled period with a start and end time, assigned area (e.g., "Ground Floor Kitchen"), optional role requirement (e.g., Cook), and metadata (priority, notes).
- Roster / RosterPeriod: a grouping of shifts (week/month) that can be published to staff and synced to calendars.
- Assignment: a concrete association of a `shift` to a `staff` (or to a device/role for shared-device assignments).
- Shift Template / Recurrence: reusable shift definitions (e.g., Morning Cook 07:00-11:00) with recurrence rules for generating rosters.

Actors & permissions
- Admin: create/edit/delete shifts and rosters; assign staff; force-approve swaps; publish rosters; enable Google Calendar sync; view coverage analytics.
- Staff (individual accounts): view roster, accept/decline assignments (if your policy allows), request swaps, request replacements, clock-in/out from assigned device or personal account.
- Shared-device operator: select name on device, authenticate (PIN/QR), then start/stop shift actions attributed to selected staff.

Suggested data model (SQL examples)
- roles (existing)
- staff_profiles (existing or new fields)
- shifts
  - id (uuid)
  - title (varchar)
  - description (text nullable)
  - area (varchar) -- e.g., Kitchen/Block A/Floor 2
  - role_required (varchar nullable) -- role slug (e.g., cook)
  - start_at (timestamp)
  - end_at (timestamp)
  - is_recurring (boolean)
  - recurrence_rule (text nullable) -- RFC5545 rrule or custom JSON
  - created_by (user_id)
  - published (boolean default false)
  - created_at, updated_at

- shift_assignments
  - id (uuid)
  - shift_id (uuid)
  - staff_id (uuid nullable) -- assigned staff
  - device_id (uuid nullable) -- if assigned to a device/role
  - status (enum: assigned | accepted | declined | in_progress | completed | cancelled)
  - assigned_at, started_at, completed_at

- shift_swap_requests
  - id (uuid)
  - from_assignment_id (uuid)
  - requested_by_staff_id (uuid)
  - target_staff_id (uuid nullable)
  - status (enum: pending | approved | rejected | withdrawn)
  - admin_comment (text nullable)
  - created_at, resolved_at

- roster_periods (optional)
  - id, title, start_date, end_date, published_by, published_at

API endpoints (examples)
- GET /api/shifts?start=YYYY-MM-DD&end=YYYY-MM-DD — list published shifts for date range
- POST /api/shifts — create shift (admin)
- PUT /api/shifts/:id — update shift (admin)
- POST /api/shifts/:id/publish — publish/unpublish (admin)
- POST /api/shifts/:id/assign — assign staff or device to a shift (admin)
- POST /api/shifts/:id/clock-in — staff/device clock-in (auth required)
- POST /api/shifts/:id/clock-out — staff/device clock-out (auth required)
- POST /api/shift-assignments/:id/swap — request swap (staff)
- POST /api/shift-assignments/:id/complete — mark completed (staff/device)

Client UI flows
- Admin UI (pages/admin/ShiftManagement.jsx)
  - Calendar/Month/Week list view of shifts with filters (area, role, status).
  - Create/Edit shift modal (reuse `Modal.jsx`) with recurrence options and role requirement.
  - Assignment panel: drag-and-drop staff onto shift slots or open assign modal.
  - Publish roster button: triggers notifications and optional Google Calendar sync.

- Staff view (client/src/pages/staff/ShiftRoster.jsx)
  - My shifts list and calendar; action buttons: Request swap, View details, Clock-in/out.
  - Notifications for new assignments, swap approvals, and coverage alerts.

- Shared-device flow (client/src/components/DeviceShiftPanel.jsx)
  - Device shows a grid of staff photo-cards (cached list). Staff tap card and optionally enter PIN or scan QR to authenticate.
  - After identification, device shows available actions: Start shift (clock-in), Mark task complete, End shift (clock-out), Report incident.
  - All actions record `operator` metadata (device_id, selected_staff_id, auth_method).

Shared vs Individual account behavior
- Shared-device: when a device is used, the UI should limit visibility of sensitive student data; actions are still attributed to the selected staff id for audits.
- Individual account: staff can receive personal notifications, accept/decline assignments, and have shifts synced to personal calendars.

Google Calendar integration
- Approach: implement optional per-roster sync using a service account for a shared hostel calendar, and optional per-staff attendee invitations when staff have emails.
- Sync actions: on `publish roster` create calendar events for each assigned shift; on update/delete update/delete events.
- Use server-side ID mapping to store remote `calendar_event_id` for safe updates.

Notifications & alerts
- On publish: notify assigned staff via in-app notifications and optional SMS/email.
- Coverage alerts: run nightly check or realtime rule that flags understaffed time ranges and notifies admin and on-shift staff.

Business rules & validations
- Prevent double-assignment of a single staff to overlapping shifts unless policy allows.
- Enforce minimum rest gap between shifts (configurable, e.g., 8 hours).
- Validate recurrence end dates and prevent infinite recurrences without admin confirmation.

Audit & security
- Log all admin actions (create/assign/publish) and staff actions (clock-in/out, swap requests) in `audit_logs`.
- Protect endpoints with `roleMiddleware` so only admins can create/publish shifts; staff can only modify their own assignments or create swap requests.

UI / Theme integration notes
- Keep the current theme and component library: reuse `src/components/Modal.jsx`, `Navbar.jsx`, `Sidebar.jsx`, `DashboardLayout.jsx`, and the project's Tailwind setup.
- New components should follow existing naming and styling conventions (use Tailwind classes from `tailwind.config.js`) and export predictable props so other pages reuse them.
- Add pages under `client/src/pages/admin/` and `client/src/pages/staff/` and wire routes in `src/routes.jsx` following existing patterns.

Edge cases & testing
- Test shared-device flows for concurrent usage and ensure device-level locking or optimistic conflict handling.
- Simulate daylight saving/timezone issues for shift times; store timestamps in UTC and convert to user locale client-side.

Testing plan
- Unit tests for server-side shift creation/assignment logic and validation rules.
- Integration tests for publish flow that triggers Google Calendar sync and notifications.
- E2E tests for admin create->assign->publish->staff receives notification->staff clocks-in.

Deployment & migration notes
- Add SQL migration: `003_create_shifts_and_roster_tables.sql` to `server/migrations/` with `shifts`, `shift_assignments`, `shift_swap_requests`, and `roster_periods` tables.
- Add models in `server/models/Shift.js` and `server/models/ShiftAssignment.js` to match the migration.

Phased MVP (recommended)
1. Basic shifts + assignments + staff roster view + simple clock-in/out (shared-device and individual account support).
2. Shift swap requests + leave integration + publish/notifications.
3. Recurrence rules + calendar sync + coverage analytics + advanced admin roster editing.

Estimated implementation tasks (high-level)
- DB migration & models: 1–2 days
- Server controllers & routes: 2–3 days
- Client admin pages + components: 3–5 days
- Shared-device flows + PIN/QR auth: 2–3 days
- Google Calendar integration & notifications: 2–3 days
- Tests + polish + accessibility: 2–3 days

Deliverables for this feature
- Migration file(s) and models
- Server controllers and routes for CRUD and actions (assign, clock-in/out, swap)
- Client admin UI (calendar & list), staff roster page, device panel component
- Tests and basic documentation in [doc/staff-features.md](doc/staff-features.md#L1)

Next steps
- If you approve this spec, I can generate the DB migration and model files next, then scaffold server controllers and client pages in sequence. Tell me if you'd like me to proceed with the migration now.

---

## Shift Coverage Alerts & Analytics — Detailed specification

Overview
- Purpose: provide real-time and forecasted monitoring of shift coverage so admins and on‑duty staff can detect understaffing early, assign replacements, and measure operational impact (incidents, missed tasks, service degradation).
- Value: reduce service gaps, speed replacement assignment, provide evidence for staffing decisions, and expose KPIs (coverage rate, time-to-assign, alert volume).

Goals & use-cases
- Real-time detection: discover when a published shift window becomes understaffed (no-shows, late clock-ins, last-minute leave) and trigger immediate alerts.
- Forecast & planning: surface predicted shortages for the next 24–72 hours based on roster, approved leaves, and known unavailability.
- Automated suggestions: recommend replacement staff filtered by role, availability, proximity and recent workload.
- Escalation & audit: escalate critical shortages via in-app + SMS/email and record audit logs for all assignments and manual overrides.

Inputs (data sources)
- `shift_assignments` / `shifts` — required headcount per area and role.
- `attendance_events` — clock-in/clock-out events to determine presence.
- `staff_leave_requests` — approved/active leaves to subtract available staff.
- `staff_profiles.availability` — declared availability patterns and on-call schedules.
- `tasks`/`tickets`/`incidents` — events that may change required headcount or severity rules.
- Device health/last_seen (for shared devices) — determine whether device issues may cause apparent shortages.

Core concepts & evaluation model
- Time buckets: evaluate coverage in fixed buckets (recommended 15-minute buckets) across areas and roles.
- Required vs present: for each bucket compute `required_count` (from shifts), `present_count` (from attendance events within window minus approved leave), and `shortage = max(0, required_count - present_count)`.
- Thresholds & severity: define thresholds per role/area (e.g., any shortage >0 = Warning; shortage >= 50% or affecting a critical role = Critical). Configurable by admin.
- Grace & debouncing: apply a grace window (e.g., 10 minutes) to reduce false positives for late clock-ins; allow configurable debounce before firing alerts.

Example SQL (15-minute bucket shortage detection)
-- compute shortages for a date range (Postgres)
```sql
WITH buckets AS (
  SELECT generate_series(
    date_trunc('minute', $1::timestamptz),
    date_trunc('minute', $2::timestamptz) - interval '1 minute',
    interval '15 minutes'
  ) AS bucket_start
), required AS (
  -- expand shift assignments into overlapping buckets and count required headcount by area/role
  SELECT b.bucket_start,
         sa.area,
         sa.role_required AS role,
         COUNT(sa.id) AS required_count
  FROM buckets b
  JOIN shift_assignments sa
    ON sa.start_at < (b.bucket_start + interval '15 minutes')
   AND sa.end_at   > b.bucket_start
  GROUP BY b.bucket_start, sa.area, sa.role_required
), present AS (
  -- count distinct staff with a clock-in within the bucket window (or currently on-shift)
  SELECT b.bucket_start,
         s.area,
         s.role_required AS role,
         COUNT(DISTINCT ae.staff_id) AS present_count
  FROM buckets b
  JOIN shift_assignments s
    ON s.start_at < (b.bucket_start + interval '15 minutes')
   AND s.end_at   > b.bucket_start
  LEFT JOIN attendance_events ae
    ON ae.staff_id = s.staff_id
   AND ae.event_type = 'clock_in'
   AND ae.timestamp_utc >= b.bucket_start
   AND ae.timestamp_utc < (b.bucket_start + interval '15 minutes')
  WHERE ae.timestamp_utc IS NOT NULL
  GROUP BY b.bucket_start, s.area, s.role_required
)
SELECT r.bucket_start, r.area, r.role, r.required_count,
       COALESCE(p.present_count,0) AS present_count,
       GREATEST(r.required_count - COALESCE(p.present_count,0), 0) AS shortage
FROM required r
LEFT JOIN present p
  ON p.bucket_start = r.bucket_start
 AND p.area = r.area
 AND p.role = r.role
WHERE (r.required_count - COALESCE(p.present_count,0)) > 0
ORDER BY r.bucket_start, r.area, r.role;
```

Alert types, severity & escalation
- Informational: minor shortages or single-person late arrivals; notify on-duty supervisor with low urgency.
- Warning: shortages that persist beyond the grace window or affect multiple buckets; notify supervisor + scheduled replacements list.
- Critical: high-impact shortages (safety/security roles, kitchen), immediate SMS/push + escalate to admin and on-call pool.
- Automatic remediation: optionally auto-assign replacements from a configured pool and notify them; admin approval can be required based on policies.

Alert channels & actions
- In-app alerts (real-time) with deep-links to the coverage dashboard and one-click assign UI.
- Push notifications for on-call staff and SMS/email for high-severity alerts.
- Webhooks for external integrations (Ops dashboards, paging systems).
- Actions available in alert: `Acknowledge`, `Assign Replacement`, `Escalate`, `Create Incident/Ticket`, `Resolve`.

Suggested data model additions
- `coverage_snapshots` (materialized snapshots for historical analysis)
  - id uuid, area varchar, role varchar, bucket_start timestamptz, required_count int, present_count int, shortage int, computed_at timestamptz

- `coverage_alerts`
  - id uuid, bucket_start timestamptz, area varchar, role varchar, shortage int, severity varchar, triggered_by varchar (system|manual), status varchar (open|acknowledged|resolved), assigned_to uuid nullable, note text, created_at timestamptz, resolved_at timestamptz nullable

Implementation architecture
- Event-driven evaluator: worker (e.g., Bull queue) subscribes to events: `attendance.created`, `attendance.updated`, `leave.approved`, `shift.assigned`, `shift.published`. For each event compute and persist affected buckets and enqueue alert tasks when shortages appear.
- Near-real-time pipeline: Redis or Kafka for event milling, workers compute minimal affected time-buckets (e.g., current + next 1–2 buckets) and push updates to clients via WebSocket/SSE channels.
- Forecast job: nightly batch job computes 24–72 hour forecast snapshots and fills `coverage_snapshots` for reporting and trend analysis.
- Auto-suggest engine: small service that queries `staff_profiles` for matching role, availability, recent workload, and returns ranked replacement candidates.

API endpoints (examples)
- GET /api/coverage?area=&start=&end=&role= — timeline of coverage with shortages and suggested actions (auth: `staff:read_profile`/admin)
- GET /api/coverage/alerts?status=open — admin/onsite feed of active alerts (auth: `coverage:manage`)
- POST /api/coverage/alerts/:id/acknowledge — acknowledge an alert (auth: assigned_or_admin)
- POST /api/coverage/alerts/:id/assign — assign a replacement (body: {staff_id, note})
- POST /api/coverage/simulate — simulate shortages given hypothetical leaves/assignments (useful for planning)

Frontend UX & components
- Coverage Dashboard (`client/src/pages/admin/CoverageDashboard.jsx`)
  - Heatmap/time-grid by area and hour, filter by role and date range; color-coded by severity.
  - Alert inbox panel with real-time updates and quick assign buttons.
  - Suggested replacements modal with one-click assign and notification options.

- Roster overlay & map view (`Shift Management`)
  - Annotate calendar/rota with shortage flags; allow drag-drop assignment to resolve shortages.

- Mobile alert flow (`client/src/components/OnCallAlertCard.jsx`)
  - On-call staff receive alert card with `Accept assignment` button; accept updates the assignment and notifies admin.

Metrics & KPIs to track
- Coverage Rate: percent of required headcount staffed per time period (area/role).
- Average Time-to-Assign: median time between alert and replacement assignment.
- Open Alerts: count and trend of open coverage alerts by severity.
- Correlated Incidents: number of incidents/tickets generated during periods of understaffing (to measure impact).

Testing plan
- Unit tests: coverage computation function given mocked shifts/attendance/leaves.
- Integration tests: event -> worker -> alert generation -> API surface -> dashboard update.
- Load tests: simulate high volumes of attendance events (e.g., during shift change) and ensure workers and websocket channels scale.
- E2E: create an approved leave for an assigned staff, verify system detects shortage, sends alert, admin assigns replacement, alert resolves.

Acceptance criteria
- System detects shortages in 15-minute buckets and creates `coverage_alerts` when thresholds are exceeded.
- Admin dashboard displays open alerts and suggested replacements; assigning a replacement resolves or reduces the shortage accordingly.
- Forecast job populates `coverage_snapshots` for historical reporting and the coverage heatmap.

Migration & deliverables
- SQL migration to add `coverage_snapshots` and `coverage_alerts` tables.
- Server models: `CoverageSnapshot.js`, `CoverageAlert.js`.
- Worker: `coverageEvaluator` subscribing to core events and enqueuing alert tasks.
- Routes/controllers: `server/src/routes/coverageRouter.js`, `server/src/controllers/coverageController.js` implementing endpoints above.
- Client components: `CoverageDashboard.jsx`, `OnCallAlertCard.jsx`, and small modal `SuggestedReplacements.jsx`.

Implementation notes & optimisations
- Use materialized views for historical aggregation with periodic refresh (`REFRESH MATERIALIZED VIEW CONCURRENTLY`) to reduce compute.
- Persist only shortages above configured minimum (e.g., skip 1-person shortage for non-critical roles) to reduce noise.
- Keep replacement-suggestion SQL fast by indexing `staff_profiles.assigned_area`, `staff_profiles.sub_role`, and `staff_profiles.availability` where possible.

Privacy & audit
- All automated assignments and manual overrides must be logged to `audit_logs` with actor, device_id, reasoning, and timestamp.
- Mask candidate contact details in public-facing views; only reveal full contact to assigned staff/admins per visibility rules.

If you'd like, I can now scaffold the migration and model files for `coverage_snapshots` and `coverage_alerts`, or implement the worker `coverageEvaluator`. Which should I do next?

## Attendance & Clock-in/Clock-out — Detailed specification

Overview
- Purpose: provide reliable, auditable attendance records for staff using shared or individual devices, enable timesheet generation for payroll, and support coverage/analytics.
- Goals: simple clock-in/out flow for staff, robust device/offline support, accurate timesheet calculation (including breaks and overtime), export-ready payroll data, and secure auditability of edits.

Core concepts
- Attendance event: a single record representing a clock-in, clock-out, break-start, break-end, or manual adjustment.
- Session: optional grouping of events for a work period (one clock-in -> one clock-out, possibly with breaks).
- Timesheet: aggregated hours for a staff member over a pay period, including regular, overtime, and break deductions.
- Payroll export: a CSV/JSON file produced from approved timesheets for payroll processing.

Actors & permissions
- Admin: view/edit all attendance events, generate timesheets, approve timesheets, run payroll exports, and correct anomalies (with audit trail).
- Staff (individual accounts): clock-in/out, start/end breaks, view personal timesheets and history, request corrections for their events.
- Shared-device operator: select/identify staff on a shared device, authenticate (PIN/QR), then perform clock-in/out actions attributed to the selected staff. Shared devices have restricted visibility to sensitive data.

Suggested data model (SQL examples)
- attendance_events
  - id (uuid)
  - staff_id (uuid) -- who the event belongs to
  - device_id (uuid nullable) -- device that recorded the event
  - shift_assignment_id (uuid nullable) -- optional linkage to a shift
  - event_type (enum: clock_in | clock_out | break_start | break_end | manual_adjustment)
  - timestamp_utc (timestamp) -- stored in UTC
  - recorded_by (uuid nullable) -- operator id or admin who created/adjusted
  - auth_method (enum: pin | qr | oauth | admin)
  - location (json nullable) -- optional GPS/metadata
  - notes (text nullable)
  - created_at, updated_at

- timesheets
  - id (uuid)
  - staff_id (uuid)
  - period_start (date)
  - period_end (date)
  - regular_seconds (int)
  - overtime_seconds (int)
  - breaks_seconds (int)
  - total_seconds (int)
  - calculated_at
  - approved_by (uuid nullable)
  - status (enum: generated | approved | exported)
  - created_at, updated_at

- payroll_exports
  - id (uuid)
  - period_start, period_end
  - file_path (string) -- location of generated CSV/JSON
  - generated_by (uuid)
  - generated_at

API endpoints (examples)
- POST /api/attendance/events — record an event (body: staff_id, device_id, event_type, timestamp, auth_method)
- GET /api/attendance/events?staff_id=&start=&end= — list events for range
- POST /api/attendance/timesheets/generate — generate timesheets for period (admin)
- GET /api/attendance/timesheets?staff_id=&start=&end= — view generated timesheets
- POST /api/attendance/timesheets/:id/approve — admin approves timesheet
- GET /api/attendance/payroll-export?start=&end= — generate or fetch payroll export (admin)
- POST /api/attendance/events/:id/adjust — admin corrects an event (creates adjustment and audit entry)

Client UI flows
- Staff page (client/src/pages/staff/Attendance.jsx)
  - Big contextual action button: shows `Clock In` when not on-shift, `Clock Out` when on-shift, and `Start Break` / `End Break` as appropriate.
  - Recent events feed: list of last 7 days with ability to request correction.
  - Timesheet view: summary per pay period, breakdown of regular/overtime/breaks.

- Shared-device flow (client/src/components/DeviceAttendancePanel.jsx)
  - Device shows staff photo-cards (cached list). Staff tap their photo and optionally confirm with PIN or QR scan.
  - After identification the device shows available actions: `Clock In`, `Start Break`, `End Break`, `Clock Out`.
  - Device stores events locally when offline; a background sync pushes events to server when online. UI shows sync status and retry controls.

- Admin UI (pages/admin/AttendanceAdmin.jsx)
  - Event log viewer with filters (staff, device, date, event_type), inline edit (admin only), and anomaly flags (missing clock-out, overlapping sessions).
  - Timesheet generator with preview and manual adjustments before approving/exporting.
  - Payroll export UI with configurable columns and rounding rules.

Key behaviors & validations
- Event pairing: server pairs `clock_in` with the next `clock_out` for the same staff when building a session; `break_start`/`break_end` are subtracted from session duration.
- Duplicate prevention: ignore repeated identical events within a short debounce window (configurable, e.g., 30s).
- Overlap prevention: optionally prevent a staff member from being `in_progress` on multiple devices concurrently; flag instead of silently overriding.
- Missing clock-out handling: mark sessions as `open` and notify staff/admin; optionally auto-close using scheduled shift end or apply admin rule.
- Rounding & grace periods: configurable rules for rounding time intervals (e.g., to nearest 5/10/15 minutes) and grace window for late clock-ins.

Timesheet calculation rules (recommended defaults)
- Pair in/out events in chronological order; sum durations of valid pairs.
- Subtract total break durations (manual or auto-deduct if configured).
- Apply daily/weekly thresholds for overtime and compute overtime_seconds.
- Apply rounding rules after summation (or per-pair depending on policy).
- Produce totals in `timesheets` table with seconds precision for later formatting.

Payroll export format
- CSV columns (suggested): staff_id, staff_name, period_start, period_end, regular_hours, overtime_hours, breaks_hours, total_hours, pay_rate, gross_pay, notes
- Support JSON export for integrations requiring structured data.
- Include both raw seconds and formatted hours to simplify external processing.

Security, audit & data integrity
- Raw events must be kept immutable: edits create `manual_adjustment` events and an `audit_logs` entry describing the change, who made it and why.
- Protect adjustment endpoints with strict RBAC: only admins (or payroll clerks with `attendance:edit`) may modify events.
- Log device pairing/registration and store `device_id` and `operator` metadata with each event for traceability.

Notifications & alerts
- Missing clock-out alert: notify staff and admin if an `open` session exceeds a configurable threshold (e.g., 12 hours).
- No-show alert: if a scheduled shift has no clock-in within X minutes of start, notify on-call admin.
- Timesheet ready: notify staff when a timesheet is generated and when approved/exported.

Edge cases & offline behavior
- Offline-first devices cache events locally (IndexedDB or localStorage). Implement a reliable sync queue and exponential retry.
- Conflict resolution: if two devices report overlapping sessions for same staff, mark conflict and surface to admin for manual resolution.
- Timezones & DST: store timestamps in UTC and convert to user locale in client; handle DST transitions when calculating durations.

Testing plan
- Unit tests for pairing logic, rounding, overtime calculations, and break handling.
- Integration tests for device sync, offline queuing, and admin adjustments.
- E2E tests: device clock-in/out → timesheet generation → payroll export.

Migration & models to add
- Add migration `004_create_attendance_tables.sql` under `server/migrations/` to create `attendance_events`, `timesheets`, and `payroll_exports`.
- Add `server/models/AttendanceEvent.js`, `server/models/Timesheet.js`, and update `server/models/Staff.js` to include optional pay fields (pay_rate, pay_type) if payroll calculations will be performed.

Phased MVP (recommended)
1. Event recording + admin event viewer + basic timesheet generator (server-side pairing) — minimal UI for staff and shared devices.
2. Offline device sync, break handling, and automatic alerts for missing clock-outs.
3. Payroll export, rounding/overtime configuration, and integration hooks.

Estimated implementation tasks
- DB migration & models: 0.5–1 day
- Server controllers & business logic (pairing, rounding, timesheets): 1–2 days
- Client device panel + staff page: 2–3 days
- Admin UI for corrections & exports: 1–2 days
- Offline sync reliability & tests: 1–2 days

Deliverables
- Migration file(s) and models
- Server endpoints for event recording, adjustments, timesheet generation and payroll export
- Client components: `DeviceAttendancePanel.jsx`, `Attendance.jsx`, and admin pages
- Tests, documentation updates in [doc/staff-features.md](doc/staff-features.md#L1)

Questions / decisions needed
- Rounding policy: round per-pair or at total? (default: round per-pair to nearest 15 minutes)
- Overtime rules: daily vs weekly thresholds? Which is preferred?
- Should staff pay rates be stored in `staff_profiles` or a separate compensation table?

Next steps
- If you approve, I can generate the SQL migration and model files now, then scaffold the recording endpoint and a simple device UI for clock-in/out. Which step should I start with?



