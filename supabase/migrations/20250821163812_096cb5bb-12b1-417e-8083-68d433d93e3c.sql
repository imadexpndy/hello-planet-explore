-- Add payment and document tables
CREATE TYPE payment_status AS ENUM ('pending', 'confirmed', 'failed', 'cancelled');
CREATE TYPE payment_method AS ENUM ('cmi_card', 'bank_transfer', 'check', 'free');
CREATE TYPE document_type AS ENUM ('devis', 'invoice', 'ticket');

-- Create payments table
CREATE TABLE public.payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'EUR',
  payment_method payment_method NOT NULL,
  payment_status payment_status NOT NULL DEFAULT 'pending',
  transaction_id TEXT,
  payment_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create documents table
CREATE TABLE public.documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  document_type document_type NOT NULL,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create audit_logs table
CREATE TABLE public.audit_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add consent fields to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email_consent BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS whatsapp_consent BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS privacy_accepted BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS terms_accepted BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS consent_date TIMESTAMP WITH TIME ZONE;

-- Enable RLS
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for payments
CREATE POLICY "Users can view their own payments" 
ON public.payments 
FOR SELECT 
USING (
  booking_id IN (
    SELECT id FROM public.bookings WHERE user_id = auth.uid()
  )
);

-- Create policies for documents
CREATE POLICY "Users can view their own documents" 
ON public.documents 
FOR SELECT 
USING (
  booking_id IN (
    SELECT id FROM public.bookings WHERE user_id = auth.uid()
  )
);

-- Create policies for audit logs (admin only)
CREATE POLICY "Admins can view audit logs" 
ON public.audit_logs 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'super_admin')
  )
);

-- Insert policies for service operations
CREATE POLICY "Service can insert/update payments" ON public.payments FOR ALL USING (true);
CREATE POLICY "Service can insert documents" ON public.documents FOR ALL USING (true);
CREATE POLICY "Service can insert audit logs" ON public.audit_logs FOR ALL USING (true);

-- Add triggers for updated_at
CREATE TRIGGER update_payments_updated_at
BEFORE UPDATE ON public.payments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();