import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/integrations/supabase/client";

/**
 * POSTBACK HANDLER - Real Conversion Tracking
 * 
 * Receives conversion notifications from affiliate networks
 * This is how REAL revenue is tracked - NOT generated
 * 
 * URL Format: /api/postback?network=amazon&click_id=xxx&amount=50.00&order_id=yyy
 */

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const {
      network,
      click_id,
      amount,
      order_id,
      commission,
      status = 'pending'
    } = req.query;

    console.log('📬 POSTBACK RECEIVED:', {
      network,
      click_id,
      amount,
      order_id,
      commission,
      status
    });

    // Validate required fields
    if (!network || !click_id || !amount) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: network, click_id, amount'
      });
    }

    const networkStr = Array.isArray(network) ? network[0] : network;
    const clickIdStr = Array.isArray(click_id) ? click_id[0] : click_id;
    const amountStr = Array.isArray(amount) ? amount[0] : amount;
    const orderIdStr = order_id ? (Array.isArray(order_id) ? order_id[0] : order_id) : undefined;
    const statusStr = Array.isArray(status) ? status[0] : status;

    // Parse amount and commission
    const revenue = parseFloat(amountStr);
    const commissionAmount = commission ? parseFloat(Array.isArray(commission) ? commission[0] : commission) : revenue * 0.05;

    // Find the click event
    const { data: clickEvent } = await supabase
      .from('click_events')
      .select('id, link_id, user_id, content_id')
      .eq('id', clickIdStr)
      .maybeSingle();

    if (!clickEvent) {
      console.error('❌ Click event not found:', clickIdStr);
      return res.status(404).json({
        success: false,
        error: 'Click event not found'
      });
    }

    // Record the conversion
    const { data: conversion, error: conversionError } = await supabase
      .from('conversion_events')
      .insert({
        click_id: clickEvent.id,
        content_id: clickEvent.content_id,
        user_id: clickEvent.user_id,
        revenue: revenue,
        commission: commissionAmount,
        source: networkStr,
        order_id: orderIdStr,
        status: statusStr,
        converted_at: new Date().toISOString()
      })
      .select()
      .single();

    if (conversionError) {
      console.error('❌ Failed to record conversion:', conversionError);
      return res.status(500).json({
        success: false,
        error: 'Failed to record conversion'
      });
    }

    // Update click event to mark as converted
    await supabase
      .from('click_events')
      .update({ converted: true })
      .eq('id', clickEvent.id);

    // Update affiliate link stats
    if (clickEvent.link_id) {
      const { data: link } = await supabase
        .from('affiliate_links')
        .select('conversions, revenue')
        .eq('id', clickEvent.link_id)
        .single();

      if (link) {
        await supabase
          .from('affiliate_links')
          .update({
            conversions: (link.conversions || 0) + 1,
            revenue: (link.revenue || 0) + revenue
          })
          .eq('id', clickEvent.link_id);
      }
    }

    console.log('✅ Conversion recorded:', conversion.id);

    return res.status(200).json({
      success: true,
      conversion_id: conversion.id,
      revenue: revenue,
      commission: commissionAmount,
      message: 'Conversion tracked successfully'
    });

  } catch (error: any) {
    console.error('❌ POSTBACK ERROR:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}