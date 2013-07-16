--
-- PostgreSQL database dump
--

-- Dumped from database version 9.2.4
-- Dumped by pg_dump version 9.2.4
-- Started on 2013-07-17 00:15:01

SET statement_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SET check_function_bodies = false;
SET client_min_messages = warning;

--
-- TOC entry 178 (class 3079 OID 11727)
-- Name: plpgsql; Type: EXTENSION; Schema: -; Owner: 
--

CREATE EXTENSION IF NOT EXISTS plpgsql WITH SCHEMA pg_catalog;


--
-- TOC entry 1979 (class 0 OID 0)
-- Dependencies: 178
-- Name: EXTENSION plpgsql; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION plpgsql IS 'PL/pgSQL procedural language';


SET search_path = public, pg_catalog;

SET default_tablespace = '';

SET default_with_oids = false;

--
-- TOC entry 168 (class 1259 OID 16440)
-- Name: day_of_event; Type: TABLE; Schema: public; Owner: postgres; Tablespace: 
--

CREATE TABLE day_of_event (
    id_day_of_event bigint NOT NULL,
    id_event bigint NOT NULL,
    datetime timestamp with time zone NOT NULL
);


ALTER TABLE public.day_of_event OWNER TO postgres;

--
-- TOC entry 169 (class 1259 OID 16443)
-- Name: day_of_event_id_day_of_event_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE day_of_event_id_day_of_event_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.day_of_event_id_day_of_event_seq OWNER TO postgres;

--
-- TOC entry 1980 (class 0 OID 0)
-- Dependencies: 169
-- Name: day_of_event_id_day_of_event_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE day_of_event_id_day_of_event_seq OWNED BY day_of_event.id_day_of_event;


--
-- TOC entry 170 (class 1259 OID 16445)
-- Name: event; Type: TABLE; Schema: public; Owner: postgres; Tablespace: 
--

