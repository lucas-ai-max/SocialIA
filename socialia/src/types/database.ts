export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type PostStatus = "draft" | "scheduled" | "publishing" | "published" | "failed";
export type TransactionType = "purchase" | "usage" | "bonus" | "refund";
export type GenerationMode = "auto" | "prompt";
export type ImageFormat = "square" | "portrait";
export type BrandVoice = "formal" | "casual" | "playful" | "professional";
export type VisualStyle = "minimalist" | "vibrant" | "dark" | "clean";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          credits: number;
          onboarding_completed: boolean;
          profile_photo_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          credits?: number;
          onboarding_completed?: boolean;
          profile_photo_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          credits?: number;
          onboarding_completed?: boolean;
          profile_photo_url?: string | null;
          updated_at?: string;
        };
      };
      instagram_accounts: {
        Row: {
          id: string;
          user_id: string;
          composio_connection_id: string | null;
          ig_user_id: string;
          ig_username: string;
          ig_name: string | null;
          ig_profile_picture_url: string | null;
          ig_followers_count: number | null;
          facebook_page_id: string;
          access_token: string;
          token_expires_at: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          composio_connection_id?: string | null;
          ig_user_id: string;
          ig_username: string;
          ig_name?: string | null;
          ig_profile_picture_url?: string | null;
          ig_followers_count?: number | null;
          facebook_page_id: string;
          access_token: string;
          token_expires_at: string;
          is_active?: boolean;
        };
        Update: {
          composio_connection_id?: string | null;
          ig_username?: string;
          ig_name?: string | null;
          ig_profile_picture_url?: string | null;
          ig_followers_count?: number | null;
          access_token?: string;
          token_expires_at?: string;
          is_active?: boolean;
          updated_at?: string;
        };
      };
      brand_profiles: {
        Row: {
          id: string;
          user_id: string;
          niche: string;
          target_audience: string;
          brand_voice: string;
          visual_style: string;
          color_palette: string[] | null;
          content_pillars: string[];
          additional_context: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          niche: string;
          target_audience: string;
          brand_voice: string;
          visual_style: string;
          color_palette?: string[] | null;
          content_pillars: string[];
          additional_context?: string | null;
        };
        Update: {
          niche?: string;
          target_audience?: string;
          brand_voice?: string;
          visual_style?: string;
          color_palette?: string[] | null;
          content_pillars?: string[];
          additional_context?: string | null;
          updated_at?: string;
        };
      };
      posts: {
        Row: {
          id: string;
          user_id: string;
          instagram_account_id: string | null;
          generation_mode: GenerationMode;
          user_prompt: string | null;
          image_format: ImageFormat;
          generated_image_url: string | null;
          generated_image_prompt: string | null;
          caption: string | null;
          hashtags: string[] | null;
          status: PostStatus;
          scheduled_at: string | null;
          published_at: string | null;
          ig_media_id: string | null;
          ig_container_id: string | null;
          publish_error: string | null;
          retry_count: number;
          credits_charged: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          instagram_account_id?: string | null;
          generation_mode: GenerationMode;
          user_prompt?: string | null;
          image_format?: ImageFormat;
          generated_image_url?: string | null;
          generated_image_prompt?: string | null;
          caption?: string | null;
          hashtags?: string[] | null;
          status?: PostStatus;
          scheduled_at?: string | null;
        };
        Update: {
          instagram_account_id?: string | null;
          user_prompt?: string | null;
          image_format?: ImageFormat;
          generated_image_url?: string | null;
          generated_image_prompt?: string | null;
          caption?: string | null;
          hashtags?: string[] | null;
          status?: PostStatus;
          scheduled_at?: string | null;
          published_at?: string | null;
          ig_media_id?: string | null;
          ig_container_id?: string | null;
          publish_error?: string | null;
          retry_count?: number;
          credits_charged?: number;
          updated_at?: string;
        };
      };
      reference_images: {
        Row: {
          id: string;
          post_id: string;
          user_id: string;
          storage_path: string;
          original_filename: string | null;
          file_size: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          post_id: string;
          user_id: string;
          storage_path: string;
          original_filename?: string | null;
          file_size?: number | null;
        };
        Update: {};
      };
      credit_transactions: {
        Row: {
          id: string;
          user_id: string;
          type: TransactionType;
          amount: number;
          balance_after: number;
          description: string | null;
          post_id: string | null;
          stripe_payment_intent_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: TransactionType;
          amount: number;
          balance_after: number;
          description?: string | null;
          post_id?: string | null;
          stripe_payment_intent_id?: string | null;
        };
        Update: {};
      };
      stripe_customers: {
        Row: {
          id: string;
          user_id: string;
          stripe_customer_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          stripe_customer_id: string;
        };
        Update: {};
      };
    };
  };
}
