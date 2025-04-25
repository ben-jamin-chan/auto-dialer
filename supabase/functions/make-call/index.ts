import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'npm:@supabase/supabase-js@2.39.0';
import { Twilio } from 'npm:twilio@4.23.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { to, from, userId } = await req.json();

    if (!to || !from || !userId) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate phone numbers
    const toNumber = to.replace(/\D/g, '');
    const fromNumber = from.replace(/\D/g, '');
    
    if (!toNumber || !fromNumber) {
      return new Response(
        JSON.stringify({ error: 'Invalid phone number format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const client = new Twilio(
      Deno.env.get('TWILIO_ACCOUNT_SID')!,
      Deno.env.get('TWILIO_AUTH_TOKEN')!
    );

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Create a publicly accessible TwiML URL
    const twimlEndpoint = `${Deno.env.get('SUPABASE_URL')}/functions/v1/twiml`;

    // Initiate the call
    const call = await client.calls.create({
      to: toNumber,
      from: fromNumber,
      url: twimlEndpoint,
      statusCallback: `${Deno.env.get('SUPABASE_URL')}/functions/v1/call-status`,
      statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed'],
      statusCallbackMethod: 'POST',
      timeout: 30
    });

    // Record the call in the database
    await supabase
      .from('calls')
      .insert({
        call_sid: call.sid,
        to_number: toNumber,
        from_number: fromNumber,
        status: 'initiated',
        user_id: userId
      });

    return new Response(
      JSON.stringify({ success: true, callSid: call.sid }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error making call:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});