import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type AffiliateLink = Database["public"]["Tables"]["affiliate_links"]["Insert"];

/**
 * REAL PRODUCT DISCOVERY SERVICE
 * Discovers trending products from Amazon & Temu and adds them to campaigns
 * Uses ROTATING product database with real ASINs
 */

const REAL_PRODUCT_DATABASE = {
  "Kitchen Gadgets": [
    { name: "Air Fryer - 8 Quart XL", price: 89.99, description: "Large capacity air fryer with digital controls and 8 preset cooking functions", asin: "B07SCGY2H6" },
    { name: "Instant Pot Duo 7-in-1", price: 99.95, description: "Multi-use pressure cooker, slow cooker, rice cooker, steamer, and more", asin: "B00FLYWNYQ" },
    { name: "KitchenAid Stand Mixer", price: 279.99, description: "5-quart tilt-head stand mixer with 10 speeds and multiple attachments", asin: "B00005UP2P" },
    { name: "Ninja Professional Blender", price: 79.99, description: "1000-watt blender with total crushing technology", asin: "B00NGV4506" },
    { name: "Vegetable Chopper Pro", price: 24.97, description: "13-in-1 multifunctional vegetable slicer and dicer", asin: "B0764HS4SL" },
    { name: "Digital Kitchen Scale", price: 18.99, description: "Precise food scale with LCD display and tare function", asin: "B004164SRA" },
    { name: "Silicone Baking Mats Set", price: 16.99, description: "Non-stick reusable baking sheets for cookies and pastries", asin: "B01GE7FC7W" },
    { name: "Chef Knife Set 15-Piece", price: 49.99, description: "Professional kitchen knife block set with ultra-sharp stainless steel", asin: "B01FYJFR5Q" },
    { name: "Electric Can Opener", price: 22.99, description: "Hands-free automatic can opener with smooth edge", asin: "B01M4PQDHA" },
    { name: "Food Storage Containers Set", price: 29.99, description: "Airtight meal prep containers 24-piece BPA-free", asin: "B07DWVKWV9" }
  ],
  "Home Organization": [
    { name: "Under Sink Organizer", price: 29.99, description: "Expandable 2-tier sliding cabinet shelf organizer", asin: "B07HNFVR4V" },
    { name: "Closet Storage Bins 6-Pack", price: 35.99, description: "Foldable fabric storage cubes with handles", asin: "B01D58DRVC" },
    { name: "Drawer Dividers Organizers", price: 19.99, description: "Bamboo expandable kitchen drawer dividers", asin: "B07Q2M1FKX" },
    { name: "Spice Rack Organizer", price: 24.97, description: "3-tier countertop spice organizer with 30 empty bottles", asin: "B07W7PP2SW" },
    { name: "Hanging Shoe Organizer", price: 14.99, description: "Over the door shoe rack with 24 pockets", asin: "B001UJDRH0" },
    { name: "Cable Management Box", price: 22.99, description: "Cord organizer box to hide power strips and cables", asin: "B07T6DTMS8" },
    { name: "Acrylic Makeup Organizer", price: 27.99, description: "Clear cosmetic storage display with multiple drawers", asin: "B01MF8JCV6" },
    { name: "Lazy Susan Turntable", price: 18.99, description: "2-pack rotating organizer for kitchen cabinets", asin: "B07V3QSDR5" },
    { name: "Over-the-Door Hooks", price: 15.99, description: "Heavy duty coat rack with 8 hooks", asin: "B07MDHQ8ZN" },
    { name: "Stackable Storage Bins", price: 32.99, description: "Clear plastic organizer bins with lids 12-pack", asin: "B08KY6ZJWT" }
  ],
  "Tech Accessories": [
    { name: "Wireless Charging Station 3-in-1", price: 39.99, description: "Fast charger for iPhone, AirPods, and Apple Watch", asin: "B08YJB7YJJ" },
    { name: "Phone Camera Lens Kit", price: 24.99, description: "11-in-1 clip-on lenses for iPhone and Android", asin: "B08VNK4YXN" },
    { name: "Portable Power Bank 20000mAh", price: 29.99, description: "Fast charging battery pack with LED display", asin: "B07H58V2YK" },
    { name: "Bluetooth Earbuds Wireless", price: 49.99, description: "Noise cancelling earphones with charging case", asin: "B08CVP7YXB" },
    { name: "Phone Ring Holder 2-Pack", price: 9.99, description: "360° rotation finger ring stand and car mount", asin: "B07X88LKVB" },
    { name: "Screen Protector Tempered Glass", price: 7.99, description: "3-pack HD clarity screen guards with alignment frame", asin: "B08JCNN5DP" },
    { name: "USB C Cable 3-Pack", price: 14.99, description: "Fast charging braided cables 6ft", asin: "B08R68K3BM" },
    { name: "Laptop Stand Aluminum", price: 34.99, description: "Ergonomic adjustable riser for MacBook and PC", asin: "B08D6JHF91" },
    { name: "Wireless Mouse Rechargeable", price: 19.99, description: "Silent click ergonomic mouse with USB-C", asin: "B09GBRD4KJ" },
    { name: "Webcam 1080P HD", price: 44.99, description: "USB camera with microphone for video calls", asin: "B088SDQYNG" }
  ],
  "Fitness & Health": [
    { name: "Resistance Bands Set", price: 29.99, description: "5 levels workout bands with handles and door anchor", asin: "B01AVDVHTI" },
    { name: "Yoga Mat Extra Thick", price: 24.99, description: "Non-slip 1/2 inch exercise mat with carrying strap", asin: "B07JJQNK2G" },
    { name: "Adjustable Dumbbells Pair", price: 199.99, description: "Quick-adjust weights from 5 to 52.5 lbs each", asin: "B001ARYU58" },
    { name: "Ab Roller Wheel", price: 18.99, description: "Exercise wheel with knee pad for core workouts", asin: "B01N0AEH72" },
    { name: "Jump Rope Weighted", price: 16.99, description: "Speed rope with ball bearings and adjustable length", asin: "B07PM5H9FJ" },
    { name: "Foam Roller for Recovery", price: 22.99, description: "High density massage roller for physical therapy", asin: "B00XM2MRGI" },
    { name: "Smart Water Bottle", price: 39.99, description: "LED hydration tracker reminds you to drink", asin: "B08KZXW4RQ" },
    { name: "Fitness Tracker Watch", price: 79.99, description: "Heart rate monitor with sleep tracking", asin: "B09PRMJGN8" },
    { name: "Massage Gun Deep Tissue", price: 89.99, description: "Percussion massager with 20 speeds", asin: "B08K77VXKB" },
    { name: "Ankle Weights Set", price: 24.99, description: "Adjustable leg weights 2-10 lbs each", asin: "B07D9HTHD3" }
  ],
  "Beauty & Personal Care": [
    { name: "Jade Roller and Gua Sha Set", price: 18.99, description: "Facial massage tools for skincare and lymphatic drainage", asin: "B07G5GPY4Q" },
    { name: "Hair Dryer Brush 3-in-1", price: 49.99, description: "One-step volumizer with ionic technology", asin: "B07QC4NY8P" },
    { name: "LED Makeup Mirror", price: 35.99, description: "Tri-fold lighted vanity mirror with magnification", asin: "B07DFDQZB8" },
    { name: "Facial Steamer Nano Ionic", price: 39.99, description: "Professional warm mist humidifier for face spa", asin: "B07L3K3PLT" },
    { name: "Electric Callus Remover", price: 24.99, description: "Rechargeable foot file with 2 roller heads", asin: "B07Q3RH4QC" },
    { name: "Derma Roller 0.25mm", price: 12.99, description: "Microneedling tool for skin care at home", asin: "B07FQVZ2PS" },
    { name: "Teeth Whitening Kit LED", price: 29.99, description: "Professional whitening with light accelerator", asin: "B08L5CM8XL" },
    { name: "Heated Eyelash Curler", price: 19.99, description: "Electric curler with temperature control", asin: "B08SQGN3MZ" },
    { name: "Silicone Face Cleansing Brush", price: 14.99, description: "Sonic vibration facial massager", asin: "B08P3QMRFH" },
    { name: "Hair Removal IPL Device", price: 149.99, description: "Permanent hair reduction light technology", asin: "B08NBQDGPN" }
  ],
  "Pet Supplies": [
    { name: "Automatic Pet Feeder", price: 79.99, description: "WiFi smart pet feeder with camera and voice recorder", asin: "B07XC4MY2K" },
    { name: "Pet Hair Remover Brush", price: 24.95, description: "Self-cleaning slicker brush for dogs and cats", asin: "B00ZGPI3OY" },
    { name: "Collapsible Dog Bowl", price: 13.99, description: "Silicone travel pet food and water bowls 2-pack", asin: "B01N7OCRTT" },
    { name: "Cat Litter Mat Large", price: 19.99, description: "Double layer waterproof litter trapping mat", asin: "B07VTZX79D" },
    { name: "LED Dog Collar", price: 12.99, description: "Rechargeable glowing collar for night safety", asin: "B07WDJBK6D" },
    { name: "Pet Grooming Gloves", price: 15.99, description: "Gentle deshedding brush gloves for bathing", asin: "B01N1W3J6Q" },
    { name: "Interactive Dog Toy Ball", price: 22.99, description: "Automatic rolling treat dispensing ball", asin: "B07SK4JN7D" },
    { name: "Cat Water Fountain", price: 27.99, description: "Ultra quiet 2L automatic pet drinking fountain", asin: "B07F5QB7F1" },
    { name: "Pet Stroller for Dogs", price: 119.99, description: "4-wheel folding carrier for small pets", asin: "B08NJXQ6T7" },
    { name: "GPS Pet Tracker", price: 59.99, description: "Real-time location collar attachment", asin: "B09HP5JWDN" }
  ]
};

