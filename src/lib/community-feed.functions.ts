import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** Fil Découvrir : renvoie seulement les champs publics, jamais les identifiants des membres. */
export const getCommunityFeed = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [posts, comments] = await Promise.all([
      supabaseAdmin
        .from("community_posts")
        .select("id, author_name, author_avatar, author_role, content, category, media_url, media_type, views_count, created_at")
        .order("created_at", { ascending: false })
        .limit(20),
      supabaseAdmin
        .from("community_post_comments")
        .select("id, post_id, user_name, user_avatar, content, created_at")
        .order("created_at", { ascending: true })
        .limit(500),
    ]);
    if (posts.error) throw new Error("Impossible de charger les publications");
    if (comments.error) throw new Error("Impossible de charger les commentaires");
    return { posts: posts.data ?? [], comments: comments.data ?? [] };
  });
