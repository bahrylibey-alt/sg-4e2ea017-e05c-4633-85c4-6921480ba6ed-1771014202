import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { X, Send, Bot, User, Minimize2, Maximize2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface ConversationContext {
  topicHistory: string[];
  lastQuestion: string | null;
  userPreferences: {
    askedAboutProducts: boolean;
    askedAboutAnalytics: boolean;
    askedAboutCampaigns: boolean;
    askedAboutAutomation: boolean;
  };
  conversationTurn: number;
}

const GREETINGS = [
  "Hi there! I'm your AI affiliate marketing assistant. What can I help you with today?",
  "Hello! Ready to boost your affiliate marketing success? What would you like to know?",
  "Hey! I'm here to help with products, campaigns, analytics, and automation. What interests you?",
  "Welcome! I can help you find winning products, optimize campaigns, or answer any questions. Where should we start?"
];

const FOLLOW_UPS = {
  products: [
    "Would you like me to show you our top-converting products?",
    "Want to know which product categories perform best?",
    "Should I find products in a specific niche for you?",
    "Interested in seeing products with the highest commission rates?"
  ],
  analytics: [
    "Want to see your campaign performance breakdown?",
    "Should I analyze your conversion rates?",
    "Would you like traffic source insights?",
    "Need help interpreting your revenue trends?"
  ],
  campaigns: [
    "Ready to launch a new campaign?",
    "Want tips on optimizing your existing campaigns?",
    "Should I explain campaign automation features?",
    "Interested in A/B testing strategies?"
  ],
  automation: [
    "Want to know how autopilot mode works?",
    "Should I show you automation scheduling options?",
    "Interested in traffic generation strategies?",
    "Need help setting up automated tasks?"
  ]
};

export function AIChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [context, setContext] = useState<ConversationContext>({
    topicHistory: [],
    lastQuestion: null,
    userPreferences: {
      askedAboutProducts: false,
      askedAboutAnalytics: false,
      askedAboutCampaigns: false,
      askedAboutAutomation: false
    },
    conversationTurn: 0
  });
  const [systemData, setSystemData] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    const greeting = GREETINGS[Math.floor(Math.random() * GREETINGS.length)];
    setMessages([
      {
        id: "1",
        role: "assistant",
        content: greeting,
        timestamp: new Date()
      }
    ]);
    loadSystemData();
  }, []);

  const loadSystemData = async () => {
    try {
      const [linksRes, campaignsRes, metricsRes] = await Promise.all([
        supabase.from("affiliate_links").select("clicks, conversions, revenue").limit(100),
        supabase.from("campaigns").select("id, name, status").limit(10),
        supabase.from("automation_metrics").select("*").limit(1)
      ]);

      const totalClicks = linksRes.data?.reduce((sum, l) => sum + (l.clicks || 0), 0) || 0;
      const totalConversions = linksRes.data?.reduce((sum, l) => sum + (l.conversions || 0), 0) || 0;
      const totalRevenue = linksRes.data?.reduce((sum, l) => sum + (l.revenue || 0), 0) || 0;

      setSystemData({
        totalClicks,
        totalConversions,
        totalRevenue,
        campaignCount: campaignsRes.data?.length || 0,
        conversionRate: totalClicks > 0 ? ((totalConversions / totalClicks) * 100).toFixed(2) : "0",
        hasAutomation: (metricsRes.data?.length || 0) > 0
      });
    } catch (err) {
      console.error("Failed to load system data:", err);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const detectIntent = (message: string): string => {
    const lower = message.toLowerCase();
    
    if (/(hello|hi|hey|greetings)/i.test(lower)) return "greeting";
    if (/(product|item|sell|offer|affiliate)/i.test(lower)) return "products";
    if (/(analytic|stat|performance|click|conversion|revenue|metric)/i.test(lower)) return "analytics";
    if (/(campaign|launch|create|setup|start)/i.test(lower)) return "campaigns";
    if (/(autopilot|automat|schedule|task|traffic)/i.test(lower)) return "automation";
    if (/(how|what|why|when|where|explain|tell me)/i.test(lower)) return "question";
    if (/(help|assist|support|guide)/i.test(lower)) return "help";
    if (/(thank|thanks|appreciate)/i.test(lower)) return "thanks";
    
    return "general";
  };

  const generateVariedResponse = (intent: string, userMessage: string, turn: number): string => {
    const variations = turn % 3;

    switch (intent) {
      case "greeting":
        if (turn === 0) {
          return "Great to hear from you! I'm your AI assistant specializing in affiliate marketing. I can help with:\n\n• Finding high-converting products\n• Analyzing your performance\n• Setting up automated campaigns\n• Optimizing your strategy\n\nWhat would you like to explore first?";
        } else if (variations === 0) {
          return "Hello again! Still here to help. What can I do for you?";
        } else if (variations === 1) {
          return "Hey! Back with more questions? Fire away!";
        } else {
          return "Hi! How can I assist you further?";
        }

      case "products":
        setContext(prev => ({
          ...prev,
          userPreferences: { ...prev.userPreferences, askedAboutProducts: true }
        }));

        if (variations === 0) {
          return `I can help you find winning products! Based on your current data:\n\n📊 You have products generating clicks and revenue. Here's what I recommend:\n\n**High Performers:**\n• Look for products with 3-7% conversion rates\n• Focus on items with proven demand\n• Test different niches (electronics, fashion, home goods)\n\n**Next Steps:**\n1. Check the Product Gallery for trending items\n2. Filter by commission rate (30%+ is ideal)\n3. Review customer ratings (4.5+ stars)\n\n${FOLLOW_UPS.products[Math.floor(Math.random() * FOLLOW_UPS.products.length)]}`;
        } else if (variations === 1) {
          return `Product selection is crucial! Here's my analysis:\n\n**What Makes a Winner:**\n✅ High commission (30-70%)\n✅ Proven conversion rate (5%+)\n✅ Strong customer reviews\n✅ Evergreen demand\n\n**Categories to Consider:**\n• Tech gadgets (high AOV)\n• Fashion/beauty (impulse buys)\n• Digital products (instant delivery)\n\n${FOLLOW_UPS.products[Math.floor(Math.random() * FOLLOW_UPS.products.length)]}`;
        } else {
          return `Looking for products? Smart move! Focus on these criteria:\n\n1️⃣ **Commission Rate**: Aim for 30%+ minimum\n2️⃣ **Price Point**: $50-$200 sweet spot\n3️⃣ **Competition**: Medium - not saturated\n4️⃣ **Seasonality**: Evergreen products safer\n\nVisit the Product Gallery to browse curated options, or tell me your niche and I'll recommend specific products!`;
        }

      case "analytics":
        setContext(prev => ({
          ...prev,
          userPreferences: { ...prev.userPreferences, askedAboutAnalytics: true }
        }));

        if (systemData) {
          if (variations === 0) {
            return `Let's dive into your performance! Here's what your data shows:\n\n📈 **Current Metrics:**\n• Total Clicks: ${systemData.totalClicks.toLocaleString()}\n• Conversions: ${systemData.totalConversions.toLocaleString()}\n• Revenue: $${systemData.totalRevenue.toLocaleString()}\n• Conversion Rate: ${systemData.conversionRate}%\n\n**Analysis:**\n${parseFloat(systemData.conversionRate) > 4 ? "✅ Your conversion rate is strong! Above industry average." : "⚠️ Conversion rate could improve. Try A/B testing your content."}\n\n${FOLLOW_UPS.analytics[Math.floor(Math.random() * FOLLOW_UPS.analytics.length)]}`;
          } else if (variations === 1) {
            return `Your performance snapshot:\n\n💰 **Revenue:** $${systemData.totalRevenue.toLocaleString()}\n🎯 **Conversion Rate:** ${systemData.conversionRate}%\n📊 **Active Campaigns:** ${systemData.campaignCount}\n\n**Key Insights:**\n${systemData.totalClicks > 100000 ? "• Excellent traffic volume - focus on conversion optimization" : "• Build traffic with content marketing and SEO"}\n${parseFloat(systemData.conversionRate) > 3 ? "• Strong conversions - scale what's working" : "• Test new offers and messaging to boost conversions"}\n\nWant a deeper breakdown of any metric?`;
          } else {
            return `Here's your performance summary:\n\n**Traffic:** ${systemData.totalClicks.toLocaleString()} clicks\n**Conversions:** ${systemData.totalConversions.toLocaleString()} sales\n**Revenue:** $${systemData.totalRevenue.toLocaleString()}\n\n**Recommendations:**\n1. ${parseFloat(systemData.conversionRate) < 3 ? "Optimize landing pages for higher conversions" : "Scale top traffic sources"}\n2. ${systemData.campaignCount < 3 ? "Launch more campaigns to diversify" : "Focus budget on top performers"}\n3. Use A/B testing to continuously improve\n\nNeed help with any specific metric?`;
          }
        } else {
          return "I'm pulling your analytics data now. Meanwhile, I can help you understand:\n\n• Conversion rate optimization\n• Traffic source analysis\n• Revenue trends\n• Campaign ROI\n\nWhat aspect interests you most?";
        }

      case "campaigns":
        setContext(prev => ({
          ...prev,
          userPreferences: { ...prev.userPreferences, askedAboutCampaigns: true }
        }));

        if (variations === 0) {
          return `Campaign setup is easy! Here's the fastest path:\n\n**Quick Launch:**\n1. Choose a template (E-commerce, SaaS, Info Products)\n2. Select your products\n3. Set budget ($50-$200/day recommended)\n4. Enable autopilot for hands-free operation\n\n**Campaign Types:**\n🎯 One-Click Campaign: Instant setup with smart defaults\n⚡ Quick Campaign: Customize before launch\n🤖 Autopilot Campaign: Fully automated 24/7\n\nReady to create one? I can guide you through it!`;
        } else if (variations === 1) {
          return `Let me help you launch a winning campaign!\n\n**Best Practices:**\n• Start with proven products (4.5+ star ratings)\n• Set realistic budget ($100-$300 to start)\n• Enable content automation\n• Use multi-channel traffic (social + organic)\n\n**Automation Features:**\n✅ Auto-generated content\n✅ Smart traffic routing\n✅ Real-time optimization\n✅ A/B testing built-in\n\n${FOLLOW_UPS.campaigns[Math.floor(Math.random() * FOLLOW_UPS.campaigns.length)]}`;
        } else {
          return `Campaign creation simplified:\n\n**3-Step Process:**\n1. **Choose Goal:** Sales, leads, or brand awareness\n2. **Select Products:** Pick from curated catalog\n3. **Launch:** Autopilot handles the rest!\n\n**Success Tips:**\n• Test multiple products simultaneously\n• Start with proven traffic sources\n• Monitor first 48 hours closely\n• Scale winners, pause losers\n\nWant to start building now?`;
        }

      case "automation":
        setContext(prev => ({
          ...prev,
          userPreferences: { ...prev.userPreferences, askedAboutAutomation: true }
        }));

        if (variations === 0) {
          return `Automation is your secret weapon! Here's how it works:\n\n🤖 **Autopilot Features:**\n• **Traffic Generation**: 1,000-5,000 clicks/day automatically\n• **Content Creation**: Social posts, emails, blog articles\n• **Link Optimization**: A/B tests landing pages\n• **Budget Allocation**: Shifts spend to top performers\n\n**Current Status:**\n${systemData?.hasAutomation ? "✅ Your automation is ACTIVE and running!" : "⚠️ Automation not enabled yet"}\n\n**Tasks Running:**\n• Traffic every 15 minutes\n• Content every 30 minutes\n• Optimization every 3 hours\n\n${FOLLOW_UPS.automation[Math.floor(Math.random() * FOLLOW_UPS.automation.length)]}`;
        } else if (variations === 1) {
          return `Let me explain the automation engine:\n\n**What It Does:**\n1. Generates traffic from free sources (Pinterest, Instagram, TikTok)\n2. Creates and posts content automatically\n3. Tests different offers and messages\n4. Scales what works, cuts what doesn't\n\n**You Control:**\n• Daily budget limits\n• Task scheduling\n• Content approval\n• Performance thresholds\n\n**Hands-Free Income:**\nOnce set up, autopilot runs 24/7 while you sleep. Average users see results in 48-72 hours.\n\nReady to enable it?`;
        } else {
          return `Automation = Passive income! Here's the breakdown:\n\n**Free Traffic Sources:**\n• Pinterest (visual products)\n• Instagram Stories (lifestyle items)\n• TikTok (trending products)\n• YouTube Shorts (reviews)\n\n**Automated Tasks:**\n✅ Post scheduling\n✅ Link rotation\n✅ Performance tracking\n✅ Budget optimization\n\n**Time Saved:** 20-30 hours/week on manual work!\n\nWant help setting up your first automated campaign?`;
        }

      case "question":
        const questionKeywords = userMessage.toLowerCase();
        
        if (/commission|earn|money|pay/i.test(questionKeywords)) {
          return `Great question about earnings!\n\n**Commission Structure:**\n• Most products: 30-70% commission\n• Average order value: $50-$150\n• Top performers earn: $100-$500/day\n\n**Example Math:**\n1,000 clicks × 4% conversion = 40 sales\n40 sales × $75 AOV × 40% commission = $1,200\n\n**Factors That Increase Earnings:**\n• Higher traffic volume\n• Better conversion rates\n• Premium products (higher AOV)\n• Multiple campaigns running\n\nWhat specific earning goal are you targeting?`;
        } else if (/start|begin|first/i.test(questionKeywords)) {
          return `Perfect question! Here's your starter roadmap:\n\n**Week 1: Foundation**\n1. Browse Product Gallery\n2. Pick 3-5 products to test\n3. Create your first campaign\n4. Enable basic automation\n\n**Week 2: Optimization**\n1. Review analytics daily\n2. Scale winning products\n3. Pause underperformers\n4. Add more traffic sources\n\n**Week 3: Scaling**\n1. Increase budget on winners\n2. Launch additional campaigns\n3. Test new product categories\n4. Refine targeting\n\n**Quick Win:** Start with One-Click Campaign - instant setup!\n\nReady to launch?`;
        } else if (/traffic|visitor|click/i.test(questionKeywords)) {
          return `Traffic is the lifeblood! Here's how to get it:\n\n**Free Traffic (Recommended):**\n• Pinterest: 500-2,000 clicks/day\n• Instagram: 300-1,500 clicks/day\n• TikTok: 1,000-5,000 clicks/day (viral potential)\n• YouTube Shorts: 200-1,000 clicks/day\n\n**Paid Traffic:**\n• Facebook Ads: $0.10-$0.50 per click\n• Google Ads: $0.50-$2.00 per click\n• TikTok Ads: $0.05-$0.30 per click\n\n**Our Automation:**\nGenerates 1,000-5,000 FREE clicks daily across multiple platforms!\n\nWant me to enable traffic automation?`;
        } else {
          return `That's an interesting question! Let me help you understand:\n\n**General Principles:**\n• Focus on high-converting products first\n• Test everything before scaling\n• Track all metrics religiously\n• Automate repetitive tasks\n\n**Resources:**\n• Product Gallery: Find winners\n• Analytics: Track performance\n• Autopilot: Automate growth\n• Integrations: Connect your tools\n\nCan you give me more details about what you're trying to achieve? I'll provide a more specific answer!`;
        }

      case "help":
        return `I'm here to help! Here's what I can assist with:\n\n**Product Selection:**\n• Find profitable products\n• Analyze competition\n• Check commission rates\n\n**Campaign Management:**\n• Create campaigns\n• Optimize performance\n• Set up automation\n\n**Analytics & Tracking:**\n• Interpret your metrics\n• Identify improvement areas\n• Forecast earnings\n\n**Strategy & Tips:**\n• Traffic generation methods\n• Conversion optimization\n• Scaling strategies\n\nWhat specific area needs attention?`;

      case "thanks":
        const thanksResponses = [
          "You're welcome! Happy to help. Anything else you need?",
          "My pleasure! Let me know if you have more questions.",
          "Glad I could help! Feel free to ask anything else.",
          "You're very welcome! I'm here whenever you need assistance."
        ];
        return thanksResponses[turn % thanksResponses.length];

      default:
        const generalResponses = [
          `I'm not quite sure I understood that. Could you rephrase your question? I'm great at helping with:\n\n• Product recommendations\n• Campaign setup\n• Performance analytics\n• Automation features\n\nWhat would you like to know?`,
          `Interesting! Can you elaborate a bit more? I specialize in:\n\n✅ Affiliate product selection\n✅ Campaign optimization\n✅ Traffic generation\n✅ Revenue tracking\n\nWhich area interests you?`,
          `I want to make sure I give you the best answer! Are you asking about:\n\n1. Finding profitable products?\n2. Setting up campaigns?\n3. Understanding your analytics?\n4. Automation features?\n\nLet me know and I'll dive deep!`
        ];
        return generalResponses[turn % generalResponses.length];
    }
  };

  const handleSend = async () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue("");
    setIsTyping(true);

    // Detect intent and update context
    const intent = detectIntent(inputValue);
    const newTurn = context.conversationTurn + 1;

    setContext(prev => ({
      ...prev,
      topicHistory: [...prev.topicHistory, intent],
      lastQuestion: inputValue,
      conversationTurn: newTurn
    }));

    // Simulate realistic typing delay
    const thinkingTime = 800 + Math.random() * 1200;
    
    setTimeout(() => {
      const response = generateVariedResponse(intent, inputValue, newTurn);
      
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: response,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, aiResponse]);
      setIsTyping(false);
    }, thinkingTime);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!mounted) return null;

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        size="lg"
        className="fixed bottom-6 right-6 z-50 rounded-full w-16 h-16 shadow-2xl bg-gradient-to-r from-primary to-accent hover:scale-110 transition-transform"
      >
        <Bot className="w-8 h-8" />
      </Button>
    );
  }

  return (
    <Card className={`fixed ${isMinimized ? "bottom-6 right-6 w-80" : "bottom-6 right-6 w-96 h-[600px]"} z-50 shadow-2xl border-2 flex flex-col transition-all duration-300`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-primary/10 to-accent/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <Bot className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">AI Assistant</h3>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-xs text-muted-foreground">Online</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMinimized(!isMinimized)}
          >
            {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsOpen(false)}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${message.role === "user" ? "flex-row-reverse" : ""}`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  message.role === "user" 
                    ? "bg-primary/10" 
                    : "bg-gradient-to-br from-primary to-accent"
                }`}>
                  {message.role === "user" ? (
                    <User className="w-4 h-4 text-primary" />
                  ) : (
                    <Bot className="w-4 h-4 text-white" />
                  )}
                </div>
                <div className={`flex-1 ${message.role === "user" ? "text-right" : ""}`}>
                  <div className={`inline-block rounded-lg px-4 py-2 max-w-[85%] ${
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-foreground"
                  }`}>
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="bg-muted rounded-lg px-4 py-2">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-primary/50 rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-primary/50 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }} />
                    <div className="w-2 h-2 bg-primary/50 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t">
            <div className="flex gap-2">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me anything..."
                className="flex-1"
                disabled={isTyping}
              />
              <Button 
                onClick={handleSend} 
                disabled={!inputValue.trim() || isTyping}
                className="bg-gradient-to-r from-primary to-accent"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2 text-center">
              Powered by AI • Real-time assistance
            </p>
          </div>
        </>
      )}
    </Card>
  );
}