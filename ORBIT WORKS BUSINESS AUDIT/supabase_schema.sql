-- Run this in your Supabase SQL Editor to create the necessary table

CREATE TABLE public.audit_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    full_name TEXT,
    email TEXT,
    whatsapp TEXT,
    business_name TEXT,
    website_url TEXT,
    city TEXT,
    country TEXT,
    aeo_geo_score INTEGER DEFAULT 0,
    website_health_score INTEGER DEFAULT 0,
    seo_score INTEGER DEFAULT 0,
    reputation_score INTEGER DEFAULT 0,
    competitor_score INTEGER DEFAULT 0,
    social_score INTEGER DEFAULT 0,
    overall_score INTEGER DEFAULT 0,
    ai_insights JSONB,
    raw_data JSONB
);

-- Optional: Enable Row Level Security (RLS) if you want to secure the table
-- ALTER TABLE public.audit_reports ENABLE ROW LEVEL SECURITY;
