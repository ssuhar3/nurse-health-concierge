-- ══════════════════════════════════════════════════════════
-- SHC Portal — Supabase Database Schema
-- Run this in Supabase SQL Editor
-- ══════════════════════════════════════════════════════════

-- Enable UUID generation
create extension if not exists "uuid-ossp";

-- ─── Advocate Applications ───────────────────────────────
create table advocate_applications (
  id uuid primary key default uuid_generate_v4(),
  created_at timestamptz not null default now(),

  -- Applicant info
  full_name text not null,
  email text not null,
  phone text not null,
  address text,
  city text,
  state text,
  zip text,

  -- Professional
  professional_title text not null,
  employment_type text,
  geographic_areas text,
  start_date text,
  experience text,

  -- PDFs (S3 URLs)
  summary_pdf_url text,
  packet_pdf_url text,
  resume_pdf_url text,

  -- References
  ref1_name text, ref1_phone text, ref1_email text, ref1_relationship text,
  ref2_name text, ref2_phone text, ref2_email text, ref2_relationship text,
  ref3_name text, ref3_phone text, ref3_email text, ref3_relationship text,

  -- Management
  status text not null default 'Packet Sent'
    check (status in ('Packet Sent', 'Packet Received', 'Under Review', 'Interview Scheduled', 'Approved', 'Denied', 'Onboarding')),
  internal_notes text default ''
);

-- ─── Client Inquiries ────────────────────────────────────
create table client_inquiries (
  id uuid primary key default uuid_generate_v4(),
  created_at timestamptz not null default now(),

  -- Contact info
  contact_name text not null,
  relationship text not null,
  phone text not null,
  email text not null,
  contact_method text,
  contact_time text,

  -- Senior info
  senior_name text,
  age_range text,
  senior_location text,
  living_situation text,

  -- Needs & details
  health_needs text,  -- comma-separated list
  story text,
  referral_source text,
  timeframe text,

  -- Management
  status text not null default 'New'
    check (status in ('New', 'Contacted', 'Under Review', 'Consultation Scheduled', 'Converted', 'Closed', 'Active Client')),
  internal_notes text default ''
);

-- ─── Client Onboarding ──────────────────────────────────
create table client_onboarding (
  id uuid primary key default uuid_generate_v4(),
  created_at timestamptz not null default now(),

  -- Client info
  client_name text not null,
  dob text not null,
  address text,
  city text,
  state text,
  zip text,
  phone text not null,
  email text not null,

  -- Primary contact
  primary_contact_name text not null,
  primary_contact_relationship text,
  primary_contact_phone text not null,
  primary_contact_email text,

  -- Emergency contact
  emergency_contact_name text not null,
  emergency_contact_phone text not null,

  -- Medical
  pcp text,
  specialists text,
  medical_conditions text,
  medications text,
  allergies text,
  hospital_preference text,
  medicare_medicaid text,
  supplemental_insurance text,
  pharmacy text,

  -- Care
  care_needs text,  -- comma-separated list
  care_goals text,

  -- PDFs (S3 URLs)
  summary_pdf_url text,
  packet_pdf_url text,

  -- Management
  status text not null default 'New'
    check (status in ('New', 'Documents Sent', 'Documents Received', 'Under Review', 'Active', 'Inactive')),
  internal_notes text default ''
);

-- ─── Indexes for common queries ─────────────────────────
create index idx_applications_status on advocate_applications(status);
create index idx_applications_created on advocate_applications(created_at desc);
create index idx_inquiries_status on client_inquiries(status);
create index idx_inquiries_created on client_inquiries(created_at desc);
create index idx_onboarding_status on client_onboarding(status);
create index idx_onboarding_created on client_onboarding(created_at desc);

-- ─── Row Level Security ─────────────────────────────────
-- Enable RLS on all tables
alter table advocate_applications enable row level security;
alter table client_inquiries enable row level security;
alter table client_onboarding enable row level security;

-- Service role (backend) can do everything
-- These policies allow the service_role key (used by your server) full access
create policy "Service role full access" on advocate_applications
  for all using (auth.role() = 'service_role');
create policy "Service role full access" on client_inquiries
  for all using (auth.role() = 'service_role');
create policy "Service role full access" on client_onboarding
  for all using (auth.role() = 'service_role');

-- Anon key can insert (for public form submissions)
create policy "Anon can insert applications" on advocate_applications
  for insert with check (true);
create policy "Anon can insert inquiries" on client_inquiries
  for insert with check (true);
create policy "Anon can insert onboarding" on client_onboarding
  for insert with check (true);