CREATE TABLE event (
    id_event bigint NOT NULL,
    id_creator bigint NOT NULL,
    name character varying(60) NOT NULL,
    description character varying(255),
    created timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.event OWNER TO postgres;

--
-- TOC entry 171 (class 1259 OID 16449)
-- Name: event_id_event_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE event_id_event_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.event_id_event_seq OWNER TO postgres;

--
-- TOC entry 1981 (class 0 OID 0)
-- Dependencies: 171
-- Name: event_id_event_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE event_id_event_seq OWNED BY event.id_event;


--
-- TOC entry 172 (class 1259 OID 16451)
-- Name: event_user; Type: TABLE; Schema: public; Owner: postgres; Tablespace: 
--

CREATE TABLE event_user (
    id_event bigint NOT NULL,
    id_user bigint NOT NULL
);


ALTER TABLE public.event_user OWNER TO postgres;

--
-- TOC entry 173 (class 1259 OID 16454)
-- Name: invitation; Type: TABLE; Schema: public; Owner: postgres; Tablespace: 
--

CREATE TABLE invitation (
    id_invitation bigint NOT NULL,
    id_event bigint NOT NULL,
    email_invitation character varying(60),
    id_user_invited bigint DEFAULT (-1) NOT NULL,
    invitation_token character(32)
);


ALTER TABLE public.invitation OWNER TO postgres;

--
-- TOC entry 174 (class 1259 OID 16458)
-- Name: invitation_id_invitation_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE invitation_id_invitation_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.invitation_id_invitation_seq OWNER TO postgres;

--
-- TOC entry 1982 (class 0 OID 0)
-- Dependencies: 174
-- Name: invitation_id_invitation_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE invitation_id_invitation_seq OWNED BY invitation.id_invitation;


--
-- TOC entry 175 (class 1259 OID 16460)
-- Name: user; Type: TABLE; Schema: public; Owner: postgres; Tablespace: 
--

CREATE TABLE "user" (
    id_user bigint NOT NULL,
    email character varying(60) NOT NULL,
    password character(32) NOT NULL,
    activation_token character(32) NOT NULL,
    created timestamp without time zone DEFAULT now() NOT NULL,
    nickname character varying(20)
);


ALTER TABLE public."user" OWNER TO postgres;

--
-- TOC entry 1983 (class 0 OID 0)
-- Dependencies: 175
-- Name: COLUMN "user".nickname; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN "user".nickname IS 'Visible name that registered users show next to email they''ve been invited to...';


--
-- TOC entry 176 (class 1259 OID 16464)
-- Name: user_day_availability; Type: TABLE; Schema: public; Owner: postgres; Tablespace: 
--

CREATE TABLE user_day_availability (
    id_user bigint NOT NULL,
    id_day_of_event bigint NOT NULL,
    is_available character(1) DEFAULT 'm'::text
);


ALTER TABLE public.user_day_availability OWNER TO postgres;

--
-- TOC entry 1984 (class 0 OID 0)
-- Dependencies: 176
-- Name: COLUMN user_day_availability.is_available; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN user_day_availability.is_available IS 'Indicates whether a user is available or not at the corresponding day. Default value is ''m'' (maybe) which can be considered neutral or N/A value. The other two are ''y'' and ''n'' for YES and NO respectively';


--
-- TOC entry 177 (class 1259 OID 16468)
-- Name: user_id_user_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE user_id_user_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.user_id_user_seq OWNER TO postgres;

--
-- TOC entry 1985 (class 0 OID 0)
-- Dependencies: 177
-- Name: user_id_user_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE user_id_user_seq OWNED BY "user".id_user;


--
-- TOC entry 1942 (class 2604 OID 16470)
-- Name: id_day_of_event; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY day_of_event ALTER COLUMN id_day_of_event SET DEFAULT nextval('day_of_event_id_day_of_event_seq'::regclass);


--
-- TOC entry 1944 (class 2604 OID 16471)
-- Name: id_event; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY event ALTER COLUMN id_event SET DEFAULT nextval('event_id_event_seq'::regclass);


--
-- TOC entry 1946 (class 2604 OID 16472)
-- Name: id_invitation; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY invitation ALTER COLUMN id_invitation SET DEFAULT nextval('invitation_id_invitation_seq'::regclass);


--
-- TOC entry 1948 (class 2604 OID 16473)
-- Name: id_user; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "user" ALTER COLUMN id_user SET DEFAULT nextval('user_id_user_seq'::regclass);


--
-- TOC entry 1962 (class 0 OID 16440)
-- Dependencies: 168
-- Data for Name: day_of_event; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY day_of_event (id_day_of_event, id_event, datetime) FROM stdin;
92	38	2013-06-01 11:04:27+02
93	38	2013-06-02 11:04:27+02
94	38	2013-06-05 11:04:27+02
95	38	2013-06-06 11:04:27+02
96	38	2013-06-07 11:04:27+02
97	38	2013-06-04 11:04:27+02
98	38	2013-06-03 11:04:27+02
99	39	2013-08-03 11:04:27+02
100	39	2013-08-04 11:04:27+02
101	40	2013-07-10 20:06:47+02
102	40	2013-07-11 20:06:47+02
\.


--
-- TOC entry 1986 (class 0 OID 0)
-- Dependencies: 169
-- Name: day_of_event_id_day_of_event_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('day_of_event_id_day_of_event_seq', 102, true);


--
-- TOC entry 1964 (class 0 OID 16445)
-- Dependencies: 170
-- Data for Name: event; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY event (id_event, id_creator, name, description, created) FROM stdin;
38	1	First event 	Descibing it. 7 days, 3 ppl with creator included	2013-06-27 11:04:22.153
39	1	Second event	Describing the second oneº	2013-06-27 11:17:12.662
\.


--
-- TOC entry 1987 (class 0 OID 0)
-- Dependencies: 171
-- Name: event_id_event_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('event_id_event_seq', 40, true);


--
-- TOC entry 1966 (class 0 OID 16451)
-- Dependencies: 172
-- Data for Name: event_user; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY event_user (id_event, id_user) FROM stdin;
\.


--
-- TOC entry 1967 (class 0 OID 16454)
-- Dependencies: 173
-- Data for Name: invitation; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY invitation (id_invitation, id_event, email_invitation, id_user_invited, invitation_token) FROM stdin;
51	38	user6invitedTo38@aaa.com	6	9e6d7868e601a3992e50b8a58e65fe2d
52	38	user5invitedTo38@aaa.com	5	d631ab2b95b7e453d8a22081be18e17c
53	39	user6invited2To39@aaa.com	6	asdadasdasdadasd                
54	39	user5invitedTo39@bbb.com	5	dfas5678dfas5678                
55	38	user7invitedTo38@aaa.com	7	asdfasdfadfasdfadfadfa          
56	38	userXinvitedTo38@gmail.com	-1	65614d508d766f448f83373cdeebfa05
57	38	userYinvitedTo38@gmail.com	-1	3b2e0f6c73e2e522a9b87a293b1a9b2c
58	39	userZinvitedTo39@aaa.com	-1	654asd654asdf65a4f              
\.


--
-- TOC entry 1988 (class 0 OID 0)
-- Dependencies: 174
-- Name: invitation_id_invitation_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('invitation_id_invitation_seq', 58, true);


--
-- TOC entry 1969 (class 0 OID 16460)
-- Dependencies: 175
-- Data for Name: user; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "user" (id_user, email, password, activation_token, created, nickname) FROM stdin;
1	user1real@abc.com	1234                            	x123x123x123x123x123            	2013-06-24 11:54:20.801	User1Nick
5	user5real@email.com	321321                          	x12x3xx12x31231x23              	2013-06-24 12:04:29.709	User5Nick
6	user6real@abc.com	654654                          	xz2xz12xz1x469xxz967zx34xz      	2013-06-27 11:01:08.108	User6Nick
7	user7real@adv.com	987987                          	987987987987                    	2013-06-29 13:20:42.438	User7Nick
\.


--
-- TOC entry 1970 (class 0 OID 16464)
-- Dependencies: 176
-- Data for Name: user_day_availability; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY user_day_availability (id_user, id_day_of_event, is_available) FROM stdin;
5	92	y
5	93	y
5	94	y
5	95	y
5	99	n
5	100	n
6	92	n
6	93	n
6	94	n
6	95	y
6	99	y
6	100	y
7	92	n
7	95	n
7	93	m
7	94	m
\.


--
-- TOC entry 1989 (class 0 OID 0)
-- Dependencies: 177
-- Name: user_id_user_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('user_id_user_seq', 7, true);


--
-- TOC entry 1951 (class 2606 OID 16475)
-- Name: day_of_event_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres; Tablespace: 
--

ALTER TABLE ONLY day_of_event
    ADD CONSTRAINT day_of_event_pkey PRIMARY KEY (id_day_of_event);


--
-- TOC entry 1953 (class 2606 OID 16477)
-- Name: event_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres; Tablespace: 
--

ALTER TABLE ONLY event
    ADD CONSTRAINT event_pkey PRIMARY KEY (id_event);


--
-- TOC entry 1955 (class 2606 OID 16479)
-- Name: event_user_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres; Tablespace: 
--

ALTER TABLE ONLY event_user
    ADD CONSTRAINT event_user_pkey PRIMARY KEY (id_event, id_user);


--
-- TOC entry 1957 (class 2606 OID 16481)
-- Name: invitation_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres; Tablespace: 
--

ALTER TABLE ONLY invitation
    ADD CONSTRAINT invitation_pkey PRIMARY KEY (id_invitation);


--
-- TOC entry 1961 (class 2606 OID 16483)
-- Name: user_day_availability_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres; Tablespace: 
--

ALTER TABLE ONLY user_day_availability
    ADD CONSTRAINT user_day_availability_pkey PRIMARY KEY (id_user, id_day_of_event);


--
-- TOC entry 1959 (class 2606 OID 16485)
-- Name: user_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres; Tablespace: 
--

ALTER TABLE ONLY "user"
    ADD CONSTRAINT user_pkey PRIMARY KEY (id_user);


--
-- TOC entry 1978 (class 0 OID 0)
-- Dependencies: 6
-- Name: public; Type: ACL; Schema: -; Owner: postgres
--

REVOKE ALL ON SCHEMA public FROM PUBLIC;
REVOKE ALL ON SCHEMA public FROM postgres;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO PUBLIC;


-- Completed on 2013-07-17 00:15:04

--
-- PostgreSQL database dump complete
--

