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
  Shield, 
  Eye, 
  EyeOff, 
  LogIn,
  Building2,
  Users,
  CheckCircle,
  User,
  Lock,
  Badge
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

const loginSchema = z.object({
  employeeId: z.string().min(1, "رقم الموظف مطلوب"),
  password: z.string().min(1, "كلمة المرور مطلوبة"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function EmployeeLogin() {
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      employeeId: "",
      password: "",
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginFormValues) => {
      return await apiRequest("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({
          username: data.employeeId, // تحويل employeeId إلى username
          password: data.password,
        }),
      });
    },
    onSuccess: (response) => {
      localStorage.setItem("auth_token", response.token);
      localStorage.setItem("user_data", JSON.stringify(response.user));
      
      toast({
        title: "تم تسجيل الدخول بنجاح",
        description: "مرحباً بك في نظام الموظفين",
      });
      
      // Redirect based on role
      const role = response.user.role;
      if (role === "admin" || role === "super_admin") {
        window.location.href = "/analytics-dashboard";
      } else if (role === "inspector") {
        window.location.href = "/inspector-field-app";
      } else if (role === "surveyor") {
        window.location.href = "/field-app";
      } else {
        window.location.href = "/employee-dashboard";
      }
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
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4" dir="rtl">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3">
            <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">بنّاء اليمن</h1>
              <p className="text-sm text-red-600 font-medium">نظام الموظفين</p>
            </div>
          </div>
        </div>

        {/* Login Card */}
        <Card className="shadow-lg border-0">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-2xl font-bold text-gray-900">دخول الموظفين الحكوميين</CardTitle>
            <CardDescription>
              أدخل بيانات الموظف للوصول إلى النظام الإداري
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="employeeId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-right">رقم الموظف</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Badge className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input
                            {...field}
                            placeholder="أدخل رقم الموظف"
                            className="pl-10"
                            data-testid="input-employee-id"
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
                            data-testid="input-employee-password"
                          />
                          <button
                            type="button"
                            className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                            onClick={() => setShowPassword(!showPassword)}
                            data-testid="button-toggle-employee-password"
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
                  className="w-full h-12 text-lg font-semibold bg-red-600 hover:bg-red-700"
                  disabled={loginMutation.isPending}
                  data-testid="button-employee-login"
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
                <Button variant="link" className="text-sm text-red-600">
                  نسيت كلمة المرور؟
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Navigation to Other Portals */}
        <div className="grid grid-cols-2 gap-3">
          <Button 
            variant="outline" 
            onClick={() => window.location.href = "/auth/citizen-login"}
            className="h-12"
            data-testid="button-go-citizen"
          >
            <Users className="ml-2 h-4 w-4" />
            دخول المواطنين
          </Button>
          
          <Button 
            variant="outline" 
            onClick={() => window.location.href = "/auth/professional-login"}
            className="h-12"
            data-testid="button-go-professional"
          >
            <Building2 className="ml-2 h-4 w-4" />
            دخول المهنيين
          </Button>
        </div>

        {/* Employee Notice */}
        <Alert className="border-red-200 bg-red-50">
          <Shield className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <strong>للموظفين المعتمدين:</strong> هذه البوابة مخصصة للموظفين الحكوميين المعتمدين فقط
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