"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Sparkles,
  Crown,
  RefreshCw,
  Loader2,
} from "lucide-react";
import { GameDetailModal } from "@/components/library/game-detail-modal";
import type { Database } from "@/lib/supabase/database.types";
import { cn } from "@/lib/utils";
import {
  getCachedTop3Recommendations,
  type TopRecommendation,
} from "@/app/actions/recommendations";
import { toast } from "sonner";

type UserGame = Database["public"]["Tables"]["user_games"]["Row"];

interface SmartRecommendationsCarouselProps {
  initialGames: UserGame[];
}

export function SmartRecommendationsCarousel({
  initialGames,
}: SmartRecommendationsCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const [selectedGame, setSelectedGame] = useState<UserGame | null>(null);
  const [recommendations, setRecommendations] = useState<TopRecommendation[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const gamesMap = new Map(initialGames.map((g) => [g.appid, g]));

  const loadRecommendations = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const result = await getCachedTop3Recommendations();

      if (result.error) {
        toast.error(result.error);
        return;
      }

      if (result.recommendations.length === 0) {
        toast.info("No recommendations available at the moment");
        return;
      }

      setRecommendations(result.recommendations);
      setCurrentIndex(0);

      if (isRefresh) {
        toast.success("Recommendations refreshed!");
      }
    } catch (error) {
      toast.error("Failed to load recommendations");
      console.error(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadRecommendations();
  }, []);

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0,
      scale: 0.8,
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
      scale: 1,
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 1000 : -1000,
      opacity: 0,
      scale: 0.8,
    }),
  };

  const swipeConfidenceThreshold = 10000;
  const swipePower = (offset: number, velocity: number) => {
    return Math.abs(offset) * velocity;
  };

  const paginate = (newDirection: number) => {
    setDirection(newDirection);
    setCurrentIndex(
      (prevIndex) =>
        (prevIndex + newDirection + recommendations.length) %
        recommendations.length,
    );
  };

  if (loading) {
    return (
      <Card className="p-12 text-center glass border-border/50">
        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
        <p className="text-muted-foreground">
          AI is analyzing your gaming profile...
        </p>
      </Card>
    );
  }

  if (recommendations.length === 0) {
    return null;
  }

  const currentRec = recommendations[currentIndex];
  const currentGame = gamesMap.get(currentRec.appid);

  if (!currentGame) {
    return null;
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-amber-500/10 to-orange-500/10">
              <Sparkles className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">
                AI Recommendations
              </h2>
              <p className="text-sm text-muted-foreground">
                Personalized picks based on your preferences
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => loadRecommendations(true)}
              disabled={refreshing}
              className="rounded-full w-10 h-10"
            >
              <RefreshCw
                className={cn("w-4 h-4", refreshing && "animate-spin")}
              />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => paginate(-1)}
              className="rounded-full w-10 h-10"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <div className="flex gap-1.5 mx-2">
              {recommendations.map((_, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setDirection(index > currentIndex ? 1 : -1);
                    setCurrentIndex(index);
                  }}
                  className={cn(
                    "w-2 h-2 rounded-full transition-all duration-300",
                    index === currentIndex
                      ? "bg-primary w-6"
                      : "bg-muted-foreground/30 hover:bg-muted-foreground/50",
                  )}
                />
              ))}
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={() => paginate(1)}
              className="rounded-full w-10 h-10"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Carousel */}
        <div className="relative h-[550px] overflow-hidden rounded-2xl">
          <AnimatePresence initial={false} custom={direction}>
            <motion.div
              key={currentIndex}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                x: { type: "spring", stiffness: 300, damping: 30 },
                opacity: { duration: 0.2 },
                scale: { duration: 0.2 },
              }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={1}
              onDragEnd={(e, { offset, velocity }) => {
                const swipe = swipePower(offset.x, velocity.x);

                if (swipe < -swipeConfidenceThreshold) {
                  paginate(1);
                } else if (swipe > swipeConfidenceThreshold) {
                  paginate(-1);
                }
              }}
              className="absolute w-full h-full cursor-grab active:cursor-grabbing"
            >
              <Card
                className={cn(
                  "h-full overflow-hidden elevated border-2 bg-card/50 backdrop-blur-sm group cursor-pointer transition-all",
                  currentRec.isBestPick
                    ? "border-amber-500/50 shadow-amber-500/20"
                    : "border-border/50",
                )}
                onClick={() => setSelectedGame(currentGame)}
              >
                <div className="relative h-[55%] overflow-hidden bg-muted">
                  <motion.img
                    src={currentGame.img_url || "/placeholder-game.jpg"}
                    alt={currentGame.name}
                    className="object-cover w-full h-full"
                    whileHover={{ scale: 1.05 }}
                    transition={{ duration: 0.3 }}
                  />

                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />

                  {currentRec.isBestPick && (
                    <motion.div
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: "spring", stiffness: 200 }}
                      className="absolute top-4 left-4"
                    >
                      <div className="px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm font-bold flex items-center gap-1.5 shadow-lg">
                        <Crown className="w-4 h-4" />
                        <span>Best Pick</span>
                      </div>
                    </motion.div>
                  )}

                  <div className="absolute top-4 right-4">
                    <div className="px-3 py-1.5 rounded-full glass border border-white/20 text-white text-sm font-bold flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{currentRec.matchScore}% Match</span>
                    </div>
                  </div>

                  <div className="absolute inset-x-0 bottom-0 p-6">
                    <h3 className="text-3xl font-bold text-white drop-shadow-lg mb-2">
                      {currentGame.name}
                    </h3>
                  </div>
                </div>

                <CardContent className="p-6 space-y-4 overflow-y-auto max-h-[45%]">
                  <div className="p-4 rounded-xl bg-primary/5 border border-primary/10">
                    <div className="flex items-start gap-2 mb-2">
                      <Sparkles className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                      <p className="text-sm font-medium text-primary">
                        Why we recommend this:
                      </p>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {currentRec.reasoning}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Clock className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">
                          Estimated Time
                        </p>
                        <p className="text-sm font-bold">
                          {currentRec.estimatedPlaytime}
                        </p>
                      </div>
                    </div>

                    {currentGame.hltb_main && (
                      <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
                        <div className="p-2 rounded-lg bg-blue-500/10">
                          <Clock className="w-4 h-4 text-blue-500" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">
                            HLTB Main
                          </p>
                          <p className="text-sm font-bold">
                            ~{currentGame.hltb_main}h
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  <Button
                    className={cn(
                      "w-full",
                      currentRec.isBestPick &&
                        "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600",
                    )}
                    size="lg"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedGame(currentGame);
                    }}
                  >
                    {currentRec.isBestPick
                      ? "Start Playing Now"
                      : "View Details"}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {selectedGame && (
        <GameDetailModal
          game={selectedGame}
          isOpen={!!selectedGame}
          onClose={() => setSelectedGame(null)}
        />
      )}
    </>
  );
}
