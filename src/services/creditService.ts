import { supabase } from '../lib/supabase';

export const creditService = {
  // Add credits to a company
  addCredits: async (companyId: string, amount: number, description: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase.rpc('record_credit_transaction', {
        p_company_id: companyId,
        p_amount: amount,
        p_description: description,
        p_created_by: user.id
      });

      if (error) throw error;
    } catch (error) {
      console.error('Error adding credits:', error);
      throw error;
    }
  },

  // Get credit history for a company with pagination
  getCreditHistory: async (companyId: string, page = 1, pageSize = 10) => {
    try {
      const { data, error, count } = await supabase
        .from('credit_transactions')
        .select('*', { count: 'exact' })
        .eq('company_id', companyId)
        .order('created_at', { ascending: false })
        .range((page - 1) * pageSize, page * pageSize - 1);

      if (error) throw error;

      return {
        data,
        total: count || 0,
        page,
        pageSize
      };
    } catch (error) {
      console.error('Error fetching credit history:', error);
      throw error;
    }
  }
};