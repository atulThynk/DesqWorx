import { supabase } from '../lib/supabase';
import { format } from 'date-fns';

export const attendanceService = {
  // Mark or update attendance
  markAttendance: async (employeeId: string, companyId: string, status: 'present' | 'absent', date?: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const attendanceDate = date || format(new Date(), 'yyyy-MM-dd');

      // Check if attendance exists
      const { data: existing, error: checkError } = await supabase
        .from('attendance')
        .select('id, status')
        .eq('user_id', employeeId)
        .eq('date', attendanceDate)
        .maybeSingle();

      if (checkError) throw checkError;

      if (existing) {
        // Update existing attendance
        const { error } = await supabase.rpc('record_attendance_change', {
          p_attendance_id: existing.id,
          p_new_status: status,
          p_changed_by: user.id
        });

        if (error) throw error;
      } else {
        // Create new attendance
        const { data: newAttendance, error: createError } = await supabase
          .from('attendance')
          .insert({
            user_id: employeeId,
            company_id: companyId,
            date: attendanceDate,
            status
          })
          .select()
          .single();

        if (createError) throw createError;
      }
    } catch (error) {
      console.error('Error marking attendance:', error);
      throw error;
    }
  },

  // Get attendance history for an employee with pagination
  getAttendanceHistory: async (employeeId: string, page = 1, pageSize = 10) => {
    try {
      const { data, error, count } = await supabase
        .from('attendance')
        .select('*, attendance_history(*)', { count: 'exact' })
        .eq('user_id', employeeId)
        .order('date', { ascending: false })
        .range((page - 1) * pageSize, page * pageSize - 1);

      if (error) throw error;

      return {
        data,
        total: count || 0,
        page,
        pageSize
      };
    } catch (error) {
      console.error('Error fetching attendance history:', error);
      throw error;
    }
  },

  // Get attendance history changes for a specific attendance
  getAttendanceChanges: async (attendanceId: string) => {
    try {
      const { data, error } = await supabase
        .from('attendance_history')
        .select('*')
        .eq('attendance_id', attendanceId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error fetching attendance changes:', error);
      throw error;
    }
  }
};