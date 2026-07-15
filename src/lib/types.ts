export type PostStatus =
  | "auto_posted"
  | "pending_review"
  | "filtered"
  | "scheduled"
  | "posted"
  | "rejected";

export type ContentType = "text" | "image" | "carousel" | "document";
export type SourceType = "personal" | "company" | "manual";

export interface Post {
  id: string;
  source_type: SourceType | null;
  source_url: string | null;
  origin: string | null;
  content_type: ContentType | null;
  original_content: string | null;
  repurposed_content: string | null;
  image_prompt: string | null;
  image_urls: string[] | null;
  document_url: string | null;
  brand_tone: string | null;
  score: number | null;
  score_reason: string | null;
  improvement_tip: string | null;
  status: PostStatus;
  scheduled_for: string | null;
  upload_post_job_id: string | null;
  platform_post_id: string | null;
  profile_username: string | null;
  live_likes: number | null;
  live_comments: number | null;
  live_shares: number | null;
  live_reach: number | null;
  live_impressions: number | null;
  analytics_updated_at: string | null;
  scraped_post_id: string | null;
  client_id: string | null;
  created_at: string;
}

export interface ScrapedPost {
  id: string;
  linkedin_post_id: string | null;
  linkedin_url: string | null;
  content: string | null;
  author_type: string | null;
  author_name: string | null;
  author_avatar_url: string | null;
  posted_at: string | null;
  image_urls: string[] | null;
  image_count: number | null;
  likes: number | null;
  comments: number | null;
  shares: number | null;
}

export interface WeeklySuggestion {
  id: string;
  week_start: string;
  suggestion: string;
  created_at: string;
}

export interface PausedDate {
  id: string;
  paused_date: string;
  reason: string | null;
  created_at: string;
}
