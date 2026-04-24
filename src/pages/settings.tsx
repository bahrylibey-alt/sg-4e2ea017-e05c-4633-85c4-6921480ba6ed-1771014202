import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { mockAuthService } from "@/services/mockAuthService";
import { SEO } from "@/components/SEO";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Settings as SettingsIcon, Zap, Target, FileText, TrendingUp, Key, CheckCircle2, AlertCircle, Loader2, Eye, EyeOff } from "lucide-react";

interface AutopilotSettings {
  autopilot_frequency: string;
  content_generation_frequency: string;
  product_discovery_frequency: string;
  target_niches: string[];
  excluded_niches: string[];
  content_tone: string;
  content_length: string;
  use_emojis: boolean;
  use_hashtags: boolean;
  max_hashtags: number;
  enabled_platforms: string[];
  min_product_price: number;
  max_product_price: number;
  min_product_rating: number;
  preferred_networks: string[];
  auto_scale_winners: boolean;
  scale_threshold: number;
  pause_underperformers: boolean;
  pause_threshold: number;
}

const DEFAULT_SETTINGS: AutopilotSettings = {
  autopilot_frequency: 'every_30_minutes',
  content_generation_frequency: 'daily',
  product_discovery_frequency: 'daily',
  target_niches: [],
  excluded_niches: [],
  content_tone: 'conversational',
  content_length: 'medium',
  use_emojis: true,
  use_hashtags: true,
  max_hashtags: 5,
  enabled_platforms: ['pinterest', 'tiktok', 'twitter', 'facebook', 'instagram'],
  min_product_price: 10.00,
  max_product_price: 500.00,
  min_product_rating: 4.0,
  preferred_networks: ['amazon', 'aliexpress'],
  auto_scale_winners: true,
  scale_threshold: 100,
  pause_underperformers: true,
  pause_threshold: 20
};

