import type { NextApiRequest, NextApiResponse } from "next";

/**
 * MANUAL TEST FOR PRODUCT DISCOVERY CRON
 * Visit: /api/test-cron-discovery
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const cronSecret = process.env.CRON_SECRET;

    // Call discovery cron
    const discoveryResponse = await fetch(`${baseUrl}/api/cron/discover-products`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${cronSecret}`,
        'Content-Type': 'application/json'
      }
    });

    const discoveryData = await discoveryResponse.json();

    return res.status(200).json({
      success: true,
      discovery: {
        status: discoveryResponse.status,
        data: discoveryData
      }
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}