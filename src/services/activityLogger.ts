import { supabase } from "@/integrations/supabase/client";

export interface ActivityLog {
  id?: string;
  user_id?: string;
  timestamp: string;
  action: string;
  status: "started" | "success" | "error" | "info";
  details: string;
  metadata?: Record<string, any>;
}

export const activityLogger = {
  logs: [] as ActivityLog[],

  /**
   * Add a log entry
   */
  async log(
    action: string,
    status: "started" | "success" | "error" | "info",
    details: string,
    metadata?: Record<string, any>
  ) {
    const logEntry: ActivityLog = {
      timestamp: new Date().toISOString(),
      action,
      status,
      details,
      metadata
    };

    this.logs.push(logEntry);
    console.log(`[${status.toUpperCase()}] ${action}: ${details}`, metadata || "");

    // Try to save to database (non-blocking)
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { error } = await supabase.from("activity_logs").insert({
          user_id: user.id,
          action,
          status,
          details,
          metadata: metadata || null
        });
        
        if (error) {
          console.warn("Failed to save activity log to DB:", error);
        }
      }
    } catch (err) {
      console.warn("Exception saving activity log:", err);
    }

    return logEntry;
  },

  /**
   * Get all logs for current session
   */
  getLogs(): ActivityLog[] {
    return [...this.logs];
  },

  /**
   * Get recent logs from database
   */
  async getRecentLogs(limit: number = 50): Promise<ActivityLog[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log("No user found for activity logs");
        return [];
      }

      const { data, error } = await supabase
        .from("activity_logs")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) {
        console.error("Failed to fetch activity logs:", error);
        return [];
      }

      if (!data || data.length === 0) {
        console.log("No activity logs found in database");
        return [];
      }

      console.log(`✅ Loaded ${data.length} activity logs from database`);

      // Map database records to ActivityLog interface
      return data.map(log => ({
        id: log.id,
        user_id: log.user_id || undefined,
        timestamp: log.created_at,
        action: log.action,
        status: log.status as "started" | "success" | "error" | "info",
        details: log.details,
        metadata: (log.metadata as Record<string, any>) || undefined
      }));
    } catch (err) {
      console.error("Exception fetching activity logs:", err);
      return [];
    }
  },

  /**
   * Clear session logs
   */
  clearLogs() {
    this.logs = [];
  },

  /**
   * Log system activity (campaigns, links, etc.)
   */
  async logSystemActivity(
    action: string,
    details: string,
    metadata?: Record<string, any>
  ) {
    return this.log(action, "info", details, metadata);
  },

  /**
   * Log user action
   */
  async logUserAction(
    action: string,
    details: string,
    metadata?: Record<string, any>
  ) {
    return this.log(action, "success", details, metadata);
  }
};