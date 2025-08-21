import { supabase } from '@/integrations/supabase/client';

export interface AuditLogEntry {
  user_id: string | null;
  action: string;
  table_name: string;
  entity: string;
  record_id?: string;
  old_values?: any;
  new_values?: any;
  ip_address?: string;
  user_agent?: string;
}

export const logAuditEvent = async (entry: AuditLogEntry) => {
  try {
    const { error } = await supabase
      .from('audit_logs')
      .insert({
        user_id: entry.user_id,
        action: entry.action,
        table_name: entry.table_name,
        entity: entry.entity,
        record_id: entry.record_id,
        old_values: entry.old_values,
        new_values: entry.new_values,
        ip_address: entry.ip_address,
        user_agent: entry.user_agent || navigator.userAgent,
      });

    if (error) {
      console.error('Failed to log audit event:', error);
    }
  } catch (error) {
    console.error('Error logging audit event:', error);
  }
};

// Helper functions for common audit events
export const logUserLogin = async (userId: string) => {
  await logAuditEvent({
    user_id: userId,
    action: 'LOGIN',
    table_name: 'auth.users',
    entity: 'user_session',
    record_id: userId,
  });
};

export const logUserLogout = async (userId: string) => {
  await logAuditEvent({
    user_id: userId,
    action: 'LOGOUT',
    table_name: 'auth.users',
    entity: 'user_session',
    record_id: userId,
  });
};

export const logBookingCreation = async (userId: string, bookingId: string, bookingData: any) => {
  await logAuditEvent({
    user_id: userId,
    action: 'CREATE',
    table_name: 'bookings',
    entity: 'booking',
    record_id: bookingId,
    new_values: bookingData,
  });
};

export const logProfileUpdate = async (userId: string, oldData: any, newData: any) => {
  await logAuditEvent({
    user_id: userId,
    action: 'UPDATE',
    table_name: 'profiles',
    entity: 'user_profile',
    record_id: userId,
    old_values: oldData,
    new_values: newData,
  });
};