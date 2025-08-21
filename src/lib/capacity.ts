import { supabase } from '@/integrations/supabase/client';

export interface CapacityCheck {
  sessionId: string;
  requestedSeats: number;
  availableSeats: number;
  canBook: boolean;
  alternativeSessions?: {
    id: string;
    date: string;
    time: string;
    venue: string;
    availableSeats: number;
  }[];
}

export const checkSessionCapacity = async (
  sessionId: string, 
  requestedSeats: number
): Promise<CapacityCheck> => {
  try {
    // Get session with current bookings
    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .select(`
        id,
        total_capacity,
        session_date,
        session_time,
        venue,
        spectacle_id,
        bookings (number_of_tickets)
      `)
      .eq('id', sessionId)
      .single();

    if (sessionError) throw sessionError;

    // Calculate currently booked seats
    const bookedSeats = session.bookings?.reduce(
      (total, booking) => total + booking.number_of_tickets, 
      0
    ) || 0;

    const availableSeats = session.total_capacity - bookedSeats;
    const canBook = availableSeats >= requestedSeats;

    let alternativeSessions: any[] = [];

    // If can't book, find alternative sessions for the same spectacle
    if (!canBook) {
      const { data: alternatives } = await supabase
        .from('sessions')
        .select(`
          id,
          session_date,
          session_time,
          venue,
          total_capacity,
          bookings (number_of_tickets)
        `)
        .eq('spectacle_id', session.spectacle_id)
        .neq('id', sessionId)
        .eq('status', 'published')
        .gte('session_date', new Date().toISOString().split('T')[0])
        .order('session_date');

      alternativeSessions = (alternatives || [])
        .map(alt => {
          const altBookedSeats = alt.bookings?.reduce(
            (total, booking) => total + booking.number_of_tickets, 
            0
          ) || 0;
          const altAvailableSeats = alt.total_capacity - altBookedSeats;
          
          return {
            id: alt.id,
            date: alt.session_date,
            time: alt.session_time,
            venue: alt.venue,
            availableSeats: altAvailableSeats
          };
        })
        .filter(alt => alt.availableSeats >= requestedSeats)
        .slice(0, 5); // Limit to 5 alternatives
    }

    return {
      sessionId,
      requestedSeats,
      availableSeats,
      canBook,
      alternativeSessions: canBook ? undefined : alternativeSessions
    };
  } catch (error) {
    console.error('Error checking capacity:', error);
    throw error;
  }
};

export const reserveSeats = async (
  sessionId: string,
  userId: string,
  requestedSeats: number,
  bookingType: string,
  organizationId?: string
) => {
  try {
    // Check capacity first
    const capacityCheck = await checkSessionCapacity(sessionId, requestedSeats);
    
    if (!capacityCheck.canBook) {
      throw new Error(`Insufficient capacity. Only ${capacityCheck.availableSeats} seats available.`);
    }

    // Create booking
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert([{
        session_id: sessionId,
        user_id: userId,
        organization_id: organizationId,
        booking_type: bookingType,
        number_of_tickets: requestedSeats,
        status: 'pending',
        payment_status: 'pending'
      }])
      .select()
      .single();

    if (bookingError) throw bookingError;

    return booking;
  } catch (error) {
    console.error('Error reserving seats:', error);
    throw error;
  }
};