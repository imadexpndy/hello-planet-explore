-- Update database schema to match exact requirements

-- Add missing columns to profiles table (users equivalent)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS whatsapp TEXT;

-- Update organizations table structure
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS ice TEXT;

-- Update spectacles table structure  
ALTER TABLE public.spectacles ADD COLUMN IF NOT EXISTS level_range TEXT;
ALTER TABLE public.spectacles ADD COLUMN IF NOT EXISTS price DECIMAL(10,2) DEFAULT 80.00;
ALTER TABLE public.spectacles ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);

-- Update sessions table structure
ALTER TABLE public.sessions ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE public.sessions ADD COLUMN IF NOT EXISTS datetime TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.sessions ADD COLUMN IF NOT EXISTS session_type TEXT DEFAULT 'b2c';
ALTER TABLE public.sessions ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

-- Update bookings table structure
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS students_count INTEGER DEFAULT 0;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS accompanists_count INTEGER DEFAULT 0;

-- Update tickets table structure
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS pdf_url TEXT;
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS assigned_to TEXT;
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS partner_name TEXT;
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS association_name TEXT;

-- Create payments table
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
    method TEXT NOT NULL, -- 'cmi_card', 'bank_transfer', 'cheque'
    amount DECIMAL(10,2) NOT NULL,
    status payment_status DEFAULT 'pending',
    transaction_reference TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on payments table
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for payments
CREATE POLICY "Users can view their own payments" ON public.payments
FOR SELECT USING (
  booking_id IN (
    SELECT id FROM public.bookings WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Admins can view all payments" ON public.payments
FOR SELECT USING (public.get_current_user_role() = 'admin');

CREATE POLICY "System can insert payments" ON public.payments
FOR INSERT WITH CHECK (true);

-- Add trigger for payments timestamps
CREATE TRIGGER update_payments_updated_at
  BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Update audit_logs table to match requirements
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS entity TEXT;
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS timestamp TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Create policies for profile updates
CREATE POLICY "Users can insert their own profile" ON public.profiles
FOR INSERT WITH CHECK (user_id = auth.uid());