import { GetServerSideProps } from "next";
import { supabase } from "@/integrations/supabase/client";

export default function RedirectPage() {
  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      fontFamily: 'system-ui, sans-serif'
    }}>
      <div style={{ textAlign: 'center' }}>
        <h1>Redirecting...</h1>
        <p>Taking you to the product page...</p>
      </div>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { slug } = context.query;

  console.log("🔍 Redirect request for slug:", slug);

  if (!slug || typeof slug !== "string") {
    console.error("❌ Invalid slug");
    return { notFound: true };
  }

  try {
    // Get link from database
    const { data: link, error } = await supabase
      .from("affiliate_links")
      .select("id, original_url, product_name, clicks")
      .eq("slug", slug)
      .eq("status", "active")
      .maybeSingle();

    console.log("📊 Database query result:", { link, error });

    if (error || !link) {
      console.error("❌ Link not found in database:", slug, error);
      return { notFound: true };
    }

    console.log("✅ Found link:", link.product_name, "→", link.original_url);

    // Update click count
    const { error: updateError } = await supabase
      .from("affiliate_links")
      .update({ 
        clicks: (link.clicks || 0) + 1,
        updated_at: new Date().toISOString()
      })
      .eq("id", link.id);

    if (updateError) {
      console.error("⚠️ Failed to update clicks:", updateError);
    } else {
      console.log("✅ Click count updated");
    }

    // Log activity
    await supabase
      .from("activity_logs")
      .insert({
        user_id: "00000000-0000-0000-0000-000000000000",
        action: "link_click",
        status: "success",
        details: `Redirecting to: ${link.product_name}`,
        metadata: { 
          slug, 
          product: link.product_name, 
          url: link.original_url 
        }
      });

    console.log("🚀 Redirecting to:", link.original_url);

    // Redirect to the original Amazon URL
    return {
      redirect: {
        destination: link.original_url,
        permanent: false,
      },
    };
  } catch (err) {
    console.error("❌ Unexpected error in redirect:", err);
    return { notFound: true };
  }
};