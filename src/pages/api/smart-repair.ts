import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/integrations/supabase/client";

/**
 * SMART REPAIR API - Auto-fixes broken affiliate links
 * 
 * How it works:
 * 1. Checks all affiliate links in database
 * 2. Validates format (no HTTP requests = no CAPTCHA issues)
 * 3. Removes duplicates and invalid links
 * 4. Replaces broken links with fresh trending products
 */

// URL validation functions (format-based, no HTTP requests)
function validateTemuUrl(url: string): boolean {
  // Temu URL must contain goods_id or valid product path
  return url.includes('temu.com') && (
    url.includes('goods_id=') || 
    url.match(/\/[a-z0-9-]+-g-\d+\.html/) !== null
  );
}

function validateAmazonUrl(url: string): boolean {
  // Amazon URL must contain valid ASIN
  const asinMatch = url.match(/\/dp\/([A-Z0-9]{10})/);
  return url.includes('amazon.com') && asinMatch !== null;
}

function validateAliExpressUrl(url: string): boolean {
  // AliExpress URL must contain item ID
  return url.includes('aliexpress.com') && url.match(/\/item\/\d+\.html/) !== null;
}

function validateUrl(url: string, network: string): boolean {
  if (network.includes('Temu')) return validateTemuUrl(url);
  if (network.includes('Amazon')) return validateAmazonUrl(url);
  if (network.includes('AliExpress')) return validateAliExpressUrl(url);
  return false;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { userId, campaignId } = req.body;

    // 1. Fetch all active links
    let query = supabase.from("affiliate_links").select("*").eq("status", "active");
    if (userId) query = query.eq("user_id", userId);
    if (campaignId) query = query.eq("campaign_id", campaignId);

    const { data: links, error: fetchError } = await query;
    
    if (fetchError) {
      console.error("Fetch error:", fetchError);
      return res.status(500).json({ error: fetchError.message });
    }

    if (!links || links.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No links to check",
        totalChecked: 0,
        invalidRemoved: 0,
        duplicatesRemoved: 0,
        replaced: 0
      });
    }

    console.log(`🔍 Checking ${links.length} links...`);

    let invalidCount = 0;
    let duplicateCount = 0;
    const seenProducts = new Set();
    const linksToRemove: string[] = [];

    // 2. Validate each link (format-based)
    for (const link of links) {
      // Check for duplicates
      if (seenProducts.has(link.product_name)) {
        duplicateCount++;
        linksToRemove.push(link.id);
        console.log(`❌ Duplicate: ${link.product_name}`);
        continue;
      }
      seenProducts.add(link.product_name);

      // Validate URL format
      const isValid = validateUrl(link.original_url, link.network);
      if (!isValid) {
        invalidCount++;
        linksToRemove.push(link.id);
        console.log(`❌ Invalid: ${link.product_name} (${link.network})`);
      }
    }

    // 3. Remove invalid and duplicate links
    if (linksToRemove.length > 0) {
      const { error: deleteError } = await supabase
        .from("affiliate_links")
        .delete()
        .in("id", linksToRemove);

      if (deleteError) {
        console.error("Delete error:", deleteError);
      } else {
        console.log(`🗑️  Removed ${linksToRemove.length} broken links`);
      }
    }

    // 4. Auto-replace with fresh products
    let replacedCount = 0;
    if (linksToRemove.length > 0 && userId && campaignId) {
      const { data: freshProducts, error: productsError } = await supabase
        .from("product_catalog")
        .select("*")
        .eq("status", "active")
        .limit(linksToRemove.length);

      if (!productsError && freshProducts && freshProducts.length > 0) {
        const newLinks = freshProducts.map(product => {
          const slug = `${product.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now()}-${Math.floor(Math.random() * 1000)}`.substring(0, 60);
          return {
            user_id: userId,
            campaign_id: campaignId,
            product_name: product.name,
            original_url: product.affiliate_url,
            network: product.network,
            slug: slug,
            cloaked_url: `/go/${slug}`,
            status: 'active',
            commission_rate: product.commission_rate,
            is_working: true
          };
        });

        const { error: insertError } = await supabase
          .from("affiliate_links")
          .insert(newLinks);

        if (!insertError) {
          replacedCount = newLinks.length;
          console.log(`✅ Replaced ${replacedCount} links with fresh products`);
        } else {
          console.error("Insert error:", insertError);
        }
      }
    }

    return res.status(200).json({
      success: true,
      totalChecked: links.length,
      invalidRemoved: invalidCount,
      duplicatesRemoved: duplicateCount,
      replaced: replacedCount
    });

  } catch (error: any) {
    console.error("Smart repair error:", error);
    return res.status(500).json({
      error: error.message || "Internal server error",
      success: false,
      totalChecked: 0,
      invalidRemoved: 0,
      duplicatesRemoved: 0,
      replaced: 0
    });
  }
}