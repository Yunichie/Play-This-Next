"use client";

import { Card } from "@/components/ui/card";
import { Clock, Star, Heart } from "lucide-react";
import { formatPlaytime } from "@/lib/utils";
import { motion } from "framer-motion";
import { toggleFavorite } from "@/app/actions/games";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import type { Database } from "@/lib/supabase/database.types";

type UserGame = Database["public"]["Tables"]["user_games"]["Row"];

interface GameCardProps {
  game: UserGame;
  onClick: () => void;
}

const statusColors = {
  backlog:
    "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
  playing:
    "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
  completed:
    "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",
  dropped: "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20",
  shelved:
    "bg-slate-500/10 text-slate-700 dark:text-slate-400 border-slate-500/20",
};

export function GameCard({ game, onClick }: GameCardProps) {
  const router = useRouter();

  const handleFavoriteClick = async (e: React.MouseEvent) => {
    e.stopPropagation();

    const result = await toggleFavorite(game.id, !game.is_favorite);

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(
        game.is_favorite ? "Removed from favorites" : "Added to favorites",
      );
      router.refresh();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -8, scale: 1.02 }}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 20,
      }}
    >
      <Card
        className="overflow-hidden cursor-pointer group elevated border-border/50 bg-card/50 backdrop-blur-sm"
        onClick={onClick}
      >
        <div className="relative aspect-[16/9] overflow-hidden bg-muted">
          <motion.img
            src={game.img_url || "/placeholder-game.jpg"}
            alt={game.name}
            className="object-cover w-full h-full"
            whileHover={{ scale: 1.1 }}
            transition={{ duration: 0.4 }}
          />

          {}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />

          {}
          <motion.button
            onClick={handleFavoriteClick}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="absolute top-3 right-3 p-2.5 rounded-full glass z-10 hover:bg-white/20 transition-all"
          >
            <Heart
              className={cn(
                "w-4 h-4 transition-all",
                game.is_favorite
                  ? "fill-rose-500 text-rose-500 drop-shadow-lg"
                  : "text-white",
              )}
            />
          </motion.button>

          {}
          <div className="absolute top-3 left-3">
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className={cn(
                "inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-lg border backdrop-blur-sm",
                statusColors[game.status],
              )}
            >
              {game.status.charAt(0).toUpperCase() + game.status.slice(1)}
            </motion.span>
          </div>

          {/* Info Overlay */}
          <div className="absolute inset-x-0 bottom-0 p-4 space-y-3">
            <h3 className="font-semibold text-white line-clamp-1 text-base drop-shadow-lg">
              {game.name}
            </h3>

            <div className="flex items-center gap-4 text-xs text-white/90">
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg glass">
                <Clock className="w-3.5 h-3.5" />
                <span className="font-medium">
                  {formatPlaytime(game.playtime_forever)}
                </span>
              </div>

              {game.user_rating !== null && (
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg glass">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span className="font-medium">{game.user_rating}/10</span>
                </div>
              )}

              {game.hltb_main && (
                <div className="px-2 py-1 rounded-lg glass text-white/80 font-medium">
                  ~{game.hltb_main}h
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

function cn(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}
