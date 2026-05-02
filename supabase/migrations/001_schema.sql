-- ──────────────────────────────────────────────────────────────────────────────
-- LustLock — Initial Schema
-- Run in: Supabase dashboard → SQL Editor
-- ──────────────────────────────────────────────────────────────────────────────

-- ── User profiles ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id                 UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username           TEXT,
  email              TEXT,
  tagline            TEXT,
  quiz_answers       JSONB    DEFAULT '{}',
  fighting_for       TEXT[]   DEFAULT '{}',
  covenant_scripture TEXT     DEFAULT '',
  join_date          TIMESTAMPTZ DEFAULT NOW(),
  is_pro             BOOLEAN  DEFAULT FALSE,
  rc_customer_id     TEXT,                          -- RevenueCat customer ID
  created_at         TIMESTAMPTZ DEFAULT NOW(),
  updated_at         TIMESTAMPTZ DEFAULT NOW()
);

-- ── Per-battlefield streak rows ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.streaks (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  battlefield_key TEXT NOT NULL,
  streak_start    TIMESTAMPTZ,
  streak_days     INTEGER DEFAULT 0,
  longest_streak  INTEGER DEFAULT 0,
  paused          BOOLEAN DEFAULT FALSE,
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, battlefield_key)
);

-- ── Relapse events ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.relapses (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  battlefield_key TEXT NOT NULL,
  relapsed_at     TIMESTAMPTZ DEFAULT NOW(),
  hour_of_day     INTEGER CHECK (hour_of_day BETWEEN 0 AND 23),
  triggers        TEXT[] DEFAULT '{}'
);

-- ── Community posts (brotherhood feed) ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.community_posts (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  title        TEXT NOT NULL CHECK (char_length(title) BETWEEN 1 AND 80),
  content      TEXT NOT NULL CHECK (char_length(content) BETWEEN 1 AND 500),
  is_anonymous BOOLEAN DEFAULT FALSE,
  author_name  TEXT,          -- NULL when anonymous
  upvotes      INTEGER DEFAULT 0,
  amens        INTEGER DEFAULT 0,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ── Post reactions (upvote / amen) — one per user per type per post ───────────
CREATE TABLE IF NOT EXISTS public.post_reactions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id       UUID NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
  user_id       UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reaction_type TEXT NOT NULL CHECK (reaction_type IN ('upvote', 'amen')),
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, user_id, reaction_type)
);

-- ── updated_at trigger ────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER streaks_updated_at
  BEFORE UPDATE ON public.streaks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── Atomic reaction toggle (called via supabase.rpc) ─────────────────────────
-- Returns TRUE if reaction was added, FALSE if removed.
CREATE OR REPLACE FUNCTION toggle_reaction(
  p_post_id UUID,
  p_user_id UUID,
  p_type    TEXT
) RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_exists BOOLEAN;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM public.post_reactions
    WHERE post_id = p_post_id AND user_id = p_user_id AND reaction_type = p_type
  ) INTO v_exists;

  IF v_exists THEN
    DELETE FROM public.post_reactions
    WHERE post_id = p_post_id AND user_id = p_user_id AND reaction_type = p_type;

    UPDATE public.community_posts
    SET upvotes = GREATEST(0, upvotes - 1)
    WHERE id = p_post_id AND p_type = 'upvote';

    UPDATE public.community_posts
    SET amens = GREATEST(0, amens - 1)
    WHERE id = p_post_id AND p_type = 'amen';

    RETURN FALSE;
  ELSE
    INSERT INTO public.post_reactions (post_id, user_id, reaction_type)
    VALUES (p_post_id, p_user_id, p_type);

    UPDATE public.community_posts
    SET upvotes = upvotes + 1
    WHERE id = p_post_id AND p_type = 'upvote';

    UPDATE public.community_posts
    SET amens = amens + 1
    WHERE id = p_post_id AND p_type = 'amen';

    RETURN TRUE;
  END IF;
END;
$$;

-- ── Auto-create profile row after sign-up ─────────────────────────────────────
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, username)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1))
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
