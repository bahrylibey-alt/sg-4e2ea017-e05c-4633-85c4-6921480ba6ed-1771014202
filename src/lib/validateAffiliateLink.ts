/**
 * AFFILIATE LINK VALIDATOR
 * Ensures all published content has valid, trackable affiliate links
 * NO CONTENT PUBLISHED WITHOUT VALID LINKS
 */

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

export interface LinkValidationResult {
  isValid: boolean;
  link?: string;
  slug?: string;
  error?: string;
}

/**
 * Validates that a content piece has a valid affiliate tracking link
 */
export async function validateContentLink(contentId: string): Promise<LinkValidationResult> {
  try {
    // Get the content
    const { data: content, error: contentError } = await supabase
      .from("generated_content")
      .select("product_link, body")
      .eq("id", contentId)
      .single();

    if (contentError || !content) {
      return {
        isValid: false,
        error: "Content not found"
      };
    }

    // Check product_link field first
    if (content.product_link && content.product_link.includes("/go/")) {
      const slug = content.product_link.split("/go/")[1];
      return {
        isValid: true,
        link: content.product_link,
        slug
      };
    }

    // Check body for embedded link
    const linkMatch = content.body?.match(/\[.*?\]\((\/go\/[^\)]+)\)/);
    if (linkMatch && linkMatch[1]) {
      const slug = linkMatch[1].split("/go/")[1];
      return {
        isValid: true,
        link: linkMatch[1],
        slug
      };
    }

    return {
      isValid: false,
      error: "No valid /go/{slug} tracking link found in content"
    };

  } catch (error) {
    return {
      isValid: false,
      error: error instanceof Error ? error.message : "Validation failed"
    };
  }
}

/**
 * Verifies that an affiliate link slug exists in the database
 */
export async function verifyLinkExists(slug: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from("affiliate_links")
      .select("id")
      .eq("slug", slug)
      .single();

    return !error && !!data;
  } catch {
    return false;
  }
}

/**
 * Creates an affiliate link if one doesn't exist for a product
 */
export async function ensureProductHasLink(productId: string, productName: string, originalUrl: string): Promise<string> {
  try {
    // Check if link already exists
    const { data: existingLink } = await supabase
      .from("affiliate_links")
      .select("slug")
      .eq("product_id", productId)
      .maybeSingle();

    if (existingLink?.slug) {
      return `/go/${existingLink.slug}`;
    }

    // Create new link
    const slug = `${productName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Date.now()}`;
    const { data: newLink, error } = await supabase
      .from("affiliate_links")
      .insert({
        product_id: productId,
        original_url: originalUrl,
        slug,
        platform: "direct",
        status: "active"
      })
      .select("slug")
      .single();

    if (error || !newLink) {
      throw new Error("Failed to create affiliate link");
    }

    return `/go/${newLink.slug}`;

  } catch (error) {
    throw new Error(`Link creation failed: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}