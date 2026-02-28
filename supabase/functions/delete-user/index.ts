// Supabase Edge Function: Delete user(s) (admin only)
// Deletes auth user FIRST, then public.users row — so any trigger on public.users
// that tries to delete auth won't cause "Database error deleting user".
// Deploy: supabase functions deploy delete-user
// Requires: SUPABASE_SERVICE_ROLE_KEY

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const authHeader = req.headers.get('Authorization')
    const userToken = authHeader?.replace('Bearer ', '')
    if (!userToken) {
      return new Response(JSON.stringify({ error: 'Missing user token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const userClient = createClient(supabaseUrl, supabaseAnonKey)
    const { data: { user: caller } } = await userClient.auth.getUser(userToken)
    if (!caller) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const adminClient = createClient(supabaseUrl, supabaseServiceKey)
    const { data: profile } = await adminClient
      .from('users')
      .select('admin')
      .eq('email', caller.email)
      .maybeSingle()

    if (!profile?.admin) {
      return new Response(JSON.stringify({ error: 'Admin access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const body = await req.json().catch(() => ({}))
    const userIds = Array.isArray(body?.user_ids) ? body.user_ids : [body?.user_id].filter(Boolean)
    if (userIds.length === 0) {
      return new Response(JSON.stringify({ error: 'Missing user_ids (array) or user_id' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 1) Ensure no clients are assigned to these users (FK RESTRICT would fail anyway)
    const { count: assignedCount } = await adminClient
      .from('clients')
      .select('*', { count: 'exact', head: true })
      .in('assigned_user_id', userIds)

    if ((assignedCount ?? 0) > 0) {
      return new Response(
        JSON.stringify({ error: 'Reassign or remove all clients from these users before deleting them.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const errors: string[] = []

    for (const uid of userIds) {
      // 2) Delete auth user FIRST (so trigger on public.users delete won't fail)
      const { error: authErr } = await adminClient.auth.admin.deleteUser(uid)
      if (authErr) {
        const msg = authErr.message || ''
        if (msg.includes('User not found') || msg.includes('not found') || msg.includes('404')) {
          // Auth user already gone; still remove public.users row if present
        } else {
          errors.push(`${uid}: ${msg}`)
          continue
        }
      }

      // 3) Then delete from public.users (trigger may run here; auth is already deleted)
      const { error: dbErr } = await adminClient.from('users').delete().eq('user_id', uid)
      if (dbErr) {
        errors.push(`${uid}: ${dbErr.message}`)
      }
    }

    if (errors.length > 0) {
      return new Response(
        JSON.stringify({ error: 'Database error deleting user', details: errors }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(JSON.stringify({ success: true, deleted: userIds.length }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
