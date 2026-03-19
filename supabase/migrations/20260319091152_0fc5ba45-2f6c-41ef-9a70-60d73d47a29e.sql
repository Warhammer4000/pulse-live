-- Add new slide types to the enum
ALTER TYPE public.slide_type ADD VALUE IF NOT EXISTS 'rating_scale';
ALTER TYPE public.slide_type ADD VALUE IF NOT EXISTS 'quiz';
ALTER TYPE public.slide_type ADD VALUE IF NOT EXISTS 'ranking';
ALTER TYPE public.slide_type ADD VALUE IF NOT EXISTS 'poll';

-- Add image_url column to slides
ALTER TABLE public.slides ADD COLUMN IF NOT EXISTS image_url text;