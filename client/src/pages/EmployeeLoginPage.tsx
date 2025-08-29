import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, MapPin, Eye, EyeOff, Shield } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { useLocation } from 'wouter';

// Schema للتحقق من بيانات الدخول
const loginSchema = z.object({
  username: z.string().min(3, 'اسم المستخدم يجب أن يكون 3 أحرف على الأقل'),
  password: z.string().min(6, 'كلمة المرور يجب أن تكون 6 أحرف على الأقل')
});

type LoginFormData = z.infer<typeof loginSchema>;

interface User {
  id: string;
  username: string;
  email?: string;
  role: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
}

export default function EmployeeLoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: '',
      password: ''
    }
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setLoginError(null);

    try {
      const response = await apiRequest('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(data),
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include' // مهم لإرسال cookies
      });

      if (response.success) {
        toast({
          title: "تم تسجيل الدخول بنجاح",
          description: `مرحباً ${response.user.fullName || response.user.username}`,
          variant: "default"
        });

        // إعادة توجيه حسب دور المستخدم
        if (response.user.role === 'admin') {
          setLocation('/admin-dashboard');
        } else if (response.user.role === 'surveyor') {
          setLocation('/phase2-digitization');
        } else {
          setLocation('/');
        }
      } else {
        throw new Error(response.message || 'فشل تسجيل الدخول');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      const errorMessage = error.message || 'خطأ في تسجيل الدخول. يرجى المحاولة مرة أخرى';
      setLoginError(errorMessage);
      
      toast({
        title: "خطأ في تسجيل الدخول",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-primary/10 flex items-center justify-center p-4" dir="rtl">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-primary/10 p-3 rounded-full">
              <Shield className="w-8 h-8 text-primary" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-foreground">
            بوابة الموظفين
          </h1>
          <p className="text-muted-foreground">
            منصة بنّاء اليمن الرقمية - نظام المعلومات الجغرافية
          </p>
        </div>

        {/* Login Card */}
        <Card className="shadow-lg border-0">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl font-semibold">
              تسجيل الدخول
            </CardTitle>
            <CardDescription>
              أدخل بياناتك للوصول إلى النظام
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {/* Error Alert */}
            {loginError && (
              <Alert variant="destructive" className="text-right">
                <AlertDescription>
                  {loginError}
                </AlertDescription>
              </Alert>
            )}

            {/* Login Form */}
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-right block">
                  اسم المستخدم
                </Label>
                <Input
                  id="username"
                  type="text"
                  dir="ltr"
                  className="text-right"
                  placeholder="أدخل اسم المستخدم"
                  {...form.register('username')}
                  disabled={isLoading}
                  data-testid="input-username"
                />
                {form.formState.errors.username && (
                  <p className="text-sm text-destructive text-right">
                    {form.formState.errors.username.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-right block">
                  كلمة المرور
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    dir="ltr"
                    className="text-right pr-10"
                    placeholder="أدخل كلمة المرور"
                    {...form.register('password')}
                    disabled={isLoading}
                    data-testid="input-password"
                  />
                  <button
                    type="button"
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                    data-testid="button-toggle-password"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {form.formState.errors.password && (
                  <p className="text-sm text-destructive text-right">
                    {form.formState.errors.password.message}
                  </p>
                )}
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading}
                data-testid="button-login"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    جار تسجيل الدخول...
                  </>
                ) : (
                  'دخول'
                )}
              </Button>
            </form>

            {/* Demo Credentials */}
            <div className="border-t pt-4">
              <p className="text-xs text-muted-foreground text-center mb-3">
                بيانات تجريبية للاختبار:
              </p>
              <div className="grid grid-cols-1 gap-2 text-xs">
                <div className="bg-muted/50 p-2 rounded text-center">
                  <strong>مدير النظام:</strong> admin / Admin@2025!
                </div>
                <div className="bg-muted/50 p-2 rounded text-center">
                  <strong>مساح:</strong> surveyor1 / Employee@2025!
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-sm text-muted-foreground">
          <div className="flex items-center justify-center space-x-2 space-x-reverse">
            <MapPin className="w-4 h-4" />
            <span>بنّاء اليمن - النظام الرقمي الموحد</span>
          </div>
          <p className="mt-2">
            جميع الحقوق محفوظة © 2025
          </p>
        </div>
      </div>
    </div>
  );
}