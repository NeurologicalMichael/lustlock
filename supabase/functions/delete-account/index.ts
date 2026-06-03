import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.105.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const authHeader = req.headers.get('Authorization') ?? '';

    if (!supabaseUrl || !anonKey || !serviceRoleKey) {
      throw new Error('Missing Supabase environment variables.');
    }

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    await adminClient.from('post_reactions').delete().eq('user_id', user.id);
    await adminClient.from('community_posts').delete().eq('user_id', user.id);
    await adminClient.from('relapses').delete().eq('user_id', user.id);
    await adminClient.from('streaks').delete().eq('user_id', user.id);
    await adminClient.from('profiles').delete().eq('id', user.id);

    const { error: deleteError } = await adminClient.auth.admin.deleteUser(user.id);
    if (deleteError) throw deleteError;

    return new Response(JSON.stringify({ deleted: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Account deletion failed.',
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
