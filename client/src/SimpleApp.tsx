import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Switch, Route } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import SimpleFieldTest from "@/pages/simple-field-test";

export default function SimpleApp() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen">
        <Switch>
          <Route path="/field-app" component={SimpleFieldTest} />
          <Route path="*">
            {() => (
              <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                  <h1 className="text-2xl font-bold mb-4">بنّاء اليمن</h1>
                  <p className="text-gray-600 mb-4">نظام المساحة الرقمية</p>
                  <a 
                    href="/field-app" 
                    className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
                  >
                    تطبيق المساحة الميدانية
                  </a>
                </div>
              </div>
            )}
          </Route>
        </Switch>
      </div>
      <Toaster />
    </QueryClientProvider>
  );
}