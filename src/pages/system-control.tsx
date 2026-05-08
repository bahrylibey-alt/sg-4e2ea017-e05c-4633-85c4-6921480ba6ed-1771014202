import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, PlayCircle, TestTube, CheckCircle, AlertTriangle, XCircle } from "lucide-react";

export default function SystemControl() {
  const [activating, setActivating] = useState(false);
  const [testing, setTesting] = useState(false);
  const [activationResult, setActivationResult] = useState<any>(null);
  const [testResult, setTestResult] = useState<any>(null);

  const activateSystem = async () => {
    setActivating(true);
    setActivationResult(null);
    try {
      const response = await fetch('/api/system/activate-full-system');
      const data = await response.json();
      setActivationResult(data);
    } catch (error: any) {
      setActivationResult({ success: false, error: error.message });
    } finally {
      setActivating(false);
    }
  };

  const runEndToEndTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const response = await fetch('/api/system/end-to-end-test');
      const data = await response.json();
      setTestResult(data);
    } catch (error: any) {
      setTestResult({ success: false, error: error.message });
    } finally {
      setTesting(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'SUCCESS':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'WARNING':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'FAILED':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-gray-900">System Control Center</h1>
          <p className="text-lg text-gray-600">Activate and test the autonomous affiliate system</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Activation Card */}
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PlayCircle className="h-6 w-6 text-green-600" />
                System Activation
              </CardTitle>
              <CardDescription>
                Initialize and start the autonomous engine
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                onClick={activateSystem}
                disabled={activating}
                className="w-full"
                size="lg"
              >
                {activating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Activating System...
                  </>
                ) : (
                  <>
                    <PlayCircle className="mr-2 h-4 w-4" />
                    Activate Full System
                  </>
                )}
              </Button>

              {activationResult && (
                <div className="space-y-2 p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    {activationResult.success ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500" />
                    )}
                    <span className="font-semibold">
                      {activationResult.success ? 'System Activated!' : 'Activation Failed'}
                    </span>
                  </div>
                  
                  {activationResult.activationProgress && (
                    <p className="text-sm text-gray-600">
                      Progress: {activationResult.activationProgress}
                    </p>
                  )}

                  {activationResult.steps && (
                    <div className="mt-4 space-y-2">
                      {activationResult.steps.map((step: any, i: number) => (
                        <div key={i} className="flex items-center gap-2 text-sm">
                          {getStatusIcon(step.status)}
                          <span className={step.status === 'SUCCESS' ? 'text-gray-700' : 'text-gray-500'}>
                            {step.step}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {activationResult.error && (
                    <p className="text-sm text-red-600 mt-2">{activationResult.error}</p>
                  )}

                  {activationResult.nextSteps && (
                    <div className="mt-4 p-3 bg-blue-50 rounded">
                      <p className="font-semibold text-sm mb-2">Next Steps:</p>
                      <ul className="text-xs space-y-1">
                        {activationResult.nextSteps.map((step: string, i: number) => (
                          <li key={i}>• {step}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Testing Card */}
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TestTube className="h-6 w-6 text-blue-600" />
                End-to-End Test
              </CardTitle>
              <CardDescription>
                Validate complete system functionality
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                onClick={runEndToEndTest}
                disabled={testing}
                variant="outline"
                className="w-full"
                size="lg"
              >
                {testing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Running Tests...
                  </>
                ) : (
                  <>
                    <TestTube className="mr-2 h-4 w-4" />
                    Run System Test
                  </>
                )}
              </Button>

              {testResult && (
                <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {testResult.success ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <AlertTriangle className="h-5 w-5 text-yellow-500" />
                      )}
                      <span className="font-semibold">System Health</span>
                    </div>
                    <Badge variant={testResult.healthScore >= 80 ? 'default' : 'secondary'}>
                      {testResult.healthScore}%
                    </Badge>
                  </div>

                  {testResult.summary && (
                    <div className="grid grid-cols-3 gap-2 text-center text-sm">
                      <div className="bg-green-50 p-2 rounded">
                        <div className="font-bold text-green-700">{testResult.summary.passed}</div>
                        <div className="text-xs text-gray-600">Passed</div>
                      </div>
                      <div className="bg-yellow-50 p-2 rounded">
                        <div className="font-bold text-yellow-700">{testResult.summary.warnings}</div>
                        <div className="text-xs text-gray-600">Warnings</div>
                      </div>
                      <div className="bg-red-50 p-2 rounded">
                        <div className="font-bold text-red-700">{testResult.summary.failed}</div>
                        <div className="text-xs text-gray-600">Failed</div>
                      </div>
                    </div>
                  )}

                  {testResult.results && (
                    <div className="mt-4 space-y-2 max-h-64 overflow-y-auto">
                      {testResult.results.map((result: any, i: number) => (
                        <div key={i} className="flex items-start gap-2 text-sm p-2 bg-white rounded">
                          {getStatusIcon(result.status)}
                          <div className="flex-1">
                            <div className="font-medium">{result.step}</div>
                            {result.count !== undefined && (
                              <div className="text-xs text-gray-600">Count: {result.count}</div>
                            )}
                            {result.message && (
                              <div className="text-xs text-yellow-600">{result.message}</div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {testResult.recommendations && testResult.recommendations.length > 0 && (
                    <div className="mt-4 p-3 bg-yellow-50 rounded border border-yellow-200">
                      <p className="font-semibold text-sm mb-2">Recommendations:</p>
                      <ul className="text-xs space-y-1">
                        {testResult.recommendations.map((rec: string, i: number) => (
                          <li key={i}>• {rec}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {testResult.duration && (
                    <p className="text-xs text-gray-500 text-center mt-2">
                      Completed in {testResult.duration}
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* System Info */}
        <Card>
          <CardHeader>
            <CardTitle>System Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <h3 className="font-semibold text-sm">Upgraded Features</h3>
                <ul className="text-xs text-gray-600 space-y-1">
                  <li>✅ 12 Advanced Traffic Tactics</li>
                  <li>✅ Influencer Outreach Engine</li>
                  <li>✅ Viral Loop Systems</li>
                  <li>✅ SEO Automation</li>
                  <li>✅ Smart Content Syndication</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold text-sm">Autonomous Features</h3>
                <ul className="text-xs text-gray-600 space-y-1">
                  <li>🤖 Product Discovery</li>
                  <li>🤖 Content Generation</li>
                  <li>🤖 Traffic Distribution</li>
                  <li>🤖 Performance Optimization</li>
                  <li>🤖 Self-Healing</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold text-sm">Traffic Sources</h3>
                <ul className="text-xs text-gray-600 space-y-1">
                  <li>📱 Social Media (9 platforms)</li>
                  <li>🔍 SEO & Content Marketing</li>
                  <li>📧 Email & Community</li>
                  <li>🎯 Paid Advertising</li>
                  <li>🔗 Partnership Networks</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}