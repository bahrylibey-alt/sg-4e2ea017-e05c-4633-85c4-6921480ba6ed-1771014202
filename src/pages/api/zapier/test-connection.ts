import type { NextApiRequest, NextApiResponse } from "next";

/**
 * ZAPIER TEST CONNECTION ENDPOINT
 * 
 * Simple endpoint to verify Zapier can reach your API.
 * Use this when setting up the Zapier connection for the first time.
 * 
 * Test URL: https://yourapp.vercel.app/api/zapier/test-connection
 */

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  console.log('🔌 Zapier test connection request received');

  res.status(200).json({
    success: true,
    message: "Zapier connection successful! Your API is ready.",
    timestamp: new Date().toISOString(),
    endpoints: {
      content_feed: "/api/zapier/content-feed",
      webhook: "/api/zapier/webhook",
      test: "/api/zapier/test-connection"
    },
    status: "✅ All systems operational"
  });
}