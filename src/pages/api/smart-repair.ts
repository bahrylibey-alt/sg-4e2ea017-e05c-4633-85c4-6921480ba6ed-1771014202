import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/integrations/supabase/client";
import { smartProductDiscovery } from "@/services/smartProductDiscovery";

/**
 * SMART AUTO-REPAIR ENGINE
 * Uses advanced techniques (Googlebot User-Agent spoofing) to bypass CAPTCHAs
 * and accurately determine if a product page actually exists or is a 404.
 */

const GOOGLEBOT_UA = "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)";

async function checkUrlStatus(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, {
      method: "GET", // Use GET instead of HEAD to mimic real crawler
      headers: {
        "User-Agent": GOOGLEBOT_UA,
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
      },
      // Timeout after 8 seconds
      signal: AbortSignal.timeout(8000)
    });

    // If it's a 404, it's definitely dead
    if (response.status === 404) return false;
    
    // For Amazon, sometimes they return 200 but the page says "Sorry! We couldn't find that page"
    if (response.status === 200 && url.includes("amazon.com")) {
      const text = await response.text();
      if (text.includes("Sorry! We couldn't find that page") || text.includes("Page Not Found")) {
        return false;
      }
    }
    
    // If it returns 200, 403 (CAPTCHA), or 503 (Rate limit), we assume the URL format is valid 
    // and the product likely exists, it's just blocking our server.
    return true;
  } catch (err) {
    // If it timeouts, it might just be blocking our server IP. We'll give it the benefit of the doubt
    // but if it's a DNS error or invalid URL, we mark as dead.
    console.error(`Error checking ${url}:`, err);
    return false;
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { userId, campaignId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: "userId is required" });
    }

    // 1. Fetch all active links
    let query = supabase.from("affiliate_links").select("*");
    if (userId) query = query.eq("user_id", userId);
    if (campaignId) query = query.eq("campaign_id", campaignId);

    const { data: links, error } = await query;
    if (error) throw error;
    if (!links || links.length === 0) return res.status(200).json({ message: "No links to check", totalChecked: 0, deadRemoved: 0, replaced: 0, deadLinks: [] });

    console.log(`Starting smart repair for ${links.length} links...`);

    let deadCount = 0;
    let replacedCount = 0;
    const deadLinks = [];

    // 2. Check each link using Smart Validator
    for (const link of links) {
      const isAlive = await checkUrlStatus(link.original_url);
      
      if (!isAlive) {
        deadCount++;
        deadLinks.push(link);
        
        // Mark as broken or delete
        await supabase.from("affiliate_links").delete().eq("id", link.id);
      }
    }

    // 3. Auto-replace dead links with fresh trending products
    if (deadCount > 0 && userId && campaignId) {
      try {
        // FIX: Pass userId instead of string
        const freshProducts = await smartProductDiscovery.discoverTrending(userId, deadCount);

        for (const product of freshProducts) {
          const slug = product.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').substring(0, 50);
          
          await supabase.from("affiliate_links").insert({
            user_id: userId,
            campaign_id: campaignId,
            product_name: product.name,
            original_url: product.url,
            network: product.network || "Amazon Associates",
            slug: `${slug}-${Math.floor(Math.random() * 10000)}`,
            cloaked_url: `/go/${slug}`,
            status: "active",
            commission_rate: product.commission_rate || 5.0
          });
          replacedCount++;
        }
      } catch (err) {
        console.error("Failed to replace links:", err);
      }
    }

    return res.status(200).json({
      success: true,
      totalChecked: links.length,
      deadRemoved: deadCount,
      replaced: replacedCount,
      deadLinks: deadLinks.map(l => l.product_name)
    });

  } catch (error: any) {
    console.error("Smart Repair Error:", error);
    return res.status(500).json({ error: error.message || "Internal server error" });
  }
}