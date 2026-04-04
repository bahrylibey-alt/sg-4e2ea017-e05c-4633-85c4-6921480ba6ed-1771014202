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
        <p style={{ color: "#666" }}>Taking you to the product page on Amazon.</p>
      </div>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { slug } = context.query;

  if (!slug || typeof slug !== "string") {
    return { notFound: true };
  }

  try {
    // 1. Get the affiliate link from the database
    const { data: link, error } = await supabase
      .from("affiliate_links")
      .select("id, original_url, product_name, network, clicks, status, user_id")
      .eq("slug", slug)
      .eq("status", "active")
      .maybeSingle();

    if (error || !link || !link.original_url) {
      console.error("Link fetch error or not found:", error || "No URL");
      return { notFound: true };
    }

    // 2. Track the click metric (await to guarantee execution)
    await supabase
      .from("affiliate_links")
      .update({ 
        clicks: (link.clicks || 0) + 1,
        updated_at: new Date().toISOString()
      })
      .eq("id", link.id);

    // 3. Log activity metric
    await supabase
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
      });

    // 4. Redirect seamlessly to actual Amazon product URL
    return {
      redirect: {
        destination: link.original_url,
        permanent: false, // 302 redirect
      },
    };
  } catch (err) {
    console.error("Unexpected error in redirect server-side:", err);
    return { notFound: true };
  }
};