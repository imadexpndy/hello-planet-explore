-- Ensure pgcrypto is available for digest()
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Recreate verify_api_key with fixed search_path
CREATE OR REPLACE FUNCTION public.verify_api_key(api_key_input TEXT)
RETURNS TABLE(is_valid BOOLEAN, key_id UUID, permissions JSONB) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    key_parts TEXT[];
    prefix_part TEXT;
    secret_part TEXT;
    stored_hash TEXT;
    key_record RECORD;
BEGIN
    -- Split the API key (format: prefix_secret)
    key_parts := string_to_array(api_key_input, '_');
    
    IF array_length(key_parts, 1) < 2 THEN
        RETURN QUERY SELECT false, NULL::UUID, NULL::JSONB;
        RETURN;
    END IF;
    
    prefix_part := key_parts[1];
    secret_part := array_to_string(key_parts[2:], '_');
    
    -- Find the API key by prefix
    SELECT ak.id, ak.key_hash, ak.permissions, ak.is_active, ak.expires_at
    INTO key_record
    FROM public.api_keys ak
    WHERE ak.key_prefix = prefix_part;
    
    -- Check if key exists and is active
    IF NOT FOUND OR NOT key_record.is_active THEN
        RETURN QUERY SELECT false, NULL::UUID, NULL::JSONB;
        RETURN;
    END IF;
    
    -- Check if key is expired
    IF key_record.expires_at IS NOT NULL AND key_record.expires_at < now() THEN
        RETURN QUERY SELECT false, NULL::UUID, NULL::JSONB;
        RETURN;
    END IF;
    
    -- Verify the hash
    stored_hash := key_record.key_hash;
    
    IF stored_hash = encode(digest(secret_part, 'sha256'), 'hex') THEN
        -- Update last_used_at
        UPDATE public.api_keys 
        SET last_used_at = now() 
        WHERE id = key_record.id;
        
        RETURN QUERY SELECT true, key_record.id, key_record.permissions;
    ELSE
        RETURN QUERY SELECT false, NULL::UUID, NULL::JSONB;
    END IF;
END;
$$;