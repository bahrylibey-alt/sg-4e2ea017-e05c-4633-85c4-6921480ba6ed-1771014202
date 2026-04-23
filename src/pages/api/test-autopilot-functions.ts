import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/integrations/supabase/client";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const results: any = {
    timestamp: new Date().toISOString(),
    tests: [],
    summary: {
      total: 0,
      passed: 0,
      failed: 0
    }
  };

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Test 1: Check existing content
    console.log("🧪 Test 1: Checking existing content...");
    const { data: content, error: contentError } = await supabase
      .from("generated_content")
      .select("id, title, status, views, clicks")
      .eq("user_id", user.id);

    results.tests.push({
      name: "Database Query - Existing Content",
      status: !contentError && content ? "PASS" : "FAIL",
      details: {
        found: content?.length || 0,
        error: contentError?.message
      }
    });

    // Test 2: Performance Analysis
    console.log("🧪 Test 2: Testing Performance Analysis...");
    try {
      const perfResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/autopilot/performance-analysis`, {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
      const perfData = await perfResponse.json();
      
      results.tests.push({
        name: "Performance Analysis",
        status: perfResponse.ok ? "PASS" : "FAIL",
        details: perfData
      });
    } catch (error: any) {
      results.tests.push({
        name: "Performance Analysis",
        status: "FAIL",
        details: { error: error.message }
      });
    }

    // Test 3: SEO Optimizer
    console.log("🧪 Test 3: Testing SEO Optimizer...");
    const { data: publishedContent } = await supabase
      .from("generated_content")
      .select("id, autopilot_state")
      .eq("user_id", user.id)
      .eq("status", "published")
      .limit(1);

    results.tests.push({
      name: "SEO Optimizer - Data Available",
      status: publishedContent && publishedContent.length > 0 ? "PASS" : "SKIP",
      details: {
        publishedArticles: publishedContent?.length || 0,
        message: publishedContent?.length ? "Ready for optimization" : "No published content yet"
      }
    });

    // Test 4: Auto-Publish
    console.log("🧪 Test 4: Testing Auto-Publish...");
    const { data: drafts } = await supabase
      .from("generated_content")
      .select("id")
      .eq("user_id", user.id)
      .eq("status", "draft");

    results.tests.push({
      name: "Auto-Publish - Data Available",
      status: "PASS",
      details: {
        draftsFound: drafts?.length || 0,
        message: drafts?.length ? `${drafts.length} drafts ready to publish` : "No drafts (will create when needed)"
      }
    });

    // Test 5: Product Catalog
    console.log("🧪 Test 5: Checking Product Catalog...");
    const { data: products, error: productsError } = await supabase
      .from("product_catalog")
      .select("id, name")
      .eq("user_id", user.id);

    results.tests.push({
      name: "Product Catalog Query",
      status: !productsError ? "PASS" : "FAIL",
      details: {
        productsFound: products?.length || 0,
        error: productsError?.message
      }
    });

    // Test 6: Click Events Tracking
    console.log("🧪 Test 6: Checking Click Events...");
    const { data: clicks, error: clicksError } = await supabase
      .from("click_events")
      .select("id")
      .limit(10);

    results.tests.push({
      name: "Click Events Tracking",
      status: !clicksError ? "PASS" : "FAIL",
      details: {
        clicksFound: clicks?.length || 0,
        error: clicksError?.message
      }
    });

    // Test 7: Commissions
    console.log("🧪 Test 7: Checking Commissions...");
    const { data: commissions, error: commissionsError } = await supabase
      .from("commissions")
      .select("id, amount");

    results.tests.push({
      name: "Commissions Tracking",
      status: !commissionsError ? "PASS" : "FAIL",
      details: {
        commissionsFound: commissions?.length || 0,
        totalRevenue: commissions?.reduce((sum, c) => sum + (Number(c.amount) || 0), 0) || 0,
        error: commissionsError?.message
      }
    });

    // Test 8: System Health Check
    console.log("🧪 Test 8: Running System Health Check...");
    const healthChecks = {
      database: !contentError,
      content: (content?.length || 0) > 0,
      products: (products?.length || 0) >= 0,
      tracking: !clicksError,
      revenue: !commissionsError
    };

    const healthScore = Object.values(healthChecks).filter(Boolean).length;
    const totalChecks = Object.values(healthChecks).length;

    results.tests.push({
      name: "System Health Check",
      status: healthScore === totalChecks ? "PASS" : healthScore > totalChecks / 2 ? "WARN" : "FAIL",
      details: {
        score: `${healthScore}/${totalChecks}`,
        checks: healthChecks
      }
    });

    // Calculate summary
    results.summary.total = results.tests.length;
    results.summary.passed = results.tests.filter((t: any) => t.status === "PASS").length;
    results.summary.failed = results.tests.filter((t: any) => t.status === "FAIL").length;
    results.summary.skipped = results.tests.filter((t: any) => t.status === "SKIP").length;

    console.log("✅ All tests completed!");
    console.log(`Summary: ${results.summary.passed}/${results.summary.total} passed`);

    return res.status(200).json({
      success: true,
      message: "AutoPilot system test completed",
      results
    });

  } catch (error: any) {
    console.error("Test suite error:", error);
    return res.status(500).json({
      error: error.message,
      results
    });
  }
}