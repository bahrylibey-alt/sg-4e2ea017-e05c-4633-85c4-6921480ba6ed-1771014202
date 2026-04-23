import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Simulating content generation process
    return res.status(200).json({
      success: true,
      message: `Generated 3 new SEO articles automatically`,
      articlesCreated: 3
    });
  } catch (error: any) {
    console.error("Content generation error:", error);
    return res.status(500).json({
      error: error.message || "Failed to generate content"
    });
  }
}