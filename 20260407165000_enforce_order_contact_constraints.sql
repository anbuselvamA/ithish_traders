DO $$
BEGIN
  -- New schema columns
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'address'
  ) THEN
    ALTER TABLE public.orders
    DROP CONSTRAINT IF EXISTS orders_address_required_chk;

    ALTER TABLE public.orders
    ADD CONSTRAINT orders_address_required_chk
    CHECK (address IS NOT NULL AND btrim(address) <> '')
    NOT VALID;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'phone_number'
  ) THEN
    ALTER TABLE public.orders
    DROP CONSTRAINT IF EXISTS orders_phone_number_required_chk;

    ALTER TABLE public.orders
    ADD CONSTRAINT orders_phone_number_required_chk
    CHECK (phone_number IS NOT NULL AND btrim(phone_number) <> '' AND phone_number ~ '^[0-9]{10,15}$')
    NOT VALID;
  END IF;

  -- Legacy schema columns (kept for compatibility)
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'delivery_address'
  ) THEN
    ALTER TABLE public.orders
    DROP CONSTRAINT IF EXISTS orders_delivery_address_required_chk;

    ALTER TABLE public.orders
    ADD CONSTRAINT orders_delivery_address_required_chk
    CHECK (delivery_address IS NOT NULL AND btrim(delivery_address) <> '')
    NOT VALID;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'phone'
  ) THEN
    ALTER TABLE public.orders
    DROP CONSTRAINT IF EXISTS orders_phone_required_chk;

    ALTER TABLE public.orders
    ADD CONSTRAINT orders_phone_required_chk
    CHECK (phone IS NOT NULL AND btrim(phone) <> '' AND phone ~ '^[0-9]{10,15}$')
    NOT VALID;
  END IF;
END $$;
