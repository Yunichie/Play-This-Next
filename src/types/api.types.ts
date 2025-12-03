import type { Database } from "@/lib/supabase/database.types";

export type UserGame = Database["public"]["Tables"]["user_games"]["Row"];
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

export interface CreateGameRequest {
  appid: number;
  name: string;
  status?: "backlog" | "playing" | "completed" | "dropped" | "shelved";
  user_rating?: number | null;
  user_review?: string | null;
  liked_aspects?: string[] | null;
  disliked_aspects?: string[] | null;
  is_favorite?: boolean;
}

export interface UpdateGameRequest {
  status?: "backlog" | "playing" | "completed" | "dropped" | "shelved";
  is_favorite?: boolean;
  user_rating?: number | null;
  user_review?: string | null;
  liked_aspects?: string[] | null;
  disliked_aspects?: string[] | null;
}

export interface GameListParams {
  status?: string;
  search?: string;
  sort?: "name" | "playtime" | "rating" | "recent";
  limit?: number;
  offset?: number;
}

export interface GameSearchRequest {
  query: string;
  status?: "backlog" | "playing" | "completed" | "dropped" | "shelved" | "all";
  minRating?: number;
  maxRating?: number;
  minPlaytime?: number;
  maxPlaytime?: number;
  isFavorite?: boolean;
  hasReview?: boolean;
  sortBy?: "name" | "playtime" | "rating" | "recent" | "added";
  sortOrder?: "asc" | "desc";
  limit?: number;
  offset?: number;
}

export interface BulkUpdateRequest {
  gameIds: string[];
  updates: {
    status?: "backlog" | "playing" | "completed" | "dropped" | "shelved";
    is_favorite?: boolean;
  };
}

export interface BulkDeleteRequest {
  gameIds: string[];
}

export interface ReviewRequest {
  user_rating: number;
  user_review: string;
  liked_aspects?: string[];
  disliked_aspects?: string[];
}

export interface ReviewsListParams {
  minRating?: number;
  maxRating?: number;
}

export interface UpdateProfileRequest {
  username?: string;
  avatar_url?: string;
}

export interface ProfileResponse extends Profile {}

export interface StatsOverview {
  totalGames: number;
  totalPlaytime: number;
  averageRating: number;
  favoriteCount: number;
  reviewCount: number;
}

export interface StatusDistribution {
  backlog: number;
  playing: number;
  completed: number;
  dropped: number;
  shelved: number;
}

export interface StatsResponse {
  overview: StatsOverview;
  statusDistribution: StatusDistribution;
  mostPlayed: Array<{
    id: string;
    name: string;
    appid: number;
    playtime_forever: number;
    user_rating: number | null;
  }>;
  recentlyPlayed: Array<{
    id: string;
    name: string;
    appid: number;
    last_played: string | null;
  }>;
}

export interface ChartsData {
  statusDistribution: Record<string, number>;
  playtimeRanges: {
    "0-1h": number;
    "1-5h": number;
    "5-10h": number;
    "10-50h": number;
    "50-100h": number;
    "100+h": number;
  };
  ratingDistribution: Array<{
    rating: number;
    count: number;
  }>;
}

export interface RatingStatsResponse {
  totalRatings: number;
  averageRating: number;
  distribution: Record<number, number>;
  highestRated: number;
  lowestRated: number;
}

export interface RecommendationRequest {
  query?: string;
  limit?: number;
  includeBacklogOnly?: boolean;
}

export interface GameRecommendation {
  appid: number;
  name: string;
  reasoning: string;
  estimatedPlaytime: string;
  matchScore: number;
}

export interface RecommendationsResponse {
  recommendations: GameRecommendation[];
  query?: string;
  totalGames: number;
  analyzedGames?: number;
}

export interface FilterOptions {
  statuses: Record<string, number>;
  ratingRange: {
    min: number;
    max: number;
  };
  playtimeRange: {
    min: number;
    max: number;
  };
  favoriteCount: number;
  totalGames: number;
  availableAspects: {
    liked: string[];
    disliked: string[];
  };
}

export interface AutocompleteResult {
  id: string;
  name: string;
  appid: number;
  img_url: string | null;
}

export interface SyncSteamResponse {
  success: boolean;
  count?: number;
  error?: string;
}

export interface ApiError {
  error: string;
  details?: any;
}

export interface ValidationError {
  error: Array<{
    path: string[];
    message: string;
  }>;
}
