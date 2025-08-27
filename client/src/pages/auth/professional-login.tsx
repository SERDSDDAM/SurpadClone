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
  Lock,
  Briefcase
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

const loginSchema = z.object({
  licenseNumber: z.string().min(1, "رقم الترخيص مطلوب"),
  password: z.string().min(1, "كلمة المرور مطلوبة"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function ProfessionalLogin() {
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      licenseNumber: "",
      password: "",
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginFormValues) => {
      return await apiRequest("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({
          ...data,
          userType: "professional",
        }),
      });
    },
    onSuccess: (response) => {
      localStorage.setItem("auth_token", response.token);
      localStorage.setItem("user", JSON.stringify(response.user));
      
      toast({
        title: "تم تسجيل الدخول بنجاح",
        description: "مرحباً بك في بوابة المهنيين",
      });
      
      // Redirect based on role
      const role = response.user.role;
      if (role === "engineer") {
        window.location.href = "/engineering-office";
      } else if (role === "contractor") {
        window.location.href = "/contractor-portal";
      } else {
        window.location.href = "/professionals";
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
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4" dir="rtl">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3">
            <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center">
              <Building2 className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">بنّاء اليمن</h1>
              <p className="text-sm text-green-600 font-medium">بوابة المهنيين</p>
            </div>
          </div>
        </div>

        {/* Login Card */}
        <Card className="shadow-lg border-0">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-2xl font-bold text-gray-900">دخول المكاتب الهندسية والمقاولين</CardTitle>
            <CardDescription>
              أدخل بيانات الترخيص للوصول إلى لوحة التحكم المهنية
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="licenseNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-right">رقم الترخيص المهني</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Briefcase className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input
                            {...field}
                            placeholder="أدخل رقم الترخيص"
                            className="pl-10"
                            data-testid="input-professional-license"
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
                            data-testid="input-professional-password"
                          />
                          <button
                            type="button"
                            className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                            onClick={() => setShowPassword(!showPassword)}
                            data-testid="button-toggle-professional-password"
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
                  className="w-full h-12 text-lg font-semibold bg-green-600 hover:bg-green-700"
                  disabled={loginMutation.isPending}
                  data-testid="button-professional-login"
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
                <Button variant="link" className="text-sm text-green-600">
                  نسيت كلمة المرور؟
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Register Link */}
        <div className="text-center space-y-2">
          <div className="text-sm">
            <span className="text-gray-600">تريد تسجيل مكتب جديد؟ </span>
            <a href="/auth/professional-register" className="text-green-600 hover:underline font-medium">
              طلب ترخيص مهني
            </a>
          </div>
        </div>

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
            onClick={() => window.location.href = "/auth/employee-login"}
            className="h-12"
            data-testid="button-go-employee"
          >
            <Shield className="ml-2 h-4 w-4" />
            دخول الموظفين
          </Button>
        </div>

        {/* Professional Notice */}
        <Alert className="border-green-200 bg-green-50">
          <Building2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            <strong>للمهنيين المرخصين:</strong> هذه البوابة مخصصة للمكاتب الهندسية والمقاولين المرخصين رسمياً
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