import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/integrations/supabase/client";

/**
 * DIAGNOSTIC API - Shows exactly what's in the database and what errors occur
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    // Get user
    const { data: profiles } = await (supabase as any)
      .from('profiles')
      .select('id, email')
      .limit(1);

    if (!profiles || profiles.length === 0) {
      return res.status(200).json({
        error: 'No users found',
        diagnosis: 'Please create a user account first'
      });
    }

    const userId = profiles[0].id;
    const diagnosis: any = {
      userId,
      userEmail: profiles[0].email,
      database: {},
      testInserts: {},
      errors: []
    };

    // CHECK 1: Products
    const { data: products, error: productsError } = await (supabase as any)
      .from('product_catalog')
      .select('*')
      .eq('user_id', userId)
      .limit(5);

    diagnosis.database.products = {
      count: products?.length || 0,
      sample: products?.[0] || null,
      error: productsError?.message
    };

    if (productsError) {
      diagnosis.errors.push(`Products query: ${productsError.message}`);
    }

    // CHECK 2: Try to create a test link
    if (products && products.length > 0) {
      const testProduct = products[0];
      
      const testLinkData = {
        user_id: userId,
        product_id: testProduct.id,
        original_url: testProduct.affiliate_url || `https://amazon.com/test`,
        cloaked_url: `/go/test123`,
        slug: 'test123',
        status: 'active',
        network: testProduct.network || 'amazon'
      };

      const { data: testLink, error: linkError } = await (supabase as any)
        .from('affiliate_links')
        .insert(testLinkData)
        .select()
        .maybeSingle();

      diagnosis.testInserts.link = {
        success: !linkError,
        data: testLinkData,
        result: testLink,
        error: linkError?.message,
        errorDetails: linkError
      };

      if (linkError) {
        diagnosis.errors.push(`Link insert: ${linkError.message}`);
      } else if (testLink) {
        // Clean up test link
        await (supabase as any)
          .from('affiliate_links')
          .delete()
          .eq('id', testLink.id);
      }
    }

    // CHECK 3: Try to create test content
    if (products && products.length > 0) {
      const testProduct = products[0];
      
      const testContentData = {
        user_id: userId,
        campaign_id: null,
        title: 'Test Content',
        body: 'This is test content for diagnostic purposes.',
        type: 'social',
        status: 'draft'
      };

      const { data: testContent, error: contentError } = await (supabase as any)
        .from('generated_content')
        .insert(testContentData)
        .select()
        .maybeSingle();

      diagnosis.testInserts.content = {
        success: !contentError,
        data: testContentData,
        result: testContent,
        error: contentError?.message,
        errorDetails: contentError
      };

      if (contentError) {
        diagnosis.errors.push(`Content insert: ${contentError.message}`);
      } else if (testContent) {
        // Clean up test content
        await (supabase as any)
          .from('generated_content')
          .delete()
          .eq('id', testContent.id);
      }
    }

    // CHECK 4: Try to create test post
    if (products && products.length > 0) {
      const testProduct = products[0];
      
      const testPostData = {
        user_id: userId,
        product_id: testProduct.id,
        platform: 'pinterest',
        post_type: 'product_promo',
        caption: 'Test post for diagnostic purposes',
        post_url: 'https://pinterest.com/test',
        status: 'posted',
        posted_at: new Date().toISOString()
      };

      const { data: testPost, error: postError } = await (supabase as any)
        .from('posted_content')
        .insert(testPostData)
        .select()
        .maybeSingle();

      diagnosis.testInserts.post = {
        success: !postError,
        data: testPostData,
        result: testPost,
        error: postError?.message,
        errorDetails: postError
      };

      if (postError) {
        diagnosis.errors.push(`Post insert: ${postError.message}`);
      } else if (testPost) {
        // Clean up test post
        await (supabase as any)
          .from('posted_content')
          .delete()
          .eq('id', testPost.id);
      }
    }

    // CHECK 5: Existing data counts
    const [
      { count: existingLinks },
      { count: existingContent },
      { count: existingPosts }
    ] = await Promise.all([
      (supabase as any).from('affiliate_links').select('*', { count: 'exact', head: true }).eq('user_id', userId),
      (supabase as any).from('generated_content').select('*', { count: 'exact', head: true }).eq('user_id', userId),
      (supabase as any).from('posted_content').select('*', { count: 'exact', head: true }).eq('user_id', userId)
    ]);

    diagnosis.database.existingCounts = {
      links: existingLinks || 0,
      content: existingContent || 0,
      posts: existingPosts || 0
    };

    return res.status(200).json({
      success: true,
      diagnosis,
      summary: {
        productsFound: products?.length || 0,
        canCreateLinks: diagnosis.testInserts.link?.success || false,
        canCreateContent: diagnosis.testInserts.content?.success || false,
        canCreatePosts: diagnosis.testInserts.post?.success || false,
        totalErrors: diagnosis.errors.length
      }
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}