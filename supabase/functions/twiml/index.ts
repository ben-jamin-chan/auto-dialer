import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { VoiceResponse } from 'twilio';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const twiml = new VoiceResponse();
  twiml.say({
    voice: 'alice',
    language: 'en-US',
  }, 'This is an automated call. The call will end automatically when completed.');

  return new Response(twiml.toString(), {
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/xml',
    },
  });
});