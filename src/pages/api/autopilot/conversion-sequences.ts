import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/integrations/supabase/client";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Get products without conversion sequences
    const { data: products, error: productsError } = await supabase
      .from("product_catalog")
      .select("id, title, category")
      .limit(10);

    if (productsError) throw productsError;

    if (!products || products.length === 0) {
      return res.status(200).json({
        message: "No products found for conversion sequences",
        created: 0
      });
    }

    // Create conversion sequences
    const sequences = [];
    for (const product of products) {
      // Email sequence
      sequences.push({
        product_id: product.id,
        sequence_type: "email",
        step_number: 1,
        content: `Welcome! Here's why ${product.title} is perfect for you...`,
        delay_hours: 0,
        created_at: new Date().toISOString()
      });

      sequences.push({
        product_id: product.id,
        sequence_type: "email",
        step_number: 2,
        content: `Still thinking about ${product.title}? Here's what others are saying...`,
        delay_hours: 24,
        created_at: new Date().toISOString()
      });

      sequences.push({
        product_id: product.id,
        sequence_type: "email",
        step_number: 3,
        content: `Last chance! Special offer on ${product.title} ends soon.`,
        delay_hours: 48,
        created_at: new Date().toISOString()
      });

      // Retargeting sequence
      sequences.push({
        product_id: product.id,
        sequence_type: "retargeting",
        step_number: 1,
        content: `Show ${product.title} ad to visitors who viewed but didn't click`,
        delay_hours: 1,
        created_at: new Date().toISOString()
      });
    }

    const { error: insertError } = await supabase
      .from("conversion_sequences")
      .insert(sequences);

    if (insertError && insertError.code !== "23505") {
      console.error("Conversion sequences insert error:", insertError);
    }

    return res.status(200).json({
      message: `Created ${sequences.length} conversion sequences for ${products.length} products`,
      created: sequences.length,
      types: ["email", "retargeting"]
    });

  } catch (error: any) {
    console.error("Conversion sequences error:", error);
    return res.status(500).json({
      error: error.message || "Failed to create conversion sequences"
    });
  }
}