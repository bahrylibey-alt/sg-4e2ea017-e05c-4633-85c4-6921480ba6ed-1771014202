import { GetServerSideProps } from "next";
import { supabase } from "@/integrations/supabase/client";

export default function RedirectPage() {
  return (
    <div style={{ 
      display: "flex", 
      alignItems: "center", 
      justifyContent: "center", 
      height: "100vh",
      fontFamily: "system-ui, -apple-system, sans-serif"
    }}>
      <div style={{ textAlign: "center" }}>
        <h1 style={{ fontSize: "24px", marginBottom: "16px" }}>Redirecting...</h1>
        <p style={{ color: "#666" }}>Please wait while we redirect you to the product.</p>
      </div>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { slug } = context.query;

  if (!slug || typeof slug !== "string") {
    console.error("No slug provided");
    return { notFound: true };
  }

  try {
    // Get link from database
    const { data: link, error } = await supabase
      .from("affiliate_links")
      .select("id, original_url, product_name, network, clicks, status")
      .eq("slug", slug)
      .eq("status", "active")
      .maybeSingle();

    if (error) {
      console.error("Database error:", error);
      return { notFound: true };
    }

    if (!link) {
      console.error("Link not found for slug:", slug);
      return { notFound: true };
    }

    if (!link.original_url) {
      console.error("No original_url for link:", link.id);
      return { notFound: true };
    }

    // Update click count (fire and forget - don't wait)
    supabase
      .from("affiliate_links")
      .update({ 
        clicks: (link.clicks || 0) + 1,
        updated_at: new Date().toISOString()
      })
      .eq("id", link.id)
      .then(() => {
        console.log("Click tracked for:", link.product_name);
      })
      .catch((err) => {
        console.error("Failed to track click:", err);
      });

    // Log activity (fire and forget)
    supabase
      .from("activity_logs")
      .insert({
        user_id: link.user_id || "00000000-0000-0000-0000-000000000000",
        action: "link_click",
        status: "success",
        details: `Clicked: ${link.product_name}`,
        metadata: { 
          slug, 
          product_name: link.product_name, 
          network: link.network,
          destination: link.original_url
        }
      })
      .then(() => {
        console.log("Activity logged for:", link.product_name);
      })
      .catch((err) => {
        console.error("Failed to log activity:", err);
      });

    console.log("Redirecting to:", link.original_url);

    // Redirect to the actual product URL
    return {
      redirect: {
        destination: link.original_url,
        permanent: false,
      },
    };
  } catch (err) {
    console.error("Unexpected error in redirect:", err);
    return { notFound: true };
  }
};