DROP POLICY IF EXISTS "community_read" ON storage.objects;
CREATE POLICY "community_read" ON storage.objects FOR SELECT TO authenticated USING (
  bucket_id = 'community' AND (select auth.uid()) IS NOT NULL AND (
    owner_id = (select auth.uid()::text)
    OR (storage.foldername(name))[1] = (select auth.uid()::text)
    OR public.has_role((select auth.uid()),'admin')
    OR EXISTS (SELECT 1 FROM public.course_resources r WHERE r.file_path = objects.name AND public.can_access_course(r.course_id))
    OR EXISTS (SELECT 1 FROM public.courses c WHERE c.cover_path = objects.name AND c.status = 'published')
    OR EXISTS (SELECT 1 FROM public.author_profiles a WHERE a.photo_path = objects.name AND a.published)
    OR EXISTS (SELECT 1 FROM public.opportunities o WHERE o.cover_path = objects.name AND o.status = 'active')
  ));
DROP POLICY IF EXISTS "books files entitled read" ON storage.objects;
CREATE POLICY "books files entitled read" ON storage.objects FOR SELECT TO authenticated USING (
  bucket_id = 'books' AND (select auth.uid()) IS NOT NULL AND (
    owner_id = (select auth.uid()::text)
    OR (storage.foldername(name))[1] = (select auth.uid()::text)
    OR public.has_role((select auth.uid()),'admin')
    OR EXISTS (SELECT 1 FROM public.books b WHERE b.file_path = objects.name AND public.can_access_book(b.id))
    OR EXISTS (SELECT 1 FROM public.books b WHERE b.cover_path = objects.name AND b.status = 'published')
  ));