CREATE TABLE IF NOT EXISTS public.feedbacks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  food_id TEXT NOT NULL,
  rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, food_id)
);

ALTER TABLE public.feedbacks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can create own feedbacks" ON public.feedbacks;
CREATE POLICY "Users can create own feedbacks" ON public.feedbacks
FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own feedbacks" ON public.feedbacks;
CREATE POLICY "Users can view own feedbacks" ON public.feedbacks
FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all feedbacks" ON public.feedbacks;
CREATE POLICY "Admins can view all feedbacks" ON public.feedbacks
FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Users can create own ratings" ON public.ratings;
CREATE POLICY "Users can create own ratings" ON public.ratings
FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own ratings" ON public.ratings;
CREATE POLICY "Users can update own ratings" ON public.ratings
FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own ratings" ON public.ratings;
CREATE POLICY "Users can view own ratings" ON public.ratings
FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Anyone can read ratings" ON public.ratings;
CREATE POLICY "Anyone can read ratings" ON public.ratings
FOR SELECT USING (true);
