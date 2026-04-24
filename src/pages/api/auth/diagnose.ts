import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const diagnostics: any[] = [];

  try {
    // 1. Check Environment Variables
    diagnostics.push({
      test: "Environment Variables",
      status: "Testing...",
      details: {}
    });

    const hasUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL;
    const hasAnonKey = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const hasServiceKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY;

    diagnostics[0].details = {
      NEXT_PUBLIC_SUPABASE_URL: hasUrl ? "✅ Set" : "❌ Missing",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: hasAnonKey ? "✅ Set" : "❌ Missing",
      SUPABASE_SERVICE_ROLE_KEY: hasServiceKey ? "✅ Set" : "❌ Missing"
    };

    if (!hasUrl || !hasServiceKey) {
      diagnostics[0].status = "❌ Failed";
      diagnostics[0].error = "Missing required environment variables";
      return res.status(500).json({ success: false, diagnostics });
    }

    diagnostics[0].status = "✅ Passed";

    // 2. Create Supabase Admin Client
    diagnostics.push({
      test: "Admin Client Creation",
      status: "Testing..."
    });

    let supabaseAdmin;
    try {
      supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false
          }
        }
      );
      diagnostics[1].status = "✅ Passed";
      diagnostics[1].details = "Admin client created successfully";
    } catch (err) {
      diagnostics[1].status = "❌ Failed";
      diagnostics[1].error = err instanceof Error ? err.message : "Unknown error";
      return res.status(500).json({ success: false, diagnostics });
    }

    // 3. Test Database Connection
    diagnostics.push({
      test: "Database Connection",
      status: "Testing..."
    });

    try {
      const { data, error } = await supabaseAdmin
        .from("profiles")
        .select("id")
        .limit(1);

      if (error) {
        diagnostics[2].status = "❌ Failed";
        diagnostics[2].error = error.message;
        diagnostics[2].details = {
          code: error.code,
          hint: error.hint,
          details: error.details
        };
        return res.status(500).json({ success: false, diagnostics });
      }

      diagnostics[2].status = "✅ Passed";
      diagnostics[2].details = "Database accessible";
    } catch (err) {
      diagnostics[2].status = "❌ Failed";
      diagnostics[2].error = err instanceof Error ? err.message : "Unknown error";
      return res.status(500).json({ success: false, diagnostics });
    }

    // 4. Test Auth Admin Access
    diagnostics.push({
      test: "Auth Admin Access",
      status: "Testing..."
    });

    try {
      const { data, error } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1 });

      if (error) {
        diagnostics[3].status = "❌ Failed";
        diagnostics[3].error = error.message;
        return res.status(500).json({ success: false, diagnostics });
      }

      diagnostics[3].status = "✅ Passed";
      diagnostics[3].details = `Found ${data.users.length} user(s)`;
    } catch (err) {
      diagnostics[3].status = "❌ Failed";
      diagnostics[3].error = err instanceof Error ? err.message : "Unknown error";
      return res.status(500).json({ success: false, diagnostics });
    }

    // 5. Test Profile Table Access
    diagnostics.push({
      test: "Profile Table Access",
      status: "Testing..."
    });

    try {
      const { count, error } = await supabaseAdmin
        .from("profiles")
        .select("*", { count: "exact", head: true });

      if (error) {
        diagnostics[4].status = "❌ Failed";
        diagnostics[4].error = error.message;
        return res.status(500).json({ success: false, diagnostics });
      }

      diagnostics[4].status = "✅ Passed";
      diagnostics[4].details = `Found ${count} profile(s)`;
    } catch (err) {
      diagnostics[4].status = "❌ Failed";
      diagnostics[4].error = err instanceof Error ? err.message : "Unknown error";
      return res.status(500).json({ success: false, diagnostics });
    }

    return res.status(200).json({
      success: true,
      message: "All diagnostics passed!",
      diagnostics
    });

  } catch (error) {
    console.error("Diagnostic error:", error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      diagnostics
    });
  }
}