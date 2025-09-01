import React, { useState, useEffect } from 'react';
import { useSimpleAuth } from '@/hooks/useSimpleAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, LogIn, Eye, EyeOff } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login, isAuthenticated } = useSimpleAuth();

  // إعادة توجيه إلى لوحة التحكم إذا كان المستخدم مسجل دخول بالفعل
  useEffect(() => {
    if (isAuthenticated) {
      window.location.href = '/admin-dashboard';
    }
  }, [isAuthenticated]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const result = await login(username, password);
      
      if (result.success) {
        // إعادة توجيه إلى لوحة التحكم
        window.location.href = '/admin-dashboard';
      } else {
        setError(result.error || 'فشل في تسجيل الدخول');
      }
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء تسجيل الدخول');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4" dir="rtl">
      <div className="w-full max-w-md">
        {/* شعار النظام */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 text-white rounded-xl mb-4">
            <svg 
              className="w-8 h-8" 
              fill="currentColor" 
              viewBox="0 0 24 24"
            >
              <path d="M12 2L2 7V10C2 16 6 20.9 12 22C18 20.9 22 16 22 10V7L12 2Z"/>
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            بنّاء اليمن
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            نظام إدارة القرار المساحي
          </p>
        </div>

        {/* نموذج تسجيل الدخول */}
        <Card className="shadow-2xl border-0">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl font-bold">تسجيل الدخول</CardTitle>
            <CardDescription>
              أدخل بيانات الاعتماد للوصول إلى النظام
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* رسالة الخطأ */}
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* اسم المستخدم */}
              <div className="space-y-2">
                <Label htmlFor="username">اسم المستخدم</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="أدخل اسم المستخدم"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="text-right"
                  data-testid="input-login-username"
                />
              </div>

              {/* كلمة المرور */}
              <div className="space-y-2">
                <Label htmlFor="password">كلمة المرور</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="أدخل كلمة المرور"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="text-right pr-10"
                    data-testid="input-login-password"
                  />
                  <button
                    type="button"
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    onClick={() => setShowPassword(!showPassword)}
                    data-testid="button-toggle-password"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* زر تسجيل الدخول */}
              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
                data-testid="button-login-submit"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    جاري تسجيل الدخول...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <LogIn className="h-4 w-4" />
                    تسجيل الدخول
                  </div>
                )}
              </Button>
            </form>

            {/* معلومات تجريبية */}
            <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                حسابات تجريبية:
              </h3>
              <div className="space-y-2 text-xs text-gray-600 dark:text-gray-300">
                <div className="flex justify-between">
                  <span>المدير العام:</span>
                  <span>admin / Admin@2025!</span>
                </div>
                <div className="flex justify-between">
                  <span>موظف مساحة:</span>
                  <span>surveyor1 / Employee@2025!</span>
                </div>
                <div className="flex justify-between">
                  <span>نائب تقني:</span>
                  <span>deputy_technical / Deputy@2025!</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* معلومات إضافية */}
        <div className="mt-6 text-center text-sm text-gray-600 dark:text-gray-300">
          <p>نظام إدارة القرار المساحي - الإصدار 2.0</p>
          <p className="mt-1">مكتب الأشغال العامة والطرق - الجمهورية اليمنية</p>
        </div>
      </div>
    </div>
  );
}