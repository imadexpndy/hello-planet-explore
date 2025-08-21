-- Create enum types for better data consistency
CREATE TYPE user_role AS ENUM ('admin', 'teacher_private', 'teacher_public', 'association', 'partner', 'b2c_user');
CREATE TYPE organization_type AS ENUM ('private_school', 'public_school', 'association', 'partner');
CREATE TYPE booking_status AS ENUM ('pending', 'confirmed', 'cancelled', 'completed');
CREATE TYPE payment_status AS ENUM ('pending', 'completed', 'failed', 'refunded');
CREATE TYPE ticket_status AS ENUM ('active', 'used', 'cancelled');
CREATE TYPE communication_type AS ENUM ('email', 'whatsapp', 'sms');
CREATE TYPE communication_status AS ENUM ('pending', 'sent', 'delivered', 'failed');

-- Organizations table (schools, associations, partners)
CREATE TABLE public.organizations (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    type organization_type NOT NULL,
    contact_email TEXT,
    contact_phone TEXT,
    address TEXT,
    verification_status BOOLEAN DEFAULT false,
    max_free_tickets INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- User profiles table
CREATE TABLE public.profiles (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    first_name TEXT,
    last_name TEXT,
    phone TEXT,
    role user_role NOT NULL DEFAULT 'b2c_user',
    organization_id UUID REFERENCES public.organizations(id),
    is_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Spectacles table (shows/performances)
CREATE TABLE public.spectacles (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    age_range_min INTEGER,
    age_range_max INTEGER,
    duration_minutes INTEGER,
    poster_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Sessions table (specific showings of spectacles)
CREATE TABLE public.sessions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    spectacle_id UUID NOT NULL REFERENCES public.spectacles(id) ON DELETE CASCADE,
    session_date DATE NOT NULL,
    session_time TIME NOT NULL,
    venue TEXT NOT NULL,
    total_capacity INTEGER NOT NULL,
    b2c_capacity INTEGER NOT NULL,
    partner_quota INTEGER DEFAULT 50,
    price_mad DECIMAL(10,2) NOT NULL DEFAULT 80.00,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Bookings table
CREATE TABLE public.bookings (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES public.organizations(id),
    booking_type TEXT NOT NULL, -- 'b2c', 'private_school', 'public_school', 'association', 'partner'
    number_of_tickets INTEGER NOT NULL CHECK (number_of_tickets > 0),
    total_amount DECIMAL(10,2) DEFAULT 0,
    status booking_status DEFAULT 'pending',
    payment_status payment_status DEFAULT 'pending',
    payment_reference TEXT,
    devis_url TEXT,
    confirmation_deadline TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tickets table
CREATE TABLE public.tickets (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
    ticket_number TEXT NOT NULL UNIQUE,
    qr_code TEXT NOT NULL,
    seat_number TEXT,
    status ticket_status DEFAULT 'active',
    holder_name TEXT,
    used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Communications table (email/whatsapp tracking)
CREATE TABLE public.communications (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    booking_id UUID REFERENCES public.bookings(id),
    type communication_type NOT NULL,
    recipient TEXT NOT NULL,
    subject TEXT,
    content TEXT NOT NULL,
    template_name TEXT,
    status communication_status DEFAULT 'pending',
    sent_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Audit logs table
CREATE TABLE public.audit_logs (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    action TEXT NOT NULL,
    table_name TEXT NOT NULL,
    record_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spectacles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.communications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Create security definer function to get current user role
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS user_role AS $$
  SELECT role FROM public.profiles WHERE user_id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update their own profile" ON public.profiles
FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Admins can view all profiles" ON public.profiles
FOR SELECT USING (public.get_current_user_role() = 'admin');

CREATE POLICY "Admins can update all profiles" ON public.profiles
FOR UPDATE USING (public.get_current_user_role() = 'admin');

-- RLS Policies for organizations
CREATE POLICY "Anyone can view organizations" ON public.organizations
FOR SELECT USING (true);

CREATE POLICY "Admins can manage organizations" ON public.organizations
FOR ALL USING (public.get_current_user_role() = 'admin');

-- RLS Policies for spectacles
CREATE POLICY "Anyone can view active spectacles" ON public.spectacles
FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage spectacles" ON public.spectacles
FOR ALL USING (public.get_current_user_role() = 'admin');

-- RLS Policies for sessions
CREATE POLICY "Anyone can view active sessions" ON public.sessions
FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage sessions" ON public.sessions
FOR ALL USING (public.get_current_user_role() = 'admin');

-- RLS Policies for bookings
CREATE POLICY "Users can view their own bookings" ON public.bookings
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create their own bookings" ON public.bookings
FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own bookings" ON public.bookings
FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Admins can view all bookings" ON public.bookings
FOR SELECT USING (public.get_current_user_role() = 'admin');

CREATE POLICY "Admins can manage all bookings" ON public.bookings
FOR ALL USING (public.get_current_user_role() = 'admin');

-- RLS Policies for tickets
CREATE POLICY "Users can view their booking tickets" ON public.tickets
FOR SELECT USING (
  booking_id IN (
    SELECT id FROM public.bookings WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Admins can view all tickets" ON public.tickets
FOR SELECT USING (public.get_current_user_role() = 'admin');

CREATE POLICY "Admins can manage tickets" ON public.tickets
FOR ALL USING (public.get_current_user_role() = 'admin');

-- RLS Policies for communications
CREATE POLICY "Users can view their communications" ON public.communications
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can view all communications" ON public.communications
FOR SELECT USING (public.get_current_user_role() = 'admin');

CREATE POLICY "System can insert communications" ON public.communications
FOR INSERT WITH CHECK (true);

-- RLS Policies for audit logs
CREATE POLICY "Admins can view audit logs" ON public.audit_logs
FOR SELECT USING (public.get_current_user_role() = 'admin');

CREATE POLICY "System can insert audit logs" ON public.audit_logs
FOR INSERT WITH CHECK (true);

-- Function to auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, role)
  VALUES (
    NEW.id,
    NEW.email,
    'b2c_user'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for auto-creating profiles
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updating timestamps
CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_spectacles_updated_at
  BEFORE UPDATE ON public.spectacles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_sessions_updated_at
  BEFORE UPDATE ON public.sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tickets_updated_at
  BEFORE UPDATE ON public.tickets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();