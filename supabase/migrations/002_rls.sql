-- ──────────────────────────────────────────────────────────────────────────────
-- LustLock — Row Level Security Policies
-- Run after 001_schema.sql
-- ──────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.profiles        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.streaks         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.relapses        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_reactions  ENABLE ROW LEVEL SECURITY;

-- ── profiles ──────────────────────────────────────────────────────────────────
CREATE POLICY "profiles_select_own"
  ON public.profiles FOR SELECT USING (auth.uid() = id);

CREATE POLICY "profiles_insert_own"
  ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- ── streaks (private per user) ────────────────────────────────────────────────
CREATE POLICY "streaks_all_own"
  ON public.streaks USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ── relapses (private per user) ──────────────────────────────────────────────
CREATE POLICY "relapses_all_own"
  ON public.relapses USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ── community_posts (public read, auth write) ─────────────────────────────────
CREATE POLICY "posts_public_read"
  ON public.community_posts FOR SELECT USING (true);

CREATE POLICY "posts_auth_insert"
  ON public.community_posts FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "posts_own_update"
  ON public.community_posts FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "posts_own_delete"
  ON public.community_posts FOR DELETE USING (auth.uid() = user_id);

-- ── post_reactions ────────────────────────────────────────────────────────────
CREATE POLICY "reactions_public_read"
  ON public.post_reactions FOR SELECT USING (true);

-- toggle_reaction() runs SECURITY DEFINER so it bypasses RLS internally.
-- Direct inserts/deletes from client still need the policy:
CREATE POLICY "reactions_own"
  ON public.post_reactions USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Enable realtime for brotherhood feed
ALTER PUBLICATION supabase_realtime ADD TABLE public.community_posts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.post_reactions;
