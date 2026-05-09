<![CDATA[
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { 
  Sparkles, 
  Copy, 
  Check,
  Loader2,
  TrendingUp,
  Hash,
  MessageSquare,
  Zap
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { aiContentGenerator } from "@/services/aiContentGenerator";

interface AIContentGeneratorProps {
  product?: {
    id: string;
    name: string;
    price: number;
    category: string;
    affiliate_url: string;
    image_url?: string;
  };
  userId: string;
}

export function AIContentGenerator({ product, userId }: AIContentGeneratorProps) {
  const [generating, setGenerating] = useState(false);
  const [generatedPosts, setGeneratedPosts] = useState<any[]>([]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const { toast } = useToast();

  const generateContent = async () => {
    if (!product) {
      toast({
        title: "No Product Selected",
        description: "Please select a product first",
        variant: "destructive"
      });
      return;
    }

    setGenerating(true);
    try {
      const posts = await aiContentGenerator.generateAllPlatforms(product, userId);
      setGeneratedPosts(posts);
      
      toast({
        title: "Content Generated!",
        description: `Created ${posts.length} platform-optimized posts`,
      });
    } catch (error: any) {
      toast({
        title: "Generation Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setGenerating(false);
    }
  };

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
    
    toast({
      title: "Copied!",
      description: "Post copied to clipboard",
    });
  };

  const platformIcons: Record<string, string> = {
    'tiktok': '🎵',
    'instagram': '📸',
    'pinterest': '📌',
    'twitter': '🐦',
    'facebook': '👥',
    'linkedin': '💼'
  };

  const platformColors: Record<string, string> = {
    'tiktok': 'bg-pink-100 border-pink-300',
    'instagram': 'bg-purple-100 border-purple-300',
    'pinterest': 'bg-red-100 border-red-300',
    'twitter': 'bg-blue-100 border-blue-300',
    'facebook': 'bg-blue-100 border-blue-300',
    'linkedin': 'bg-indigo-100 border-indigo-300'
  };

  return (
    <div className="space-y-6">
      {/* Generator Header */}
      <Card className="border-2 border-blue-500 bg-gradient-to-r from-blue-50 to-purple-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-blue-600" />
            AI Content Generator
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {product && (
            <div className="p-4 bg-white rounded-lg border">
              <div className="flex items-center gap-4">
                {product.image_url && (
                  <img 
                    src={product.image_url} 
                    alt={product.name}
                    className="w-16 h-16 object-cover rounded"
                  />
                )}
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{product.name}</h3>
                  <p className="text-sm text-gray-600">{product.category} • ${product.price}</p>
                </div>
              </div>
            </div>
          )}

          <Button 
            onClick={generateContent}
            disabled={generating || !product}
            className="w-full"
            size="lg"
          >
            {generating ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Generating Content...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-5 w-5" />
                Generate Social Media Posts
              </>
            )}
          </Button>

          <p className="text-xs text-gray-600 text-center">
            Automatically creates optimized posts for 6 platforms: TikTok, Instagram, Pinterest, Twitter, Facebook, LinkedIn
          </p>
        </CardContent>
      </Card>

      {/* Generated Posts */}
      {generatedPosts.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-blue-600" />
            Generated Posts ({generatedPosts.length})
          </h3>

          {generatedPosts.map((post, index) => (
            <Card key={index} className={`border-2 ${platformColors[post.platform]}`}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <span className="text-2xl">{platformIcons[post.platform]}</span>
                    {post.platform.charAt(0).toUpperCase() + post.platform.slice(1)}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">
                      <Zap className="h-3 w-3 mr-1" />
                      {post.estimated_engagement}% engagement
                    </Badge>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(`${post.caption}\n\n${post.hashtags.join(' ')}`, index)}
                    >
                      {copiedIndex === index ? (
                        <Check className="h-4 w-4 text-green-600" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Hook */}
                <div>
                  <div className="text-xs font-semibold text-gray-600 mb-1 flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    HOOK
                  </div>
                  <p className="text-sm font-medium text-gray-900 bg-yellow-50 p-2 rounded">
                    {post.hook}
                  </p>
                </div>

                {/* Caption */}
                <div>
                  <div className="text-xs font-semibold text-gray-600 mb-1 flex items-center gap-1">
                    <MessageSquare className="h-3 w-3" />
                    CAPTION
                  </div>
                  <Textarea 
                    value={post.caption}
                    readOnly
                    className="min-h-[150px] text-sm bg-white"
                  />
                </div>

                {/* Hashtags */}
                <div>
                  <div className="text-xs font-semibold text-gray-600 mb-1 flex items-center gap-1">
                    <Hash className="h-3 w-3" />
                    HASHTAGS ({post.hashtags.length})
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {post.hashtags.map((tag: string, tagIndex: number) => (
                      <Badge key={tagIndex} variant="outline" className="text-blue-600">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 pt-2 border-t">
                  <div className="text-center">
                    <div className="text-xs text-gray-600">Characters</div>
                    <div className="text-sm font-semibold">{post.character_count}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-gray-600">Emojis</div>
                    <div className="text-sm font-semibold">{post.emoji_count}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-gray-600">CTA</div>
                    <div className="text-sm font-semibold">{post.cta}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
</file_contents>
