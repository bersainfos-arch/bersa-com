ALTER TABLE public.document_templates ADD COLUMN content_html text;
ALTER TABLE public.document_templates ADD COLUMN file_name text;
COMMENT ON COLUMN public.document_templates.content_html IS 'Imported editable Word template content; rendering must sanitize it.';