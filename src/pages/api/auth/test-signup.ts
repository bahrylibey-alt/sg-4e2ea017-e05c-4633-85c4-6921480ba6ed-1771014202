import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { email, password, name } = req.body;

    // Create admin client (bypasses RLS)
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Test 1: Check if we can connect to Supabase
    const { data: healthCheck, error: healthError } = await supabaseAdmin
      .from("profiles")
      .select("count")
      .limit(1);

    if (healthError) {
      return res.status(500).json({
        success: false,
        step: "health_check",
        error: "Cannot connect to Supabase database",
        details: healthError.message
      });
    }

    // Test 2: Try to create user with admin client (bypasses email confirmation)
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email
      user_metadata: { full_name: name }
    });

    if (userError) {
      return res.status(400).json({
        success: false,
        step: "user_creation",
        error: userError.message,
        details: userError
      });
    }

    // Test 3: Create profile entry
    if (userData.user) {
      const { error: profileError } = await supabaseAdmin
        .from("profiles")
        .insert({
          id: userData.user.id,
          email: userData.user.email,
          full_name: name
        });

      if (profileError && !profileError.message.includes("duplicate")) {
        console.error("Profile creation error:", profileError);
      }
    }

    return res.status(200).json({
      success: true,
      message: "Account created successfully! You can now log in.",
      user: {
        id: userData.user?.id,
        email: userData.user?.email
      }
    });
  } catch (error) {
    console.error("Test signup error:", error);
    return res.status(500).json({
      success: false,
      step: "exception",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
}