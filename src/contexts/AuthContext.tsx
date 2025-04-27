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

  // Updated user data fetcher with better error handling
  const fetchUserData = async (userId: string) => {
    try {
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .maybeSingle(); // Use maybeSingle instead of single to handle no results gracefully
      
      if (userError) {
        console.error('Error fetching user data:', userError);
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
      console.error('Error in fetchUserData:', error);
      return null;
    }
  };

  const handleAuthError = async () => {
    setUser(null);
    setIsLoading(false);
    if (location.pathname !== '/login') {
      navigate('/login', { replace: true });
    }
  };

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          throw sessionError;
        }

        if (session?.user && mounted) {
          const userObj = await fetchUserData(session.user.id);
          if (userObj && mounted) {
            setUser(userObj);
            
            // Only redirect if we're on the login page or root
            if (location.pathname === '/login' || location.pathname === '/') {
              const redirectPath = `/${userObj.role.toLowerCase().replace('_', '-')}/dashboard`;
              navigate(redirectPath, { replace: true });
            }
          } else {
            await handleAuthError();
          }
        } else if (location.pathname !== '/login' && mounted) {
          navigate('/login', { replace: true });
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        if (mounted) {
          await handleAuthError();
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      if (event === 'SIGNED_IN' && session?.user) {
        try {
          const userObj = await fetchUserData(session.user.id);
          if (userObj && mounted) {
            setUser(userObj);
            const redirectPath = `/${userObj.role.toLowerCase().replace('_', '-')}/dashboard`;
            navigate(redirectPath, { replace: true });
          } else {
            await handleAuthError();
          }
        } catch (error) {
          console.error('Auth state change error:', error);
          if (mounted) {
            await handleAuthError();
          }
        }
      } else if (event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED' || event === 'USER_DELETED') {
        if (mounted) {
          setUser(null);
          navigate('/login', { replace: true });
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [navigate, location.pathname]);

  const login = async (email: string, password: string) => {
    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) throw signInError;
      if (!data?.user) throw new Error('No user returned from authentication');

      const userObj = await fetchUserData(data.user.id);
      if (!userObj) throw new Error('User not found in database');

      setUser(userObj);
      return { error: null };
    } catch (error) {
      console.error('Login error:', error);
      return { error: error as Error };
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      navigate('/login', { replace: true });
    } catch (error) {
      console.error('Logout error:', error);
      // Even if there's an error during signOut, we should clear the local state
      setUser(null);
      navigate('/login', { replace: true });
    }
  };

  const getUserRole = (): UserRole | null => {
    return user ? user.role : null;
  };

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