"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, Clock, RefreshCw, TrendingUp } from "lucide-react";
import { getRecommendations } from "@/app/actions/ai";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

export function HeroRecommendation() {
  const [loading, setLoading] = useState(false);
  const [recommendation, setRecommendation] = useState<any>(null);

  const handleGetRecommendation = async () => {
    setLoading(true);
    try {
      const result = await getRecommendations("What should I play next?");

      if (result.error) {
        toast.error(result.error);
        return;
      }

      if (result.recommendations && result.recommendations.length > 0) {
        setRecommendation(result.recommendations[0]);
      } else {
        toast.info("No recommendations available. Try syncing your library!");
      }
    } catch (error) {
      toast.error("Failed to get recommendation");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="relative overflow-hidden glass border-border/50 bg-gradient-to-br from-primary/5 via-card/50 to-accent/5 backdrop-blur-sm">
      <div className="absolute inset-0 bg-grid-pattern opacity-5" />

      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.div
              initial={{ rotate: 0 }}
              animate={{ rotate: loading ? 360 : 0 }}
              transition={{
                duration: 2,
                repeat: loading ? Infinity : 0,
                ease: "linear",
              }}
              className="p-3 rounded-2xl bg-primary/10"
            >
              <Sparkles className="w-6 h-6 text-primary" />
            </motion.div>
            <div>
              <CardTitle className="text-2xl">AI Recommendation</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Personalized pick from your library
              </p>
            </div>
          </div>
          <Button
            onClick={handleGetRecommendation}
            disabled={loading}
            size="sm"
            variant="outline"
            className="rounded-full border-border/50"
          >
            <RefreshCw
              className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`}
            />
            {loading ? "Finding..." : "Get New"}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="relative">
        <AnimatePresence mode="wait">
          {!recommendation && !loading && (
            <motion.div
              key="empty"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="text-center py-12"
            >
              <div className="inline-flex p-4 rounded-2xl bg-muted/50 mb-4">
                <Sparkles className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground">
                Click above to get your first AI-powered recommendation!
              </p>
            </motion.div>
          )}

          {loading && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-12"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="inline-block mb-4"
              >
                <Sparkles className="w-8 h-8 text-primary" />
              </motion.div>
              <p className="text-muted-foreground">
                Analyzing your gaming preferences...
              </p>
            </motion.div>
          )}

          {recommendation && !loading && (
            <motion.div
              key="recommendation"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div>
                <h3 className="text-3xl font-bold mb-3">
                  {recommendation.name}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {recommendation.reasoning}
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                {recommendation.estimatedPlaytime && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.1 }}
                    className="flex items-center gap-2 px-4 py-2 rounded-full glass border border-border/50"
                  >
                    <Clock className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium">
                      {recommendation.estimatedPlaytime}
                    </span>
                  </motion.div>
                )}

                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2 }}
                  className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20"
                >
                  <TrendingUp className="w-4 h-4 text-primary" />
                  <span className="text-sm font-bold text-primary">
                    {recommendation.matchScore}% match
                  </span>
                </motion.div>
              </div>

              {/* Match Score Bar */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Match Score</span>
                  <span className="font-bold text-primary">
                    {recommendation.matchScore}%
                  </span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${recommendation.matchScore}%` }}
                    transition={{ delay: 0.3, duration: 1, ease: "easeOut" }}
                    className="h-full bg-gradient-to-r from-primary to-primary/60 rounded-full"
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}
