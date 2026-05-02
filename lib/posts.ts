import { supabase } from './supabase';
import { getCurrentUser } from './auth';

export interface DBPost {
  id: string;
  user_id: string | null;
  title: string;
  content: string;
  is_anonymous: boolean;
  author_name: string | null;
  upvotes: number;
  amens: number;
  created_at: string;
  upvotedByMe: boolean;
  amenedByMe: boolean;
}

type RawPost = {
  id: string;
  user_id: string | null;
  title: string;
  content: string;
  is_anonymous: boolean;
  author_name: string | null;
  upvotes: number;
  amens: number;
  created_at: string;
  post_reactions: { reaction_type: string; user_id: string }[];
};

function shapePost(raw: RawPost, myId: string | null): DBPost {
  return {
    ...raw,
    upvotedByMe: raw.post_reactions?.some(r => r.user_id === myId && r.reaction_type === 'upvote') ?? false,
    amenedByMe:  raw.post_reactions?.some(r => r.user_id === myId && r.reaction_type === 'amen')   ?? false,
  };
}

export async function fetchPosts(sort: 'latest' | 'popular'): Promise<DBPost[]> {
  const user = await getCurrentUser();
  const order = sort === 'latest' ? 'created_at' : 'upvotes';

  const { data, error } = await supabase
    .from('community_posts')
    .select('*, post_reactions(reaction_type, user_id)')
    .order(order, { ascending: false })
    .limit(100);

  if (error || !data) return [];
  return (data as RawPost[]).map(p => shapePost(p, user?.id ?? null));
}

export async function createPost(payload: {
  title: string;
  content: string;
  is_anonymous: boolean;
  author_name: string | null;
}): Promise<DBPost | null> {
  const user = await getCurrentUser();
  const { data, error } = await supabase
    .from('community_posts')
    .insert({ ...payload, user_id: user?.id ?? null })
    .select('*, post_reactions(reaction_type, user_id)')
    .single();

  if (error || !data) return null;
  return shapePost(data as RawPost, user?.id ?? null);
}

export async function toggleReaction(
  postId: string,
  type: 'upvote' | 'amen'
): Promise<boolean | null> {
  const user = await getCurrentUser();
  if (!user) return null;

  const { data, error } = await supabase.rpc('toggle_reaction', {
    p_post_id: postId,
    p_user_id: user.id,
    p_type: type,
  });

  if (error) return null;
  return data as boolean;
}

export function subscribeToFeed(onUpdate: () => void) {
  return supabase
    .channel('community_posts_feed')
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'community_posts',
    }, onUpdate)
    .subscribe();
}
