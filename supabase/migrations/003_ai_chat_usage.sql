CREATE TABLE IF NOT EXISTS public.ai_chat_usage (
  user_id    UUID    NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  usage_date DATE    NOT NULL DEFAULT CURRENT_DATE,
  count      INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, usage_date)
);

ALTER TABLE public.ai_chat_usage ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users read own usage" ON public.ai_chat_usage;

CREATE POLICY "users read own usage"
  ON public.ai_chat_usage FOR SELECT
  USING (auth.uid() = user_id);

DROP FUNCTION IF EXISTS public.claim_ai_chat_usage(INTEGER);

CREATE OR REPLACE FUNCTION public.claim_ai_chat_usage()
RETURNS TABLE(allowed BOOLEAN, used INTEGER, remaining INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  max_daily CONSTANT INTEGER := 5;
  current_user_id UUID := auth.uid();
  new_count INTEGER;
BEGIN
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'not_authenticated' USING ERRCODE = '28000';
  END IF;

  INSERT INTO public.ai_chat_usage (user_id, usage_date, count)
  VALUES (current_user_id, CURRENT_DATE, 1)
  ON CONFLICT (user_id, usage_date)
  DO UPDATE
    SET count = public.ai_chat_usage.count + 1
    WHERE public.ai_chat_usage.count < max_daily
  RETURNING count INTO new_count;

  IF new_count IS NULL THEN
    SELECT count INTO new_count
    FROM public.ai_chat_usage
    WHERE user_id = current_user_id
      AND usage_date = CURRENT_DATE;

    RETURN QUERY SELECT FALSE, COALESCE(new_count, max_daily), 0;
    RETURN;
  END IF;

  RETURN QUERY SELECT TRUE, new_count, GREATEST(max_daily - new_count, 0);
END;
$$;

GRANT EXECUTE ON FUNCTION public.claim_ai_chat_usage() TO authenticated;
