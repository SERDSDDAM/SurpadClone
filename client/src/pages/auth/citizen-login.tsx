import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { 
  Building2, 
  Eye, 
  EyeOff, 
  LogIn,
  Shield,
  Users,
  CheckCircle,
  User,
  Lock
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

const loginSchema = z.object({
  nationalId: z.string().min(9, "الرقم الوطني يجب أن يكون 9 أرقام على الأقل"),
  password: z.string().min(1, "كلمة المرور مطلوبة"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function CitizenLogin() {
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      nationalId: "",
      password: "",
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginFormValues) => {
      return await apiRequest("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({
          ...data,
          userType: "citizen",
        }),
      });
    },
    onSuccess: (response) => {
      localStorage.setItem("auth_token", response.token);
      localStorage.setItem("user", JSON.stringify(response.user));
      
      toast({
        title: "تم تسجيل الدخول بنجاح",
        description: "مرحباً بك في بوابة المواطنين",
      });
      
      // Redirect to citizen dashboard
      window.location.href = "/citizen-portal";
    },
    onError: (error: any) => {
      toast({
        title: "فشل في تسجيل الدخول",
        description: error.message || "بيانات الدخول غير صحيحة",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: LoginFormValues) => {
    loginMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center p-4" dir="rtl">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3">
            <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
              <Users className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">بنّاء اليمن</h1>
              <p className="text-sm text-blue-600 font-medium">بوابة المواطنين</p>
            </div>
          </div>
        </div>

        {/* Login Card */}
        <Card className="shadow-lg border-0">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-2xl font-bold text-gray-900">تسجيل دخول المواطن</CardTitle>
            <CardDescription>
              أدخل بياناتك للوصول إلى الخدمات الحكومية
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="nationalId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-right">الرقم الوطني</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input
                            {...field}
                            placeholder="أدخل الرقم الوطني"
                            className="pl-10"
                            data-testid="input-citizen-national-id"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-right">كلمة المرور</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input
                            {...field}
                            type={showPassword ? "text" : "password"}
                            placeholder="أدخل كلمة المرور"
                            className="pl-10 pr-10"
                            data-testid="input-citizen-password"
                          />
                          <button
                            type="button"
                            className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                            onClick={() => setShowPassword(!showPassword)}
                            data-testid="button-toggle-citizen-password"
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full h-12 text-lg font-semibold bg-blue-600 hover:bg-blue-700"
                  disabled={loginMutation.isPending}
                  data-testid="button-citizen-login"
                >
                  {loginMutation.isPending ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      جاري تسجيل الدخول...
                    </div>
                  ) : (
                    <>
                      تسجيل الدخول
                      <LogIn className="mr-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </form>
            </Form>

            {/* Additional Options */}
            <div className="space-y-4">
              <div className="text-center">
                <Button variant="link" className="text-sm text-blue-600">
                  نسيت كلمة المرور؟
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Register Link */}
        <div className="text-center space-y-2">
          <div className="text-sm">
            <span className="text-gray-600">ليس لديك حساب؟ </span>
            <a href="/auth/citizen-register" className="text-blue-600 hover:underline font-medium">
              إنشاء حساب مواطن جديد
            </a>
          </div>
        </div>

        {/* Navigation to Other Portals */}
        <div className="grid grid-cols-2 gap-3">
          <Button 
            variant="outline" 
            onClick={() => window.location.href = "/auth/professional-login"}
            className="h-12"
            data-testid="button-go-professional"
          >
            <Building2 className="ml-2 h-4 w-4" />
            دخول المهنيين
          </Button>
          
          <Button 
            variant="outline" 
            onClick={() => window.location.href = "/auth/employee-login"}
            className="h-12"
            data-testid="button-go-employee"
          >
            <Shield className="ml-2 h-4 w-4" />
            دخول الموظفين
          </Button>
        </div>

        {/* Security Notice */}
        <Alert className="border-blue-200 bg-blue-50">
          <Shield className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            <strong>أمان المعلومات:</strong> جلستك محمية بتشفير متقدم ومطابقة للمعايير الدولية
          </AlertDescription>
        </Alert>

        {/* Government Notice */}
        <div className="text-center">
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800 text-sm">
              منصة حكومية رسمية معتمدة من قبل الحكومة اليمنية
            </AlertDescription>
          </Alert>
        </div>
      </div>
    </div>
  );
}