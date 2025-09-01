import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  Smartphone, 
  ClipboardCheck, 
  MapPin,
  Menu,
  X,
  Building2,
  Users,
  MessageSquare,
  Layers
} from "lucide-react";
import { useState } from "react";
import Dashboard from "@/pages/dashboard";
import FieldApp from "@/pages/field-app";
import Login from "@/pages/auth/login";
import Register from "@/pages/auth/register";
import CitizenLogin from "@/pages/auth/citizen-login";
import ProfessionalLogin from "@/pages/auth/professional-login";
import EmployeeLogin from "@/pages/auth/employee-login";
import EmployeeLoginPage from "@/pages/EmployeeLoginPage";
import AdminDashboard from "@/pages/AdminDashboard";
import AdminDashboardNew from "@/pages/admin/AdminDashboardNew";
import SimpleLoginPage from "@/pages/SimpleLoginPage";
import PortalSelection from "@/pages/auth/portal-selection";
import CitizenDashboard from "@/pages/citizen/citizen-dashboard";
import SmartEmployeeDashboard from "@/pages/employee/smart-employee-dashboard";
import AnalyticsDashboard from "@/pages/admin/analytics-dashboard";
import RoleManagement from "@/pages/admin/role-management";
import React from "react";
import UnifiedRequestDetails from "@/pages/citizen/unified-request-details";
import CleanFieldApp from "@/pages/clean-field-app";
import SurveyorDashboard from "@/pages/surveyor-dashboard";
import Review from "@/pages/review";
import AdvancedFieldApp from "@/pages/field-app-advanced";
import SurveyRequestForm from "@/pages/survey/survey-request-form";
import SurveyDashboard from "@/pages/survey/survey-dashboard";
import CitizenPortal from "@/pages/citizen-portal";
import ProfessionalsManagement from "@/pages/professionals-management";
import BuildingPermits from "@/pages/building-permits";
import OccupancyCertificates from "@/pages/occupancy-certificates";
import InspectionManagement from "@/pages/inspection-management";
import InspectorFieldApp from "@/pages/inspector-field-app";
import DigitalCertificates from "@/pages/digital-certificates";
import NotificationsSystem from "@/pages/notifications-system";
import { GISDataManagement, DigitizationTool } from "@/pages/gis";
import SimpleDigitizationTool from "@/pages/gis/simple-digitization-tool";
import RolesAndPermissions from "@/pages/admin/RolesAndPermissions";
import AdvancedRBACManagement from "@/pages/admin/AdvancedRBACManagement";
import AdminDashboardEnhanced from "@/pages/admin/AdminDashboardEnhanced";
import { ContextAwareManagement } from "@/pages/admin/ContextAwareManagement";
import QGISWebTool from "@/pages/gis/qgis-web-tool";
import Phase0Test from "@/pages/Phase0Test";
import Phase1Processing from "@/pages/Phase1Processing";
import Phase2DigitizationTool from "@/pages/Phase2DigitizationTool";
import NotFound from "@/pages/not-found";
import LoginPage from "@/pages/LoginPage";
import AdminUsers from "@/pages/admin/AdminUsers";
import { useSimpleAuth } from "@/hooks/useSimpleAuth";

