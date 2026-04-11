import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { webhookUrl } = req.body;

    if (!webhookUrl || !webhookUrl.includes("hooks.zapier.com")) {
      return res.status(400).json({ 
        error: "Invalid webhook URL. Must be a Zapier webhook URL." 
      });
    }

    // Send test webhook to Zapier
    const testData = {
      event: "test.connection",
      data: {
        message: "Test webhook from Sale Makseb",
        timestamp: new Date().toISOString(),
        test: true,
        platform: "test",
        caption: "This is a test post to verify your Zapier connection is working!",
        link_url: "https://example.com/test",
        image_url: ""
      },
      timestamp: new Date().toISOString()
    };

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(testData),
    });

    if (!response.ok) {
      return res.status(response.status).json({
        success: false,
        error: `Zapier webhook returned status ${response.status}`,
        status: response.status
      });
    }

    // Zapier webhooks typically return with status 200 and some response
    const responseData = await response.text();

    return res.status(200).json({
      success: true,
      message: "Test webhook sent successfully to Zapier!",
      zapierResponse: responseData
    });

  } catch (error: any) {
    console.error("Error testing Zapier webhook:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to send test webhook"
    });
  }
}