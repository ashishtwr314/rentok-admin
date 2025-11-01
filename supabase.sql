-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.admins (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  email character varying NOT NULL UNIQUE,
  password character varying NOT NULL,
  phone_number character varying NOT NULL UNIQUE,
  phone_verified boolean DEFAULT false,
  email_verified boolean DEFAULT false,
  is_verified boolean DEFAULT (phone_verified AND email_verified),
  type character varying NOT NULL CHECK (type::text = ANY (ARRAY['vendor'::character varying, 'admin'::character varying]::text[])),
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT admins_pkey PRIMARY KEY (id)
);
CREATE TABLE public.advertisements (
  ad_id uuid NOT NULL DEFAULT uuid_generate_v4(),
  title character varying NOT NULL,
  description text,
  image_url text NOT NULL,
  link_url text,
  sort_order integer DEFAULT 0,
  start_date timestamp without time zone NOT NULL,
  end_date timestamp without time zone NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT advertisements_pkey PRIMARY KEY (ad_id)
);
CREATE TABLE public.categories (
  category_id uuid NOT NULL DEFAULT uuid_generate_v4(),
  name character varying NOT NULL,
  description text,
  image_url text,
  sort_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT categories_pkey PRIMARY KEY (category_id)
);
CREATE TABLE public.coupon_usage (
  usage_id uuid NOT NULL DEFAULT uuid_generate_v4(),
  coupon_id uuid NOT NULL,
  order_id uuid NOT NULL,
  profile_id uuid NOT NULL,
  vendor_id uuid,
  discount_applied numeric NOT NULL,
  used_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT coupon_usage_pkey PRIMARY KEY (usage_id),
  CONSTRAINT coupon_usage_coupon_id_fkey FOREIGN KEY (coupon_id) REFERENCES public.coupons(coupon_id),
  CONSTRAINT coupon_usage_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(order_id),
  CONSTRAINT coupon_usage_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(user_id),
  CONSTRAINT coupon_usage_vendor_id_fkey FOREIGN KEY (vendor_id) REFERENCES public.vendors(vendor_id)
);
CREATE TABLE public.coupons (
  coupon_id uuid NOT NULL DEFAULT uuid_generate_v4(),
  vendor_id uuid,
  code character varying NOT NULL UNIQUE,
  description text,
  discount_type USER-DEFINED NOT NULL,
  discount_value numeric NOT NULL,
  minimum_order_amount numeric DEFAULT 0.00,
  maximum_discount numeric,
  usage_limit integer,
  used_count integer DEFAULT 0,
  valid_from timestamp without time zone NOT NULL,
  valid_until timestamp without time zone NOT NULL,
  is_active boolean DEFAULT true,
  is_admin_coupon boolean DEFAULT false,
  applicable_categories jsonb DEFAULT '[]'::jsonb,
  applicable_products jsonb DEFAULT '[]'::jsonb,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT coupons_pkey PRIMARY KEY (coupon_id),
  CONSTRAINT coupons_vendor_id_fkey FOREIGN KEY (vendor_id) REFERENCES public.vendors(vendor_id)
);
CREATE TABLE public.order_items (
  order_item_id uuid NOT NULL DEFAULT uuid_generate_v4(),
  order_id uuid NOT NULL,
  product_id uuid NOT NULL,
  selected_size character varying,
  quantity integer NOT NULL DEFAULT 1,
  unit_price numeric NOT NULL,
  total_price numeric NOT NULL,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT order_items_pkey PRIMARY KEY (order_item_id),
  CONSTRAINT order_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(order_id),
  CONSTRAINT order_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(product_id)
);
CREATE TABLE public.order_status_history (
  history_id uuid NOT NULL DEFAULT uuid_generate_v4(),
  order_id uuid NOT NULL,
  status USER-DEFINED NOT NULL,
  notes text,
  updated_by character varying,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT order_status_history_pkey PRIMARY KEY (history_id),
  CONSTRAINT order_status_history_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(order_id)
);
CREATE TABLE public.orders (
  order_id uuid NOT NULL DEFAULT uuid_generate_v4(),
  profile_id uuid NOT NULL,
  order_number character varying NOT NULL UNIQUE,
  subtotal numeric NOT NULL,
  delivery_charge numeric DEFAULT 0.00,
  discount_amount numeric DEFAULT 0.00,
  total_amount numeric NOT NULL,
  rental_start_date date NOT NULL,
  rental_end_date date NOT NULL,
  rental_days integer NOT NULL,
  status USER-DEFINED DEFAULT 'pending'::order_status,
  coupon_code character varying,
  delivery_address text NOT NULL,
  contact_number character varying NOT NULL,
  payment_status USER-DEFINED DEFAULT 'pending'::payment_status,
  payment_method character varying,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT orders_pkey PRIMARY KEY (order_id),
  CONSTRAINT orders_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(user_id)
);
CREATE TABLE public.otp_storage (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  otp text NOT NULL,
  expires_at timestamp with time zone NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT otp_storage_pkey PRIMARY KEY (id)
);
CREATE TABLE public.product_highlights (
  highlight_id uuid NOT NULL DEFAULT uuid_generate_v4(),
  product_id uuid NOT NULL,
  title character varying NOT NULL,
  value character varying NOT NULL,
  sort_order integer DEFAULT 0,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT product_highlights_pkey PRIMARY KEY (highlight_id),
  CONSTRAINT product_highlights_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(product_id)
);
CREATE TABLE public.products (
  product_id uuid NOT NULL DEFAULT uuid_generate_v4(),
  category_id uuid NOT NULL,
  vendor_id uuid,
  title character varying NOT NULL,
  description text,
  price_per_day numeric NOT NULL,
  original_price numeric,
  discount_percentage integer DEFAULT 0,
  rating numeric DEFAULT 0.0,
  review_count integer DEFAULT 0,
  available_sizes jsonb DEFAULT '[]'::jsonb,
  tags jsonb DEFAULT '[]'::jsonb,
  images jsonb DEFAULT '[]'::jsonb,
  stock_quantity integer DEFAULT 1,
  is_featured boolean DEFAULT false,
  is_active boolean DEFAULT true,
  created_by_admin boolean DEFAULT false,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  deal_of_the_day boolean DEFAULT false,
  user_id uuid,
  is_user_product boolean DEFAULT false,
  is_verified boolean DEFAULT false,
  security_deposit numeric,
  specifications jsonb DEFAULT '{}'::jsonb,
  CONSTRAINT products_pkey PRIMARY KEY (product_id),
  CONSTRAINT products_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(category_id),
  CONSTRAINT products_vendor_id_fkey FOREIGN KEY (vendor_id) REFERENCES public.vendors(vendor_id),
  CONSTRAINT products_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(user_id)
);
CREATE TABLE public.profiles (
  user_id uuid NOT NULL DEFAULT uuid_generate_v4(),
  mobile_number character varying NOT NULL UNIQUE,
  name character varying,
  email character varying UNIQUE,
  profile_picture text,
  address text,
  city character varying,
  postal_code character varying,
  password_hash character varying,
  is_verified boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  auth_user_id uuid UNIQUE,
  full_name text,
  state text,
  country text DEFAULT 'India'::text,
  gender text CHECK (gender = ANY (ARRAY['male'::text, 'female'::text, 'other'::text])),
  date_of_birth date,
  profile_picture_url text,
  mobile_verified boolean DEFAULT false,
  is_profile_complete boolean DEFAULT false,
  email_verified boolean DEFAULT false,
  CONSTRAINT profiles_pkey PRIMARY KEY (user_id),
  CONSTRAINT profiles_auth_user_id_fkey FOREIGN KEY (auth_user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.reviews (
  review_id uuid NOT NULL DEFAULT uuid_generate_v4(),
  product_id uuid NOT NULL,
  profile_id uuid NOT NULL,
  order_id uuid,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  is_verified boolean DEFAULT false,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT reviews_pkey PRIMARY KEY (review_id),
  CONSTRAINT reviews_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(product_id),
  CONSTRAINT reviews_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(order_id),
  CONSTRAINT reviews_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(user_id)
);
CREATE TABLE public.search_queries (
  query_id uuid NOT NULL DEFAULT uuid_generate_v4(),
  query_text character varying NOT NULL UNIQUE,
  search_count integer DEFAULT 1,
  last_searched_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT search_queries_pkey PRIMARY KEY (query_id)
);
CREATE TABLE public.user_sessions (
  session_id uuid NOT NULL DEFAULT uuid_generate_v4(),
  profile_id uuid NOT NULL,
  token text NOT NULL,
  device_info jsonb,
  ip_address character varying,
  expires_at timestamp without time zone NOT NULL,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT user_sessions_pkey PRIMARY KEY (session_id),
  CONSTRAINT user_sessions_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(user_id)
);
CREATE TABLE public.vendor_earnings (
  earning_id uuid NOT NULL DEFAULT uuid_generate_v4(),
  vendor_id uuid NOT NULL,
  order_id uuid NOT NULL,
  order_item_id uuid NOT NULL,
  gross_amount numeric NOT NULL,
  commission_rate numeric NOT NULL,
  commission_amount numeric NOT NULL,
  net_amount numeric NOT NULL,
  status USER-DEFINED DEFAULT 'pending'::payment_status,
  payout_date timestamp without time zone,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT vendor_earnings_pkey PRIMARY KEY (earning_id),
  CONSTRAINT vendor_earnings_vendor_id_fkey FOREIGN KEY (vendor_id) REFERENCES public.vendors(vendor_id),
  CONSTRAINT vendor_earnings_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(order_id),
  CONSTRAINT vendor_earnings_order_item_id_fkey FOREIGN KEY (order_item_id) REFERENCES public.order_items(order_item_id)
);
CREATE TABLE public.vendors (
  vendor_id uuid NOT NULL DEFAULT uuid_generate_v4(),
  name character varying NOT NULL,
  email character varying NOT NULL UNIQUE,
  phone character varying NOT NULL,
  business_name character varying,
  business_address text,
  city character varying,
  state character varying,
  postal_code character varying,
  country character varying DEFAULT 'India'::character varying,
  gst_number character varying,
  pan_number character varying,
  bank_account_number character varying,
  bank_ifsc_code character varying,
  bank_account_holder_name character varying,
  is_verified boolean DEFAULT false,
  is_active boolean DEFAULT true,
  commission_rate numeric DEFAULT 10.00,
  profile_picture_url text,
  business_license_url text,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  auth_user_id uuid UNIQUE,
  CONSTRAINT vendors_pkey PRIMARY KEY (vendor_id),
  CONSTRAINT vendors_auth_user_id_fkey FOREIGN KEY (auth_user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.wishlist (
  wishlist_id uuid NOT NULL DEFAULT uuid_generate_v4(),
  profile_id uuid NOT NULL,
  product_id uuid NOT NULL,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT wishlist_pkey PRIMARY KEY (wishlist_id),
  CONSTRAINT wishlist_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(product_id),
  CONSTRAINT wishlist_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(user_id)
);