function Navigation() {
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navigation = [
    { name: "لوحة التحكم", href: "/admin", icon: LayoutDashboard },
    { name: "بوابة المواطنين", href: "/citizen-portal", icon: Building2 },
    { name: "رخص البناء", href: "/building-permits", icon: Building2 },
    { name: "شهادات الإشغال", href: "/occupancy-certificates", icon: ClipboardCheck },
    { name: "إدارة التفتيش", href: "/inspection-management", icon: ClipboardCheck },
    { name: "تطبيق المفتش", href: "/inspector-field-app", icon: Smartphone },
    { name: "الشهادات الرقمية", href: "/digital-certificates", icon: ClipboardCheck },
    { name: "نظام الإشعارات", href: "/notifications", icon: MessageSquare },
    { name: "إدارة البيانات الجغرافية", href: "/gis-management", icon: MapPin },
    { name: "أداة رقمنة المخططات", href: "/digitization-tool", icon: Layers },
    { name: "الرقمنة البسيطة (CRS.Simple)", href: "/simple-digitization", icon: Layers },
    { name: "🧪 Phase 0 Test Suite", href: "/phase0-test", icon: Layers },
    { name: "🚀 Phase 1 Processing", href: "/phase1-processing", icon: Layers },
    { name: "⚡ Phase 2 - الرقمنة المتقدمة", href: "/phase2-digitization", icon: Layers },
    { name: "إدارة المهنيين", href: "/professionals", icon: Users },
    { name: "تطبيق المساح", href: "/field-app", icon: Smartphone },
    { name: "التطبيق النظيف", href: "/clean-field-app", icon: MapPin },
    { name: "التطبيق المتقدم", href: "/advanced-field-app", icon: MapPin },
    { name: "نموذج طلب مساحي", href: "/survey-request-form", icon: ClipboardCheck },
    { name: "لوحة المساحة", href: "/survey-dashboard", icon: LayoutDashboard },
    { name: "المراجعة", href: "/review", icon: ClipboardCheck },
  ];

  return (
    <header className="bg-white shadow-lg border-b-2 border-primary">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <h1 className="text-2xl font-bold text-primary flex items-center">
              <MapPin className="ml-2 h-6 w-6" />
              بنّاء اليمن - النظام المساحي
            </h1>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:block">
            <div className="flex items-center space-x-4 space-x-reverse">
              {navigation.map((item) => {
                const IconComponent = item.icon;
                const isActive = location === item.href;
                
                return (
                  <Link key={item.name} href={item.href}>
                    <span
                      className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors flex items-center cursor-pointer ${
                        isActive
                          ? "bg-primary text-white"
                          : "text-gray-600 hover:text-primary hover:bg-primary/10"
                      }`}
                      data-testid={`nav-${item.name.replace(/\s+/g, '-').toLowerCase()}`}
                    >
                      <IconComponent className="ml-1 h-4 w-4" />
                      {item.name}
                    </span>
                  </Link>
                );
              })}
              
              <div className="bg-green-600 text-white px-3 py-2 rounded-lg text-sm flex items-center">
                <span>مهندس أحمد المساحي</span>
              </div>
            </div>
          </nav>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              data-testid="mobile-menu-button"
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-4 border-t">
            <div className="space-y-2">
              {navigation.map((item) => {
                const IconComponent = item.icon;
                const isActive = location === item.href;
                
                return (
                  <Link key={item.name} href={item.href}>
                    <span
                      className={`block px-3 py-2 text-sm font-medium rounded-lg transition-colors flex items-center cursor-pointer ${
                        isActive
                          ? "bg-primary text-white"
                          : "text-gray-600 hover:text-primary hover:bg-primary/10"
                      }`}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <IconComponent className="ml-2 h-4 w-4" />
                      {item.name}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

function ProtectedRoute({ children, role }: { children: React.ReactNode; role?: string }) {
  const { isAuthenticated, isLoading, user } = useSimpleAuth();
  const [location] = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">جاري التحقق من المصادقة...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // حفظ الرابط المطلوب للعودة إليه بعد تسجيل الدخول
    localStorage.setItem('redirect_after_login', location);
    window.location.href = '/employee-login';
    return null;
  }

  // فحص الصلاحيات إذا كان مطلوباً
  if (role && user?.role !== role && user?.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600">ليس لديك صلاحية للوصول</h2>
          <p className="mt-2 text-gray-600">الدور المطلوب: {role}</p>
          <p className="text-gray-600">دورك الحالي: {user?.role}</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

function Router() {
  const [location] = useLocation();
  
  // Check if current route should hide navigation
  const hideNavigation = location === "/" || location === "/dashboard" || location === "/clean-field-app" || location === "/login";
  
  return (
    <div className="min-h-screen bg-gray-50">
      {!hideNavigation && <Navigation />}
      <main className={hideNavigation ? "" : "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6"}>
        <Switch>
          <Route path="/" component={PortalSelection} />
          <Route path="/admin" component={Dashboard} />
          <Route path="/admin-dashboard">
            {() => (
              <ProtectedRoute role="admin">
                <AdminDashboardEnhanced />
              </ProtectedRoute>
            )}
          </Route>
          <Route path="/dashboard" component={Dashboard} />
          <Route path="/citizen-portal" component={CitizenPortal} />
          <Route path="/building-permits" component={BuildingPermits} />
          <Route path="/occupancy-certificates" component={OccupancyCertificates} />
          <Route path="/inspection-management" component={InspectionManagement} />
          <Route path="/inspector-field-app" component={InspectorFieldApp} />
          <Route path="/digital-certificates" component={DigitalCertificates} />
          <Route path="/notifications" component={NotificationsSystem} />
          <Route path="/gis-management" component={GISDataManagement} />
          <Route path="/digitization-tool" component={DigitizationTool} />
          <Route path="/simple-digitization-tool" component={SimpleDigitizationTool} />
          <Route path="/phase0-test" component={Phase0Test} />
          <Route path="/phase1-processing" component={Phase1Processing} />
          <Route path="/phase2-digitization" component={Phase2DigitizationTool} />
          <Route path="/simple-digitization" component={SimpleDigitizationTool} />
          <Route path="/qgis-web-tool" component={QGISWebTool} />
          <Route path="/professionals" component={ProfessionalsManagement} />
          <Route path="/field-app" component={FieldApp} />
          <Route path="/clean-field-app" component={CleanFieldApp} />
          <Route path="/advanced-field-app" component={AdvancedFieldApp} />
          <Route path="/survey-request-form" component={SurveyRequestForm} />
          <Route path="/survey-dashboard" component={SurveyDashboard} />
          <Route path="/review" component={Review} />
          <Route path="/auth/login" component={Login} />
          <Route path="/auth/register" component={Register} />
          <Route path="/auth/citizen-login" component={CitizenLogin} />
          <Route path="/auth/professional-login" component={ProfessionalLogin} />
          <Route path="/auth/employee-login" component={EmployeeLogin} />
          <Route path="/employee-login" component={EmployeeLoginPage} />
          <Route path="/simple-login" component={SimpleLoginPage} />
          <Route path="/login" component={LoginPage} />
          {/* Admin Dashboard System - Fixed Routes */}
          <Route path="/admin">
            {() => (
              <ProtectedRoute role="admin">
                <AdminDashboardNew />
              </ProtectedRoute>
            )}
          </Route>
          <Route path="/admin-users">
            {() => (
              <ProtectedRoute role="admin">
                <AdminUsers />
              </ProtectedRoute>
            )}
          </Route>
          <Route path="/admin-rbac">
            {() => (
              <ProtectedRoute role="admin">
                <RolesAndPermissions />
              </ProtectedRoute>
            )}
          </Route>
          <Route path="/admin-advanced-rbac">
            {() => (
              <ProtectedRoute role="admin">
                <AdvancedRBACManagement />
              </ProtectedRoute>
            )}
          </Route>
          <Route path="/admin/context-aware">
            {() => (
              <ProtectedRoute role="admin">
                <ContextAwareManagement />
              </ProtectedRoute>
            )}
          </Route>
          <Route path="/admin-dashboard">
            {() => {
              const AdminDashboardLayout = React.lazy(() => import('@/layouts/AdminDashboardLayout'));
              const AdminHome = React.lazy(() => import('@/pages/admin/AdminHome'));
              const RequireAuth = React.lazy(() => import('@/components/RequireAuth'));
              
              return (
                <React.Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div></div>}>
                  <RequireAuth role="admin">
                    <AdminDashboardLayout>
                      <AdminHome />
                    </AdminDashboardLayout>
                  </RequireAuth>
                </React.Suspense>
              );
            }}
          </Route>

          <Route path="/admin/analytics">
            {() => {
              const AdminDashboardLayout = React.lazy(() => import('@/layouts/AdminDashboardLayout'));
              const RequireAuth = React.lazy(() => import('@/components/RequireAuth'));
              
              return (
                <React.Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div></div>}>
                  <RequireAuth role="admin">
                    <AdminDashboardLayout>
                      <AnalyticsDashboard />
                    </AdminDashboardLayout>
                  </RequireAuth>
                </React.Suspense>
              );
            }}
          </Route>

          <Route path="/admin/users">
            {() => (
              <ProtectedRoute role="admin">
                <AdminUsers />
              </ProtectedRoute>
            )}
          </Route>
          
          <Route path="/admin-users">
            {() => (
              <ProtectedRoute role="admin">
                <AdminUsers />
              </ProtectedRoute>
            )}
          </Route>

          <Route path="/admin/users/:id">
            {() => {
              const AdminDashboardLayout = React.lazy(() => import('@/layouts/AdminDashboardLayout'));
              const AdminUserDetails = React.lazy(() => import('@/pages/admin/AdminUserDetails'));
              const RequireAuth = React.lazy(() => import('@/components/RequireAuth'));
              
              return (
                <React.Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div></div>}>
                  <RequireAuth role="admin">
                    <AdminDashboardLayout>
                      <AdminUserDetails />
                    </AdminDashboardLayout>
                  </RequireAuth>
                </React.Suspense>
              );
            }}
          </Route>

          <Route path="/admin/roles">
            {() => {
              const AdminDashboardLayout = React.lazy(() => import('@/layouts/AdminDashboardLayout'));
              const RequireAuth = React.lazy(() => import('@/components/RequireAuth'));
              
              return (
                <React.Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div></div>}>
                  <RequireAuth role="admin">
                    <AdminDashboardLayout>
                      <RoleManagement />
                    </AdminDashboardLayout>
                  </RequireAuth>
                </React.Suspense>
              );
            }}
          </Route>

          <Route path="/admin/gis">
            {() => {
              const AdminDashboardLayout = React.lazy(() => import('@/layouts/AdminDashboardLayout'));
              const AdminGIS = React.lazy(() => import('@/pages/admin/AdminGIS'));
              const RequireAuth = React.lazy(() => import('@/components/RequireAuth'));
              
              return (
                <React.Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div></div>}>
                  <RequireAuth role="admin">
                    <AdminDashboardLayout>
                      <AdminGIS />
                    </AdminDashboardLayout>
                  </RequireAuth>
                </React.Suspense>
              );
            }}
          </Route>

          <Route path="/admin/settings">
            {() => {
              const AdminDashboardLayout = React.lazy(() => import('@/layouts/AdminDashboardLayout'));
              const RequireAuth = React.lazy(() => import('@/components/RequireAuth'));
              
              return (
                <React.Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div></div>}>
                  <RequireAuth role="admin">
                    <AdminDashboardLayout>
                      <div className="p-6">
                        <h1 className="text-2xl font-bold mb-4">الإعدادات</h1>
                        <p className="text-gray-600">قريباً...</p>
                      </div>
                    </AdminDashboardLayout>
                  </RequireAuth>
                </React.Suspense>
              );
            }}
          </Route>
          
          {/* Legacy admin routes - redirect to new system */}
          <Route path="/analytics-dashboard">
            {() => {
              window.location.href = '/admin/analytics';
              return null;
            }}
          </Route>
          
          <Route path="/citizen-dashboard" component={CitizenDashboard} />
          <Route path="/employee-dashboard" component={SmartEmployeeDashboard} />
          <Route path="/role-management" component={RoleManagement} />
          <Route path="/request-details/:id" component={UnifiedRequestDetails} />
          <Route component={NotFound} />
        </Switch>
      </main>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
