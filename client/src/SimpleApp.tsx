import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Switch, Route } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import FieldApp from "@/pages/field-app";
import SimpleFieldTest from "@/pages/simple-field-test";

export default function SimpleApp() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="min-h-screen">
          <Switch>
            <Route path="/field-app" component={FieldApp} />
            <Route path="/field-app-simple" component={SimpleFieldTest} />
            <Route path="*">
              {() => (
                <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-green-50">
                  <div className="text-center space-y-6 p-8 bg-white rounded-xl shadow-lg max-w-md">
                    <div className="text-6xl mb-4">🗺️</div>
                    <h1 className="text-3xl font-bold text-gray-800">بنّاء اليمن</h1>
                    <p className="text-gray-600">نظام المساحة الرقمية المتقدم</p>
                    <div className="space-y-3">
                      <a 
                        href="/field-app" 
                        className="block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        🚀 تطبيق المساحة المتقدم
                      </a>
                      <a 
                        href="/field-app-simple" 
                        className="block bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
                      >
                        📱 التطبيق المبسط
                      </a>
                    </div>
                    <div className="text-sm text-gray-500 pt-4">
                      نظام مساحي احترافي مع تقنيات GPS متقدمة
                    </div>
                  </div>
                </div>
              )}
            </Route>
          </Switch>
        </div>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}