// @ts-nocheck
import type { NextApiRequest, NextApiResponse } from "next";
import { trafficAutomationService } from "@/services/trafficAutomationService";

/**
 * REAL TRAFFIC TRACKING API
 * 
 * This endpoint is called on EVERY page view to track real visitors.
 * It logs actual traffic sources (Google, Facebook, Direct, etc.)
 * 
 * Usage: Add this to every page via useEffect
 * 
 * Example:
 * useEffect(() => {
 *   fetch('/api/track-visit', {
 *     method: 'POST',
 *     headers: { 'Content-Type': 'application/json' },
 *     body: JSON.stringify({ campaignId, page: window.location.pathname })
 *   });
 * }, []);
 */

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { campaignId, page } = req.body;

    if (!campaignId) {
      return res.status(400).json({ error: "Missing campaignId" });
    }

    // Get real visitor data from HTTP headers
    const referrer = (req.headers.referer || req.headers.referrer || "") as string;
    const userAgent = req.headers["user-agent"] || "";
    const ip = (req.headers["x-forwarded-for"] as string) || req.socket.remoteAddress || "";

    // Track the visit
    const result = await trafficAutomationService.trackRealVisitor({
      campaignId,
      source: page || "/",
      referrer,
      userAgent,
      ip
    });

    if (result.success) {
      return res.status(200).json({
        success: true,
        message: "Visit tracked",
        source: trafficAutomationService.detectTrafficSource(referrer)
      });
    } else {
      return res.status(500).json({ error: "Failed to track visit" });
    }

  } catch (error: any) {
    console.error("Track visit error:", error);
    return res.status(500).json({ error: error.message });
  }
}