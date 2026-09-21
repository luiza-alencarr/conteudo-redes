// Tipos escritos manualmente a partir das migrations em supabase/migrations/.
// Depois de rodar as migrations contra um projeto Supabase real, prefira gerar
// este arquivo automaticamente com:
//   npm run supabase:types

export type SocialNetwork = "instagram" | "tiktok" | "youtube" | "linkedin";

export type ContentType =
  | "image"
  | "carousel"
  | "video"
  | "reel"
  | "short"
  | "story"
  | "live"
  | "article"
  | "text";

export type ScriptStatus = "rascunho" | "pronto" | "publicado";

export type CalendarStatus =
  | "ideia"
  | "planejado"
  | "em_producao"
  | "pronto"
  | "publicado";

export interface Database {
  public: {
    Tables: {
      social_profiles: {
        Row: {
          id: string;
          network: SocialNetwork;
          username: string;
          platform_account_id: string | null;
          display_name: string | null;
          profile_url: string | null;
          followers_count: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          network: SocialNetwork;
          username: string;
          platform_account_id?: string | null;
          display_name?: string | null;
          profile_url?: string | null;
          followers_count?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["social_profiles"]["Insert"]>;
        Relationships: [];
      };
      posts: {
        Row: {
          id: string;
          social_profile_id: string | null;
          network: SocialNetwork;
          external_id: string | null;
          content_type: ContentType;
          caption: string | null;
          script_id: string | null;
          published_at: string | null;
          url: string | null;
          thumbnail_url: string | null;
          duration_seconds: number | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          social_profile_id?: string | null;
          network: SocialNetwork;
          external_id?: string | null;
          content_type: ContentType;
          caption?: string | null;
          script_id?: string | null;
          published_at?: string | null;
          url?: string | null;
          thumbnail_url?: string | null;
          duration_seconds?: number | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["posts"]["Insert"]>;
        Relationships: [];
      };
      post_metrics: {
        Row: {
          id: string;
          post_id: string;
          likes: number;
          comments_count: number;
          views: number;
          saves: number;
          shares: number;
          reach: number;
          collected_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          post_id: string;
          likes?: number;
          comments_count?: number;
          views?: number;
          saves?: number;
          shares?: number;
          reach?: number;
          collected_at?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["post_metrics"]["Insert"]>;
        Relationships: [];
      };
      comments: {
        Row: {
          id: string;
          post_id: string;
          external_id: string | null;
          author: string | null;
          text: string;
          like_count: number;
          commented_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          post_id: string;
          external_id?: string | null;
          author?: string | null;
          text: string;
          like_count?: number;
          commented_at?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["comments"]["Insert"]>;
        Relationships: [];
      };
      audience_demographics: {
        Row: {
          id: string;
          network: SocialNetwork;
          snapshot_date: string;
          age_range: string | null;
          gender: string | null;
          location: string | null;
          percentage: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          network: SocialNetwork;
          snapshot_date: string;
          age_range?: string | null;
          gender?: string | null;
          location?: string | null;
          percentage: number;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["audience_demographics"]["Insert"]>;
        Relationships: [];
      };
      scripts: {
        Row: {
          id: string;
          network: SocialNetwork;
          title: string;
          content: string | null;
          status: ScriptStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          network: SocialNetwork;
          title: string;
          content?: string | null;
          status?: ScriptStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["scripts"]["Insert"]>;
        Relationships: [];
      };
      calendar_items: {
        Row: {
          id: string;
          suggested_date: string;
          network: SocialNetwork;
          content_type: ContentType;
          theme: string;
          status: CalendarStatus;
          script_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          suggested_date: string;
          network: SocialNetwork;
          content_type: ContentType;
          theme: string;
          status?: CalendarStatus;
          script_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["calendar_items"]["Insert"]>;
        Relationships: [];
      };
      oauth_connections: {
        Row: {
          id: string;
          network: SocialNetwork;
          access_token: string;
          refresh_token: string | null;
          access_token_expires_at: string | null;
          refresh_token_expires_at: string | null;
          scope: string | null;
          open_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          network: SocialNetwork;
          access_token: string;
          refresh_token?: string | null;
          access_token_expires_at?: string | null;
          refresh_token_expires_at?: string | null;
          scope?: string | null;
          open_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["oauth_connections"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      social_network: SocialNetwork;
      content_type: ContentType;
      script_status: ScriptStatus;
      calendar_status: CalendarStatus;
    };
    CompositeTypes: Record<string, never>;
  };
}
