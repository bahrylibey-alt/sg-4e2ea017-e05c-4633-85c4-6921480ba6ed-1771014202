import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

/**
 * NOTIFICATION SERVICE v1.0
 * Alerts users when content hits view milestones
 */

export interface ViewThreshold {
  threshold: number;
  label: string;
  icon: string;
}

export const VIEW_THRESHOLDS: ViewThreshold[] = [
  { threshold: 100, label: "First 100 Views!", icon: "🎉" },
  { threshold: 500, label: "500 Views - Going Viral!", icon: "🚀" },
  { threshold: 1000, label: "1,000 Views - Viral Content!", icon: "🔥" },
  { threshold: 5000, label: "5,000 Views - Major Hit!", icon: "⭐" },
  { threshold: 10000, label: "10K Views - Superstar!", icon: "💎" }
];

/**
 * Check for view threshold notifications
 * Returns number of notifications sent
 */
export async function checkViewThresholdNotifications(userId: string): Promise<number> {
  try {
    console.log("🔔 Checking view threshold notifications...");

    // Get all posted content with impressions
    const { data: posts, error } = await supabase
      .from("posted_content")
      .select("id, caption, platform, impressions, clicks, conversions")
      .eq("user_id", userId)
      .eq("status", "posted")
      .not("posted_at", "is", null)
      .order("posted_at", { ascending: false });

    if (error) {
      console.error("Error fetching posts:", error);
      return 0;
    }

    if (!posts || posts.length === 0) {
      return 0;
    }

    let notificationsSent = 0;

    // Check each post for threshold crossings
    for (const post of posts) {
      const views = post.impressions || 0;
      
      // Find the highest threshold this post has reached
      const reachedThresholds = VIEW_THRESHOLDS.filter(t => views >= t.threshold);
      
      if (reachedThresholds.length === 0) continue;

      // Get the highest threshold reached
      const highestThreshold = reachedThresholds[reachedThresholds.length - 1];

      // Check if we've already notified for this threshold
      const { data: existingNotification } = await supabase
        .from("view_threshold_notifications")
        .select("id")
        .eq("post_id", post.id)
        .eq("threshold", highestThreshold.threshold)
        .maybeSingle();

      // Only notify if we haven't already
      if (!existingNotification) {
        // Create notification record
        await supabase
          .from("view_threshold_notifications")
          .insert({
            user_id: userId,
            post_id: post.id,
            threshold: highestThreshold.threshold,
            views_at_notification: views,
            platform: post.platform
          });

        // Send in-app notification
        const truncatedCaption = post.caption?.substring(0, 50) || "Your post";
        
        toast({
          title: `${highestThreshold.icon} ${highestThreshold.label}`,
          description: `"${truncatedCaption}..." on ${post.platform}`,
          duration: 10000
        });

        // Log activity
        await supabase
          .from("activity_logs")
          .insert({
            user_id: userId,
            action: "view_threshold_reached",
            details: `Post reached ${highestThreshold.threshold} views on ${post.platform}`,
            metadata: {
              post_id: post.id,
              threshold: highestThreshold.threshold,
              views,
              clicks: post.clicks || 0,
              conversions: post.conversions || 0,
              platform: post.platform
            },
            status: "success"
          });

        notificationsSent++;
        console.log(`✅ Notification sent: ${highestThreshold.label} for post ${post.id}`);
      }
    }

    if (notificationsSent > 0) {
      console.log(`🔔 Sent ${notificationsSent} view threshold notifications`);
    }

    return notificationsSent;
  } catch (error) {
    console.error("Error checking view threshold notifications:", error);
    return 0;
  }
}

/**
 * Check for conversion notifications (when content generates sales)
 */
export async function checkConversionNotifications(userId: string): Promise<number> {
  try {
    console.log("💰 Checking conversion notifications...");

    // Get recent conversions (last 24 hours)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const { data: conversions, error } = await supabase
      .from("conversion_events")
      .select("*")
      .eq("user_id", userId)
      .eq("verified", true)
      .gte("created_at", oneDayAgo)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching conversions:", error);
      return 0;
    }

    if (!conversions || conversions.length === 0) {
      return 0;
    }

    let notificationsSent = 0;

    for (const conversion of conversions) {
      // Check if already notified
      const { data: existingNotification } = await supabase
        .from("conversion_notifications")
        .select("id")
        .eq("conversion_id", conversion.id)
        .maybeSingle();

      if (!existingNotification) {
        // Create notification record
        await supabase
          .from("conversion_notifications")
          .insert({
            user_id: userId,
            conversion_id: conversion.id,
            revenue: conversion.revenue
          });

        // Send notification
        toast({
          title: "💰 New Sale!",
          description: `Earned $${Number(conversion.revenue).toFixed(2)} from verified conversion`,
          duration: 15000
        });

        notificationsSent++;
      }
    }

    if (notificationsSent > 0) {
      console.log(`💰 Sent ${notificationsSent} conversion notifications`);
    }

    return notificationsSent;
  } catch (error) {
    console.error("Error checking conversion notifications:", error);
    return 0;
  }
}

/**
 * Check for traffic warnings (low performance alerts)
 */
export async function checkTrafficWarnings(userId: string): Promise<void> {
  try {
    // Get posts from last 24 hours with low views
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const { data: recentPosts } = await supabase
      .from("posted_content")
      .select("id, caption, platform, impressions, posted_at")
      .eq("user_id", userId)
      .eq("status", "posted")
      .gte("posted_at", oneDayAgo);

    if (!recentPosts || recentPosts.length === 0) return;

    // Check for posts with very low views after 6+ hours
    const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000);

    for (const post of recentPosts) {
      const postedAt = new Date(post.posted_at);
      const views = post.impressions || 0;

      // If posted more than 6 hours ago and has less than 20 views
      if (postedAt < sixHoursAgo && views < 20) {
        // Check if already warned
        const { data: existingWarning } = await supabase
          .from("traffic_warnings")
          .select("id")
          .eq("post_id", post.id)
          .maybeSingle();

        if (!existingWarning) {
          await supabase
            .from("traffic_warnings")
            .insert({
              user_id: userId,
              post_id: post.id,
              warning_type: "low_views",
              message: `Post has only ${views} views after 6+ hours`
            });

          console.log(`⚠️ Low views warning for post ${post.id}: ${views} views`);
        }
      }
    }
  } catch (error) {
    console.error("Error checking traffic warnings:", error);
  }
}

/**
 * Get user's notification settings
 */
export async function getNotificationSettings(userId: string) {
  try {
    const { data: settings } = await supabase
      .from("user_settings")
      .select("notification_email, notification_push")
      .eq("user_id", userId)
      .maybeSingle();

    return {
      emailEnabled: settings?.notification_email ?? true,
      pushEnabled: settings?.notification_push ?? true
    };
  } catch (error) {
    console.error("Error getting notification settings:", error);
    return {
      emailEnabled: true,
      pushEnabled: true
    };
  }
}

/**
 * Update notification settings
 */
export async function updateNotificationSettings(
  userId: string,
  settings: { emailEnabled?: boolean; pushEnabled?: boolean }
) {
  try {
    await supabase
      .from("user_settings")
      .update({
        notification_email: settings.emailEnabled,
        notification_push: settings.pushEnabled
      })
      .eq("user_id", userId);

    return true;
  } catch (error) {
    console.error("Error updating notification settings:", error);
    return false;
  }
}