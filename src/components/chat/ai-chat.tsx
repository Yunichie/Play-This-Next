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
        "Hi! I'm your AI gaming assistant. Tell me what you're in the mood for, and I'll help you find the perfect game from your library.",
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
      {}
      <Card className="flex-1 overflow-y-auto p-6 space-y-6 mb-6 glass border-border/50">
        <AnimatePresence initial={false}>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className={`flex gap-4 ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              {message.role === "assistant" && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0"
                >
                  <Bot className="w-5 h-5 text-primary" />
                </motion.div>
              )}

              <div
                className={`max-w-[75%] rounded-2xl p-4 ${
                  message.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "glass border border-border/50"
                }`}
              >
                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                  {message.content}
                </p>

                {message.recommendations &&
                  message.recommendations.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="mt-4 space-y-3"
                    >
                      {message.recommendations.map((rec, idx) => (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.3 + idx * 0.1 }}
                          className="bg-background/50 backdrop-blur-sm rounded-xl p-4 border border-border/50 hover:border-border transition-all elevated"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-semibold text-foreground">
                              {rec.name}
                            </h4>
                            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-primary/10 text-primary">
                              <Sparkles className="w-3.5 h-3.5" />
                              <span className="text-xs font-bold">
                                {rec.matchScore}%
                              </span>
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground leading-relaxed mb-2">
                            {rec.reasoning}
                          </p>
                          {rec.estimatedPlaytime && (
                            <p className="text-xs text-muted-foreground font-medium">
                              ⏱️ {rec.estimatedPlaytime}
                            </p>
                          )}
                        </motion.div>
                      ))}
                    </motion.div>
                  )}
              </div>

              {message.role === "user" && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="w-10 h-10 rounded-2xl bg-accent flex items-center justify-center flex-shrink-0"
                >
                  <User className="w-5 h-5" />
                </motion.div>
              )}
            </motion.div>
          ))}

          {loading && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-4"
            >
              <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Bot className="w-5 h-5 text-primary animate-pulse" />
              </div>
              <div className="glass border border-border/50 rounded-2xl p-4">
                <div className="flex gap-2">
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 1, delay: 0 }}
                    className="w-2 h-2 bg-primary rounded-full"
                  />
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 1, delay: 0.2 }}
                    className="w-2 h-2 bg-primary rounded-full"
                  />
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 1, delay: 0.4 }}
                    className="w-2 h-2 bg-primary rounded-full"
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </Card>

      {}
      {messages.length <= 1 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-wrap gap-2 mb-4"
        >
          {suggestedPrompts.map((prompt, index) => (
            <motion.div
              key={prompt}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
            >
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePromptClick(prompt)}
                disabled={loading}
                className="rounded-full border-border/50 hover:border-border transition-all"
              >
                {prompt}
              </Button>
            </motion.div>
          ))}
        </motion.div>
      )}

      {}
      <div className="flex gap-3">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Ask me anything... (e.g., 'short game for tonight')"
          disabled={loading}
          className="flex-1 rounded-2xl border-border/50 focus:border-primary transition-all glass"
        />
        <Button
          onClick={() => handleSend()}
          disabled={loading || !input.trim()}
          size="lg"
          className="rounded-2xl px-6"
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
