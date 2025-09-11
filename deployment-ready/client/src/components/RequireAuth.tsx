import React, { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, AlertTriangle, LogIn } from 'lucide-react';

interface RequireAuthProps {
  children: React.ReactNode;
  role?: string | string[];
  fallbackPath?: string;
}

export default function RequireAuth({ 
  children, 
  role, 
  fallbackPath = '/login' 
}: RequireAuthProps) {
  const { user, isLoading, isAuthenticated } = useAuth();

  useEffect(() => {
    // If not authenticated and not loading, redirect to login
    if (!isLoading && !isAuthenticated) {
      setTimeout(() => {
        window.location.href = fallbackPath;
      }, 100);
    }
  }, [isAuthenticated, isLoading, fallbackPath]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50" dir="rtl">
        <Card className="w-full max-w-md">
          <CardContent className="flex items-center justify-center p-8">
            <div className="text-center space-y-4">
              <div className="w-8 h-8 border-4 border-red-200 border-t-red-600 rounded-full animate-spin mx-auto"></div>
              <p className="text-gray-600">جارٍ التحقق من الصلاحيات...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show unauthorized if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50" dir="rtl">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <LogIn className="w-6 h-6 text-red-600" />
            </div>
            <CardTitle>غير مسجل دخول</CardTitle>
            <CardDescription>
              يجب تسجيل الدخول للوصول إلى هذه الصفحة
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button 
              onClick={() => window.location.href = fallbackPath}
              className="w-full"
            >
              تسجيل الدخول
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check role if specified
  if (role && user) {
    const userRole = user.role;
    const allowedRoles = Array.isArray(role) ? role : [role];
    
    if (!allowedRoles.includes(userRole)) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50" dir="rtl">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-6 h-6 text-orange-600" />
              </div>
              <CardTitle>صلاحية غير كافية</CardTitle>
              <CardDescription>
                ليس لديك الصلاحية المطلوبة للوصول إلى هذه الصفحة
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <div className="text-sm text-gray-600">
                <p>الصلاحية الحالية: <span className="font-medium">{userRole}</span></p>
                <p>المطلوب: <span className="font-medium">{allowedRoles.join(' أو ')}</span></p>
              </div>
              <Button 
                variant="outline"
                onClick={() => window.history.back()}
                className="w-full"
              >
                العودة للخلف
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }
  }

  // All checks passed, render children
  return <>{children}</>;
}

// Higher-order component for easier usage
export function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  role?: string | string[]
) {
  return function AuthenticatedComponent(props: P) {
    return (
      <RequireAuth role={role}>
        <Component {...props} />
      </RequireAuth>
    );
  };
}

// Hook for role checking
export function useRequireRole(role: string | string[]) {
  const { user } = useAuth();
  
  if (!user) return false;
  
  const allowedRoles = Array.isArray(role) ? role : [role];
  return allowedRoles.includes(user.role);
}