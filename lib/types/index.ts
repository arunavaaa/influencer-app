export type UserRole = 'creator' | 'brand'

export type User = {
  id: string
  role: UserRole
  created_at: string
}

export type CreatorProfile = {
  id: string
  user_id: string
  username: string | null
  display_name: string | null
  city: string | null
  bio: string | null
  profile_photo_url: string | null
  languages: string[] | null
  niches: string[] | null
  instagram_url: string | null
  instagram_followers: number | null
  youtube_url: string | null
  youtube_subscribers: number | null
  other_social_links: Record<string, string> | null
  profile_completion_score: number
  is_profile_live: boolean
  onboarding_complete: boolean
  created_at: string
  updated_at: string
}

export type BrandProfile = {
  id: string
  user_id: string
  brand_name: string
  logo_url: string | null
  type: 'product' | 'service' | null
  niche: string | null
  description: string | null
  website_url: string | null
  city: string | null
  team_size: string | null
  instagram_url: string | null
  youtube_url: string | null
  other_social_links: Record<string, string> | null
  platforms: string[] | null
  onboarding_complete: boolean
  created_at: string
  updated_at: string
}

export type ContentPackage = {
  id: string
  creator_id: string
  platform: string
  content_type: string
  price_inr: number
  delivery_days: number
  revisions: number
  description: string | null
  is_active: boolean
  created_at: string
}

export type Campaign = {
  id: string
  brand_id: string
  title: string
  goal: string | null
  deliverable_formats: string[] | null
  platforms: string[] | null
  niches: string[] | null
  budget_inr: number | null
  application_deadline: string | null
  content_deadline: string | null
  status: 'draft' | 'open' | 'closed'
  created_at: string
  updated_at: string
}

export type Application = {
  id: string
  campaign_id: string
  creator_id: string
  cover_note: string | null
  proposed_rate_inr: number | null
  status: 'pending' | 'shortlisted' | 'selected' | 'rejected'
  created_at: string
  updated_at: string
}

export type Conversation = {
  id: string
  brand_id: string
  creator_id: string
  initiated_by: 'brand' | 'creator'
  creator_accepted: boolean | null
  campaign_id: string | null
  created_at: string
  last_message_at: string
}

export type Message = {
  id: string
  conversation_id: string
  sender_id: string
  content: string
  created_at: string
}

export type Notification = {
  id: string
  user_id: string
  type: string
  message: string
  link: string | null
  read: boolean
  created_at: string
}

export const NICHES = [
  'Fashion', 'Beauty & Skincare', 'Food & Beverage', 'Health & Fitness',
  'Tech & Gadgets', 'Finance', 'Travel', 'Education', 'Gaming', 'Automotive',
  'Home & Lifestyle', 'Entertainment', 'E-commerce', 'Parenting', 'Comedy', 'Music', 'Other',
]

export const NICHE_EMOJIS: Record<string, string> = {
  'Fashion': '👗', 'Beauty & Skincare': '💄', 'Food & Beverage': '🍜',
  'Health & Fitness': '💪', 'Tech & Gadgets': '💻', 'Finance': '💰',
  'Travel': '✈️', 'Education': '📚', 'Gaming': '🎮', 'Automotive': '🏎️',
  'Home & Lifestyle': '🌿', 'Entertainment': '🎬', 'E-commerce': '🛍️',
  'Parenting': '👨‍👩‍👧', 'Comedy': '😂', 'Music': '🎵', 'Other': '✨',
}

export const CITIES = [
  'Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 'Kolkata',
  'Pune', 'Ahmedabad', 'Jaipur', 'Surat', 'Lucknow', 'Kochi',
  'Chandigarh', 'Indore', 'Bhopal', 'Coimbatore', 'Nagpur', 'Visakhapatnam', 'Other',
]

export const LANGUAGES = [
  'Hindi', 'English', 'Tamil', 'Telugu', 'Kannada',
  'Malayalam', 'Bengali', 'Marathi', 'Gujarati', 'Punjabi',
]

export const PLATFORMS = ['Instagram', 'YouTube', 'Facebook', 'Moj', 'LinkedIn', 'Other']

export const DELIVERABLE_FORMATS = ['Reel', 'Story', 'Post', 'Long Video', 'Shorts', 'UGC', 'Other']

export function formatINR(paise: number): string {
  return `₹${paise.toLocaleString('en-IN')}`
}

export function formatFollowers(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`
  return `${n}`
}
