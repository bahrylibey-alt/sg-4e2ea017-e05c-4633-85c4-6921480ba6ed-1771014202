import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/integrations/supabase/client";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const checks = {
      database: { status: "unknown", message: "" },
      products: { status: "unknown", message: "" },
      content: { status: "unknown", message: "" },
      tracking: { status: "unknown", message: "" }
    };

    try {
      const { error } = await supabase.from("product_catalog").select("id").limit(1);
      checks.database = {
        status: error ? "error" : "ok",
        message: error ? error.message : "Database connected"
      };
    } catch (error: any) {
      checks.database = { status: "error", message: error.message };
    }

    try {
      const { count, error } = await supabase.from("product_catalog").select("*", { count: "exact", head: true });
      checks.products = {
        status: error ? "error" : "ok",
        message: error ? error.message : `${count || 0} products in database`
      };
    } catch (error: any) {
      checks.products = { status: "error", message: error.message };
    }

    try {
      const { count, error } = await supabase.from("generated_content").select("*", { count: "exact", head: true });
      checks.content = {
        status: error ? "error" : "ok",
        message: error ? error.message : `${count || 0} articles generated`
      };
    } catch (error: any) {
      checks.content = { status: "error", message: error.message };
    }

    try {
      const { count, error } = await supabase.from("click_events").select("*", { count: "exact", head: true });
      checks.tracking = {
        status: error ? "error" : "ok",
        message: error ? error.message : `${count || 0} clicks tracked`
      };
    } catch (error: any) {
      checks.tracking = { status: "error", message: error.message };
    }

    const allOk = Object.values(checks).every(c => c.status === "ok");
    const hasErrors = Object.values(checks).some(c => c.status === "error");

    return res.status(200).json({
      success: true,
      overall: allOk ? "healthy" : hasErrors ? "unhealthy" : "degraded",
      checks,
      message: allOk 
        ? "All systems operational" 
        : hasErrors 
        ? "System health check found errors" 
        : "System operational with warnings"
    });
  } catch (error: any) {
    console.error("Health check error:", error);
    return res.status(500).json({
      error: error.message || "Health check failed"
    });
  }
}