import type { NextApiRequest, NextApiResponse } from "next";

/**
 * MANUAL TEST FOR AUTOPILOT CRON
 * Visit: /api/test-cron-autopilot
 * NO AUTH REQUIRED - For testing purposes
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const cronSecret = process.env.CRON_SECRET;

    // Call autopilot cron
    const autopilotResponse = await fetch(`${baseUrl}/api/cron/autopilot`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${cronSecret}`,
        'Content-Type': 'application/json'
      }
    });

    const autopilotData = await autopilotResponse.json();

    return res.status(200).json({
      success: true,
      autopilot: {
        status: autopilotResponse.status,
        data: autopilotData
      }
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}