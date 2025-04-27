export type UserRole = 'super_admin' | 'admin' | 'employee';

export interface User {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  idProofUrl?: string | null;
  companyId: string;
  role: UserRole;
}

export interface Company {
  id: string;
  name: string;
  adminId: string;
  credits: number;
  seatPrice: number;
  seatBookingLimit: number;
}

export interface Attendance {
  id: string;
  userId: string;
  companyId: string;
  date: string;
  status: 'present' | 'absent';
}

export interface CreditHistory {
  id: string;
  companyId: string;
  amount: number;
  action: 'assigned' | 'used';
  description?: string;
  createdAt: string;
}

export interface SeatBooking {
  id: string;
  companyId: string;
  userId: string;
  date: string;
  status: 'confirmed' | 'cancelled';
}

export interface AttendanceStats {
  present: number;
  absent: number;
  total: number;
}

export interface CreditStats {
  total: number;
  used: number;
  remaining: number;
}

export interface BookingStats {
  booked: number;
  limit: number;
  percentage: number;
}

export interface DashboardStats {
  attendance: AttendanceStats;
  credits: CreditStats;
  bookings: BookingStats;
}