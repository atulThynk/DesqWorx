import { supabase } from '../lib/supabase';
import { Company } from '../types';

export const companyService = {
  // Create a new company
  createCompany: async (name: string, adminId: string, seatPrice: number, seatBookingLimit: number): Promise<Company> => {
    const { data, error } = await supabase
      .from('companies')
      .insert([
        { 
          name, 
          admin_id: adminId, 
          credits: 0, 
          seat_price: seatPrice, 
          seat_booking_limit: seatBookingLimit 
        }
      ])
      .select()
      .single();

    if (error) throw error;
    
    return {
      id: data.id,
      name: data.name,
      adminId: data.admin_id,
      credits: data.credits,
      seatPrice: data.seat_price,
      seatBookingLimit: data.seat_booking_limit
    };
  },

  // Get all companies
  getAllCompanies: async (): Promise<Company[]> => {
    const { data, error } = await supabase
      .from('companies')
      .select('*');

    if (error) throw error;
    
    return data.map(company => ({
      id: company.id,
      name: company.name,
      adminId: company.admin_id,
      credits: company.credits,
      seatPrice: company.seat_price,
      seatBookingLimit: company.seat_booking_limit
    }));
  },

  // Get a single company by ID
  getCompanyById: async (id: string): Promise<Company> => {
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    
    return {
      id: data.id,
      name: data.name,
      adminId: data.admin_id,
      credits: data.credits,
      seatPrice: data.seat_price,
      seatBookingLimit: data.seat_booking_limit
    };
  },

  // Update a company
  updateCompany: async (id: string, updates: Partial<Omit<Company, 'id'>>): Promise<Company> => {
    const updateData: any = {};
    
    if (updates.name) updateData.name = updates.name;
    if (updates.adminId) updateData.admin_id = updates.adminId;
    if (updates.credits !== undefined) updateData.credits = updates.credits;
    if (updates.seatPrice !== undefined) updateData.seat_price = updates.seatPrice;
    if (updates.seatBookingLimit !== undefined) updateData.seat_booking_limit = updates.seatBookingLimit;

    const { data, error } = await supabase
      .from('companies')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    
    return {
      id: data.id,
      name: data.name,
      adminId: data.admin_id,
      credits: data.credits,
      seatPrice: data.seat_price,
      seatBookingLimit: data.seat_booking_limit
    };
  },

  // Delete a company
  deleteCompany: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('companies')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // Assign credits to a company
  assignCredits: async (companyId: string, amount: number, description?: string): Promise<void> => {
    // Start a transaction to update company credits and add credit history
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('credits')
      .eq('id', companyId)
      .single();
      
    if (companyError) throw companyError;
    
    const newCredits = company.credits + amount;
    
    const { error: updateError } = await supabase
      .from('companies')
      .update({ credits: newCredits })
      .eq('id', companyId);
      
    if (updateError) throw updateError;
    
    // Add to credit history
    const { error: historyError } = await supabase
      .from('credit_history')
      .insert([{
        company_id: companyId,
        amount: amount,
        action: 'assigned',
        description: description || 'Credits assigned by admin'
      }]);
      
    if (historyError) throw historyError;
  },

  // Get company by admin user ID
  getCompanyByAdminId: async (adminId: string): Promise<Company> => {
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .eq('admin_id', adminId)
      .single();

    if (error) throw error;
    
    return {
      id: data.id,
      name: data.name,
      adminId: data.admin_id,
      credits: data.credits,
      seatPrice: data.seat_price,
      seatBookingLimit: data.seat_booking_limit
    };
  }
};