import type {
  ApiResponse,
  PaginatedResponse,
  UserGame,
  Profile,
  CreateGameRequest,
  UpdateGameRequest,
  GameListParams,
  GameSearchRequest,
  BulkUpdateRequest,
  BulkDeleteRequest,
  ReviewRequest,
  ReviewsListParams,
  UpdateProfileRequest,
  StatsResponse,
  ChartsData,
  RatingStatsResponse,
  RecommendationRequest,
  RecommendationsResponse,
  FilterOptions,
  AutocompleteResult,
  SyncSteamResponse,
} from "@/types/api.types";

class ApiClient {
  private baseUrl = "/api";

  private async request<T>(
    endpoint: string,
    options?: RequestInit,
  ): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
      ...options,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "API request failed");
    }

    return data;
  }

  games = {
    list: async (
      params?: GameListParams,
    ): Promise<PaginatedResponse<UserGame>> => {
      const searchParams = new URLSearchParams();
      if (params?.status) searchParams.append("status", params.status);
      if (params?.search) searchParams.append("search", params.search);
      if (params?.sort) searchParams.append("sort", params.sort);
      if (params?.limit) searchParams.append("limit", params.limit.toString());
      if (params?.offset)
        searchParams.append("offset", params.offset.toString());

      const query = searchParams.toString();
      return this.request<PaginatedResponse<UserGame>>(
        `/games${query ? `?${query}` : ""}`,
      );
    },

    get: async (id: string): Promise<ApiResponse<UserGame>> => {
      return this.request<ApiResponse<UserGame>>(`/games/${id}`);
    },

    create: async (data: CreateGameRequest): Promise<ApiResponse<UserGame>> => {
      return this.request<ApiResponse<UserGame>>("/games", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },

    update: async (
      id: string,
      data: UpdateGameRequest,
    ): Promise<ApiResponse<UserGame>> => {
      return this.request<ApiResponse<UserGame>>(`/games/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      });
    },

    delete: async (id: string): Promise<ApiResponse<void>> => {
      return this.request<ApiResponse<void>>(`/games/${id}`, {
        method: "DELETE",
      });
    },

    search: async (
      params: GameSearchRequest,
    ): Promise<PaginatedResponse<UserGame>> => {
      return this.request<PaginatedResponse<UserGame>>("/games/search", {
        method: "POST",
        body: JSON.stringify(params),
      });
    },

    autocomplete: async (
      query: string,
      limit = 10,
    ): Promise<ApiResponse<AutocompleteResult[]>> => {
      return this.request<ApiResponse<AutocompleteResult[]>>(
        `/games/autocomplete?q=${encodeURIComponent(query)}&limit=${limit}`,
      );
    },

    bulkUpdate: async (
      data: BulkUpdateRequest,
    ): Promise<ApiResponse<UserGame[]>> => {
      return this.request<ApiResponse<UserGame[]>>("/games/bulk", {
        method: "PATCH",
        body: JSON.stringify(data),
      });
    },

    bulkDelete: async (data: BulkDeleteRequest): Promise<ApiResponse<void>> => {
      return this.request<ApiResponse<void>>("/games/bulk", {
        method: "DELETE",
        body: JSON.stringify(data),
      });
    },
  };

  favorites = {
    list: async (): Promise<ApiResponse<UserGame[]>> => {
      return this.request<ApiResponse<UserGame[]>>("/games/favorites");
    },

    toggle: async (id: string): Promise<ApiResponse<UserGame>> => {
      return this.request<ApiResponse<UserGame>>(`/games/favorites/${id}`, {
        method: "PUT",
      });
    },
  };

  reviews = {
    list: async (
      params?: ReviewsListParams,
    ): Promise<ApiResponse<UserGame[]>> => {
      const searchParams = new URLSearchParams();
      if (params?.minRating)
        searchParams.append("minRating", params.minRating.toString());
      if (params?.maxRating)
        searchParams.append("maxRating", params.maxRating.toString());

      const query = searchParams.toString();
      return this.request<ApiResponse<UserGame[]>>(
        `/games/reviews${query ? `?${query}` : ""}`,
      );
    },

    add: async (
      id: string,
      data: ReviewRequest,
    ): Promise<ApiResponse<UserGame>> => {
      return this.request<ApiResponse<UserGame>>(`/games/${id}/review`, {
        method: "POST",
        body: JSON.stringify(data),
      });
    },

    delete: async (id: string): Promise<ApiResponse<UserGame>> => {
      return this.request<ApiResponse<UserGame>>(`/games/${id}/review`, {
        method: "DELETE",
      });
    },

    stats: async (): Promise<ApiResponse<RatingStatsResponse>> => {
      return this.request<ApiResponse<RatingStatsResponse>>(
        "/games/ratings/stats",
      );
    },
  };

  profile = {
    get: async (): Promise<ApiResponse<Profile>> => {
      return this.request<ApiResponse<Profile>>("/profile");
    },

    update: async (
      data: UpdateProfileRequest,
    ): Promise<ApiResponse<Profile>> => {
      return this.request<ApiResponse<Profile>>("/profile", {
        method: "PATCH",
        body: JSON.stringify(data),
      });
    },

    delete: async (): Promise<ApiResponse<void>> => {
      return this.request<ApiResponse<void>>("/profile", {
        method: "DELETE",
      });
    },
  };

  stats = {
    get: async (): Promise<ApiResponse<StatsResponse>> => {
      return this.request<ApiResponse<StatsResponse>>("/stats");
    },

    charts: async (): Promise<ApiResponse<ChartsData>> => {
      return this.request<ApiResponse<ChartsData>>("/stats/charts");
    },
  };

  recommendations = {
    get: async (
      query?: string,
      limit?: number,
      backlogOnly?: boolean,
    ): Promise<RecommendationsResponse> => {
      const searchParams = new URLSearchParams();
      if (query) searchParams.append("query", query);
      if (limit) searchParams.append("limit", limit.toString());
      if (backlogOnly) searchParams.append("backlogOnly", "true");

      const queryString = searchParams.toString();
      return this.request<RecommendationsResponse>(
        `/recommendations${queryString ? `?${queryString}` : ""}`,
      );
    },

    generate: async (
      data: RecommendationRequest,
    ): Promise<RecommendationsResponse> => {
      return this.request<RecommendationsResponse>("/recommendations", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
  };

  filters = {
    getOptions: async (): Promise<ApiResponse<FilterOptions>> => {
      return this.request<ApiResponse<FilterOptions>>("/games/filters/options");
    },
  };

  steam = {
    sync: async (): Promise<SyncSteamResponse> => {
      return this.request<SyncSteamResponse>("/sync-steam", {
        method: "POST",
      });
    },
  };
}

export const apiClient = new ApiClient();

export const {
  games,
  favorites,
  reviews,
  profile,
  stats,
  recommendations,
  filters,
  steam,
} = apiClient;
