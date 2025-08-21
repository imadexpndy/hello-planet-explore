-- Create schools table for teachers to select from
CREATE TABLE IF NOT EXISTS public.schools (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  ice_number TEXT,
  address TEXT,
  city TEXT,
  school_type TEXT NOT NULL CHECK (school_type IN ('public', 'private')),
  domain TEXT, -- for email validation
  verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create associations table
CREATE TABLE IF NOT EXISTS public.associations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  ice_number TEXT,
  address TEXT,
  city TEXT,
  contact_person TEXT,
  verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add verification and registration fields to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS school_id UUID REFERENCES public.schools(id),
ADD COLUMN IF NOT EXISTS association_id UUID REFERENCES public.associations(id),
ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'approved', 'rejected')),
ADD COLUMN IF NOT EXISTS verification_documents TEXT[], -- URLs to uploaded documents
ADD COLUMN IF NOT EXISTS professional_email TEXT,
ADD COLUMN IF NOT EXISTS season_verified_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS full_name TEXT,
ADD COLUMN IF NOT EXISTS contact_person TEXT,
ADD COLUMN IF NOT EXISTS ice_number TEXT,
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS admin_role TEXT CHECK (admin_role IN ('school_manager', 'communication_manager', 'programming_manager', 'support_manager', 'finance_manager', 'super_admin'));

-- Enable RLS on new tables
ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.associations ENABLE ROW LEVEL SECURITY;

-- Create policies for schools
CREATE POLICY "Anyone can view approved schools" 
ON public.schools 
FOR SELECT 
USING (verification_status = 'approved' OR verification_status = 'pending');

CREATE POLICY "Admins can manage schools" 
ON public.schools 
FOR ALL 
USING (get_current_user_role() IN ('admin', 'super_admin'));

-- Create policies for associations
CREATE POLICY "Anyone can view associations" 
ON public.associations 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage associations" 
ON public.associations 
FOR ALL 
USING (get_current_user_role() IN ('admin', 'super_admin'));

-- Insert some default schools for testing
INSERT INTO public.schools (name, ice_number, city, school_type, verification_status, domain) VALUES
('Lycée Mohammed V', 'ICE123456789', 'Casablanca', 'public', 'approved', 'lycee-mohammedv.ma'),
('École Privée Atlas', 'ICE987654321', 'Rabat', 'private', 'approved', 'atlas-school.ma'),
('Collège Ibn Sina', 'ICE456789123', 'Marrakech', 'public', 'approved', 'ibnsina-college.ma'),
('Institution Privée Excellence', 'ICE321654987', 'Fès', 'private', 'approved', 'excellence.ma')
ON CONFLICT DO NOTHING;

-- Add triggers
CREATE TRIGGER update_schools_updated_at
BEFORE UPDATE ON public.schools
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_associations_updated_at
BEFORE UPDATE ON public.associations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();