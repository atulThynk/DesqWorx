import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { User, UserRole } from '../types';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ error: Error | null }>;
  logout: () => Promise<void>;
  getUserRole: () => UserRole | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const [authInitialized, setAuthInitialized] = useState(false);

  const fetchUserData = async (userId: string) => {
    try {
      const { data: userData, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching user data:', error);
        return null;
      }
      if (!userData) {
        console.warn('No user data found for ID:', userId);
        return null;
      }

      return {
        id: userData.id,
        fullName: userData.full_name,
        email: userData.email,
        phone: userData.phone,
        idProofUrl: userData.id_proof_url,
        companyId: userData.company_id,
        role: userData.role as UserRole,
      };
    } catch (error) {
      console.error('Unexpected error fetching user data:', error);
      return null;
    }
  };

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });

      if (signInError) throw signInError;
      if (!data?.user) throw new Error('No user returned from authentication');

      const userObj = await fetchUserData(data.user.id);
      if (!userObj) throw new Error('User not found in database');

      setUser(userObj);
      return { error: null };
    } catch (error) {
      console.error('Login error:', error);
      return { error: error as Error };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setIsLoading(false);
      navigate('/login', { replace: true });
    }
  };

  const getUserRole = (): UserRole | null => {
    return user ? user.role : null;
  };

  // Handle initial session check
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setIsLoading(true);
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) throw error;

        if (session?.user) {
          const userObj = await fetchUserData(session.user.id);
          if (userObj) {
            setUser(userObj);
          } else {
            // User data not found, log out
            await supabase.auth.signOut();
            setUser(null);
            if (location.pathname !== '/login') {
              navigate('/login', { replace: true });
            }
          }
        } else if (location.pathname !== '/login') {
          navigate('/login', { replace: true });
        }
      } catch (error) {
        console.error('Initialization error:', error);
        if (location.pathname !== '/login') {
          navigate('/login', { replace: true });
        }
      } finally {
        setIsLoading(false);
        setAuthInitialized(true);
      }
    };

    initializeAuth();
  }, [navigate, location.pathname]);

  // Handle auth state changes separately
  useEffect(() => {
    if (!authInitialized) return;
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth event:', event);

      // Skip handling INITIAL_SESSION since we already processed it
      if (event === 'INITIAL_SESSION') {
        return;
      }

      // For SIGNED_IN event, don't reload the page if the user is already set
      if (event === 'SIGNED_IN' && session?.user) {
        if (user && user.id === session.user.id) {
          // User is already set correctly, no need to reload data
          return;
        }
        
        try {
          setIsLoading(true);
          const userObj = await fetchUserData(session.user.id);
          if (userObj) {
            setUser(userObj);
          } else {
            // User data not found, log out
            await supabase.auth.signOut();
            setUser(null);
            navigate('/login', { replace: true });
          }
        } catch (error) {
          console.error('Error processing SIGNED_IN event:', error);
        } finally {
          setIsLoading(false);
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        navigate('/login', { replace: true });
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [authInitialized, user, navigate]);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, getUserRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};