
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.4.0"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Get the request body
    const { p_id, p_email, p_name, p_role, p_status } = await req.json()
    
    if (!p_id || !p_email) {
      return new Response(
        JSON.stringify({ error: "p_id and p_email are required" }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }
    
    // Create a Supabase client with the Auth context of the logged in user
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: { headers: { Authorization: req.headers.get('Authorization')! } },
      }
    )
    
    // First check if user exists
    const { data: existingUser, error: fetchError } = await supabaseClient
      .from('app_users')
      .select('*')
      .eq('id', p_id)
      .single()
    
    let result;
    
    if (existingUser) {
      // Update existing user
      result = await supabaseClient
        .from('app_users')
        .update({ 
          email: p_email,
          name: p_name,
          // Don't overwrite existing role or status if user exists
          updated_at: new Date().toISOString()
        })
        .eq('id', p_id)
    } else {
      // Insert new user
      result = await supabaseClient
        .from('app_users')
        .insert({ 
          id: p_id,
          email: p_email,
          name: p_name,
          role: p_role || 'user',
          status: p_status || 'active'
        })
    }
    
    if (result.error) {
      return new Response(
        JSON.stringify({ error: result.error.message }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
