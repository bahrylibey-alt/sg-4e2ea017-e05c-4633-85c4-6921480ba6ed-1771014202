import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/integrations/supabase/client';
import { smartProductDiscovery } from '@/services/smartProductDiscovery';

/**
 * MANUAL SYNC ENDPOINT
 * Manually trigger product discovery and sync
 * Use this to test the system
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    console.log('🔄 MANUAL SYNC: Starting product discovery...');

    // Get user from authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Authorization required' });
    }

    // Extract token from Bearer header
    const token = authHeader.replace('Bearer ', '');
    
    // Verify user session
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    console.log(`📊 Running discovery for user: ${user.id}`);

    // Run product discovery
    const result = await smartProductDiscovery.discoverProducts(user.id, 50);

    console.log(`✅ MANUAL SYNC: Complete`);
    console.log(`📦 ${result.discovered} products discovered`);
    console.log(`🔌 Networks: ${result.networks.join(', ')}`);

    return res.status(200).json({
      success: true,
      discovered: result.discovered,
      networks: result.networks,
      products: result.products,
      message: `Successfully discovered ${result.discovered} products from ${result.networks.length} networks`
    });

  } catch (error: any) {
    console.error('❌ MANUAL SYNC: Failed:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}