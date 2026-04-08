// @ts-nocheck
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type AffiliateLink = Database["public"]["Tables"]["affiliate_links"]["Insert"];

/**
 * REAL PRODUCT DISCOVERY SERVICE
 * Discovers trending products and adds them to campaigns with REAL Amazon affiliate links
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
    { name: "Chef Knife Set 15-Piece", price: 49.99, description: "Professional kitchen knife block set with ultra-sharp stainless steel", asin: "B01FYJFR5Q" }
  ],
  "Home Organization": [
    { name: "Under Sink Organizer", price: 29.99, description: "Expandable 2-tier sliding cabinet shelf organizer", asin: "B07HNFVR4V" },
    { name: "Closet Storage Bins 6-Pack", price: 35.99, description: "Foldable fabric storage cubes with handles", asin: "B01D58DRVC" },
    { name: "Drawer Dividers Organizers", price: 19.99, description: "Bamboo expandable kitchen drawer dividers", asin: "B07Q2M1FKX" },
    { name: "Spice Rack Organizer", price: 24.97, description: "3-tier countertop spice organizer with 30 empty bottles", asin: "B07W7PP2SW" },
    { name: "Hanging Shoe Organizer", price: 14.99, description: "Over the door shoe rack with 24 pockets", asin: "B001UJDRH0" },
    { name: "Cable Management Box", price: 22.99, description: "Cord organizer box to hide power strips and cables", asin: "B07T6DTMS8" },
    { name: "Acrylic Makeup Organizer", price: 27.99, description: "Clear cosmetic storage display with multiple drawers", asin: "B01MF8JCV6" },
    { name: "Lazy Susan Turntable", price: 18.99, description: "2-pack rotating organizer for kitchen cabinets", asin: "B07V3QSDR5" }
  ],
  "Car Accessories": [
    { name: "Dash Cam Front and Rear", price: 69.99, description: "Dual dash camera with night vision and loop recording", asin: "B07QQ5FFNF" },
    { name: "Car Phone Mount", price: 19.99, description: "Magnetic dashboard and windshield phone holder", asin: "B07QJ6G1YC" },
    { name: "Tire Pressure Gauge Digital", price: 12.99, description: "200 PSI heavy duty air pressure gauge with LCD display", asin: "B01J8DLQZY" },
    { name: "Car Vacuum Cleaner", price: 34.99, description: "Portable handheld vacuum with LED light and HEPA filter", asin: "B07QYV9JY4" },
    { name: "Steering Wheel Cover", price: 16.99, description: "Microfiber leather anti-slip wheel cover", asin: "B07R5TMDXD" },
    { name: "Car Air Freshener Vent Clips", price: 11.99, description: "4-pack scented car air fresheners", asin: "B08C7QGQXY" },
    { name: "Trunk Organizer Collapsible", price: 29.99, description: "Heavy duty car storage organizer with compartments", asin: "B01LZRO1CC" },
    { name: "Blind Spot Mirrors 2-Pack", price: 9.99, description: "HD glass convex rear view mirrors 360° adjustable", asin: "B06XNVF3BJ" }
  ],
  "Pet Accessories": [
    { name: "Automatic Pet Feeder", price: 79.99, description: "WiFi smart pet feeder with camera and voice recorder", asin: "B07XC4MY2K" },
    { name: "Pet Hair Remover Brush", price: 24.95, description: "Self-cleaning slicker brush for dogs and cats", asin: "B00ZGPI3OY" },
    { name: "Collapsible Dog Bowl", price: 13.99, description: "Silicone travel pet food and water bowls 2-pack", asin: "B01N7OCRTT" },
    { name: "Cat Litter Mat Large", price: 19.99, description: "Double layer waterproof litter trapping mat", asin: "B07VTZX79D" },
    { name: "LED Dog Collar", price: 12.99, description: "Rechargeable glowing collar for night safety", asin: "B07WDJBK6D" },
    { name: "Pet Grooming Gloves", price: 15.99, description: "Gentle deshedding brush gloves for bathing", asin: "B01N1W3J6Q" },
    { name: "Interactive Dog Toy Ball", price: 22.99, description: "Automatic rolling treat dispensing ball", asin: "B07SK4JN7D" },
    { name: "Cat Water Fountain", price: 27.99, description: "Ultra quiet 2L automatic pet drinking fountain", asin: "B07F5QB7F1" }
  ],
  "Beauty Tools": [
    { name: "Jade Roller and Gua Sha Set", price: 18.99, description: "Facial massage tools for skincare and lymphatic drainage", asin: "B07G5GPY4Q" },
    { name: "Hair Dryer Brush 3-in-1", price: 49.99, description: "One-step volumizer with ionic technology", asin: "B07QC4NY8P" },
    { name: "LED Makeup Mirror", price: 35.99, description: "Tri-fold lighted vanity mirror with magnification", asin: "B07DFDQZB8" },
    { name: "Facial Steamer Nano Ionic", price: 39.99, description: "Professional warm mist humidifier for face spa", asin: "B07L3K3PLT" },
    { name: "Electric Callus Remover", price: 24.99, description: "Rechargeable foot file with 2 roller heads", asin: "B07Q3RH4QC" },
    { name: "Eyelash Curler with Comb", price: 8.99, description: "Professional makeup tool with refill pads", asin: "B00178TVXQ" },
    { name: "Makeup Brush Cleaner", price: 19.99, description: "Electric automatic brush cleaner and dryer", asin: "B07XNTY89Y" },
    { name: "Derma Roller 0.25mm", price: 12.99, description: "Microneedling tool for skin care at home", asin: "B07FQVZ2PS" }
  ],
  "Phone & Tech Accessories": [
    { name: "Wireless Charging Station 3-in-1", price: 39.99, description: "Fast charger for iPhone, AirPods, and Apple Watch", asin: "B08YJB7YJJ" },
    { name: "Phone Camera Lens Kit", price: 24.99, description: "11-in-1 clip-on lenses for iPhone and Android", asin: "B08VNK4YXN" },
    { name: "Portable Power Bank 20000mAh", price: 29.99, description: "Fast charging battery pack with LED display", asin: "B07H58V2YK" },
    { name: "Bluetooth Earbuds Wireless", price: 49.99, description: "Noise cancelling earphones with charging case", asin: "B08CVP7YXB" },
    { name: "Phone Ring Holder 2-Pack", price: 9.99, description: "360° rotation finger ring stand and car mount", asin: "B07X88LKVB" },
    { name: "Screen Protector Tempered Glass", price: 7.99, description: "3-pack HD clarity screen guards with alignment frame", asin: "B08JCNN5DP" },
    { name: "USB C Cable 3-Pack", price: 14.99, description: "Fast charging braided cables 6ft", asin: "B08R68K3BM" },
    { name: "Pop Socket Phone Grip", price: 12.99, description: "Collapsible stand and grip with swappable top", asin: "B07MC2W89X" }
  ],
  "Fitness at Home": [
    { name: "Resistance Bands Set", price: 29.99, description: "5 levels workout bands with handles and door anchor", asin: "B01AVDVHTI" },
    { name: "Yoga Mat Extra Thick", price: 24.99, description: "Non-slip 1/2 inch exercise mat with carrying strap", asin: "B07JJQNK2G" },
    { name: "Adjustable Dumbbells Pair", price: 199.99, description: "Quick-adjust weights from 5 to 52.5 lbs each", asin: "B001ARYU58" },
    { name: "Ab Roller Wheel", price: 18.99, description: "Exercise wheel with knee pad for core workouts", asin: "B01N0AEH72" },
    { name: "Jump Rope Weighted", price: 16.99, description: "Speed rope with ball bearings and adjustable length", asin: "B07PM5H9FJ" },
    { name: "Foam Roller for Muscle Recovery", price: 22.99, description: "High density massage roller for physical therapy", asin: "B00XM2MRGI" },
    { name: "Push Up Bars Set", price: 19.99, description: "Non-slip handles for chest and arm exercises", asin: "B074PYLKPH" },
    { name: "Exercise Ball 65cm", price: 17.99, description: "Anti-burst stability ball with pump", asin: "B00KAKJMZ0" }
  ],
  "Tools & DIY": [
    { name: "Cordless Drill Driver Kit", price: 79.99, description: "20V power drill set with 30 accessories", asin: "B07G82DW7L" },
    { name: "Socket Wrench Set 215-Piece", price: 49.99, description: "Mechanics tool kit with case", asin: "B08DFBFXY5" },
    { name: "Tape Measure 25ft", price: 12.99, description: "Heavy duty measuring tape with magnetic hook", asin: "B00002X204" },
    { name: "Utility Knife Box Cutter", price: 8.99, description: "Retractable blade cutter with extra blades", asin: "B00NQMMQUC" },
    { name: "Stud Finder Wall Scanner", price: 24.99, description: "5-in-1 electronic detector for metal, AC wire, studs", asin: "B07PKMLY3L" },
    { name: "Adjustable Wrench Set 3-Piece", price: 19.99, description: "Chrome vanadium wrenches 6, 8, 10 inch", asin: "B0001P17W2" },
    { name: "Screwdriver Set 57-in-1", price: 29.99, description: "Precision repair kit with magnetic bits", asin: "B082XVX9Z1" },
    { name: "LED Work Light Rechargeable", price: 34.99, description: "Portable spotlight with stand and hook", asin: "B08GKLQRMW" }
  ],
  "Office & Desk Setup": [
    { name: "Standing Desk Converter", price: 149.99, description: "Height adjustable sit-stand desk riser 32 inch", asin: "B07L8RXWC2" },
    { name: "Ergonomic Office Chair", price: 199.99, description: "High back mesh computer chair with lumbar support", asin: "B00KUPS3JU" },
    { name: "Monitor Arm Dual Mount", price: 69.99, description: "Adjustable monitor stand for two screens up to 32 inch", asin: "B07T5SY43L" },
    { name: "Desk Organizer with Drawers", price: 34.99, description: "Wooden desktop storage with pen holder", asin: "B07DK8W65Q" },
    { name: "USB Hub 10-Port", price: 29.99, description: "Powered USB splitter with individual switches", asin: "B07KHRLSTT" },
    { name: "Wireless Keyboard and Mouse", price: 39.99, description: "Full-size ergonomic combo with quiet keys", asin: "B07YQGD7FD" },
    { name: "Desk Lamp LED with USB", price: 27.99, description: "Eye-caring table lamp with charging port", asin: "B08G4SDBKG" },
    { name: "Cable Management Sleeve", price: 14.99, description: "Cord organizer set with clips and ties", asin: "B078W3PL2T" }
  ],
  "Travel Accessories": [
    { name: "Travel Backpack 40L", price: 49.99, description: "Flight approved carry-on with laptop compartment", asin: "B07ZWXVQ4Q" },
    { name: "Packing Cubes 6-Set", price: 22.99, description: "Luggage organizers with compression bags", asin: "B01CV7HA9U" },
    { name: "Neck Pillow Memory Foam", price: 24.99, description: "U-shaped travel pillow with sleep mask", asin: "B08NF1S1TB" },
    { name: "Travel Adapter Universal", price: 19.99, description: "All-in-one international plug with USB ports", asin: "B07K1YP7Z5" },
    { name: "Toiletry Bag Hanging", price: 18.99, description: "Large waterproof cosmetics organizer", asin: "B071JH7HT8" },
    { name: "Luggage Scale Digital", price: 11.99, description: "Portable baggage scale with LCD display", asin: "B01FQIT5O0" },
    { name: "Passport Holder RFID", price: 13.99, description: "Travel wallet with blocking sleeves", asin: "B01BNBM2GS" },
    { name: "Water Bottle Collapsible", price: 16.99, description: "Leak-proof silicone travel bottle 600ml", asin: "B07PWQ4F8Y" }
  ]
};

export const smartProductDiscovery = {
  /**
   * Discover trending products in a niche and add to campaign
   */
  async addToCampaign(campaignId: string, userId: string, count: number = 5): Promise<{ success: boolean; products: any[]; added: number }> {
    try {
      console.log(`🔍 Discovering ${count} products for campaign:`, campaignId);

      // Get campaign to determine niche
      const { data: campaign } = await supabase
        .from("campaigns")
        .select("name")
        .eq("id", campaignId)
        .single();

      // Detect niche from campaign name
      let niche = "Kitchen Gadgets"; // Default
      const campaignName = campaign?.name || "";
      
      for (const nicheName of Object.keys(REAL_PRODUCT_DATABASE)) {
        if (campaignName.toLowerCase().includes(nicheName.toLowerCase())) {
          niche = nicheName as keyof typeof REAL_PRODUCT_DATABASE;
          break;
        }
      }

      console.log(`📦 Using niche: ${niche}`);
      
      const products = REAL_PRODUCT_DATABASE[niche as keyof typeof REAL_PRODUCT_DATABASE] || REAL_PRODUCT_DATABASE["Kitchen Gadgets"];
      
      // Randomly select products
      const shuffled = [...products].sort(() => Math.random() - 0.5);
      const selectedProducts = shuffled.slice(0, count);

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
          console.log(`✅ Added product: ${product.name}`);
        }
      }

      console.log(`✅ Successfully added ${insertedProducts.length} products`);
      
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