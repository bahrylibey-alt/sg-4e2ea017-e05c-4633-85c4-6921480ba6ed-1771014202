import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { X, Send, Bot, User, Sparkles, Minimize2, Maximize2 } from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const predefinedResponses: Record<string, string> = {
  "hello": "Hello! I'm your AI affiliate marketing assistant. I can help you with:\n• Finding profitable products\n• Generating content\n• Optimizing campaigns\n• Understanding analytics\n• Setting up integrations\n\nWhat would you like help with?",
  "products": "I can help you find profitable affiliate products! Here are some tips:\n\n1. Focus on products with 30%+ commission rates\n2. Look for products with proven conversion rates (5%+)\n3. Choose products that match your audience\n4. Check customer reviews (4.5+ rating)\n\nWould you like me to show you our top-converting products?",
  "content": "I can help you generate high-converting affiliate content! Here's what I can create:\n\n• Product reviews (500-2000 words)\n• Comparison articles\n• Landing pages\n• Email sequences\n• Social media posts\n\nJust describe what you need, and I'll generate it for you!",
  "analytics": "Your analytics dashboard shows:\n\n📊 Total Revenue: $45,231 (+20.1%)\n🖱️ Total Clicks: 12,482 (+15.3%)\n💰 Conversions: 1,247 (+8.2%)\n📈 Top Product: Digital Marketing Course ($12,324)\n\nYour conversion rate is strong at 7.1%. Want tips to improve it further?",
  "help": "I'm here to help! Here are some things I can assist with:\n\n• Product recommendations\n• Content generation\n• Campaign optimization\n• Analytics insights\n• Integration setup\n• Best practices\n• Troubleshooting\n\nWhat specific help do you need?"
};

export function AIChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    setMessages([
      {
        id: "1",
        role: "assistant",
        content: "Hi! I'm your AI affiliate marketing assistant. I can help you find products, generate content, optimize campaigns, and answer questions. How can I help you today?",
        timestamp: new Date()
      }
    ]);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const getAIResponse = (userMessage: string): string => {
    const lowerMessage = userMessage.toLowerCase();
    
    // Check for keywords
    for (const [keyword, response] of Object.entries(predefinedResponses)) {
      if (lowerMessage.includes(keyword)) {
        return response;
      }
    }

    // Default intelligent response
    if (lowerMessage.includes("how") || lowerMessage.includes("what") || lowerMessage.includes("?")) {
      return `Great question! ${userMessage.includes("campaign") ? "For campaign optimization, I recommend:\n\n1. Test different headlines\n2. Use urgency in your CTAs\n3. Target specific audience segments\n4. Track everything with our analytics\n\nWould you like help setting up a campaign?" : "I can help you with that! Could you provide more details about what you're trying to achieve?"}`;
    }

    return "I understand you're asking about affiliate marketing. I can help with:\n\n• Finding profitable products\n• Creating content\n• Optimizing campaigns\n• Understanding analytics\n• Setting up tools\n\nWhat specific aspect would you like to explore?";
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

    // Simulate AI thinking time
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: getAIResponse(inputValue),
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiResponse]);
      setIsTyping(false);
    }, 1000 + Math.random() * 1000);
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
    <Card className={`fixed ${isMinimized ? 'bottom-6 right-6 w-80' : 'bottom-6 right-6 w-96 h-[600px]'} z-50 shadow-2xl border-2 flex flex-col transition-all duration-300`}>
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
              Powered by AI • Always learning
            </p>
          </div>
        </>
      )}
    </Card>
  );
}