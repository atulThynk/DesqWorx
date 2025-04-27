import { supabase } from '../lib/supabase';
import { SeatBooking } from '../types';
import { format } from 'date-fns';

export const bookingService = {
  // Create a new seat booking
  createBooking: async (companyId: string, userId: string, date?: string): Promise<SeatBooking> => {
    const bookingDate = date || format(new Date(), 'yyyy-MM-dd');
    
    // Get company details to check booking limits and credits
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('*')
      .eq('id', companyId)
      .single();
      
    if (companyError) throw companyError;
    
    // Check if company has enough credits
    if (company.credits < company.seat_price) {
      throw new Error('Company does not have enough credits for booking');
    }
    
    // Check if booking limit for the day is reached
    const { data: existingBookings, error: bookingsError } = await supabase
      .from('seat_bookings')
      .select('*')
      .eq('company_id', companyId)
      .eq('date', bookingDate)
      .eq('status', 'confirmed');
      
    if (bookingsError) throw bookingsError;
    
    if (existingBookings.length >= company.seat_booking_limit) {
      throw new Error('Daily booking limit reached for this company');
    }
    
    // Check if user already has a booking for this date
    const { data: userBooking, error: userBookingError } = await supabase
      .from('seat_bookings')
      .select('*')
      .eq('user_id', userId)
      .eq('date', bookingDate)
      .eq('status', 'confirmed')
      .maybeSingle();
      
    if (userBookingError) throw userBookingError;
    
    if (userBooking) {
      throw new Error('User already has a booking for this date');
    }
    
    // Create the booking
    const { data: booking, error: bookingError } = await supabase
      .from('seat_bookings')
      .insert([{
        company_id: companyId,
        user_id: userId,
        date: bookingDate,
        status: 'confirmed'
      }])
      .select()
      .single();
      
    if (bookingError) throw bookingError;
    
    // Deduct credits from company
    const { error: updateError } = await supabase
      .from('companies')
      .update({ credits: company.credits - company.seat_price })
      .eq('id', companyId);
      
    if (updateError) throw updateError;
    
    // Record credit usage in history
    const { error: historyError } = await supabase
      .from('credit_history')
      .insert([{
        company_id: companyId,
        amount: company.seat_price,
        action: 'used',
        description: `Seat booking for ${bookingDate}`
      }]);
      
    if (historyError) throw historyError;
    
    return {
      id: booking.id,
      companyId: booking.company_id,
      userId: booking.user_id,
      date: booking.date,
      status: booking.status
    };
  },
  
  // Cancel a booking
  cancelBooking: async (bookingId: string): Promise<void> => {
    // Get booking details
    const { data: booking, error: bookingError } = await supabase
      .from('seat_bookings')
      .select('*, companies!inner(*)')
      .eq('id', bookingId)
      .single();
      
    if (bookingError) throw bookingError;
    
    if (booking.status === 'cancelled') {
      throw new Error('Booking is already cancelled');
    }
    
    // Update booking status
    const { error: updateError } = await supabase
      .from('seat_bookings')
      .update({ status: 'cancelled' })
      .eq('id', bookingId);
      
    if (updateError) throw updateError;
    
    // Refund credits to company
    const company = booking.companies;
    const { error: companyError } = await supabase
      .from('companies')
      .update({ credits: company.credits + company.seat_price })
      .eq('id', booking.company_id);
      
    if (companyError) throw companyError;
    
    // Record credit refund in history
    const { error: historyError } = await supabase
      .from('credit_history')
      .insert([{
        company_id: booking.company_id,
        amount: company.seat_price,
        action: 'assigned',
        description: `Refund for cancelled booking on ${booking.date}`
      }]);
      
    if (historyError) throw historyError;
  },
  
  // Get bookings by company ID for a specific date
  getBookingsByCompany: async (companyId: string, date?: string): Promise<SeatBooking[]> => {
    let query = supabase
      .from('seat_bookings')
      .select('*')
      .eq('company_id', companyId);
      
    if (date) {
      query = query.eq('date', date);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    return data.map(booking => ({
      id: booking.id,
      companyId: booking.company_id,
      userId: booking.user_id,
      date: booking.date,
      status: booking.status
    }));
  },
  
  // Get bookings by user ID
  getBookingsByUser: async (userId: string): Promise<SeatBooking[]> => {
    const { data, error } = await supabase
      .from('seat_bookings')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false });
      
    if (error) throw error;
    
    return data.map(booking => ({
      id: booking.id,
      companyId: booking.company_id,
      userId: booking.user_id,
      date: booking.date,
      status: booking.status
    }));
  }
};