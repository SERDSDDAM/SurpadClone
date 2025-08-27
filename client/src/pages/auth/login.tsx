import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { 
  Shield, 
  Eye, 
  EyeOff, 
  Smartphone, 
  AlertTriangle, 
  CheckCircle,
  Building2,
  Lock,
  User,
  Phone
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

const loginSchema = z.object({
  nationalId: z.string().min(1, "الرقم الوطني مطلوب"),
  password: z.string().min(1, "كلمة المرور مطلوبة"),
  twoFactorToken: z.string().optional(),
  rememberMe: z.boolean().optional().default(false),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [requires2FA, setRequires2FA] = useState(false);
  const [loginStep, setLoginStep] = useState<"credentials" | "2fa">("credentials");
  const { toast } = useToast();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      nationalId: "",
      password: "",
      twoFactorToken: "",
      rememberMe: false,
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginFormValues) => {
      return await apiRequest("/api/auth/login", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: (response) => {
      if (response.code === "2FA_REQUIRED") {
        setRequires2FA(true);
        setLoginStep("2fa");
        toast({
          title: "مطلوب التحقق بخطوتين",
          description: "أدخل رمز التحقق من تطبيق المصادقة",
        });
      } else {
        // Store authentication token
        if (response.token) {
          localStorage.setItem("auth_token", response.token);
          localStorage.setItem("user", JSON.stringify(response.user));
        }
        
        toast({
          title: "تم تسجيل الدخول بنجاح",
          description: `مرحباً ${response.user?.firstName} ${response.user?.lastName}`,
        });
        
        // Redirect to dashboard
        window.location.href = "/";
      }
    },
    onError: (error: any) => {
      const errorMessage = error.message || "فشل في تسجيل الدخول";
      const errorCode = error.code;
      
      if (errorCode === "ACCOUNT_LOCKED") {
        toast({
          title: "الحساب مقفل مؤقتاً",
          description: "تم قفل حسابك بسبب محاولات دخول خاطئة متعددة. حاول مرة أخرى لاحقاً.",
          variant: "destructive",
        });
      } else if (errorCode === "INVALID_2FA") {
        toast({
          title: "رمز التحقق خاطئ",
          description: "تأكد من إدخال الرمز الصحيح من تطبيق المصادقة",
          variant: "destructive",
        });
      } else {
        toast({
          title: "خطأ في تسجيل الدخول",
          description: errorMessage,
          variant: "destructive",
        });
      }
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
            <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
              <Building2 className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">بنّاء اليمن</h1>
              <p className="text-sm text-gray-600">منصة الخدمات الحكومية الرقمية</p>
            </div>
          </div>
        </div>

        {/* Login Card */}
        <Card className="shadow-lg border-0">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-2xl font-bold text-gray-900">
              {loginStep === "credentials" ? "تسجيل الدخول" : "التحقق بخطوتين"}
            </CardTitle>
            <CardDescription>
              {loginStep === "credentials" 
                ? "أدخل بياناتك للوصول لحسابك" 
                : "أدخل رمز التحقق من تطبيق المصادقة"}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                
                {loginStep === "credentials" && (
                  <>
                    {/* National ID Field */}
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
                                data-testid="input-national-id"
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Password Field */}
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
                                data-testid="input-password"
                              />
                              <button
                                type="button"
                                className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
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
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Remember Me */}
                    <FormField
                      control={form.control}
                      name="rememberMe"
                      render={({ field }) => (
                        <FormItem className="flex items-center space-x-2 space-x-reverse">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              data-testid="checkbox-remember-me"
                            />
                          </FormControl>
                          <FormLabel className="text-sm font-normal">
                            تذكرني لمدة 30 يوم
                          </FormLabel>
                        </FormItem>
                      )}
                    />
                  </>
                )}

                {loginStep === "2fa" && (
                  <FormField
                    control={form.control}
                    name="twoFactorToken"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-right">رمز التحقق</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Smartphone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                            <Input
                              {...field}
                              placeholder="أدخل رمز التحقق المكون من 6 أرقام"
                              className="pl-10 text-center text-lg tracking-widest"
                              maxLength={6}
                              data-testid="input-2fa-token"
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                        <div className="text-xs text-gray-500 text-center">
                          افتح تطبيق المصادقة واكتب الرمز المعروض
                        </div>
                      </FormItem>
                    )}
                  />
                )}

                {/* Security Notice */}
                <Alert className="border-blue-200 bg-blue-50">
                  <Shield className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-800">
                    <strong>حماية متقدمة:</strong> نستخدم تشفير متقدم وتقنيات أمان عالمية لحماية بياناتك
                  </AlertDescription>
                </Alert>

                {/* Submit Button */}
                <Button
                  type="submit"
                  className="w-full h-12 text-lg font-semibold"
                  disabled={loginMutation.isPending}
                  data-testid="button-login"
                >
                  {loginMutation.isPending ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      {loginStep === "credentials" ? "جاري المعالجة..." : "جاري التحقق..."}
                    </div>
                  ) : (
                    <>
                      {loginStep === "credentials" ? "دخول" : "تأكيد"}
                      <CheckCircle className="mr-2 h-4 w-4" />
                    </>
                  )}
                </Button>

                {/* Back to credentials if in 2FA step */}
                {loginStep === "2fa" && (
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      setLoginStep("credentials");
                      setRequires2FA(false);
                      form.reset();
                    }}
                    data-testid="button-back-to-credentials"
                  >
                    العودة لتسجيل الدخول
                  </Button>
                )}
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Footer Links */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-4 text-sm">
            <a href="/auth/register" className="text-primary hover:underline">
              إنشاء حساب جديد
            </a>
            <span className="text-gray-400">•</span>
            <a href="/auth/forgot-password" className="text-primary hover:underline">
              نسيت كلمة المرور؟
            </a>
          </div>
          
          <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
            <Phone className="h-3 w-3" />
            <span>للدعم الفني: 967-1-123456</span>
          </div>
        </div>

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