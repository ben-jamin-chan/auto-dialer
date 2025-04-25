import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
    <Response>
      <Say>This is an automated call. The call will end in 30 seconds.</Say>
      <Pause length="25"/>
      <Say>Call ending now. Goodbye.</Say>
    </Response>`;

  return new Response(twiml, {
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/xml',
    },
  });
});