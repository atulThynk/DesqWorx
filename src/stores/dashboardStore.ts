import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { format } from 'date-fns';
import {
  DashboardStats,
  AttendanceStats,
  CreditStats,
  BookingStats,
  Company,
} from '../types';

interface DashboardState {
  stats: DashboardStats | null;
  isLoading: boolean;
  error: string | null;
  fetchSuperAdminStats: () => Promise<void>;
  fetchAdminStats: (companyId: string) => Promise<void>;
}

const defaultStats: DashboardStats = {
  attendance: { present: 0, absent: 0, total: 0 },
  credits: { total: 0, used: 0, remaining: 0 },
  bookings: { booked: 0, limit: 0, percentage: 0 },
  companies: { booked: 0, limit: 0, percentage: 0 },
};

export const useDashboardStore = create<DashboardState>((set) => ({
  stats: null,
  isLoading: false,
  error: null,

  fetchSuperAdminStats: async () => {
    set({ isLoading: true, error: null });
    try {
      // Get today's date
      const today = format(new Date(), 'yyyy-MM-dd');

      // Fetch all companies
      const { data: companies, error: companiesError } = await supabase
        .from('companies')
        .select('*');

      if (companiesError) throw companiesError;

      // Fetch today's attendance
      const { data: attendance, error: attendanceError } = await supabase
        .from('attendance')
        .select('*')
        .eq('date', today);

      if (attendanceError) throw attendanceError;

      // Fetch all users
      const { data: employees, error: usersError } = await supabase
        .from('employees')
        .select('*')
        

      if (usersError) throw usersError;

      // Fetch credit history
      const { data: creditHistory, error: creditError } = await supabase
        .from('credit_history')
        .select('*');

      if (creditError) throw creditError;

      // Fetch seat bookings
      const { data: bookings, error: bookingsError } = await supabase
        .from('seat_bookings')
        .select('*')
        .eq('date', today);

      if (bookingsError) throw bookingsError;
      console.log("Attendance",attendance);
      console.log("Total Emp",employees);
      
      // Calculate attendance stats
      const presentCount = attendance?.filter(a => a.status === 'present').length || 0;
      console.log("Attendance count",presentCount);
      const totalEmployees = employees.length || 0;

      // Calculate credits stats
      let totalCredits = 0;
      let usedCredits = 0;

      if (companies && creditHistory) {
        totalCredits = companies.reduce((sum, company) => sum + company.credits, 0);
        
        const assignedCredits = creditHistory
          .filter(ch => ch.action === 'assigned')
          .reduce((sum, ch) => sum + ch.amount, 0);
          
        const usedCreditsHistory = creditHistory
          .filter(ch => ch.action === 'used')
          .reduce((sum, ch) => sum + ch.amount, 0);
          
        usedCredits = usedCreditsHistory;
        totalCredits+=usedCredits
      }

      // Calculate booking stats
      const bookedSeats = bookings?.filter(b => b.status === 'confirmed').length || 0;
      const totalBookingLimit = companies?.reduce((sum, company) => sum + company.seat_booking_limit, 0) || 0;
      const bookingPercentage = totalBookingLimit > 0 ? (bookedSeats / totalBookingLimit) * 100 : 0;
      const totalCompanies=companies.length ||0;
      set({
        stats: {
          attendance: {
            present: presentCount,
            absent: totalEmployees - presentCount,
            total: totalEmployees,
          },
          credits: {
            total: totalCredits,
            used: usedCredits,
            remaining: totalCredits - usedCredits,
          },
          bookings: {
            booked: bookedSeats,
            limit: totalBookingLimit,
            percentage: bookingPercentage,
          },
          companies:{
            total:totalCompanies
          },
        },
        isLoading: false,
      });
    } catch (error) {
      set({
        error: (error as Error).message,
        isLoading: false,
        stats: defaultStats,
      });
    }
  },

  fetchAdminStats: async (companyId: string) => {
    set({ isLoading: true, error: null });
    try {
      // Get today's date and 7 days ago
      const today = format(new Date(), 'yyyy-MM-dd');
      
      // Fetch company data
      const { data: company, error: companyError } = await supabase
        .from('companies')
        .select('*')
        .eq('id', companyId)
        .single();

      if (companyError) throw companyError;

      // Fetch employees for this company
      const { data: employees, error: employeesError } = await supabase
        .from('users')
        .select('*')
        .eq('company_id', companyId)
        .eq('role', 'employee');

      if (employeesError) throw employeesError;

      // Fetch today's attendance for this company
      const { data: attendance, error: attendanceError } = await supabase
        .from('attendance')
        .select('*')
        .eq('company_id', companyId)
        .eq('date', today);

      if (attendanceError) throw attendanceError;

      // Fetch credit history for this company
      const { data: creditHistory, error: creditError } = await supabase
        .from('credit_history')
        .select('*')
        .eq('company_id', companyId);

      if (creditError) throw creditError;

      // Fetch today's bookings for this company
      const { data: bookings, error: bookingsError } = await supabase
        .from('seat_bookings')
        .select('*')
        .eq('company_id', companyId)
        .eq('date', today);

      if (bookingsError) throw bookingsError;

      // Calculate attendance stats
      const totalEmployees = employees?.length || 0;
      const presentCount = attendance?.filter(a => a.status === 'present').length || 0;

      // Calculate credits stats
      const companyCredits = company?.credits || 0;
      const usedCredits = creditHistory
        ?.filter(ch => ch.action === 'used')
        .reduce((sum, ch) => sum + ch.amount, 0) || 0;

      // Calculate booking stats
      const bookedSeats = bookings?.filter(b => b.status === 'confirmed').length || 0;
      const bookingLimit = company?.seat_booking_limit || 0;
      const bookingPercentage = bookingLimit > 0 ? (bookedSeats / bookingLimit) * 100 : 0;

      set({
        stats: {
          attendance: {
            present: presentCount,
            absent: totalEmployees - presentCount,
            total: totalEmployees,
          },
          credits: {
            total: companyCredits,
            used: usedCredits,
            remaining: companyCredits - usedCredits,
          },
          bookings: {
            booked: bookedSeats,
            limit: bookingLimit,
            percentage: bookingPercentage,
          },
        },
        isLoading: false,
      });
    } catch (error) {
      set({
        error: (error as Error).message,
        isLoading: false,
        stats: defaultStats,
      });
    }
  },
}));