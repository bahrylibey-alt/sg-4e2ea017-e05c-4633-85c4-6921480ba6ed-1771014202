import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { affiliateLinkService } from "@/services/affiliateLinkService";
import { productCatalogService } from "@/services/productCatalogService";
import { authService } from "@/services/authService";

export default function TestLinks() {
  const [testResults, setTestResults] = useState<any[]>([]);
  const [testing, setTesting] = useState(false);

  const runLinkTest = async () => {
    setTesting(true);
    setTestResults([]);
    const results: any[] = [];

    try {
      // Check authentication
      const session = await authService.getCurrentSession();
      if (!session) {
        results.push({ test: "Auth", status: "FAIL", message: "Not logged in" });
        setTestResults(results);
        setTesting(false);
        return;
      }
      results.push({ test: "Auth", status: "PASS", message: `Logged in as ${session.user.email}` });

      // Get a test product
      const products = productCatalogService.getHighConvertingProducts(10);
      const testProduct = products[0];
      results.push({ 
        test: "Product Catalog", 
        status: "PASS", 
        message: `Found ${products.length} products. Testing with: ${testProduct.name}` 
      });

      // Test link creation with EXPLICIT undefined product_id
      console.log("🧪 Creating test link with productId: undefined");
      const linkResult = await affiliateLinkService.createAffiliateLink({
        productId: undefined, // CRITICAL: Must be undefined for catalog products
        productName: testProduct.name,
        destinationUrl: testProduct.url,
        network: testProduct.network,
        commissionRate: parseFloat(testProduct.commission.replace(/[^0-9.]/g, "")) || 0
      });

      if (linkResult.success && linkResult.link) {
        results.push({ 
          test: "Link Creation", 
          status: "PASS", 
          message: `Created link: ${linkResult.shortUrl}`,
          link: linkResult.shortUrl,
          destination: testProduct.url
        });

        // Test link lookup
        const { links: lookupResult } = await affiliateLinkService.getUserLinks();
        const foundLink = lookupResult?.find((l: any) => l.id === linkResult.link?.id);
        
        if (foundLink) {
          results.push({ 
            test: "Link Lookup", 
            status: "PASS", 
            message: `Found link in database. Destination: ${foundLink.original_url}` 
          });
        } else {
          results.push({ 
            test: "Link Lookup", 
            status: "FAIL", 
            message: "Link not found in database" 
          });
        }
      } else {
        results.push({ 
          test: "Link Creation", 
          status: "FAIL", 
          message: linkResult.error || "Unknown error" 
        });
      }

    } catch (error: any) {
      results.push({ 
        test: "System", 
        status: "ERROR", 
        message: error.message 
      });
    }

    setTestResults(results);
    setTesting(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>🔗 Affiliate Link System Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={runLinkTest} 
            disabled={testing}
            className="w-full"
          >
            {testing ? "Testing..." : "Run Link Test"}
          </Button>

          {testResults.length > 0 && (
            <div className="space-y-2 mt-4">
              {testResults.map((result, i) => (
                <div 
                  key={i}
                  className={`p-4 rounded-lg border ${
                    result.status === "PASS" 
                      ? "bg-green-50 border-green-200" 
                      : result.status === "FAIL"
                      ? "bg-red-50 border-red-200"
                      : "bg-yellow-50 border-yellow-200"
                  }`}
                >
                  <div className="font-bold">
                    {result.status === "PASS" ? "✅" : result.status === "FAIL" ? "❌" : "⚠️"} {result.test}
                  </div>
                  <div className="text-sm mt-1">{result.message}</div>
                  {result.link && (
                    <div className="mt-2">
                      <a 
                        href={result.link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline text-sm"
                      >
                        Test Link: {result.link}
                      </a>
                      <div className="text-xs text-gray-500 mt-1">
                        Destination: {result.destination}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-bold mb-2">📋 Test Instructions:</h3>
            <ol className="text-sm space-y-1 list-decimal list-inside">
              <li>Click "Run Link Test" to create a test affiliate link</li>
              <li>If all tests pass (✅), click the generated test link</li>
              <li>It should redirect to a real Amazon product page (not 404)</li>
              <li>If it works, the UUID error is completely fixed!</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}