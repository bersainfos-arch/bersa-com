-- Fix access functions to decouple access from current price (prevents losing access if price changes)
CREATE OR REPLACE FUNCTION public.can_access_book(_book uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT auth.uid() IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.books b
    WHERE b.id = _book
    AND (
      public.has_role(auth.uid(), 'admin')
      OR b.user_id = auth.uid()
      OR (
        b.status = 'published'
        AND (
          COALESCE(b.price_usd, 0) = 0
          OR EXISTS (
            SELECT 1 FROM public.orders o
            WHERE o.book_id = b.id
            AND o.user_id = auth.uid()
            AND o.paid = true
          )
        )
      )
    )
  )
$$;

CREATE OR REPLACE FUNCTION public.can_access_course(cid uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT auth.uid() IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.courses c
    WHERE c.id = cid
    AND (
      c.user_id = auth.uid()
      OR public.has_role(auth.uid(), 'admin')
      OR (
        c.status = 'published'
        AND EXISTS (
          SELECT 1 FROM public.course_enrollments e
          WHERE e.course_id = c.id
          AND e.user_id = auth.uid()
          AND e.status = 'active'
        )
      )
    )
  )
$$;

-- Add UPDATE policy for storage to allow owners to replace their files
CREATE POLICY "books files owner update" ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'books' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "community files owner update" ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'community' AND (storage.foldername(name))[1] = auth.uid()::text);
