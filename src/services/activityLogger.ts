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
        await supabase.from("activity_logs").insert({
          user_id: user.id,
          action,
          status,
          details,
          metadata: metadata || null
        });
      }
    } catch (err) {
      console.warn("Failed to save activity log:", err);
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
      if (!user) return [];

      const { data, error } = await supabase
        .from("activity_logs")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) {
        console.error("Failed to fetch logs:", error);
        return [];
      }

      // Map database records to ActivityLog interface
      return (data || []).map(log => ({
        id: log.id,
        user_id: log.user_id,
        timestamp: log.created_at, // Map created_at to timestamp
        action: log.action,
        status: log.status as "started" | "success" | "error" | "info",
        details: log.details,
        metadata: log.metadata as Record<string, any> | undefined
      }));
    } catch (err) {
      console.error("Exception fetching logs:", err);
      return [];
    }
  },

  /**
   * Clear session logs
   */
  clearLogs() {
    this.logs = [];
  }
};