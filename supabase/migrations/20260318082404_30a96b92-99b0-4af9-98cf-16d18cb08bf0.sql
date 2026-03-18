
-- Create slide type enum
CREATE TYPE public.slide_type AS ENUM ('multiple_choice', 'word_cloud', 'open_text');

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Presentations table
CREATE TABLE public.presentations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL DEFAULT 'Untitled Presentation',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.presentations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own presentations" ON public.presentations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own presentations" ON public.presentations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own presentations" ON public.presentations FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own presentations" ON public.presentations FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_presentations_updated_at
  BEFORE UPDATE ON public.presentations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Slides table
CREATE TABLE public.slides (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  presentation_id UUID REFERENCES public.presentations(id) ON DELETE CASCADE NOT NULL,
  "order" INTEGER NOT NULL DEFAULT 0,
  type public.slide_type NOT NULL DEFAULT 'multiple_choice',
  question TEXT NOT NULL DEFAULT '',
  options JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.slides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view slides of their presentations" ON public.slides
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.presentations WHERE id = presentation_id AND user_id = auth.uid())
  );
CREATE POLICY "Users can insert slides to their presentations" ON public.slides
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.presentations WHERE id = presentation_id AND user_id = auth.uid())
  );
CREATE POLICY "Users can update slides of their presentations" ON public.slides
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.presentations WHERE id = presentation_id AND user_id = auth.uid())
  );
CREATE POLICY "Users can delete slides of their presentations" ON public.slides
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.presentations WHERE id = presentation_id AND user_id = auth.uid())
  );

CREATE TRIGGER update_slides_updated_at
  BEFORE UPDATE ON public.slides
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Sessions table
CREATE TABLE public.sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  presentation_id UUID REFERENCES public.presentations(id) ON DELETE CASCADE NOT NULL,
  join_code TEXT NOT NULL UNIQUE,
  active_slide_id UUID REFERENCES public.slides(id),
  is_active BOOLEAN NOT NULL DEFAULT true,
  voting_locked BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

-- Owner can manage sessions
CREATE POLICY "Users can view their own sessions" ON public.sessions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.presentations WHERE id = presentation_id AND user_id = auth.uid())
  );
CREATE POLICY "Users can create sessions for their presentations" ON public.sessions
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.presentations WHERE id = presentation_id AND user_id = auth.uid())
  );
CREATE POLICY "Users can update their own sessions" ON public.sessions
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.presentations WHERE id = presentation_id AND user_id = auth.uid())
  );

-- Anyone can read active sessions by join_code (for audience)
CREATE POLICY "Anyone can view active sessions by join_code" ON public.sessions
  FOR SELECT USING (is_active = true);

-- Responses table
CREATE TABLE public.responses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES public.sessions(id) ON DELETE CASCADE NOT NULL,
  slide_id UUID REFERENCES public.slides(id) ON DELETE CASCADE NOT NULL,
  participant_id TEXT NOT NULL,
  value TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.responses ENABLE ROW LEVEL SECURITY;

-- Anyone can insert responses (audience voting)
CREATE POLICY "Anyone can insert responses" ON public.responses
  FOR INSERT WITH CHECK (true);

-- Session owner can read responses
CREATE POLICY "Session owners can view responses" ON public.responses
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.sessions s
      JOIN public.presentations p ON p.id = s.presentation_id
      WHERE s.id = session_id AND p.user_id = auth.uid()
    )
  );

-- Audience can read responses for live visualizations (anonymous)
CREATE POLICY "Anyone can view responses" ON public.responses
  FOR SELECT USING (true);

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.responses;

-- Index for fast join_code lookups
CREATE INDEX idx_sessions_join_code ON public.sessions(join_code);
CREATE INDEX idx_responses_session_slide ON public.responses(session_id, slide_id);
