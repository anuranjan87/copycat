CREATE TABLE IF NOT EXISTS public.real_estate_templates (
    id SERIAL PRIMARY KEY,
    code TEXT NOT NULL,
    subcategory TEXT NOT NULL,
    meta_data JSONB NOT NULL DEFAULT '{}'::jsonb
);
