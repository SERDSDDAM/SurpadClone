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
  X 
} from "lucide-react";
import { useState } from "react";
import Dashboard from "@/pages/dashboard";
import FieldApp from "@/pages/field-app";
import CleanFieldApp from "@/pages/clean-field-app";
import SurveyorDashboard from "@/pages/surveyor-dashboard";
import Review from "@/pages/review";
import NotFound from "@/pages/not-found";

function Navigation() {
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navigation = [
    { name: "لوحة التحكم", href: "/admin", icon: LayoutDashboard },
    { name: "تطبيق المساح", href: "/field-app", icon: Smartphone },
    { name: "التطبيق النظيف", href: "/clean-field-app", icon: MapPin },
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
                    <a
                      className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors flex items-center ${
                        isActive
                          ? "bg-primary text-white"
                          : "text-gray-600 hover:text-primary hover:bg-primary/10"
                      }`}
                      data-testid={`nav-${item.name.replace(/\s+/g, '-').toLowerCase()}`}
                    >
                      <IconComponent className="ml-1 h-4 w-4" />
                      {item.name}
                    </a>
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
                    <a
                      className={`block px-3 py-2 text-sm font-medium rounded-lg transition-colors flex items-center ${
                        isActive
                          ? "bg-primary text-white"
                          : "text-gray-600 hover:text-primary hover:bg-primary/10"
                      }`}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <IconComponent className="ml-2 h-4 w-4" />
                      {item.name}
                    </a>
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

function Router() {
  const [location] = useLocation();
  
  // Check if current route should hide navigation
  const hideNavigation = location === "/" || location === "/dashboard" || location === "/clean-field-app";
  
  return (
    <div className="min-h-screen bg-gray-50">
      {!hideNavigation && <Navigation />}
      <main className={hideNavigation ? "" : "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6"}>
        <Switch>
          <Route path="/" component={SurveyorDashboard} />
          <Route path="/dashboard" component={SurveyorDashboard} />
          <Route path="/admin" component={Dashboard} />
          <Route path="/field-app" component={FieldApp} />
          <Route path="/clean-field-app" component={CleanFieldApp} />
          <Route path="/review" component={Review} />
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
