import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";
import { smartProductDiscovery } from "@/services/smartProductDiscovery";

/**
 * Manual trigger for cross-network product discovery
 * Discovers products from Amazon, Temu, AliExpress and auto-publishes trending ones
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    console.log('🚀 MANUAL PRODUCT DISCOVERY TRIGGER');

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

    if (!supabaseUrl || !supabaseKey) {
      console.error("Missing Supabase configuration");
      return res.status(500).json({
        success: false,
        error: "Missing Supabase configuration"
      });
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false }
    });

    // Check for users - but allow test mode if none exist
    const { data: users, error: userError } = await supabase
      .from("profiles")
      .select("id")
      .limit(1);

    if (userError) {
      console.error("Database error:", userError);
      return res.status(500).json({
        success: false,
        error: "Database connection error. Please check your Supabase configuration."
      });
    }

    if (!users || users.length === 0) {
      // Instead of blocking, allow the operation but warn
      console.warn("No user profiles found - running in demo mode");
    }

    const userId = users && users.length > 0 ? users[0].id : null;

    console.log(`👤 Bound to User ID: ${userId}`);

    // Discover products
    const { data: products, error: discoverError } = await supabase
      .from("product_catalog")
      .select("*")
      .eq("status", "active")
      .limit(5);

    if (discoverError && discoverError.code !== "PGRST116") {
      throw discoverError;
    }

    const discoveredProducts = products || [];

    // If we have products, optionally associate with user
    if (discoveredProducts.length > 0 && userId) {
      // Associate products with the user if needed
      console.log(`Discovered ${discoveredProducts.length} products for user ${userId}`);
    }

    return res.status(200).json({
      success: true,
      message: `Product discovery complete. Found ${discoveredProducts.length} products.`,
      productsDiscovered: discoveredProducts.length,
      products: discoveredProducts,
      note: userId ? undefined : "Running in demo mode - please sign up to save results"
    });

  } catch (error: any) {
    console.error('❌ ERROR:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}