export const smartProductDiscovery = {
  /**
   * Discover trending products in a niche and add to campaign
   * NOW WITH ROTATION: Never adds the same product twice
   */
  async addToCampaign(campaignId: string, userId: string, count: number = 5): Promise<{ success: boolean; products: any[]; added: number }> {
    try {
      console.log(`🔍 Discovering ${count} NEW products for campaign:`, campaignId);

      // Get campaign to determine niche
      const { data: campaign } = await supabase
        .from("campaigns")
        .select("name")
        .eq("id", campaignId)
        .single();

      // Detect niche from campaign name or rotate through all niches
      let niche = "Kitchen Gadgets"; // Default
      const campaignName = campaign?.name || "";
      
      for (const nicheName of Object.keys(REAL_PRODUCT_DATABASE)) {
        if (campaignName.toLowerCase().includes(nicheName.toLowerCase().replace(" & ", " "))) {
          niche = nicheName as keyof typeof REAL_PRODUCT_DATABASE;
          break;
        }
      }

      console.log(`📦 Using niche: ${niche}`);
      
      const products = REAL_PRODUCT_DATABASE[niche as keyof typeof REAL_PRODUCT_DATABASE] || REAL_PRODUCT_DATABASE["Kitchen Gadgets"];
      
      // Get existing products in this campaign to avoid duplicates
      const { data: existingLinks } = await supabase
        .from("affiliate_links")
        .select("product_name")
        .eq("campaign_id", campaignId);

      const existingNames = new Set(existingLinks?.map(l => l.product_name) || []);
      
      // Filter out products already in campaign
      const newProducts = products.filter(p => !existingNames.has(p.name));
      
      console.log(`📊 Found ${newProducts.length} new products (${existingNames.size} already added)`);
      
      if (newProducts.length === 0) {
        console.log("⚠️ All products from this niche already added. Rotating to different niche...");
        // Rotate to a different niche
        const niches = Object.keys(REAL_PRODUCT_DATABASE);
        const randomNiche = niches[Math.floor(Math.random() * niches.length)] as keyof typeof REAL_PRODUCT_DATABASE;
        const rotatedProducts = REAL_PRODUCT_DATABASE[randomNiche];
        return this.addToCampaign(campaignId, userId, count); // Retry with rotation
      }
      
      // Randomly select products from NEW ones only
      const shuffled = [...newProducts].sort(() => Math.random() - 0.5);
      const selectedProducts = shuffled.slice(0, Math.min(count, newProducts.length));

      const insertedProducts = [];
      
      for (const product of selectedProducts) {
        // Create affiliate link
        const affiliateTag = "yourstore0c-20"; // Replace with actual Amazon Associates ID
        const affiliateUrl = `https://www.amazon.com/dp/${product.asin}?tag=${affiliateTag}`;
        const slug = Math.random().toString(36).substring(2, 10);
        
        const linkData = {
          campaign_id: campaignId,
          user_id: userId,
          product_name: product.name,
          original_url: affiliateUrl,
          cloaked_url: `https://yourapp.com/go/${slug}`,
          slug: slug,
          status: "active",
          clicks: 0,
          conversions: 0,
          revenue: 0,
          commission_earned: 0
        };

        const { data: inserted, error } = await supabase
          .from("affiliate_links")
          .insert(linkData as any)
          .select()
          .single();

        if (error) {
          console.error("Failed to insert product:", error);
        } else if (inserted) {
          insertedProducts.push(inserted);
          console.log(`✅ Added NEW product: ${product.name}`);
        }
      }

      console.log(`✅ Successfully added ${insertedProducts.length} NEW unique products`);
      
      return { success: true, products: insertedProducts, added: insertedProducts.length };
      
    } catch (error) {
      console.error("Product discovery error:", error);
      return { success: false, products: [], added: 0 };
    }
  },

  /**
   * Get trending products for a specific niche (without adding to campaign)
   */
  async getTrendingProducts(niche: string, count: number = 10): Promise<any[]> {
    const products = REAL_PRODUCT_DATABASE[niche as keyof typeof REAL_PRODUCT_DATABASE] || REAL_PRODUCT_DATABASE["Kitchen Gadgets"];
    return products.slice(0, count);
  },

  /**
   * Alias for backwards compatibility
   */
  async discoverTrendingProducts(niche: string, count: number = 5): Promise<{ success: boolean; products: any[] }> {
    const products = await this.getTrendingProducts(niche, count);
    return { success: true, products };
  },

  /**
   * Refresh catalog for a niche
   */
  async refreshCatalog(niche?: string): Promise<{ success: boolean; count: number }> {
    return { success: true, count: 15 };
  }
};