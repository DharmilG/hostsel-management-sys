--
-- PostgreSQL database dump
--

\restrict UgGlcY0UchrgQermVVkXxuIe5AmwVSwrup9jL76QmTK8CoxIgG33F0SgjfMI6gH

-- Dumped from database version 18.0
-- Dumped by pg_dump version 18.0

-- Started on 2026-04-19 17:39:40

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- TOC entry 240 (class 1255 OID 33324)
-- Name: notify_complaint_status(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.notify_complaint_status() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF NEW.status <> OLD.status THEN
        INSERT INTO notifications (student_id, message, type)
        VALUES (
            NEW.student_id,
            'Your complaint status is now ' || NEW.status,
            'complaint'
        );
    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.notify_complaint_status() OWNER TO postgres;

--
-- TOC entry 241 (class 1255 OID 33326)
-- Name: notify_fee_payment(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.notify_fee_payment() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF NEW.payment_status = 'paid'
       AND OLD.payment_status <> 'paid' THEN
        INSERT INTO notifications (student_id, message, type)
        VALUES (
            NEW.student_id,
            'Your hostel fee payment is successful',
            'fee'
        );
    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.notify_fee_payment() OWNER TO postgres;

--
-- TOC entry 239 (class 1255 OID 33322)
-- Name: prevent_over_allocation(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.prevent_over_allocation() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    room_capacity INT;
    room_occupied INT;
BEGIN
    SELECT capacity, occupied_count
    INTO room_capacity, room_occupied
    FROM rooms
    WHERE id = NEW.room_id;

    IF room_occupied >= room_capacity THEN
        RAISE EXCEPTION 'Room is already full';
    END IF;

    RETURN NEW;
END;
$$;


ALTER FUNCTION public.prevent_over_allocation() OWNER TO postgres;

--
-- TOC entry 238 (class 1255 OID 33320)
-- Name: update_complaint_timestamp(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_complaint_timestamp() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_complaint_timestamp() OWNER TO postgres;

--
-- TOC entry 237 (class 1255 OID 33318)
-- Name: update_room_occupancy(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_room_occupancy() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE rooms
        SET occupied_count = occupied_count + 1
        WHERE id = NEW.room_id;

    ELSIF TG_OP = 'DELETE' THEN
        UPDATE rooms
        SET occupied_count = occupied_count - 1
        WHERE id = OLD.room_id;
    END IF;

    UPDATE rooms
    SET status = CASE
        WHEN occupied_count >= capacity THEN 'full'
        ELSE 'available'
    END
    WHERE id = COALESCE(NEW.room_id, OLD.room_id);

    RETURN NULL;
END;
$$;


ALTER FUNCTION public.update_room_occupancy() OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 236 (class 1259 OID 33295)
-- Name: announcements; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.announcements (
    id integer NOT NULL,
    title character varying(100) NOT NULL,
    message text NOT NULL,
    created_by integer NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.announcements OWNER TO postgres;

--
-- TOC entry 235 (class 1259 OID 33294)
-- Name: announcements_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.announcements_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.announcements_id_seq OWNER TO postgres;

--
-- TOC entry 5052 (class 0 OID 0)
-- Dependencies: 235
-- Name: announcements_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.announcements_id_seq OWNED BY public.announcements.id;


--
-- TOC entry 228 (class 1259 OID 33216)
-- Name: attendance; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.attendance (
    id integer NOT NULL,
    student_id integer NOT NULL,
    attendance_date date NOT NULL,
    status character varying(10) NOT NULL,
    marked_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT attendance_status_check CHECK (((status)::text = ANY ((ARRAY['present'::character varying, 'absent'::character varying])::text[])))
);


ALTER TABLE public.attendance OWNER TO postgres;

--
-- TOC entry 227 (class 1259 OID 33215)
-- Name: attendance_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.attendance_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.attendance_id_seq OWNER TO postgres;

--
-- TOC entry 5053 (class 0 OID 0)
-- Dependencies: 227
-- Name: attendance_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.attendance_id_seq OWNED BY public.attendance.id;


--
-- TOC entry 230 (class 1259 OID 33236)
-- Name: complaints; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.complaints (
    id integer NOT NULL,
    student_id integer NOT NULL,
    title character varying(100) NOT NULL,
    description text NOT NULL,
    category character varying(30),
    status character varying(20) DEFAULT 'pending'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    severity integer DEFAULT 3,
    CONSTRAINT complaints_status_check CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'in_progress'::character varying, 'completed'::character varying])::text[])))
);


ALTER TABLE public.complaints OWNER TO postgres;

--
-- TOC entry 229 (class 1259 OID 33235)
-- Name: complaints_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.complaints_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.complaints_id_seq OWNER TO postgres;

--
-- TOC entry 5054 (class 0 OID 0)
-- Dependencies: 229
-- Name: complaints_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.complaints_id_seq OWNED BY public.complaints.id;


--
-- TOC entry 232 (class 1259 OID 33258)
-- Name: fees; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.fees (
    id integer NOT NULL,
    student_id integer NOT NULL,
    amount numeric(10,2) NOT NULL,
    fee_type character varying(30),
    payment_status character varying(20) DEFAULT 'unpaid'::character varying,
    payment_date date,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fees_payment_status_check CHECK (((payment_status)::text = ANY ((ARRAY['paid'::character varying, 'unpaid'::character varying])::text[])))
);


ALTER TABLE public.fees OWNER TO postgres;

--
-- TOC entry 231 (class 1259 OID 33257)
-- Name: fees_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.fees_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.fees_id_seq OWNER TO postgres;

--
-- TOC entry 5055 (class 0 OID 0)
-- Dependencies: 231
-- Name: fees_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.fees_id_seq OWNED BY public.fees.id;


--
-- TOC entry 234 (class 1259 OID 33276)
-- Name: notifications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.notifications (
    id integer NOT NULL,
    student_id integer NOT NULL,
    message text NOT NULL,
    type character varying(30),
    is_read boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.notifications OWNER TO postgres;

--
-- TOC entry 233 (class 1259 OID 33275)
-- Name: notifications_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.notifications_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.notifications_id_seq OWNER TO postgres;

--
-- TOC entry 5056 (class 0 OID 0)
-- Dependencies: 233
-- Name: notifications_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.notifications_id_seq OWNED BY public.notifications.id;


--
-- TOC entry 226 (class 1259 OID 33195)
-- Name: room_allocations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.room_allocations (
    id integer NOT NULL,
    student_id integer,
    room_id integer,
    allocated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.room_allocations OWNER TO postgres;

--
-- TOC entry 225 (class 1259 OID 33194)
-- Name: room_allocations_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.room_allocations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.room_allocations_id_seq OWNER TO postgres;

--
-- TOC entry 5057 (class 0 OID 0)
-- Dependencies: 225
-- Name: room_allocations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.room_allocations_id_seq OWNED BY public.room_allocations.id;


--
-- TOC entry 224 (class 1259 OID 33181)
-- Name: rooms; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.rooms (
    id integer NOT NULL,
    room_number character varying(10) NOT NULL,
    block character varying(10),
    floor integer,
    capacity integer NOT NULL,
    occupied_count integer DEFAULT 0,
    status character varying(20) DEFAULT 'available'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT rooms_status_check CHECK (((status)::text = ANY ((ARRAY['available'::character varying, 'full'::character varying, 'maintenance'::character varying])::text[])))
);


ALTER TABLE public.rooms OWNER TO postgres;

--
-- TOC entry 223 (class 1259 OID 33180)
-- Name: rooms_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.rooms_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.rooms_id_seq OWNER TO postgres;

--
-- TOC entry 5058 (class 0 OID 0)
-- Dependencies: 223
-- Name: rooms_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.rooms_id_seq OWNED BY public.rooms.id;


--
-- TOC entry 222 (class 1259 OID 33158)
-- Name: students; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.students (
    id integer NOT NULL,
    user_id integer,
    roll_no character varying(30) NOT NULL,
    full_name character varying(100) NOT NULL,
    course character varying(100),
    year integer,
    contact_number character varying(15),
    email character varying(100),
    emergency_contact character varying(15) NOT NULL,
    address text,
    photo_url text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.students OWNER TO postgres;

--
-- TOC entry 221 (class 1259 OID 33157)
-- Name: students_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.students_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.students_id_seq OWNER TO postgres;

--
-- TOC entry 5059 (class 0 OID 0)
-- Dependencies: 221
-- Name: students_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.students_id_seq OWNED BY public.students.id;


--
-- TOC entry 220 (class 1259 OID 33137)
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id integer NOT NULL,
    username character varying(50) NOT NULL,
    email character varying(100) NOT NULL,
    password_hash text NOT NULL,
    role character varying(20) NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    last_login_at timestamp with time zone,
    last_login_method character varying(64),
    CONSTRAINT users_role_check CHECK (((role)::text = ANY ((ARRAY['admin'::character varying, 'student'::character varying, 'staff'::character varying])::text[])))
);


ALTER TABLE public.users OWNER TO postgres;

--
-- TOC entry 219 (class 1259 OID 33136)
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO postgres;

--
-- TOC entry 5060 (class 0 OID 0)
-- Dependencies: 219
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- TOC entry 4824 (class 2604 OID 33298)
-- Name: announcements id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.announcements ALTER COLUMN id SET DEFAULT nextval('public.announcements_id_seq'::regclass);


--
-- TOC entry 4811 (class 2604 OID 33219)
-- Name: attendance id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.attendance ALTER COLUMN id SET DEFAULT nextval('public.attendance_id_seq'::regclass);


--
-- TOC entry 4813 (class 2604 OID 33239)
-- Name: complaints id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.complaints ALTER COLUMN id SET DEFAULT nextval('public.complaints_id_seq'::regclass);


--
-- TOC entry 4818 (class 2604 OID 33261)
-- Name: fees id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fees ALTER COLUMN id SET DEFAULT nextval('public.fees_id_seq'::regclass);


--
-- TOC entry 4821 (class 2604 OID 33279)
-- Name: notifications id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications ALTER COLUMN id SET DEFAULT nextval('public.notifications_id_seq'::regclass);


--
-- TOC entry 4809 (class 2604 OID 33198)
-- Name: room_allocations id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.room_allocations ALTER COLUMN id SET DEFAULT nextval('public.room_allocations_id_seq'::regclass);


--
-- TOC entry 4805 (class 2604 OID 33184)
-- Name: rooms id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rooms ALTER COLUMN id SET DEFAULT nextval('public.rooms_id_seq'::regclass);


--
-- TOC entry 4803 (class 2604 OID 33161)
-- Name: students id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.students ALTER COLUMN id SET DEFAULT nextval('public.students_id_seq'::regclass);


--
-- TOC entry 4800 (class 2604 OID 33140)
-- Name: users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- TOC entry 5046 (class 0 OID 33295)
-- Dependencies: 236
-- Data for Name: announcements; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.announcements (id, title, message, created_by, created_at) FROM stdin;
13	prayer attend	please attend prayer\n	18	2026-01-23 22:19:43.931674
\.


--
-- TOC entry 5038 (class 0 OID 33216)
-- Dependencies: 228
-- Data for Name: attendance; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.attendance (id, student_id, attendance_date, status, marked_at) FROM stdin;
3	4	2026-01-21	absent	2026-01-21 21:32:01.449326
4	4	2026-01-22	present	2026-01-21 21:32:31.45191
\.


--
-- TOC entry 5040 (class 0 OID 33236)
-- Dependencies: 230
-- Data for Name: complaints; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.complaints (id, student_id, title, description, category, status, created_at, updated_at, severity) FROM stdin;
1	4	Water leakage in bathroom	There is continuous water leakage from the bathroom tap	plumbing	pending	2026-01-21 21:39:26.60075	2026-01-21 21:39:26.60075	3
2	4	There is no clean water in the filter	Fix the cooler and filter immideatly!!!!!	drinking water	pending	2026-01-21 21:40:31.968713	2026-01-21 21:40:31.968713	3
3	4	There is no clean water in the filter	Fix the cooler and filter immideatly!!!!!	\N	completed	2026-01-21 21:40:55.328205	2026-04-19 10:37:47.167049	3
12	8	CRITICAL	FIX THIS ASAP	Hostel	pending	2026-04-19 13:27:52.829429	2026-04-19 13:27:52.829429	5
13	8	Title for major	lorem ipsium lorem lorem ipsium  lorem ipsium  lorem ipsium  lorem ipsium  lorem ipsium  lorem ipsium  lorem ipsium  lorem ipsium  lorem ipsium  lorem ipsium  lorem ipsium  lorem ipsium  lorem ipsium  lorem ipsium  lorem ipsium  lorem ipsium  lorem ipsium  lorem ipsium  lorem ipsium  lorem ipsium  lorem ipsium  lorem ipsium  lorem ipsium  lorem ipsium  lorem ipsium  lorem ipsium  lorem ipsium  lorem ipsium  lorem ipsium  lorem ipsium  lorem ipsium  lorem ipsium  lorem ipsium  lorem ipsium  lorem ipsium  lorem ipsium  lorem ipsium  lorem ipsium  lorem ipsium  lorem ipsium  lorem ipsium  lorem ipsium  lorem ipsium  lorem ipsium  lorem ipsium  lorem ipsium  lorem ipsium  lorem ipsium  lorem ipsium  lorem ipsium  lorem ipsium  lorem ipsium  lorem ipsium  lorem ipsium  lorem ipsium  lorem ipsium  lorem ipsium  lorem ipsium  lorem ipsium  lorem ipsium  lorem ipsium  lorem ipsium  lorem ipsium  lorem ipsium  lorem ipsium  lorem ipsium  lorem ipsium  lorem ipsium  lorem ipsium  lorem ipsium  lorem ipsium  lorem ipsium  lorem ipsium  lorem ipsium  lorem ipsium  lorem ipsium  lorem ipsium  lorem ipsium  lorem ipsium  lorem ipsium  lorem ipsium  lorem ipsium  lorem ipsium  lorem ipsium  lorem ipsium  lorem ipsium  lorem ipsium  lorem ipsium  lorem ipsium  lorem ipsium  lorem ipsium  lorem ipsium  lorem ipsium  lorem ipsium  lorem ipsium  lorem ipsium  lorem ipsium  lorem ipsium  lorem ipsium  lorem ipsium  lorem ipsium  lorem ipsium  lorem ipsium  lorem ipsium  lorem ipsium  lorem ipsium  lorem ipsium  lorem ipsium  lorem ipsium  lorem ipsium  lorem ipsium  lorem ipsium  lorem ipsium  lorem ipsium  lorem ipsium  lorem ipsium  lorem ipsium  lorem ipsium  lorem ipsium  lorem ipsium  lorem ipsium  lorem ipsium  lorem ipsium  lorem ipsium  lorem ipsium  lorem ipsium  lorem ipsium  lorem ipsium  lorem ipsium  lorem ipsium  lorem ipsium  lorem ipsium  lorem ipsium 	Hostel	pending	2026-04-19 15:33:28.05727	2026-04-19 15:33:28.05727	4
\.


--
-- TOC entry 5042 (class 0 OID 33258)
-- Dependencies: 232
-- Data for Name: fees; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.fees (id, student_id, amount, fee_type, payment_status, payment_date, created_at) FROM stdin;
1	4	25000.00	hostel	unpaid	\N	2026-01-21 21:56:32.38621
2	4	12000.00	food	paid	\N	2026-01-21 21:56:52.494589
4	4	12000.00	\N	paid	\N	2026-01-21 21:57:21.212743
5	4	12000.00	\N	paid	2026-01-23	2026-01-21 21:57:32.315559
\.


--
-- TOC entry 5044 (class 0 OID 33276)
-- Dependencies: 234
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.notifications (id, student_id, message, type, is_read, created_at) FROM stdin;
1	4	Your hostel fee payment is successful	fee	f	2026-01-23 21:58:06.656047
2	4	Your complaint status is now completed	complaint	f	2026-04-19 10:37:47.167049
\.


--
-- TOC entry 5036 (class 0 OID 33195)
-- Dependencies: 226
-- Data for Name: room_allocations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.room_allocations (id, student_id, room_id, allocated_at) FROM stdin;
\.


--
-- TOC entry 5034 (class 0 OID 33181)
-- Dependencies: 224
-- Data for Name: rooms; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.rooms (id, room_number, block, floor, capacity, occupied_count, status, created_at) FROM stdin;
1	A-101	A	1	3	0	available	2026-01-21 21:19:59.51432
3	A-101	A	1	3	0	available	2026-01-21 21:22:27.074683
4	A-101	A	1	4	0	available	2026-01-21 21:22:46.453064
\.


--
-- TOC entry 5032 (class 0 OID 33158)
-- Dependencies: 222
-- Data for Name: students; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.students (id, user_id, roll_no, full_name, course, year, contact_number, email, emergency_contact, address, photo_url, created_at) FROM stdin;
4	15	CS2024001	Rahul Sharma	Computer Science	2	9876543210	rahul.sharma@student.com	9123456789	Hostel Block A, Room 101	\N	2026-01-21 19:12:26.864575
6	\N	EC2345645	Dharmil Gajjar	ICT	2027	6549873216	dharmilgajjarict23@gmail.com	9845632154	dhoraji rajkot	\N	2026-01-23 21:53:51.739881
7	\N	EC2344234	Second Test	ICT23	2056	649873125	dharmilG@gamil.com	654815316	rajkot is here\n	\N	2026-01-23 22:11:08.891968
8	21	N/A	bruce		0		brucestudent@gmail.com			\N	2026-04-19 13:27:52.824804
\.


--
-- TOC entry 5030 (class 0 OID 33137)
-- Dependencies: 220
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, username, email, password_hash, role, is_active, created_at, last_login_at, last_login_method) FROM stdin;
1	Dharmil	fordarmilg@gmail.com	$2b$10$48OWLT/oAd.3EX4PxdVptuZWnXg8Fi/G.4GzPGG53O9R4y54uxINe	admin	t	2026-01-21 13:26:42.125753	\N	\N
13	NewUser	dharmilgajjar0@gmail.com	$2b$10$Ce19aKeDrdcmYvPrIUEOEO4hcCHIOwFk..vlgp0gnFF.y6rw8r.rS	admin	t	2026-01-21 18:20:50.194905	\N	\N
14	Test	test0@gmail.com	$2b$10$wgbIro82ETqLYziGPTroPOHPCWwRj5wD7WFgbXIR87enxx1sqPLSy	student	t	2026-01-21 18:21:21.605859	\N	\N
15	dharmil	dharmilgajjar@gmail.com	$2b$10$t3TZ6DtYkcK4Aky2KTKi2.JEuDdE.UWWF1q3zEAbHCe5zRLfZlT5O	admin	t	2026-01-21 19:02:31.199601	\N	\N
16	test	test@123gmail.com	$2b$10$OkxeTptNeFlFQEgSWHaETO6sejVvFIvGR1PXLPDAQiyzrxt9y7xaS	student	t	2026-01-23 01:03:56.116395	\N	\N
17	testadmin	testadmin@123gmail.com	$2b$10$SQt/4GUIOTc572Mul7Df1eHHFsoU/GjcCNz6/v5uaUwdHdZaXyvKy	admin	t	2026-01-23 01:04:11.345007	\N	\N
18	admin	admin@123gmail.com	$2b$10$0PuLpMH245G7DKcCyBv98e.6RMeLSBn0YpR6PROBvck2Jy7vmOwgK	admin	t	2026-01-23 01:47:01.798633	\N	\N
24	For Eafcbeta	foreafcbeta@gmail.com	$2b$10$rs9V4OuVsftEZxsPi/KMcO.bzroWSkjbiqT1/OabO3B97k5zcQjOy	student	t	2026-04-19 09:36:49.863769	2026-04-19 10:24:34.77826+05:30	google
23	firsttest	firsttest@gmail.com	$2b$10$cWKDVC7yCYg5S9GprUH2geim7LZpJ.AmnBxlhXHChOvdb8dNRhJze	student	t	2026-04-18 19:17:54.519103	2026-04-19 10:28:35.542999+05:30	password
21	bruce	brucestudent@gmail.com	$2b$10$4htu8wknXta9kO3mqEJsP.y9n2GtckHmIMZzD9veScwCiaPkjAs9O	student	t	2026-02-02 18:16:50.355548	2026-04-19 15:33:14.786729+05:30	password
22	bruceadmin	bruceadmin@gmail.com	$2b$10$XWf/ovpwRT6oUsSjMU0gJuk76d98waSLcvXk7/JRM/xtjLE3jLzNG	admin	t	2026-02-02 18:16:50.355548	2026-04-19 15:33:45.425924+05:30	password
26	brucestaff	brucestaff@gmail.com	$2b$10$4Mbap8CiBVs1lHjZluo1peLlC.baJQvpHSPRn8oGC/ha.SvOzK.Wa	staff	t	2026-04-19 16:12:23.826865	2026-04-19 16:40:24.261041+05:30	password
\.


--
-- TOC entry 5061 (class 0 OID 0)
-- Dependencies: 235
-- Name: announcements_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.announcements_id_seq', 13, true);


--
-- TOC entry 5062 (class 0 OID 0)
-- Dependencies: 227
-- Name: attendance_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.attendance_id_seq', 7, true);


--
-- TOC entry 5063 (class 0 OID 0)
-- Dependencies: 229
-- Name: complaints_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.complaints_id_seq', 13, true);


--
-- TOC entry 5064 (class 0 OID 0)
-- Dependencies: 231
-- Name: fees_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.fees_id_seq', 5, true);


--
-- TOC entry 5065 (class 0 OID 0)
-- Dependencies: 233
-- Name: notifications_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.notifications_id_seq', 2, true);


--
-- TOC entry 5066 (class 0 OID 0)
-- Dependencies: 225
-- Name: room_allocations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.room_allocations_id_seq', 1, false);


--
-- TOC entry 5067 (class 0 OID 0)
-- Dependencies: 223
-- Name: rooms_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.rooms_id_seq', 4, true);


--
-- TOC entry 5068 (class 0 OID 0)
-- Dependencies: 221
-- Name: students_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.students_id_seq', 8, true);


--
-- TOC entry 5069 (class 0 OID 0)
-- Dependencies: 219
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_id_seq', 26, true);


--
-- TOC entry 4868 (class 2606 OID 33307)
-- Name: announcements announcements_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.announcements
    ADD CONSTRAINT announcements_pkey PRIMARY KEY (id);


--
-- TOC entry 4853 (class 2606 OID 33227)
-- Name: attendance attendance_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.attendance
    ADD CONSTRAINT attendance_pkey PRIMARY KEY (id);


--
-- TOC entry 4858 (class 2606 OID 33251)
-- Name: complaints complaints_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.complaints
    ADD CONSTRAINT complaints_pkey PRIMARY KEY (id);


--
-- TOC entry 4862 (class 2606 OID 33269)
-- Name: fees fees_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fees
    ADD CONSTRAINT fees_pkey PRIMARY KEY (id);


--
-- TOC entry 4866 (class 2606 OID 33288)
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- TOC entry 4849 (class 2606 OID 33202)
-- Name: room_allocations room_allocations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.room_allocations
    ADD CONSTRAINT room_allocations_pkey PRIMARY KEY (id);


--
-- TOC entry 4851 (class 2606 OID 33204)
-- Name: room_allocations room_allocations_student_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.room_allocations
    ADD CONSTRAINT room_allocations_student_id_key UNIQUE (student_id);


--
-- TOC entry 4847 (class 2606 OID 33193)
-- Name: rooms rooms_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rooms
    ADD CONSTRAINT rooms_pkey PRIMARY KEY (id);


--
-- TOC entry 4841 (class 2606 OID 33170)
-- Name: students students_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.students
    ADD CONSTRAINT students_pkey PRIMARY KEY (id);


--
-- TOC entry 4843 (class 2606 OID 33174)
-- Name: students students_roll_no_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.students
    ADD CONSTRAINT students_roll_no_key UNIQUE (roll_no);


--
-- TOC entry 4845 (class 2606 OID 33172)
-- Name: students students_user_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.students
    ADD CONSTRAINT students_user_id_key UNIQUE (user_id);


--
-- TOC entry 4856 (class 2606 OID 33229)
-- Name: attendance unique_attendance; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.attendance
    ADD CONSTRAINT unique_attendance UNIQUE (student_id, attendance_date);


--
-- TOC entry 4834 (class 2606 OID 33156)
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- TOC entry 4836 (class 2606 OID 33152)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- TOC entry 4838 (class 2606 OID 33154)
-- Name: users users_username_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key UNIQUE (username);


--
-- TOC entry 4854 (class 1259 OID 33314)
-- Name: idx_attendance_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_attendance_date ON public.attendance USING btree (attendance_date);


--
-- TOC entry 4859 (class 1259 OID 33315)
-- Name: idx_complaint_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_complaint_status ON public.complaints USING btree (status);


--
-- TOC entry 4860 (class 1259 OID 656082)
-- Name: idx_complaints_severity; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_complaints_severity ON public.complaints USING btree (severity);


--
-- TOC entry 4863 (class 1259 OID 33316)
-- Name: idx_fee_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_fee_status ON public.fees USING btree (payment_status);


--
-- TOC entry 4864 (class 1259 OID 33317)
-- Name: idx_notification_read; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notification_read ON public.notifications USING btree (is_read);


--
-- TOC entry 4839 (class 1259 OID 33313)
-- Name: idx_students_roll_no; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_students_roll_no ON public.students USING btree (roll_no);


--
-- TOC entry 4831 (class 1259 OID 652507)
-- Name: idx_users_last_login_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_last_login_at ON public.users USING btree (last_login_at);


--
-- TOC entry 4832 (class 1259 OID 652508)
-- Name: idx_users_last_login_method; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_last_login_method ON public.users USING btree (last_login_method);


--
-- TOC entry 4879 (class 2620 OID 33325)
-- Name: complaints trg_notify_complaint_status; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_notify_complaint_status AFTER UPDATE ON public.complaints FOR EACH ROW EXECUTE FUNCTION public.notify_complaint_status();


--
-- TOC entry 4881 (class 2620 OID 33327)
-- Name: fees trg_notify_fee_payment; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_notify_fee_payment AFTER UPDATE ON public.fees FOR EACH ROW EXECUTE FUNCTION public.notify_fee_payment();


--
-- TOC entry 4877 (class 2620 OID 33323)
-- Name: room_allocations trg_prevent_over_allocation; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_prevent_over_allocation BEFORE INSERT ON public.room_allocations FOR EACH ROW EXECUTE FUNCTION public.prevent_over_allocation();


--
-- TOC entry 4880 (class 2620 OID 33321)
-- Name: complaints trg_update_complaint_timestamp; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_update_complaint_timestamp BEFORE UPDATE ON public.complaints FOR EACH ROW EXECUTE FUNCTION public.update_complaint_timestamp();


--
-- TOC entry 4878 (class 2620 OID 33319)
-- Name: room_allocations trg_update_room_occupancy; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_update_room_occupancy AFTER INSERT OR DELETE ON public.room_allocations FOR EACH ROW EXECUTE FUNCTION public.update_room_occupancy();


--
-- TOC entry 4876 (class 2606 OID 33308)
-- Name: announcements fk_admin_user; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.announcements
    ADD CONSTRAINT fk_admin_user FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 4872 (class 2606 OID 33230)
-- Name: attendance fk_attendance_student; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.attendance
    ADD CONSTRAINT fk_attendance_student FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;


--
-- TOC entry 4873 (class 2606 OID 33252)
-- Name: complaints fk_complaint_student; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.complaints
    ADD CONSTRAINT fk_complaint_student FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;


--
-- TOC entry 4874 (class 2606 OID 33270)
-- Name: fees fk_fee_student; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fees
    ADD CONSTRAINT fk_fee_student FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;


--
-- TOC entry 4875 (class 2606 OID 33289)
-- Name: notifications fk_notification_student; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT fk_notification_student FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;


--
-- TOC entry 4870 (class 2606 OID 33210)
-- Name: room_allocations fk_room; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.room_allocations
    ADD CONSTRAINT fk_room FOREIGN KEY (room_id) REFERENCES public.rooms(id) ON DELETE CASCADE;


--
-- TOC entry 4871 (class 2606 OID 33205)
-- Name: room_allocations fk_student_room; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.room_allocations
    ADD CONSTRAINT fk_student_room FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;


--
-- TOC entry 4869 (class 2606 OID 33175)
-- Name: students fk_user; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.students
    ADD CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


-- Completed on 2026-04-19 17:39:40

--
-- PostgreSQL database dump complete
--

\unrestrict UgGlcY0UchrgQermVVkXxuIe5AmwVSwrup9jL76QmTK8CoxIgG33F0SgjfMI6gH

