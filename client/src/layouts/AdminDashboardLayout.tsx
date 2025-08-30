import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { 
  Shield, 
  BarChart3, 
  Users, 
  Settings, 
  FileText, 
  MapPin, 
  UploadCloud,
  Menu,
  X,
  Bell,
  User,
  LogOut,
  ChevronDown,
  Home,
  Database,
  Activity,
  Layers
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';

const adminLinks = [
  { 
    id: 'dashboard', 
    to: '/admin', 
    label: 'الرئيسية', 
    icon: <Home className="w-5 h-5" />,
    exact: true
  },
  { 
    id: 'analytics', 
    to: '/admin/analytics', 
    label: 'التحليلات', 
    icon: <BarChart3 className="w-5 h-5" /> 
  },
  { 
    id: 'users', 
    to: '/admin/users', 
    label: 'إدارة المستخدمين', 
    icon: <Users className="w-5 h-5" /> 
  },
  { 
    id: 'roles', 
    to: '/admin/roles', 
    label: 'إدارة الصلاحيات', 
    icon: <Shield className="w-5 h-5" /> 
  },
  { 
    id: 'gis', 
    to: '/admin/gis', 
    label: 'نظام GIS', 
    icon: <MapPin className="w-5 h-5" /> 
  },
  { 
    id: 'layers', 
    to: '/admin/layers', 
    label: 'إدارة الطبقات', 
    icon: <Layers className="w-5 h-5" /> 
  },
  { 
    id: 'uploads', 
    to: '/admin/uploads', 
    label: 'رفع الملفات', 
    icon: <UploadCloud className="w-5 h-5" /> 
  },
  { 
    id: 'database', 
    to: '/admin/database', 
    label: 'قواعد البيانات', 
    icon: <Database className="w-5 h-5" /> 
  },
  { 
    id: 'reports', 
    to: '/admin/reports', 
    label: 'التقارير', 
    icon: <FileText className="w-5 h-5" /> 
  },
  { 
    id: 'activity', 
    to: '/admin/activity', 
    label: 'سجل النشاطات', 
    icon: <Activity className="w-5 h-5" /> 
  },
  { 
    id: 'settings', 
    to: '/admin/settings', 
    label: 'الإعدادات', 
    icon: <Settings className="w-5 h-5" /> 
  },
];

const breadcrumbMap: Record<string, string> = {
  '/admin': 'الرئيسية',
  '/admin/analytics': 'التحليلات',
  '/admin/users': 'إدارة المستخدمين',
  '/admin/roles': 'إدارة الصلاحيات',
  '/admin/gis': 'نظام GIS',
  '/admin/layers': 'إدارة الطبقات',
  '/admin/uploads': 'رفع الملفات',
  '/admin/database': 'قواعد البيانات',
  '/admin/reports': 'التقارير',
  '/admin/activity': 'سجل النشاطات',
  '/admin/settings': 'الإعدادات',
};

interface AdminDashboardLayoutProps {
  children: React.ReactNode;
}

export default function AdminDashboardLayout({ children }: AdminDashboardLayoutProps) {
  const [location] = useLocation();
  const { user } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    // Save last visited admin route
    if (location.startsWith('/admin')) {
      localStorage.setItem('admin_last_route', location);
    }
  }, [location]);

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_data');
    window.location.href = '/login';
  };

  const currentPageTitle = breadcrumbMap[location] || 'لوحة التحكم';

  return (
    <div className="flex min-h-screen bg-gray-50" dir="rtl">
      {/* Sidebar */}
      <aside className={`
        ${sidebarCollapsed ? 'w-16' : 'w-64'} 
        ${isMobile ? 'fixed inset-y-0 right-0 z-50' : 'relative'}
        transition-all duration-300 bg-white border-l border-gray-200 shadow-sm
        ${isMobile && sidebarCollapsed ? 'translate-x-full' : 'translate-x-0'}
      `}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            {!sidebarCollapsed && (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="font-bold text-lg text-gray-900">بنّاء اليمن</h2>
                  <p className="text-sm text-red-600">لوحة التحكم</p>
                </div>
              </div>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-2"
            >
              {sidebarCollapsed ? <Menu className="w-4 h-4" /> : <X className="w-4 h-4" />}
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {adminLinks.map((link) => {
              const isActive = link.exact ? location === link.to : location.startsWith(link.to);
              return (
                <Link
                  key={link.id}
                  to={link.to}
                  className={`
                    flex items-center gap-3 p-3 rounded-lg transition-colors
                    ${isActive 
                      ? 'bg-red-50 text-red-700 border border-red-200' 
                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                    }
                    ${sidebarCollapsed ? 'justify-center' : ''}
                  `}
                >
                  <span className="flex-shrink-0">{link.icon}</span>
                  {!sidebarCollapsed && (
                    <span className="font-medium">{link.label}</span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* User Info */}
          {!sidebarCollapsed && (
            <div className="p-4 border-t border-gray-200">
              <div className="flex items-center gap-3 text-sm">
                <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">
                    {user?.fullName || user?.username}
                  </p>
                  <p className="text-gray-500 truncate">{user?.role}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold text-gray-900">{currentPageTitle}</h1>
              <nav className="hidden md:flex items-center gap-2 text-sm text-gray-500">
                <span>لوحة التحكم</span>
                <span>/</span>
                <span className="text-gray-900">{currentPageTitle}</span>
              </nav>
            </div>

            <div className="flex items-center gap-4">
              {/* Notifications */}
              <Button variant="ghost" size="sm" className="relative">
                <Bell className="w-5 h-5" />
                <Badge 
                  variant="destructive" 
                  className="absolute -top-2 -right-2 w-5 h-5 text-xs flex items-center justify-center p-0"
                >
                  3
                </Badge>
              </Button>

              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4" />
                    </div>
                    <span className="hidden md:block font-medium">
                      {user?.fullName || user?.username}
                    </span>
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem>
                    <User className="w-4 h-4 ml-2" />
                    الملف الشخصي
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Settings className="w-4 h-4 ml-2" />
                    الإعدادات
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="w-4 h-4 ml-2" />
                    تسجيل الخروج
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 p-6 overflow-auto">
          {children}
        </div>
      </main>

      {/* Mobile Overlay */}
      {isMobile && !sidebarCollapsed && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setSidebarCollapsed(true)}
        />
      )}
    </div>
  );
}