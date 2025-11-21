"use client";

import { useState } from "react";
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
import { Clock, Star, Trash2 } from "lucide-react";
import { formatPlaytime } from "@/lib/utils";
import { updateGame, deleteGame } from "@/app/actions/games";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import type { Database } from "@/lib/supabase/database.types";
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{game.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Game Image */}
          <div className="relative aspect-video rounded-lg overflow-hidden">
            <img
              src={game.img_url || "/placeholder-game.jpg"}
              alt={game.name}
              className="object-cover w-full h-full"
            />
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

          {}
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
      </DialogContent>
    </Dialog>
  );
}
