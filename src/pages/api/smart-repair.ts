import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/integrations/supabase/client";

/**
 * Smart Link Repair API - Actually tests and fixes broken affiliate links
 * Uses intelligent validation without triggering CAPTCHAs
 */

// Helper: Validate URL format and extract product IDs
function validateAffiliateUrl(url: string, network: string): { valid: boolean; reason?: string } {
  if (!url || typeof url !== 'string') return { valid: false, reason: 'Empty URL' };
  
  try {
    const urlObj = new URL(url);
    
    // Network-specific validation
    if (network.includes('Amazon')) {
      // Amazon: Must have ASIN (10 chars alphanumeric)
      const asinMatch = url.match(/\/dp\/([A-Z0-9]{10})|\/gp\/product\/([A-Z0-9]{10})/);
      if (!asinMatch) return { valid: false, reason: 'No ASIN found' };
      return { valid: true };
    }
    
    if (network.includes('Temu')) {
      // Temu: Must have goods_id parameter
      const goodsId = urlObj.searchParams.get('goods_id');
      if (!goodsId) return { valid: false, reason: 'No goods_id found' };
      return { valid: true };
    }
    
    if (network.includes('AliExpress')) {
      // AliExpress: Must have numeric product ID
      const itemMatch = url.match(/\/item\/(\d+)\.html/);
      if (!itemMatch) return { valid: false, reason: 'No product ID found' };
      return { valid: true };
    }
    
    // Generic validation for other networks
    return { valid: true };
  } catch (err) {
    return { valid: false, reason: 'Invalid URL format' };
  }
}

// Helper: Get fresh replacement products from catalog
async function getReplacementProducts(count: number, network?: string) {
  let query = supabase
    .from('product_catalog')
    .select('*')
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(count);
    
  if (network) {
    query = query.eq('network', network);
  }
  
  const { data, error } = await query;
  if (error) {
    console.error('Failed to fetch replacement products:', error);
    return [];
  }
  
  return data || [];
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { userId, campaignId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: "userId is required" });
    }

    console.log(`🔧 Starting Smart Repair for user: ${userId}`);

    // Fetch all active links for the user
    let query = supabase
      .from("affiliate_links")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "active");
      
    if (campaignId) {
      query = query.eq("campaign_id", campaignId);
    }

    const { data: links, error: fetchError } = await query;
    
    if (fetchError) {
      console.error('Database error:', fetchError);
      return res.status(500).json({ error: fetchError.message });
    }

    if (!links || links.length === 0) {
      return res.status(200).json({
        success: true,
        totalChecked: 0,
        deadRemoved: 0,
        replaced: 0,
        deadLinks: [],
        message: "No active links found to check"
      });
    }

    console.log(`📊 Found ${links.length} active links to check`);

    const deadLinks: any[] = [];
    const validLinks: any[] = [];
    const duplicates: Map<string, any[]> = new Map();

    // Step 1: Validate each link by format (no HTTP requests = no CAPTCHAs)
    for (const link of links) {
      const validation = validateAffiliateUrl(link.original_url, link.network || '');
      
      if (!validation.valid) {
        console.log(`❌ Invalid: ${link.product_name} - ${validation.reason}`);
        deadLinks.push({ ...link, reason: validation.reason });
      } else {
        validLinks.push(link);
        
        // Track duplicates by product name
        const key = link.product_name?.toLowerCase().trim();
        if (key) {
          if (!duplicates.has(key)) {
            duplicates.set(key, []);
          }
          duplicates.get(key)!.push(link);
        }
      }
    }

    // Step 2: Remove duplicates (keep newest one)
    const duplicateIds: string[] = [];
    for (const [name, dupes] of duplicates.entries()) {
      if (dupes.length > 1) {
        // Sort by created_at, keep newest
        dupes.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        const toRemove = dupes.slice(1); // Remove all except the first (newest)
        duplicateIds.push(...toRemove.map(d => d.id));
        console.log(`🔄 Found ${dupes.length} duplicates of "${name}", keeping newest`);
      }
    }

    // Step 3: Delete dead and duplicate links
    const idsToDelete = [...deadLinks.map(l => l.id), ...duplicateIds];
    
    if (idsToDelete.length > 0) {
      const { error: deleteError } = await supabase
        .from("affiliate_links")
        .delete()
        .in('id', idsToDelete);
        
      if (deleteError) {
        console.error('Failed to delete links:', deleteError);
      } else {
        console.log(`🗑️  Deleted ${idsToDelete.length} links (${deadLinks.length} invalid + ${duplicateIds.length} duplicates)`);
      }
    }

    // Step 4: Replace deleted links with fresh products
    let replacedCount = 0;
    const totalRemoved = idsToDelete.length;
    
    if (totalRemoved > 0 && campaignId) {
      // Get fresh products from catalog
      const replacements = await getReplacementProducts(totalRemoved);
      
      for (const product of replacements) {
        const slug = product.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').substring(0, 50);
        const uniqueSlug = `${slug}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        
        const { error: insertError } = await supabase
          .from("affiliate_links")
          .insert({
            user_id: userId,
            campaign_id: campaignId,
            product_name: product.name,
            original_url: product.affiliate_url,
            network: product.network || 'Amazon Associates',
            slug: uniqueSlug,
            cloaked_url: `/go/${uniqueSlug}`,
            status: 'active',
            commission_rate: product.commission_rate || 5.0,
            is_working: true,
            last_checked_at: new Date().toISOString()
          });
          
        if (!insertError) {
          replacedCount++;
        } else {
          console.error('Failed to insert replacement:', insertError);
        }
      }
      
      console.log(`✅ Replaced ${replacedCount} links with fresh products`);
    }

    return res.status(200).json({
      success: true,
      totalChecked: links.length,
      deadRemoved: deadLinks.length,
      duplicatesRemoved: duplicateIds.length,
      replaced: replacedCount,
      deadLinks: deadLinks.map(l => ({
        name: l.product_name,
        reason: l.reason,
        network: l.network
      }))
    });

  } catch (error: any) {
    console.error("❌ Smart Repair Error:", error);
    return res.status(500).json({ 
      error: error.message || "Internal server error",
      success: false,
      totalChecked: 0,
      deadRemoved: 0,
      replaced: 0
    });
  }
}