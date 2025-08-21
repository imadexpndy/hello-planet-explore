-- Add missing booking status values
ALTER TYPE booking_status ADD VALUE IF NOT EXISTS 'awaiting_verification';
ALTER TYPE booking_status ADD VALUE IF NOT EXISTS 'approved';
ALTER TYPE booking_status ADD VALUE IF NOT EXISTS 'rejected';

-- Add missing communication status enum and communication type enum
CREATE TYPE IF NOT EXISTS communication_status AS ENUM ('pending', 'sent', 'delivered', 'failed');
CREATE TYPE IF NOT EXISTS communication_type AS ENUM ('email', 'whatsapp', 'sms');

-- Add missing ticket status enum
CREATE TYPE IF NOT EXISTS ticket_status AS ENUM ('active', 'used', 'cancelled', 'expired');

-- Update communications table to use the proper enums
ALTER TABLE communications 
ALTER COLUMN status TYPE communication_status USING status::communication_status,
ALTER COLUMN type TYPE communication_type USING type::communication_type;