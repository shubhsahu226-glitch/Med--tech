-- Create table to cache AI generated medical term explanations
CREATE TABLE IF NOT EXISTS public.medical_terms_cache (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    term VARCHAR(255) UNIQUE NOT NULL,
    simple_meaning TEXT NOT NULL,
    why_it_matters TEXT NOT NULL,
    body_impact TEXT NOT NULL,
    easy_example TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Set up Row Level Security (RLS)
ALTER TABLE public.medical_terms_cache ENABLE ROW LEVEL SECURITY;

-- Allow read access for authenticated and anonymous users
CREATE POLICY "Allow public read access to medical_terms_cache"
ON public.medical_terms_cache
FOR SELECT
USING (true);

-- Allow service role (backend) to insert new terms
CREATE POLICY "Allow service role insert to medical_terms_cache"
ON public.medical_terms_cache
FOR INSERT
WITH CHECK (true);
