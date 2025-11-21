export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          user_id: string;
          steamid: string | null;
          username: string | null;
          avatar_url: string | null;
          total_games: number;
          total_playtime: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          steamid?: string | null;
          username?: string | null;
          avatar_url?: string | null;
          total_games?: number;
          total_playtime?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          steamid?: string | null;
          username?: string | null;
          avatar_url?: string | null;
          total_games?: number;
          total_playtime?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      user_games: {
        Row: {
          id: string;
          user_id: string;
          appid: number;
          name: string;
          img_url: string | null;
          playtime_forever: number;
          playtime_2weeks: number;
          last_played: string | null;
          status: "backlog" | "playing" | "completed" | "dropped" | "shelved";
          is_favorite: boolean;
          user_rating: number | null;
          user_review: string | null;
          liked_aspects: string[] | null;
          disliked_aspects: string[] | null;
          hltb_main: number | null;
          hltb_completionist: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          appid: number;
          name: string;
          img_url?: string | null;
          playtime_forever?: number;
          playtime_2weeks?: number;
          last_played?: string | null;
          status?: "backlog" | "playing" | "completed" | "dropped" | "shelved";
          is_favorite?: boolean;
          user_rating?: number | null;
          user_review?: string | null;
          liked_aspects?: string[] | null;
          disliked_aspects?: string[] | null;
          hltb_main?: number | null;
          hltb_completionist?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          appid?: number;
          name?: string;
          img_url?: string | null;
          playtime_forever?: number;
          playtime_2weeks?: number;
          last_played?: string | null;
          status?: "backlog" | "playing" | "completed" | "dropped" | "shelved";
          is_favorite?: boolean;
          user_rating?: number | null;
          user_review?: string | null;
          liked_aspects?: string[] | null;
          disliked_aspects?: string[] | null;
          hltb_main?: number | null;
          hltb_completionist?: number | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      user_genre_preferences: {
        Row: {
          id: string;
          user_id: string;
          genre: string;
          score: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          genre: string;
          score?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          genre?: string;
          score?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
}
