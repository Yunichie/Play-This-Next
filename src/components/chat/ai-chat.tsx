"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Send, Bot, User, Sparkles } from "lucide-react";
import { getRecommendations } from "@/app/actions/ai";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  recommendations?: any[];
}

const suggestedPrompts = [
  "Short game for tonight",
  "Challenging roguelike",
  "Relaxing after work",
  "Story-driven adventure",
  "Co-op with friends",
];

export function AIChat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content:
        "Hi! I'm your AI gaming assistant. I can help you find the perfect game from your library based on your mood, available time, and preferences. What are you in the mood for?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (message?: string) => {
    const textToSend = message || input;
    if (!textToSend.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: textToSend,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const result = await getRecommendations(textToSend);

      if (result.error) {
        toast.error(result.error);
        setMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            role: "assistant",
            content:
              "Sorry, I encountered an error. Please make sure you have games synced in your library.",
          },
        ]);
        return;
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content:
          result.recommendations && result.recommendations.length > 0
            ? "Based on your request, here are my top recommendations from your library:"
            : "I couldn't find any games matching your criteria. Try adjusting your request!",
        recommendations: result.recommendations || [],
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      toast.error("Failed to get recommendations");
    } finally {
      setLoading(false);
    }
  };

  const handlePromptClick = (prompt: string) => {
    handleSend(prompt);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages Area */}
      <Card className="flex-1 overflow-y-auto p-4 space-y-4 mb-4">
        <AnimatePresence initial={false}>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={`flex gap-3 ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              {message.role === "assistant" && (
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-5 h-5 text-primary" />
                </div>
              )}

              <div
                className={`max-w-[80%] rounded-lg p-3 ${
                  message.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>

                {message.recommendations &&
                  message.recommendations.length > 0 && (
                    <div className="mt-4 space-y-3">
                      {message.recommendations.map((rec, idx) => (
                        <div
                          key={idx}
                          className="bg-background/50 backdrop-blur-sm rounded-lg p-3 border border-border"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-semibold text-foreground">
                              {rec.name}
                            </h4>
                            <div className="flex items-center gap-1 text-xs">
                              <Sparkles className="w-3 h-3 text-primary" />
                              <span className="text-primary font-medium">
                                {rec.matchScore}%
                              </span>
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground mb-2">
                            {rec.reasoning}
                          </p>
                          {rec.estimatedPlaytime && (
                            <p className="text-xs text-muted-foreground">
                              ⏱️ {rec.estimatedPlaytime}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
              </div>

              {message.role === "user" && (
                <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                  <User className="w-5 h-5" />
                </div>
              )}
            </motion.div>
          ))}

          {loading && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-3"
            >
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Bot className="w-5 h-5 text-primary animate-pulse" />
              </div>
              <div className="bg-muted rounded-lg p-3">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce [animation-delay:0.2s]" />
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce [animation-delay:0.4s]" />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </Card>

      {}
      {messages.length <= 1 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {suggestedPrompts.map((prompt) => (
            <Button
              key={prompt}
              variant="outline"
              size="sm"
              onClick={() => handlePromptClick(prompt)}
              disabled={loading}
            >
              {prompt}
            </Button>
          ))}
        </div>
      )}

      {/* Input Area */}
      <div className="flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Ask me anything... (e.g., 'short game for tonight')"
          disabled={loading}
        />
        <Button
          onClick={() => handleSend()}
          disabled={loading || !input.trim()}
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
