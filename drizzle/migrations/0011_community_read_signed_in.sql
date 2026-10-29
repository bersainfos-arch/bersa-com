DROP POLICY IF EXISTS "Lecture publique des likes" ON public.community_post_likes;
DROP POLICY IF EXISTS "Lecture publique des commentaires" ON public.community_post_comments;
DROP POLICY IF EXISTS "Lecture publique des publications" ON public.community_posts;
CREATE POLICY "Lecture des likes par membres" ON public.community_post_likes FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "Lecture des commentaires par membres" ON public.community_post_comments FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "Lecture des publications par membres" ON public.community_posts FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
REVOKE SELECT ON public.community_post_likes, public.community_post_comments, public.community_posts FROM anon;