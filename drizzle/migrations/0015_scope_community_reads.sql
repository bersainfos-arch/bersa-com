DROP POLICY IF EXISTS "Lecture des commentaires par membres" ON public.community_post_comments;
CREATE POLICY "Lecture commentaires auteur ou admin" ON public.community_post_comments FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));
DROP POLICY IF EXISTS "Lecture des publications par membres" ON public.community_posts;
CREATE POLICY "Lecture publications auteur ou admin" ON public.community_posts FOR SELECT TO authenticated USING (auth.uid() = author_id OR public.has_role(auth.uid(),'admin'));