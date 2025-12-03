"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Clock, Star, Trash2, Trophy } from "lucide-react";
import { formatPlaytime } from "@/lib/utils";
import { updateGame, deleteGame } from "@/app/actions/games";
import { getGameAchievements } from "@/app/actions/steam";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import type { Database } from "@/lib/supabase/database.types";
import type { SteamAchievement } from "@/lib/steam/api";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type UserGame = Database["public"]["Tables"]["user_games"]["Row"];

interface GameDetailModalProps {
  game: UserGame;
  isOpen: boolean;
  onClose: () => void;
}

export function GameDetailModal({
  game,
  isOpen,
  onClose,
}: GameDetailModalProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(game.status);
  const [rating, setRating] = useState<number | null>(game.user_rating);
  const [review, setReview] = useState(game.user_review || "");
  const [likedAspects, setLikedAspects] = useState<string>(
    game.liked_aspects?.join(", ") || "",
  );
  const [dislikedAspects, setDislikedAspects] = useState<string>(
    game.disliked_aspects?.join(", ") || "",
  );
  const [achievements, setAchievements] = useState<
    (SteamAchievement & { percent: number; achieved: boolean; unlocktime: number })[]
  >([]);
  const [loadingAchievements, setLoadingAchievements] = useState(false);
  const [showAchievements, setShowAchievements] = useState(false);

  useEffect(() => {
    if (isOpen && game.appid) {
      setLoadingAchievements(true);
      getGameAchievements(game.appid)
        .then((res) => {
          if (res.achievements) {
            setAchievements(res.achievements);
          }
        })
        .finally(() => setLoadingAchievements(false));
    }
  }, [isOpen, game.appid]);

  const handleSave = async () => {
    setLoading(true);
    try {
      const result = await updateGame({
        id: game.id,
        status,
        user_rating: rating,
        user_review: review || null,
        liked_aspects: likedAspects
          ? likedAspects
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean)
          : null,
        disliked_aspects: dislikedAspects
          ? dislikedAspects
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean)
          : null,
      });

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Game updated successfully!");
        router.refresh();
        onClose();
      }
    } catch (error) {
      toast.error("Failed to update game");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (
      !confirm("Are you sure you want to remove this game from your library?")
    ) {
      return;
    }

    setLoading(true);
    try {
      const result = await deleteGame(game.id);

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Game removed from library");
        router.refresh();
        onClose();
      }
    } catch (error) {
      toast.error("Failed to delete game");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{game.name}</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 overflow-hidden">
          {/* Left Column: Achievements - Desktop Only */}
          <div className="hidden lg:flex lg:col-span-1 border-r pr-4 flex-col overflow-hidden">
            <h3 className="font-semibold flex items-center gap-2 mb-4">
              <Trophy className="w-4 h-4" />
              Achievements
            </h3>
            {loadingAchievements ? (
              <div className="text-sm text-muted-foreground">
                Loading achievements...
              </div>
            ) : achievements.length > 0 ? (
              <div className="flex-1 overflow-y-auto pr-2 space-y-3">
                {achievements.map((ach) => (
                  <div
                    key={ach.name}
                    className="flex gap-2 items-center p-2 rounded-lg bg-muted/50"
                  >
                    {/* Checkmark Column */}
                    <div className="flex-shrink-0 w-5 flex items-center justify-center">
                      {ach.achieved && (
                        <svg
                          className="w-5 h-5 text-muted-foreground"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                        </svg>
                      )}
                    </div>
                    {/* Icon */}
                    <img
                      src={ach.achieved ? ach.icon : ach.icongray}
                      alt={ach.displayName}
                      className="w-10 h-10 rounded flex-shrink-0"
                    />
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div
                        className="font-medium text-sm truncate"
                        title={ach.displayName}
                      >
                        {ach.displayName}
                      </div>
                      <div
                        className="text-xs text-muted-foreground line-clamp-2"
                        title={ach.description}
                      >
                        {ach.description}
                      </div>
                      <div className="mt-1.5 h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary"
                          style={{ width: `${ach.percent}%` }}
                        />
                      </div>
                      <div className="text-[10px] text-right text-muted-foreground mt-0.5">
                        {ach.percent.toFixed(1)}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">
                No achievements found.
              </div>
            )}
          </div>

          {/* Right Column: Existing Content */}
          <div className="lg:col-span-2 space-y-6 overflow-y-auto p-2">
            {/* Game Image */}
            <div className="relative aspect-video rounded-lg overflow-hidden">
            <img
              src={game.img_url || "/placeholder-game.jpg"}
              alt={game.name}
              className="object-cover w-full h-full"
            />
          </div>

          {/* Mobile Achievements Toggle Button */}
          <div className="lg:hidden">
            <Button
              variant="outline"
              onClick={() => setShowAchievements(!showAchievements)}
              className="w-full flex items-center justify-between"
            >
              <span className="flex items-center gap-2">
                <Trophy className="w-4 h-4" />
                Achievements
              </span>
              <svg
                className={`w-4 h-4 transition-transform ${showAchievements ? 'rotate-180' : ''}`}
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M19 9l-7 7-7-7"></path>
              </svg>
            </Button>
            
            {showAchievements && (
              <div className="mt-4 space-y-3 max-h-96 overflow-y-auto">
                {loadingAchievements ? (
                  <div className="text-sm text-muted-foreground">
                    Loading achievements...
                  </div>
                ) : achievements.length > 0 ? (
                  achievements.map((ach) => (
                    <div
                      key={ach.name}
                      className="flex gap-2 items-center p-2 rounded-lg bg-muted/50"
                    >
                      {/* Checkmark Column */}
                      <div className="flex-shrink-0 w-5 flex items-center justify-center">
                        {ach.achieved && (
                          <svg
                            className="w-5 h-5 text-muted-foreground"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                          </svg>
                        )}
                      </div>
                      {/* Icon */}
                      <img
                        src={ach.achieved ? ach.icon : ach.icongray}
                        alt={ach.displayName}
                        className="w-10 h-10 rounded flex-shrink-0"
                      />
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div
                          className="font-medium text-sm truncate"
                          title={ach.displayName}
                        >
                          {ach.displayName}
                        </div>
                        <div
                          className="text-xs text-muted-foreground line-clamp-2"
                          title={ach.description}
                        >
                          {ach.description}
                        </div>
                        <div className="mt-1.5 h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary"
                            style={{ width: `${ach.percent}%` }}
                          />
                        </div>
                        <div className="text-[10px] text-right text-muted-foreground mt-0.5">
                          {ach.percent.toFixed(1)}%
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-muted-foreground">
                    No achievements found.
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span>Playtime: {formatPlaytime(game.playtime_forever)}</span>
            </div>
            {game.hltb_main && (
              <div className="text-sm text-muted-foreground">
                Time to beat: ~{game.hltb_main}h
              </div>
            )}
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label>Status</Label>
            <Select
              value={status}
              onValueChange={(value: any) => setStatus(value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="backlog">Backlog</SelectItem>
                <SelectItem value="playing">Playing</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="dropped">Dropped</SelectItem>
                <SelectItem value="shelved">Shelved</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Rating */}
          <div className="space-y-2">
            <Label>Your Rating (0-10)</Label>
            <div className="flex gap-2">
              <Input
                type="number"
                min="0"
                max="10"
                value={rating || ""}
                onChange={(e) =>
                  setRating(e.target.value ? parseInt(e.target.value) : null)
                }
                placeholder="Rate this game"
              />
              {rating !== null && (
                <div className="flex items-center gap-1 px-3 py-2 bg-muted rounded-md">
                  <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                  <span className="font-medium">{rating}/10</span>
                </div>
              )}
            </div>
          </div>

          {}
          <div className="space-y-2">
            <Label>Review</Label>
            <Textarea
              value={review}
              onChange={(e) => setReview(e.target.value)}
              placeholder="Share your thoughts about this game..."
              rows={4}
            />
          </div>

          {}
          <div className="space-y-2">
            <Label>What you liked (comma-separated)</Label>
            <Input
              value={likedAspects}
              onChange={(e) => setLikedAspects(e.target.value)}
              placeholder="e.g., story, gameplay, graphics, music"
            />
          </div>

          {}
          <div className="space-y-2">
            <Label>What you disliked (comma-separated)</Label>
            <Input
              value={dislikedAspects}
              onChange={(e) => setDislikedAspects(e.target.value)}
              placeholder="e.g., bugs, controls, pacing"
            />
          </div>

            {/* Footer Buttons */}
            <div className="flex justify-between pt-4">
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={loading}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Remove from Library
              </Button>

              <div className="flex gap-2">
                <Button variant="outline" onClick={onClose} disabled={loading}>
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={loading}>
                  {loading ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
