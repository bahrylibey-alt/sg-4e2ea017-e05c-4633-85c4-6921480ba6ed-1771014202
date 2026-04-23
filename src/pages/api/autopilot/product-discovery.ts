import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { niche } = req.body;

    const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/api/trending/discover`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ niche, limit: 5 })
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || "Failed to discover products");
    }

    return res.status(200).json({
      success: true,
      message: `Discovered ${result.products?.length || 0} trending products`,
      products: result.products
    });
  } catch (error: any) {
    console.error("Product discovery error:", error);
    return res.status(500).json({
      error: error.message || "Failed to discover products"
    });
  }
}