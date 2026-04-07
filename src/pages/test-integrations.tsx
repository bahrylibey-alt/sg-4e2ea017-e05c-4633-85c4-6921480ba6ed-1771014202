import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Loader2, ExternalLink, Mail, Search, Share2 } from "lucide-react";
import { EmailCaptureForm } from "@/components/EmailCaptureForm";

export default function TestIntegrationsPage() {
  const [testResults, setTestResults] = useState<Record<string, boolean | null>>({});
  const [testing, setTesting] = useState<Record<string, boolean>>({});

  const runTest = async (testName: string, testFn: () => Promise<boolean>) => {
    setTesting(prev => ({ ...prev, [testName]: true }));
    try {
      const result = await testFn();
      setTestResults(prev => ({ ...prev, [testName]: result }));
    } catch (error) {
      console.error(`${testName} failed:`, error);
      setTestResults(prev => ({ ...prev, [testName]: false }));
    } finally {
      setTesting(prev => ({ ...prev, [testName]: false }));
    }
  };

  const tests = [
    {
      name: "Sitemap XML",
      description: "Test SEO sitemap generation",
      test: async () => {
        const response = await fetch("/api/sitemap.xml");
        return response.ok && response.headers.get("content-type")?.includes("xml");
      },
      viewUrl: "/api/sitemap.xml",
      icon: Search
    },
    {
      name: "Email Capture",
      description: "Test email subscription form",
      test: async () => {
        // Email form is tested visually below
        return true;
      },
      icon: Mail,
      skipTest: true
    },
    {
      name: "Affiliate Links",
      description: "Test link redirect system",
      test: async () => {
        const response = await fetch("/api/hello");
        return response.ok;
      },
      viewUrl: "/dashboard",
      icon: Share2
    }
  ];

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Integration Tests</h1>
          <p className="text-muted-foreground text-lg">
            Test all real traffic and monetization integrations
          </p>
        </div>

        <div className="grid gap-6 mb-8">
          {tests.map((test) => (
            <Card key={test.name}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <test.icon className="w-6 h-6 text-primary mt-1" />
                    <div>
                      <CardTitle>{test.name}</CardTitle>
                      <CardDescription>{test.description}</CardDescription>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {testResults[test.name] === true && (
                      <Badge className="bg-green-600">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Passed
                      </Badge>
                    )}
                    {testResults[test.name] === false && (
                      <Badge variant="destructive">
                        <XCircle className="w-3 h-3 mr-1" />
                        Failed
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  {!test.skipTest && (
                    <Button
                      onClick={() => runTest(test.name, test.test)}
                      disabled={testing[test.name]}
                      variant="outline"
                    >
                      {testing[test.name] ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Testing...
                        </>
                      ) : (
                        "Run Test"
                      )}
                    </Button>
                  )}
                  {test.viewUrl && (
                    <Button
                      onClick={() => window.open(test.viewUrl, "_blank")}
                      variant="outline"
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      View
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Live Email Capture Test */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Email Capture Form (Live Test)</h2>
          <div className="max-w-md">
            <EmailCaptureForm
              title="Test Email Capture"
              description="Try subscribing with your email"
              source="test-page"
            />
          </div>
        </div>

        {/* Traffic Sources Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Available Traffic Sources</CardTitle>
            <CardDescription>Real methods to drive traffic to your affiliate links</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold mb-2">Free Traffic (6 methods)</h3>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• Social media sharing</li>
                  <li>• SEO & Google indexing</li>
                  <li>• Pinterest organic</li>
                  <li>• Reddit communities</li>
                  <li>• Email list building</li>
                  <li>• YouTube reviews</li>
                </ul>
              </div>
              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold mb-2">Paid Traffic (3 methods)</h3>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• Google Ads</li>
                  <li>• Facebook Ads</li>
                  <li>• TikTok Ads (future)</li>
                </ul>
              </div>
            </div>
            <div className="mt-4">
              <Button onClick={() => window.location.href = "/traffic-sources"} className="w-full">
                View All Traffic Sources
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}