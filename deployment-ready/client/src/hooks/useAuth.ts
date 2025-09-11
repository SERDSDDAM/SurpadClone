import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useEffect, useState } from "react";

export interface User {
  id: string;
  username: string;
  email?: string;
  role: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  lastLogin?: string;
}

export interface AuthResponse {
  user?: User;
  authenticated?: boolean;
}

// Hook للتحقق من حالة المصادقة
export function useAuth() {
  const [localUser, setLocalUser] = useState<User | null>(null);
  
  // Try to get user from localStorage first
  useEffect(() => {
    const userData = localStorage.getItem('user_data');
    const authToken = localStorage.getItem('auth_token');
    
    if (userData && authToken) {
      try {
        setLocalUser(JSON.parse(userData));
      } catch (e) {
        localStorage.removeItem('user_data');
        localStorage.removeItem('auth_token');
      }
    }
  }, []);

  const { data, isLoading, error, refetch } = useQuery<AuthResponse>({
    queryKey: ['/api/auth/me'],
    queryFn: () => apiRequest('/api/auth/me', {
      method: 'GET',
      credentials: 'include'
    }),
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    enabled: !!localStorage.getItem('auth_token'), // Only query if token exists
  });

  // Use server user if available, otherwise use localStorage user
  const user = data?.user || localUser;

  return {
    user,
    isLoading: isLoading && !localUser, // Don't show loading if we have localStorage data
    error,
    isAuthenticated: !!user,
    refetch,
    // Helper methods for role checking
    isAdmin: () => user?.role === 'admin',
    isSurveyor: () => user?.role === 'surveyor',
    hasRole: (role: string) => user?.role === role,
    // Logout method
    logout: () => {
      localStorage.removeItem('user_data');
      localStorage.removeItem('auth_token');
      setLocalUser(null);
      window.location.href = '/login';
    }
  };
}

// Hook للتحقق السريع من المصادقة (بدون تحميل بيانات المستخدم)
export function useAuthCheck() {
  const { data, isLoading } = useQuery<{ authenticated: boolean }>({
    queryKey: ['/api/auth/check'],
    queryFn: () => apiRequest('/api/auth/check', {
      method: 'GET',
      credentials: 'include'
    }),
    retry: false,
    staleTime: 1 * 60 * 1000, // 1 minute
    refetchInterval: 5 * 60 * 1000, // Check every 5 minutes
  });

  return {
    isAuthenticated: data?.authenticated ?? false,
    isLoading
  };
}