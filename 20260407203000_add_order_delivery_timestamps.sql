ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ;

ALTER TABLE public.orders
ALTER COLUMN created_at SET DEFAULT now();

CREATE OR REPLACE FUNCTION public.set_delivered_at_on_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Keep server-side created timestamp authoritative.
  IF TG_OP = 'INSERT' AND NEW.created_at IS NULL THEN
    NEW.created_at = now();
  END IF;

  -- Set delivered_at the first time status becomes Delivered.
  IF lower(COALESCE(NEW.status, '')) = 'delivered'
     AND lower(COALESCE(OLD.status, '')) <> 'delivered'
     AND NEW.delivered_at IS NULL THEN
    NEW.delivered_at = now();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS set_order_delivered_at_before_upsert ON public.orders;
CREATE TRIGGER set_order_delivered_at_before_upsert
BEFORE INSERT OR UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.set_delivered_at_on_status_change();
