import { useState, useEffect } from 'react';

interface User {
  id: string;
  username: string;
  email: string;
  role: string;
  firstName: string;
  lastName: string;
  name: string;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export function useSimpleAuth(): AuthState {
  const [state, setState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false
  });

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        const userData = localStorage.getItem('user_data');
        
        if (token && userData) {
          const user = JSON.parse(userData);
          console.log('🔍 Found auth data:', user);
          
          // التحقق من صحة التوكن
          const response = await fetch('/api/auth/verify', {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });

          if (response.ok) {
            const verifyData = await response.json();
            if (verifyData.valid) {
              setState({
                user: verifyData.user,
                isLoading: false,
                isAuthenticated: true
              });
              return;
            }
          }
        }
        
        // إذا لم يكن هناك توكن صحيح
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_data');
        setState({
          user: null,
          isLoading: false,
          isAuthenticated: false
        });
        
      } catch (error) {
        console.error('Auth check error:', error);
        setState({
          user: null,
          isLoading: false,
          isAuthenticated: false
        });
      }
    };

    checkAuth();
  }, []);

  return state;
}