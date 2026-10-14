ALTER TABLE public.real_estate_templates
    ADD COLUMN IF NOT EXISTS code_data TEXT NOT NULL DEFAULT '';

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'real_estate_templates'
          AND column_name = 'meta_data'
    ) THEN
        UPDATE public.real_estate_templates
        SET code_data = COALESCE(meta_data -> 'code_data', '{}'::jsonb)::text
        WHERE NULLIF(code_data, '') IS NULL
          AND meta_data ? 'code_data';

        UPDATE public.real_estate_templates
        SET code = CASE
            WHEN position('</body>' IN lower(code)) > 0 THEN
                regexp_replace(
                    code,
                    '</body>',
                    '<script>' || COALESCE(meta_data ->> 'code_script', '') || '</script></body>',
                    'i'
                )
            ELSE
                code || '<script>' || COALESCE(meta_data ->> 'code_script', '') || '</script>'
        END
        WHERE meta_data ? 'code_script'
          AND COALESCE(meta_data ->> 'code_script', '') <> '';

        ALTER TABLE public.real_estate_templates
            DROP COLUMN meta_data;
    END IF;
END
$$;