export default function Settings() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<AutopilotSettings>(DEFAULT_SETTINGS);
  const [newNiche, setNewNiche] = useState("");
  const [newExcludedNiche, setNewExcludedNiche] = useState("");

  // API Keys state
  const [openaiApiKey, setOpenaiApiKey] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [testingApiKey, setTestingApiKey] = useState(false);
  const [apiKeyStatus, setApiKeyStatus] = useState<"valid" | "invalid" | null>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = () => {
    if (!mockAuthService.isAuthenticated()) {
      router.push('/dashboard');
      return;
    }
    loadSettings();
  };

  const loadSettings = () => {
    try {
      // Load settings from localStorage
      const savedSettings = localStorage.getItem('autopilot_settings');
      if (savedSettings) {
        setSettings(JSON.parse(savedSettings));
      }

      // Load OpenAI API key
      const savedKey = localStorage.getItem('openai_api_key');
      if (savedKey) {
        setOpenaiApiKey(savedKey);
        setApiKeyStatus('valid');
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      toast({
        title: "Error",
        description: "Failed to load settings",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const saveApiKey = () => {
    if (!openaiApiKey.trim()) {
      toast({
        title: "Error",
        description: "Please enter an API key",
        variant: "destructive"
      });
      return;
    }

    if (!openaiApiKey.startsWith('sk-')) {
      toast({
        title: "Invalid Format",
        description: "OpenAI API keys start with 'sk-'",
        variant: "destructive"
      });
      return;
    }

    localStorage.setItem('openai_api_key', openaiApiKey);
    setApiKeyStatus(null);
    toast({
      title: "Success",
      description: "OpenAI API key saved successfully"
    });
  };

  const testApiKey = async () => {
    if (!openaiApiKey.trim()) {
      toast({
        title: "Error",
        description: "Please enter an API key first",
        variant: "destructive"
      });
      return;
    }

    setTestingApiKey(true);
    setApiKeyStatus(null);

    try {
      const response = await fetch('https://api.openai.com/v1/models', {
        headers: {
          'Authorization': `Bearer ${openaiApiKey}`
        }
      });

      if (response.ok) {
        setApiKeyStatus('valid');
        toast({
          title: "Success",
          description: "API key is valid and working!"
        });
      } else {
        setApiKeyStatus('invalid');
        toast({
          title: "Invalid Key",
          description: "API key is invalid or expired",
          variant: "destructive"
        });
      }
    } catch (error) {
      setApiKeyStatus('invalid');
      toast({
        title: "Error",
        description: "Failed to test API key",
        variant: "destructive"
      });
    } finally {
      setTestingApiKey(false);
    }
  };

  const maskApiKey = (key: string) => {
    if (!key || key.length < 10) return key;
    return key.slice(0, 7) + '****' + '****' + '****' + key.slice(-4);
  };

  const saveSettings = () => {
    setSaving(true);
    try {
      // Save to localStorage
      localStorage.setItem('autopilot_settings', JSON.stringify(settings));
      
      toast({
        title: "Success",
        description: "Settings saved successfully"
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: "Error",
        description: "Failed to save settings",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const addNiche = () => {
    if (!newNiche.trim()) return;
    setSettings({
      ...settings,
      target_niches: [...settings.target_niches, newNiche.trim()]
    });
    setNewNiche("");
  };

  const removeNiche = (niche: string) => {
    setSettings({
      ...settings,
      target_niches: settings.target_niches.filter(n => n !== niche)
    });
  };

  const addExcludedNiche = () => {
    if (!newExcludedNiche.trim()) return;
    setSettings({
      ...settings,
      excluded_niches: [...settings.excluded_niches, newExcludedNiche.trim()]
    });
    setNewExcludedNiche("");
  };

  const removeExcludedNiche = (niche: string) => {
    setSettings({
      ...settings,
      excluded_niches: settings.excluded_niches.filter(n => n !== niche)
    });
  };

  const togglePlatform = (platform: string) => {
    const platforms = settings.enabled_platforms.includes(platform)
      ? settings.enabled_platforms.filter(p => p !== platform)
      : [...settings.enabled_platforms, platform];
    setSettings({ ...settings, enabled_platforms: platforms });
  };

  const toggleNetwork = (network: string) => {
    const networks = settings.preferred_networks.includes(network)
      ? settings.preferred_networks.filter(n => n !== network)
      : [...settings.preferred_networks, network];
    setSettings({ ...settings, preferred_networks: networks });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <SEO 
        title="Settings - AffiliatePro"
        description="Customize your autopilot settings"
      />
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
              <SettingsIcon className="h-8 w-8" />
              Settings
            </h1>
            <p className="text-muted-foreground">
              Manage your account, autopilot settings, and API integrations
            </p>
          </div>

          <Card className="mb-6 border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-background">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-primary" />
                Autopilot Status
              </CardTitle>
              <CardDescription>
                Master switch to enable or disable the entire autopilot system
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 bg-background rounded-lg border">
                <div className="space-y-1">
                  <div className="font-semibold text-lg">Autopilot Engine</div>
                  <div className="text-sm text-muted-foreground">
                    {settings.autopilot_frequency === 'every_15_minutes' ? 'Runs every 15 minutes' : 
                     settings.autopilot_frequency === 'every_30_minutes' ? 'Runs every 30 minutes' :
                     settings.autopilot_frequency === 'hourly' ? 'Runs every hour' :
                     settings.autopilot_frequency === 'every_6_hours' ? 'Runs every 6 hours' :
                     'Runs daily'}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <Badge variant="default" className="text-sm px-3 py-1">
                    ACTIVE
                  </Badge>
                  <div className="text-sm text-muted-foreground">
                    Auto-enabled when you save settings
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="api-keys" className="space-y-6">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="api-keys" className="flex items-center gap-2">
                <Key className="h-4 w-4" />
                API Keys
              </TabsTrigger>
              <TabsTrigger value="frequency" className="flex items-center gap-2">
                <Zap className="h-4 w-4" />
                Frequency
              </TabsTrigger>
              <TabsTrigger value="niches" className="flex items-center gap-2">
                <Target className="h-4 w-4" />
                Niches
              </TabsTrigger>
              <TabsTrigger value="content" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Content
              </TabsTrigger>
              <TabsTrigger value="advanced" className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Advanced
              </TabsTrigger>
            </TabsList>

            {/* API Keys Tab */}
            <TabsContent value="api-keys" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Key className="h-5 w-5" />
                    OpenAI API Key
                  </CardTitle>
                  <CardDescription>
                    Configure your OpenAI API key for AI-powered content generation, product discovery, and automation
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Your API key is stored securely in your browser's local storage and is never sent to our servers.
                      Get your API key from <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-medium">OpenAI Platform</a>
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-2">
                    <Label htmlFor="openai-key">OpenAI API Key</Label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Key className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="openai-key"
                          type={showApiKey ? "text" : "password"}
                          placeholder="sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                          className="pl-10 pr-10"
                          value={openaiApiKey}
                          onChange={(e) => setOpenaiApiKey(e.target.value)}
                        />
                        <button
                          type="button"
                          onClick={() => setShowApiKey(!showApiKey)}
                          className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                        >
                          {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      <Button onClick={saveApiKey} variant="outline">
                        Save
                      </Button>
                      <Button onClick={testApiKey} disabled={testingApiKey}>
                        {testingApiKey ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Testing...
                          </>
                        ) : (
                          "Test"
                        )}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Format: sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
                    </p>
                  </div>

                  {apiKeyStatus && (
                    <Alert variant={apiKeyStatus === 'valid' ? 'default' : 'destructive'}>
                      {apiKeyStatus === 'valid' ? (
                        <>
                          <CheckCircle2 className="h-4 w-4" />
                          <AlertDescription>
                            ✅ API key is valid and working! Your AI features are ready to use.
                          </AlertDescription>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>
                            ❌ API key is invalid or expired. Please check your key and try again.
                          </AlertDescription>
                        </>
                      )}
                    </Alert>
                  )}

                  <div className="p-4 bg-muted rounded-lg space-y-3">
                    <div className="font-semibold">Current Status:</div>
                    <div className="flex items-center gap-2">
                      <div className={`h-2 w-2 rounded-full ${openaiApiKey ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                      <span className="text-sm">
                        {openaiApiKey ? `API Key Set: ${maskApiKey(openaiApiKey)}` : 'No API key configured'}
                      </span>
                    </div>
                    {apiKeyStatus === 'valid' && (
                      <div className="text-xs text-muted-foreground">
                        Last verified: {new Date().toLocaleString()}
                      </div>
                    )}
                  </div>

                  <div className="space-y-3 pt-4 border-t">
                    <div className="font-semibold text-sm">How to get your OpenAI API key:</div>
                    <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                      <li>Visit <a href="https://platform.openai.com/signup" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">OpenAI Platform</a> and sign up/login</li>
                      <li>Navigate to <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">API Keys</a> section</li>
                      <li>Click "Create new secret key"</li>
                      <li>Copy the key (starts with "sk-proj-") and paste it above</li>
                      <li>Click "Save" then "Test" to verify</li>
                    </ol>
                  </div>

                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Important:</strong> OpenAI charges based on usage. Monitor your usage at <a href="https://platform.openai.com/usage" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">OpenAI Usage Dashboard</a>
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Frequency Tab */}
            <TabsContent value="frequency" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Automation Frequency</CardTitle>
                  <CardDescription>
                    Control how often the autopilot runs different tasks
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label>Autopilot Cycle Frequency</Label>
                    <Select
                      value={settings.autopilot_frequency}
                      onValueChange={(value) => setSettings({ ...settings, autopilot_frequency: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="every_15_minutes">Every 15 Minutes</SelectItem>
                        <SelectItem value="every_30_minutes">Every 30 Minutes</SelectItem>
                        <SelectItem value="hourly">Hourly</SelectItem>
                        <SelectItem value="every_6_hours">Every 6 Hours</SelectItem>
                        <SelectItem value="daily">Daily</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-muted-foreground">
                      How often the autopilot scores products and generates recommendations
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Content Generation Frequency</Label>
                    <Select
                      value={settings.content_generation_frequency}
                      onValueChange={(value) => setSettings({ ...settings, content_generation_frequency: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hourly">Hourly</SelectItem>
                        <SelectItem value="every_6_hours">Every 6 Hours</SelectItem>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-muted-foreground">
                      How often new content variations are created
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Product Discovery Frequency</Label>
                    <Select
                      value={settings.product_discovery_frequency}
                      onValueChange={(value) => setSettings({ ...settings, product_discovery_frequency: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-muted-foreground">
                      How often the system discovers new products from affiliate networks
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Niches Tab */}
            <TabsContent value="niches" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Target Niches</CardTitle>
                  <CardDescription>
                    Specify which product niches to focus on
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label>Add Target Niche</Label>
                    <div className="flex gap-2">
                      <Input
                        value={newNiche}
                        onChange={(e) => setNewNiche(e.target.value)}
                        placeholder="e.g., Fitness, Technology, Fashion"
                        onKeyPress={(e) => e.key === 'Enter' && addNiche()}
                      />
                      <Button onClick={addNiche}>Add</Button>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-4">
                      {settings.target_niches.map((niche) => (
                        <Badge key={niche} variant="secondary" className="cursor-pointer" onClick={() => removeNiche(niche)}>
                          {niche} ×
                        </Badge>
                      ))}
                      {settings.target_niches.length === 0 && (
                        <p className="text-sm text-muted-foreground">No target niches set (will discover all niches)</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Exclude Niches</Label>
                    <div className="flex gap-2">
                      <Input
                        value={newExcludedNiche}
                        onChange={(e) => setNewExcludedNiche(e.target.value)}
                        placeholder="e.g., Controversial topics"
                        onKeyPress={(e) => e.key === 'Enter' && addExcludedNiche()}
                      />
                      <Button onClick={addExcludedNiche} variant="outline">Add</Button>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-4">
                      {settings.excluded_niches.map((niche) => (
                        <Badge key={niche} variant="destructive" className="cursor-pointer" onClick={() => removeExcludedNiche(niche)}>
                          {niche} ×
                        </Badge>
                      ))}
                      {settings.excluded_niches.length === 0 && (
                        <p className="text-sm text-muted-foreground">No excluded niches</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Preferred Affiliate Networks</Label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {['amazon', 'aliexpress', 'clickbank', 'ebay', 'shareasale', 'temu'].map((network) => (
                        <Button
                          key={network}
                          variant={settings.preferred_networks.includes(network) ? "default" : "outline"}
                          onClick={() => toggleNetwork(network)}
                          className="capitalize"
                        >
                          {network}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Minimum Product Price ($)</Label>
                      <Input
                        type="number"
                        value={settings.min_product_price}
                        onChange={(e) => setSettings({ ...settings, min_product_price: parseFloat(e.target.value) })}
                        min="0"
                        step="0.01"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Maximum Product Price ($)</Label>
                      <Input
                        type="number"
                        value={settings.max_product_price}
                        onChange={(e) => setSettings({ ...settings, max_product_price: parseFloat(e.target.value) })}
                        min="0"
                        step="0.01"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Minimum Product Rating</Label>
                    <Input
                      type="number"
                      value={settings.min_product_rating}
                      onChange={(e) => setSettings({ ...settings, min_product_rating: parseFloat(e.target.value) })}
                      min="0"
                      max="5"
                      step="0.1"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Content Tab */}
            <TabsContent value="content" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Content Generation Preferences</CardTitle>
                  <CardDescription>
                    Customize how content is created for your campaigns
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label>Content Tone</Label>
                    <Select
                      value={settings.content_tone}
                      onValueChange={(value) => setSettings({ ...settings, content_tone: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="professional">Professional</SelectItem>
                        <SelectItem value="conversational">Conversational (Recommended)</SelectItem>
                        <SelectItem value="casual">Casual</SelectItem>
                        <SelectItem value="enthusiastic">Enthusiastic</SelectItem>
                        <SelectItem value="educational">Educational</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Content Length</Label>
                    <Select
                      value={settings.content_length}
                      onValueChange={(value) => setSettings({ ...settings, content_length: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="short">Short (Twitter-style)</SelectItem>
                        <SelectItem value="medium">Medium (Recommended)</SelectItem>
                        <SelectItem value="long">Long (Blog-style)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Use Emojis</Label>
                      <p className="text-sm text-muted-foreground">
                        Add emojis to make content more engaging
                      </p>
                    </div>
                    <Switch
                      checked={settings.use_emojis}
                      onCheckedChange={(checked) => setSettings({ ...settings, use_emojis: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Use Hashtags</Label>
                      <p className="text-sm text-muted-foreground">
                        Include relevant hashtags for better reach
                      </p>
                    </div>
                    <Switch
                      checked={settings.use_hashtags}
                      onCheckedChange={(checked) => setSettings({ ...settings, use_hashtags: checked })}
                    />
                  </div>

                  {settings.use_hashtags && (
                    <div className="space-y-2">
                      <Label>Maximum Hashtags per Post</Label>
                      <Input
                        type="number"
                        value={settings.max_hashtags}
                        onChange={(e) => setSettings({ ...settings, max_hashtags: parseInt(e.target.value) })}
                        min="0"
                        max="30"
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label>Enabled Platforms</Label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {['pinterest', 'tiktok', 'twitter', 'facebook', 'instagram', 'reddit', 'linkedin', 'youtube'].map((platform) => (
                        <Button
                          key={platform}
                          variant={settings.enabled_platforms.includes(platform) ? "default" : "outline"}
                          onClick={() => togglePlatform(platform)}
                          className="capitalize"
                        >
                          {platform}
                        </Button>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Advanced Tab */}
            <TabsContent value="advanced" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Advanced Autopilot Settings</CardTitle>
                  <CardDescription>
                    Fine-tune scaling and optimization behavior
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Auto-Scale Winners</Label>
                      <p className="text-sm text-muted-foreground">
                        Automatically increase budget for high-performing campaigns
                      </p>
                    </div>
                    <Switch
                      checked={settings.auto_scale_winners}
                      onCheckedChange={(checked) => setSettings({ ...settings, auto_scale_winners: checked })}
                    />
                  </div>

                  {settings.auto_scale_winners && (
                    <div className="space-y-2">
                      <Label>Scale Threshold (Clicks)</Label>
                      <Input
                        type="number"
                        value={settings.scale_threshold}
                        onChange={(e) => setSettings({ ...settings, scale_threshold: parseInt(e.target.value) })}
                        min="1"
                      />
                      <p className="text-sm text-muted-foreground">
                        Products with more than this many clicks will be scaled
                      </p>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Pause Underperformers</Label>
                      <p className="text-sm text-muted-foreground">
                        Automatically pause campaigns with low performance
                      </p>
                    </div>
                    <Switch
                      checked={settings.pause_underperformers}
                      onCheckedChange={(checked) => setSettings({ ...settings, pause_underperformers: checked })}
                    />
                  </div>

                  {settings.pause_underperformers && (
                    <div className="space-y-2">
                      <Label>Pause Threshold (Clicks)</Label>
                      <Input
                        type="number"
                        value={settings.pause_threshold}
                        onChange={(e) => setSettings({ ...settings, pause_threshold: parseInt(e.target.value) })}
                        min="1"
                      />
                      <p className="text-sm text-muted-foreground">
                        Products with fewer than this many clicks after 7 days will be paused
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <div className="mt-8 flex justify-end">
            <Button onClick={saveSettings} disabled={saving} size="lg">
              {saving ? 'Saving...' : 'Save All Settings'}
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    </>
  );
}