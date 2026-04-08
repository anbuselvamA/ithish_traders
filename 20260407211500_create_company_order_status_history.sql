CREATE TABLE IF NOT EXISTS public.company_order_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  status TEXT NOT NULL,
  changed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  changed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_company_order_status_history_order_id
  ON public.company_order_status_history(order_id, changed_at DESC);

ALTER TABLE public.company_order_status_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view all company order statuses" ON public.company_order_status_history;
CREATE POLICY "Admins can view all company order statuses"
ON public.company_order_status_history
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can insert company order statuses" ON public.company_order_status_history;
CREATE POLICY "Admins can insert company order statuses"
ON public.company_order_status_history
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Users can view own company order statuses" ON public.company_order_status_history;
CREATE POLICY "Users can view own company order statuses"
ON public.company_order_status_history
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.orders o
    WHERE o.id = company_order_status_history.order_id
      AND o.user_id = auth.uid()
  )
);

CREATE OR REPLACE FUNCTION public.log_company_order_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.company_order_status_history (order_id, status, changed_by)
    VALUES (NEW.id, NEW.status, auth.uid());
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' AND COALESCE(NEW.status, '') <> COALESCE(OLD.status, '') THEN
    INSERT INTO public.company_order_status_history (order_id, status, changed_by)
    VALUES (NEW.id, NEW.status, auth.uid());
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_log_company_order_status_change ON public.orders;
CREATE TRIGGER trg_log_company_order_status_change
AFTER INSERT OR UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.log_company_order_status_change();
