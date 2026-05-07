import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false }
});

/**
 * Fetches the OpenAI API key from the user_settings table
 * This allows users to save their key once in Settings and use it everywhere
 */
export async function getOpenAIKeyFromDB(): Promise<string | null> {
  try {
    // Get first user (or you can pass userId as parameter)
    const { data: users } = await supabase
      .from("profiles")
      .select("id")
      .limit(1);
    
    if (!users || users.length === 0) {
      console.log("No users found in database");
      return null;
    }
    
    // Fetch the user's OpenAI API key from settings
    const { data: settings, error } = await supabase
      .from("user_settings")
      .select("openai_api_key")
      .eq("user_id", users[0].id)
      .maybeSingle();
    
    if (error) {
      console.error("Error fetching OpenAI key:", error);
      return null;
    }
    
    if (!settings?.openai_api_key) {
      console.log("No OpenAI API key found in user settings");
      return null;
    }
    
    console.log("✅ OpenAI API key loaded from database");
    return settings.openai_api_key;
    
  } catch (error) {
    console.error("Exception fetching OpenAI key:", error);
    return null;
  }
}