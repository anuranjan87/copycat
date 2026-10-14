CREATE TABLE IF NOT EXISTS public.real_estate_templates (
    id SERIAL PRIMARY KEY,
    code TEXT NOT NULL,
    code_data TEXT NOT NULL DEFAULT '',
    subcategory TEXT NOT NULL
);

ALTER TABLE public.real_estate_templates
    ADD COLUMN IF NOT EXISTS code_data TEXT NOT NULL DEFAULT '';
