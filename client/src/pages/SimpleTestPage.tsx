import React from 'react';
import { Link } from 'wouter';

export default function SimpleTestPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-8" dir="rtl">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          🟢 النظام الذكي الاستباقي - اختبار النجاح
        </h1>
        
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-green-600 mb-4">
            ✅ تم إكمال المرحلة الأولى بنجاح
          </h2>
          
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">مكتمل</span>
              <span>نظام الذكاء السياقي التلقائي</span>
            </div>
            
            <div className="flex items-center gap-3">
              <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">مكتمل</span>
              <span>تفعيل الصلاحيات التلقائي بناءً على السياق</span>
            </div>
            
            <div className="flex items-center gap-3">
              <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">مكتمل</span>
              <span>مراقبة المستخدم مع الإحصائيات</span>
            </div>
            
            <div className="flex items-center gap-3">
              <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">مكتمل</span>
              <span>تسجيل الأحداث السياقية الشامل</span>
            </div>
            
            <div className="flex items-center gap-3">
              <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">مكتمل</span>
              <span>واجهة إدارية للتحكم الذكي</span>
            </div>
          </div>
        </div>
        
        <div className="bg-blue-50 rounded-lg p-6 mb-8">
          <h3 className="text-lg font-semibold text-blue-800 mb-4">
            🚀 المرحلة التالية: النظام الذكي الاستباقي الشامل
          </h3>
          
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm">قيد التطوير</span>
              <span>التنبؤ الذكي بالاحتياجات</span>
            </div>
            
            <div className="flex items-center gap-3">
              <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm">قيد التطوير</span>
              <span>اتخاذ القرارات التلقائي المتقدم</span>
            </div>
            
            <div className="flex items-center gap-3">
              <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm">قيد التطوير</span>
              <span>التحليل الذكي للأنماط السلوكية</span>
            </div>
          </div>
        </div>
        
        <div className="flex gap-4 flex-wrap">
          <a href="/employee-login">
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors">
              🔐 تسجيل الدخول للموظفين
            </button>
          </a>
          
          <a href="/admin/context-management">
            <button className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg transition-colors">
              ⚙️ إدارة الذكاء السياقي
            </button>
          </a>

          <button 
            onClick={() => {
              // اختبار مباشر للتوجه للنظام الذكي
              fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: 'admin', password: 'admin123' })
              })
              .then(res => res.json())
              .then(data => {
                if (data.success) {
                  localStorage.setItem('auth_token', data.token);
                  window.location.href = '/admin/context-management';
                } else {
                  alert('فشل تسجيل الدخول');
                }
              })
              .catch(err => alert('خطأ: ' + err.message));
            }}
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg transition-colors">
            🚀 دخول مباشر للنظام الذكي
          </button>
        </div>
        
        <div className="mt-8 text-center text-gray-600">
          <p>منصة "بنّاء اليمن" الرقمية - النظام الذكي الاستباقي</p>
          <p className="text-sm mt-1">المرحلة الأولى مكتملة بنجاح ✨</p>
        </div>
      </div>
    </div>
  );
}