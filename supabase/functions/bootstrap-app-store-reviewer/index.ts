import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const REVIEW_EMAIL = 'review@inveq.fr';
const REVIEW_PASSWORD = 'azaz651234';

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRole = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !serviceRole) {
      return jsonResponse({ error: 'Server misconfigured' }, 500);
    }

    const body = (await request.json().catch(() => ({}))) as {
      email?: string;
      password?: string;
    };

    const email = body.email?.trim().toLowerCase() ?? '';
    const password = body.password ?? '';

    if (email !== REVIEW_EMAIL || password !== REVIEW_PASSWORD) {
      return jsonResponse({ error: 'Forbidden' }, 403);
    }

    const admin = createClient(supabaseUrl, serviceRole, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const listed = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
    let user = listed.data?.users?.find((entry) => entry.email?.toLowerCase() === REVIEW_EMAIL);

    if (!user) {
      const created = await admin.auth.admin.createUser({
        email: REVIEW_EMAIL,
        password: REVIEW_PASSWORD,
        email_confirm: true,
        user_metadata: {
          first_name: 'Apple',
          last_name: 'Review',
          company_name: 'Atelier Martin',
        },
      });
      if (created.error || !created.data.user) {
        return jsonResponse({ error: created.error?.message ?? 'Unable to create user' }, 500);
      }
      user = created.data.user;
    } else {
      const updated = await admin.auth.admin.updateUserById(user.id, {
        password: REVIEW_PASSWORD,
        email_confirm: true,
        user_metadata: {
          first_name: 'Apple',
          last_name: 'Review',
          company_name: 'Atelier Martin',
        },
      });
      if (updated.error) {
        return jsonResponse({ error: updated.error.message }, 500);
      }
      user = updated.data.user ?? user;
    }

    await admin.from('profiles').upsert(
      {
        id: user.id,
        first_name: 'Apple',
        last_name: 'Review',
        company_name: 'Atelier Martin',
        email: REVIEW_EMAIL,
        onboarding_completed: true,
        onboarding_step: 99,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' },
    );

    // Plan Max (fallback pro si enum max absent)
    const maxUpdate = await admin
      .from('subscriptions')
      .upsert(
        {
          user_id: user.id,
          plan: 'max',
          status: 'active',
          cancel_at_period_end: false,
          current_period_start: new Date().toISOString(),
          current_period_end: new Date(
            Date.now() + 365 * 24 * 60 * 60 * 1000,
          ).toISOString(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' },
      );

    if (maxUpdate.error) {
      await admin.from('subscriptions').upsert(
        {
          user_id: user.id,
          plan: 'pro',
          status: 'active',
          cancel_at_period_end: false,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' },
      );
    }

    const { data: memberships } = await admin
      .from('company_members')
      .select('company_id')
      .eq('user_id', user.id)
      .limit(1);

    let companyId = memberships?.[0]?.company_id as string | undefined;
    if (!companyId) {
      const { data: rpcCompanyId, error: rpcError } = await admin.rpc('create_company_for_user', {
        p_name: 'Atelier Martin',
      });
      // RPC uses auth.uid(); call via impersonation isn't available — create rows directly
      if (rpcError || !rpcCompanyId) {
        const { data: company, error: companyError } = await admin
          .from('companies')
          .insert({
            name: 'Atelier Martin',
            email: REVIEW_EMAIL,
            city: 'Lyon',
            postal_code: '69002',
            address: '12 rue de la République',
            country: 'France',
          })
          .select('id')
          .single();
        if (companyError || !company) {
          return jsonResponse(
            { error: companyError?.message ?? 'Unable to create company' },
            500,
          );
        }
        companyId = company.id;
        await admin.from('company_members').insert({
          company_id: companyId,
          user_id: user.id,
          role: 'owner',
        });
      } else {
        companyId = rpcCompanyId as string;
      }
    }

    await admin
      .from('companies')
      .update({
        name: 'Atelier Martin',
        email: REVIEW_EMAIL,
        city: 'Lyon',
        postal_code: '69002',
        address: '12 rue de la République',
        country: 'France',
        updated_at: new Date().toISOString(),
      })
      .eq('id', companyId);

    const link = await admin.auth.admin.generateLink({
      type: 'magiclink',
      email: REVIEW_EMAIL,
    });

    if (link.error || !link.data.properties?.hashed_token) {
      // Fallback: password grant via anon after confirm
      const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
      if (!anonKey) {
        return jsonResponse({ error: 'Missing anon key' }, 500);
      }
      const anon = createClient(supabaseUrl, anonKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      });
      const signedIn = await anon.auth.signInWithPassword({
        email: REVIEW_EMAIL,
        password: REVIEW_PASSWORD,
      });
      if (signedIn.error || !signedIn.data.session) {
        return jsonResponse(
          { error: signedIn.error?.message ?? 'Unable to create session' },
          500,
        );
      }
      return jsonResponse({
        access_token: signedIn.data.session.access_token,
        refresh_token: signedIn.data.session.refresh_token,
        user_id: user.id,
        company_id: companyId,
        plan: 'max',
      });
    }

    const verified = await admin.auth.verifyOtp({
      token_hash: link.data.properties.hashed_token,
      type: 'magiclink',
    });

    if (verified.error || !verified.data.session) {
      const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
      const anon = createClient(supabaseUrl!, anonKey!, {
        auth: { autoRefreshToken: false, persistSession: false },
      });
      const signedIn = await anon.auth.signInWithPassword({
        email: REVIEW_EMAIL,
        password: REVIEW_PASSWORD,
      });
      if (signedIn.error || !signedIn.data.session) {
        return jsonResponse(
          { error: signedIn.error?.message ?? 'Unable to create session' },
          500,
        );
      }
      return jsonResponse({
        access_token: signedIn.data.session.access_token,
        refresh_token: signedIn.data.session.refresh_token,
        user_id: user.id,
        company_id: companyId,
        plan: 'max',
      });
    }

    return jsonResponse({
      access_token: verified.data.session.access_token,
      refresh_token: verified.data.session.refresh_token,
      user_id: user.id,
      company_id: companyId,
      plan: 'max',
    });
  } catch (error) {
    return jsonResponse(
      { error: error instanceof Error ? error.message : 'Unexpected error' },
      500,
    );
  }
});
