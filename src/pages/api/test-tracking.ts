import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/integrations/supabase/client";

/**
 * TEST TRACKING SYSTEM
 * Verifies click and conversion tracking works end-to-end
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const results: any[] = [];

  try {
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return res.status(401).json({ 
        success: false, 
        error: "Not authenticated" 
      });
    }

    results.push({
      step: "Authentication",
      status: "PASS",
      userId: user.id,
    });

    // TEST 1: Find or create a test link
    let testLink;
    const { data: existingLinks } = await supabase
      .from("affiliate_links")
      .select("*")
      .eq("user_id", user.id)
      .eq("status", "active")
      .limit(1);

    if (existingLinks && existingLinks.length > 0) {
      testLink = existingLinks[0];
      results.push({
        step: "Get Test Link",
        status: "PASS",
        linkId: testLink.id,
        linkSlug: testLink.slug,
        currentClicks: testLink.clicks,
      });
    } else {
      // Create a test link
      const { data: newLink, error: linkError } = await supabase
        .from("affiliate_links")
        .insert({
          user_id: user.id,
          product_name: "Test Product",
          original_url: "https://amazon.com/test",
          cloaked_url: "https://yourdomain.com/go/test",
          slug: `test-${Date.now()}`,
          network: "Amazon Associates",
          status: "active",
          clicks: 0,
          click_count: 0,
        })
        .select()
        .single();

      if (linkError) {
        results.push({
          step: "Create Test Link",
          status: "FAIL",
          error: linkError.message,
        });
        return res.status(500).json({ success: false, results });
      }

      testLink = newLink;
      results.push({
        step: "Create Test Link",
        status: "PASS",
        linkId: testLink.id,
      });
    }

    // TEST 2: Simulate Click Tracking
    const beforeClicks = testLink.clicks || 0;
    const newClicks = beforeClicks + 1;

    const { error: clickUpdateError } = await supabase
      .from("affiliate_links")
      .update({ 
        clicks: newClicks,
        click_count: newClicks 
      })
      .eq("id", testLink.id);

    if (clickUpdateError) {
      results.push({
        step: "Update Click Count",
        status: "FAIL",
        error: clickUpdateError.message,
      });
    } else {
      results.push({
        step: "Update Click Count",
        status: "PASS",
        before: beforeClicks,
        after: newClicks,
      });
    }

    // TEST 3: Create Click Event
    const { data: clickEvent, error: eventError } = await supabase
      .from("click_events")
      .insert({
        link_id: testLink.id,
        user_id: user.id,
        ip_address: "test-ip",
        user_agent: "test-agent",
        referrer: "test-referrer",
        clicked_at: new Date().toISOString(),
        converted: false,
        is_bot: false,
        fraud_score: 0,
      })
      .select()
      .single();

    if (eventError) {
      results.push({
        step: "Create Click Event",
        status: "FAIL",
        error: eventError.message,
      });
    } else {
      results.push({
        step: "Create Click Event",
        status: "PASS",
        eventId: clickEvent.id,
      });

      // TEST 4: Simulate Conversion
      const { data: conversion, error: conversionError } = await supabase
        .from("conversion_events")
        .insert({
          user_id: user.id,
          click_id: clickEvent.click_id,
          revenue: 29.99,
          verified: false,
          source: "test",
        })
        .select()
        .single();

      if (conversionError) {
        results.push({
          step: "Create Conversion",
          status: "FAIL",
          error: conversionError.message,
        });
      } else {
        results.push({
          step: "Create Conversion",
          status: "PASS",
          conversionId: conversion.id,
          revenue: conversion.revenue,
        });

        // Mark click as converted
        await supabase
          .from("click_events")
          .update({ converted: true })
          .eq("id", clickEvent.id);
      }
    }

    // TEST 5: Verify Click Count Updated
    const { data: verifyLink } = await supabase
      .from("affiliate_links")
      .select("clicks, click_count")
      .eq("id", testLink.id)
      .single();

    results.push({
      step: "Verify Click Count",
      status: verifyLink?.clicks === newClicks ? "PASS" : "FAIL",
      expected: newClicks,
      actual: verifyLink?.clicks,
      click_count_actual: verifyLink?.click_count,
    });

    // TEST 6: Check Database Triggers
    const { data: systemState } = await supabase
      .from("system_state")
      .select("*")
      .eq("user_id", user.id)
      .single();

    results.push({
      step: "Check System State",
      status: systemState ? "PASS" : "WARN",
      totalClicks: systemState?.total_clicks || 0,
      totalConversions: systemState?.total_conversions || 0,
      message: systemState ? "System state exists" : "System state not found (may need first sync)",
    });

    // Summary
    const passed = results.filter((r) => r.status === "PASS").length;
    const failed = results.filter((r) => r.status === "FAIL").length;

    return res.status(200).json({
      success: failed === 0,
      summary: {
        total: results.length,
        passed,
        failed,
        warnings: results.filter((r) => r.status === "WARN").length,
      },
      testLink: {
        id: testLink.id,
        slug: testLink.slug,
        clicks: newClicks,
      },
      results,
    });
  } catch (error: any) {
    console.error("Test tracking error:", error);
    return res.status(500).json({
      success: false,
      error: error.message,
      results,
    });
  }
}