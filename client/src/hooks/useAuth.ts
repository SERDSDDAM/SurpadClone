import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

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
  const { data, isLoading, error, refetch } = useQuery<AuthResponse>({
    queryKey: ['/api/auth/me'],
    queryFn: () => apiRequest('/api/auth/me', {
      method: 'GET',
      credentials: 'include'
    }),
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true,
    refetchOnMount: true
  });

  return {
    user: data?.user,
    isLoading,
    error,
    isAuthenticated: !!data?.user,
    refetch,
    // Helper methods for role checking
    isAdmin: () => data?.user?.role === 'admin',
    isSurveyor: () => data?.user?.role === 'surveyor',
    hasRole: (role: string) => data?.user?.role === role
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