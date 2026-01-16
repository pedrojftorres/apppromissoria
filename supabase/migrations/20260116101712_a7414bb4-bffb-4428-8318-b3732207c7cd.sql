-- Create users table for simple auth
CREATE TABLE public.users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('debtor', 'creditor')),
  password_hash TEXT NOT NULL,
  pix_key TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create push subscriptions table
CREATE TABLE public.push_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, endpoint)
);

-- Create promissories table
CREATE TABLE public.promissories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  number INTEGER NOT NULL,
  amount DECIMAL(10,2) NOT NULL DEFAULT 1000.00,
  due_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid_by_debtor', 'confirmed', 'overdue')),
  debtor_confirmed_at TIMESTAMP WITH TIME ZONE,
  creditor_confirmed_at TIMESTAMP WITH TIME ZONE,
  receipt_url TEXT,
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create notifications table for in-app notifications
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('payment_marked', 'payment_confirmed', 'reminder')),
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promissories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Policies for users (public read for simple auth)
CREATE POLICY "Anyone can read users" ON public.users FOR SELECT USING (true);

-- Policies for push_subscriptions (anyone can manage for now - simple auth)
CREATE POLICY "Anyone can manage subscriptions" ON public.push_subscriptions FOR ALL USING (true);

-- Policies for promissories (public access for this simple app)
CREATE POLICY "Anyone can read promissories" ON public.promissories FOR SELECT USING (true);
CREATE POLICY "Anyone can update promissories" ON public.promissories FOR UPDATE USING (true);

-- Policies for notifications
CREATE POLICY "Anyone can manage notifications" ON public.notifications FOR ALL USING (true);

-- Enable realtime for notifications and promissories
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.promissories;

-- Insert default users
INSERT INTO public.users (name, role, password_hash) VALUES
  ('Pedro Henrique Torres', 'debtor', 'pedro123'),
  ('Lindomar de Almeida Barbosa', 'creditor', 'lindomar123');

-- Insert 20 promissories
INSERT INTO public.promissories (number, amount, due_date)
SELECT 
  generate_series(1, 20) as number,
  1000.00 as amount,
  DATE '2026-01-10' + (generate_series(1, 20) - 1) * INTERVAL '1 month' as due_date;