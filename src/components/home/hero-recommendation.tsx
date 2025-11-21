"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, Clock, RefreshCw } from "lucide-react";
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
    <Card className="overflow-hidden border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-purple-500/5">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-2xl flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-primary" />
              AI Recommendation
            </CardTitle>
            <CardDescription>
              Your personalized pick based on your gaming profile
            </CardDescription>
          </div>
          <Button
            onClick={handleGetRecommendation}
            disabled={loading}
            size="sm"
            variant="outline"
          >
            <RefreshCw
              className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`}
            />
            {loading ? "Finding..." : "Get New"}
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        <AnimatePresence mode="wait">
          {!recommendation && !loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-12"
            >
              <p className="text-muted-foreground mb-4">
                Click the button above to get your first AI-powered
                recommendation!
              </p>
            </motion.div>
          )}

          {loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-12"
            >
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="text-muted-foreground mt-4">
                Analyzing your gaming preferences...
              </p>
            </motion.div>
          )}

          {recommendation && !loading && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h3 className="text-2xl font-bold mb-2">
                    {recommendation.name}
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    {recommendation.reasoning}
                  </p>

                  <div className="flex flex-wrap gap-4 text-sm">
                    {recommendation.estimatedPlaytime && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="w-4 h-4" />
                        <span>{recommendation.estimatedPlaytime}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-24 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full"
                          style={{ width: `${recommendation.matchScore}%` }}
                        />
                      </div>
                      <span className="text-primary font-medium">
                        {recommendation.matchScore}% match
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}
