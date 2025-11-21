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
  backlog: "bg-orange-500/10 text-orange-500 border-orange-500/20",
  playing: "bg-green-500/10 text-green-500 border-green-500/20",
  completed: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  dropped: "bg-red-500/10 text-red-500 border-red-500/20",
  shelved: "bg-gray-500/10 text-gray-500 border-gray-500/20",
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
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 300 }}
    >
      <Card
        className="overflow-hidden cursor-pointer hover:shadow-xl transition-shadow group"
        onClick={onClick}
      >
        <div className="relative aspect-[16/9]">
          <img
            src={game.img_url || "/placeholder-game.jpg"}
            alt={game.name}
            className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
          />

          {}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

          {}
          <button
            onClick={handleFavoriteClick}
            className="absolute top-2 right-2 p-2 rounded-full bg-black/50 backdrop-blur-sm hover:bg-black/70 transition-colors z-10"
          >
            <Heart
              className={`w-5 h-5 ${
                game.is_favorite ? "fill-red-500 text-red-500" : "text-white"
              }`}
            />
          </button>

          {}
          <div className="absolute top-2 left-2">
            <span
              className={`inline-block px-2 py-1 text-xs font-medium rounded border ${
                statusColors[game.status]
              }`}
            >
              {game.status.charAt(0).toUpperCase() + game.status.slice(1)}
            </span>
          </div>

          {}
          <div className="absolute bottom-0 left-0 right-0 p-3 space-y-2">
            <h3 className="font-semibold text-white line-clamp-1 text-sm">
              {game.name}
            </h3>

            <div className="flex items-center justify-between text-xs text-white/80">
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>{formatPlaytime(game.playtime_forever)}</span>
              </div>

              {game.user_rating !== null && (
                <div className="flex items-center gap-1">
                  <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                  <span>{game.user_rating}/10</span>
                </div>
              )}

              {game.hltb_main && (
                <div className="text-white/60">~{game.hltb_main}h to beat</div>
              )}
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
