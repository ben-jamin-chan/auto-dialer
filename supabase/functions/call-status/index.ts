import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.4.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  // Handle preflight CORS request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Parse the form data sent by Twilio
    const formData = await req.formData();
    const callSid = formData.get('CallSid');
    const callStatus = formData.get('CallStatus');
    const to = formData.get('To');
    const from = formData.get('From');
    const duration = formData.get('CallDuration');
    const userId = formData.get('UserId') || 'unknown';

    console.log(`Call status update: ${callSid} - ${callStatus}`);
    console.log(`From: ${from} To: ${to} Duration: ${duration}s`);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase environment variables');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Store the call status update in the database
    const { error } = await supabase
      .from('call_logs')
      .upsert(
        {
          call_sid: callSid,
          user_id: userId,
          to_number: to,
          from_number: from,
          status: callStatus,
          duration: duration ? parseInt(duration.toString()) : null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'call_sid' }
      );

    if (error) {
      console.error('Error storing call status:', error);
      throw error;
    }

    // Return a success response
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Call status update received',
        callSid,
        callStatus,
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error processing call status update:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Failed to process call status update',
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
        status: 500,
      }
    );
  }
});