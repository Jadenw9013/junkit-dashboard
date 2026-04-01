-- Junk It Dashboard — Supabase Schema
-- Run this in the Supabase SQL editor after creating your project.

-- Jobs table (mirrors existing jobs.json structure)
CREATE TABLE IF NOT EXISTS jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  customer_name TEXT,
  phone TEXT,
  service TEXT,
  city TEXT,
  price NUMERIC,
  notes TEXT,
  status TEXT DEFAULT 'lead',
  source TEXT DEFAULT 'manual',
  ai_draft_sms TEXT,
  ai_draft_email TEXT
);

-- Customers table
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  name TEXT,
  phone TEXT UNIQUE,
  city TEXT,
  total_jobs INTEGER DEFAULT 0,
  total_revenue NUMERIC DEFAULT 0,
  last_job_date TIMESTAMPTZ,
  last_job_service TEXT,
  tags TEXT[],
  notes TEXT
);

-- Automation logs
CREATE TABLE IF NOT EXISTS automation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  trigger TEXT,
  action TEXT,
  recipient TEXT,
  success BOOLEAN,
  fallback_used BOOLEAN DEFAULT FALSE,
  error TEXT,
  job_id UUID,
  customer_id UUID
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON jobs(created_at);
CREATE INDEX IF NOT EXISTS idx_customers_last_job ON customers(last_job_date);
CREATE INDEX IF NOT EXISTS idx_automation_logs_timestamp ON automation_logs(timestamp);
