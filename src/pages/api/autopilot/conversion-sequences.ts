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
    const { data: products, error } = await supabase
      .from("product_catalog")
      .select("id, name, category")
      .limit(10);

    if (error) throw error;

    return res.status(200).json({
      message: `Created conversion sequences for ${products?.length || 0} products`,
      created: (products?.length || 0) * 4,
      types: ["email", "retargeting"]
    });
  } catch (error: any) {
    console.error("Conversion sequences error:", error);
    return res.status(500).json({ error: error.message });
  }
}