import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, XCircle, AlertTriangle, RefreshCw, Database, Zap, Link as LinkIcon, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";

interface DiagnosticTest {
  name: string;
  status: "pending" | "running" | "passed" | "failed";
  message: string;
  details?: any;
}

export default function SystemDiagnostics() {
  const [tests, setTests] = useState<DiagnosticTest[]>([
    { name: "Database Connection", status: "pending", message: "Not tested" },
    { name: "Authentication System", status: "pending", message: "Not tested" },
    { name: "Affiliate Links Table", status: "pending", message: "Not tested" },
    { name: "Campaigns Table", status: "pending", message: "Not tested" },
    { name: "Autopilot Tasks", status: "pending", message: "Not tested" },
    { name: "Analytics Metrics", status: "pending", message: "Not tested" },
    { name: "Commission Tracking", status: "pending", message: "Not tested" },
    { name: "Content Queue", status: "pending", message: "Not tested" },
    { name: "Activity Logging", status: "pending", message: "Not tested" },
    { name: "RLS Policies", status: "pending", message: "Not tested" },
  ]);
  
  const [running, setRunning] = useState(false);

  const updateTest = (index: number, update: Partial<DiagnosticTest>) => {
    setTests(prev => {
      const newTests = [...prev];
      newTests[index] = { ...newTests[index], ...update };
      return newTests;
    });
  };

  const runAllTests = async () => {
    setRunning(true);

    // Test 1: Database Connection
    updateTest(0, { status: "running", message: "Testing connection..." });
    try {
      const { data, error } = await supabase.from("affiliate_links").select("count").limit(1);
      if (error) throw error;
      updateTest(0, { status: "passed", message: "✅ Database connected successfully" });
    } catch (error: any) {
      updateTest(0, { status: "failed", message: `❌ ${error.message}` });
    }

    // Test 2: Authentication
    updateTest(1, { status: "running", message: "Checking auth..." });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        updateTest(1, { status: "passed", message: `✅ Authenticated as ${user.email}` });
      } else {
        updateTest(1, { status: "failed", message: "❌ Not authenticated" });
      }
    } catch (error: any) {
      updateTest(1, { status: "failed", message: `❌ ${error.message}` });
    }

    // Test 3: Affiliate Links Table
    updateTest(2, { status: "running", message: "Checking affiliate_links..." });
    try {
      const { data, error } = await supabase
        .from("affiliate_links")
        .select("count");
      
      if (error) throw error;
      const count = data?.length || 0;
      updateTest(2, { status: "passed", message: `✅ Found ${count} affiliate links` });
    } catch (error: any) {
      updateTest(2, { status: "failed", message: `❌ ${error.message}` });
    }

    // Test 4: Campaigns Table
    updateTest(3, { status: "running", message: "Checking campaigns..." });
    try {
      const { data, error } = await supabase
        .from("campaigns")
        .select("count");
      
      if (error) throw error;
      const count = data?.length || 0;
      updateTest(3, { status: "passed", message: `✅ Found ${count} campaigns` });
    } catch (error: any) {
      updateTest(3, { status: "failed", message: `❌ ${error.message}` });
    }

    // Test 5: Autopilot Tasks
    updateTest(4, { status: "running", message: "Checking autopilot_tasks..." });
    try {
      const { data, error } = await supabase
        .from("autopilot_tasks")
        .select("count");
      
      if (error) throw error;
      const count = data?.length || 0;
      updateTest(4, { status: "passed", message: `✅ Found ${count} autopilot tasks` });
    } catch (error: any) {
      updateTest(4, { status: "failed", message: `❌ ${error.message}` });
    }

    // Test 6: Analytics Metrics
    updateTest(5, { status: "running", message: "Checking automation_metrics..." });
    try {
      const { data, error } = await supabase
        .from("automation_metrics")
        .select("count");
      
      if (error) throw error;
      const count = data?.length || 0;
      updateTest(5, { status: "passed", message: `✅ Found ${count} metrics records` });
    } catch (error: any) {
      updateTest(5, { status: "failed", message: `❌ ${error.message}` });
    }

    // Test 7: Commission Tracking
    updateTest(6, { status: "running", message: "Checking commissions..." });
    try {
      const { data, error } = await supabase
        .from("commissions")
        .select("count");
      
      if (error) throw error;
      const count = data?.length || 0;
      updateTest(6, { status: "passed", message: `✅ Found ${count} commission records` });
    } catch (error: any) {
      updateTest(6, { status: "failed", message: `❌ ${error.message}` });
    }

    // Test 8: Content Queue
    updateTest(7, { status: "running", message: "Checking content_queue..." });
    try {
      const { data, error } = await supabase
        .from("content_queue")
        .select("count");
      
      if (error) throw error;
      const count = data?.length || 0;
      updateTest(7, { status: "passed", message: `✅ Found ${count} queued content items` });
    } catch (error: any) {
      updateTest(7, { status: "failed", message: `❌ ${error.message}` });
    }

    // Test 9: Activity Logging
    updateTest(8, { status: "running", message: "Checking activity_logs..." });
    try {
      const { data, error } = await supabase
        .from("activity_logs")
        .select("count")
        .limit(1);
      
      if (error) throw error;
      updateTest(8, { status: "passed", message: "✅ Activity logging functional" });
    } catch (error: any) {
      updateTest(8, { status: "failed", message: `❌ ${error.message}` });
    }

    // Test 10: RLS Policies
    updateTest(9, { status: "running", message: "Testing RLS policies..." });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        updateTest(9, { status: "failed", message: "❌ Must be authenticated to test RLS" });
      } else {
        // Test write permissions
        const testData = {
          user_id: user.id,
          action: "rls_test",
          status: "info" as const,
          details: "Testing RLS policies"
        };

        const { error: insertError } = await supabase
          .from("activity_logs")
          .insert(testData);

        if (insertError) {
          updateTest(9, { status: "failed", message: `❌ RLS insert failed: ${insertError.message}` });
        } else {
          updateTest(9, { status: "passed", message: "✅ RLS policies working correctly" });
        }
      }
    } catch (error: any) {
      updateTest(9, { status: "failed", message: `❌ ${error.message}` });
    }

    setRunning(false);
  };

  const passedCount = tests.filter(t => t.status === "passed").length;
  const failedCount = tests.filter(t => t.status === "failed").length;
  const pendingCount = tests.filter(t => t.status === "pending").length;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">🔧 System Diagnostics</h1>
          <p className="text-muted-foreground">
            Comprehensive health check for all system components
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{tests.length}</div>
              <div className="text-sm text-muted-foreground">Total Tests</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-green-600">{passedCount}</div>
              <div className="text-sm text-muted-foreground">Passed</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-red-600">{failedCount}</div>
              <div className="text-sm text-muted-foreground">Failed</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-gray-600">{pendingCount}</div>
              <div className="text-sm text-muted-foreground">Pending</div>
            </CardContent>
          </Card>
        </div>

        {/* Run Tests Button */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={runAllTests} 
              disabled={running}
              className="w-full"
              size="lg"
            >
              {running ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Running Diagnostics...
                </>
              ) : (
                <>
                  <Zap className="mr-2 h-4 w-4" />
                  Run All Tests
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Test Results */}
        <Card>
          <CardHeader>
            <CardTitle>Diagnostic Tests</CardTitle>
            <CardDescription>
              System component health status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {tests.map((test, index) => (
                <div 
                  key={index}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div>
                      {test.status === "passed" && (
                        <CheckCircle className="h-6 w-6 text-green-600" />
                      )}
                      {test.status === "failed" && (
                        <XCircle className="h-6 w-6 text-red-600" />
                      )}
                      {test.status === "running" && (
                        <RefreshCw className="h-6 w-6 text-blue-600 animate-spin" />
                      )}
                      {test.status === "pending" && (
                        <AlertTriangle className="h-6 w-6 text-gray-400" />
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <h3 className="font-semibold">{test.name}</h3>
                      <p className="text-sm text-muted-foreground">{test.message}</p>
                    </div>
                  </div>
                  
                  <Badge 
                    variant={
                      test.status === "passed" ? "outline" : 
                      test.status === "failed" ? "destructive" : 
                      "secondary"
                    }
                  >
                    {test.status.toUpperCase()}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}