import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

/**
 * REAL AMAZON LINK VALIDATOR
 * Tests if Amazon product page actually exists (detects 404s)
 */

serve(async (req) => {
  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { url } = await req.json()

    if (!url) {
      return new Response(
        JSON.stringify({ error: 'URL is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validate it's an Amazon URL
    if (!url.includes('amazon.com')) {
      return new Response(
        JSON.stringify({ valid: false, reason: 'Not an Amazon URL' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Make HEAD request to Amazon to check if page exists
    const response = await fetch(url, {
      method: 'HEAD',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    })

    // Check response
    const valid = response.status === 200
    const reason = response.status === 404 
      ? 'Product not found (404)' 
      : response.status === 503
      ? 'Amazon temporarily unavailable'
      : response.status !== 200
      ? `HTTP ${response.status}`
      : null

    return new Response(
      JSON.stringify({ 
        valid,
        reason,
        status: response.status,
        checked_at: new Date().toISOString()
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Error checking link:', error)
    return new Response(
      JSON.stringify({ 
        valid: false, 
        reason: 'Network error',
        error: error.message 
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})