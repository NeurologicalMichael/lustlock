-- ──────────────────────────────────────────────────────────────────────────────
-- LustLock — Seed Data (community posts)
-- Run after migrations to populate the brotherhood feed.
-- Replace the user_id values with real UUIDs from your auth.users table,
-- or leave as NULL (anonymous posts don't require a user_id).
-- ──────────────────────────────────────────────────────────────────────────────

INSERT INTO public.community_posts (title, content, is_anonymous, author_name, upvotes, amens, created_at)
VALUES
  (
    'Day 30 — Never thought I''d make it',
    'Brothers, 30 days clean. I remember standing at day 3 thinking it was impossible. One hour at a time. God is faithful.',
    false, 'James R.', 47, 22,
    NOW() - INTERVAL '38 minutes'
  ),
  (
    'Struggling tonight — need prayer',
    'It''s late and the urges are strong. Just opened the app instead of giving in. Can the brothers pray for me right now?',
    true, NULL, 31, 18,
    NOW() - INTERVAL '74 minutes'
  ),
  (
    'What broke my 2-year habit',
    'Three things changed everything: morning Scripture before touching my phone, cutting off after 9pm, and telling one trusted person. You don''t have to fight alone in the dark.',
    false, 'David M.', 89, 41,
    NOW() - INTERVAL '5 hours'
  ),
  (
    'Relapsed after 45 days — getting back up',
    'I fell. Hard. But I''m not staying down. The enemy wins if I quit entirely. Day 1 again — this time I know what triggers to watch for.',
    true, NULL, 62, 29,
    NOW() - INTERVAL '11 hours'
  ),
  (
    'Accountability saved me last night',
    'At 2am I was about to give in. Texted my accountability partner and he stayed up with me on the phone for an hour. Find your people, brothers. It matters.',
    false, 'Marcus T.', 73, 35,
    NOW() - INTERVAL '18 hours'
  );
