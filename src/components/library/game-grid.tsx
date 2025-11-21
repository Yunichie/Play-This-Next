"use client";

import { useState } from "react";
import { GameCard } from "./game-card";
import { GameDetailModal } from "./game-detail-modal";
import { motion } from "framer-motion";
import type { Database } from "@/lib/supabase/database.types";

type UserGame = Database["public"]["Tables"]["user_games"]["Row"];

interface GameGridProps {
  games: UserGame[];
}

export function GameGrid({ games }: GameGridProps) {
  const [selectedGame, setSelectedGame] = useState<UserGame | null>(null);

  if (!games || games.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground text-lg">
          No games found. Try syncing your Steam library or adjusting your
          filters.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {games.map((game, index) => (
          <motion.div
            key={game.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05, duration: 0.3 }}
          >
            <GameCard game={game} onClick={() => setSelectedGame(game)} />
          </motion.div>
        ))}
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
