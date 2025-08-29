# بنّاء اليمن - دليل النشر

## حالة النشر الحالية
- **النوع**: Replit Autoscale Deployment
- **البيئة**: Production-ready
- **المنفذ**: 80 (خارجي) ← 5000 (داخلي)

## مواصفات التطبيق المنشور
### المكونات الأساسية
✅ **Node.js API Server** - جميع مسارات GIS والـ APIs  
✅ **React Frontend** - واجهة مستخدم كاملة بالعربية  
✅ **Phase 0 Processing** - معالجة ملفات GeoTIFF فورية  
✅ **PostgreSQL Database** - قاعدة بيانات متكاملة  
✅ **Layer Management** - إدارة 35+ طبقة جغرافية  

### المكونات المؤجلة (تتطلب Docker)
⏳ **Phase 1 Processing Pipeline** - معالجة متقدمة بـ Celery  
⏳ **Redis Queue System** - نظام طوابير المهام  
⏳ **MinIO Object Storage** - تخزين كائنات متقدم  
⏳ **FastAPI Dispatcher** - موزع المهام المتقدم  

## عناوين الخدمة
- **التطبيق الرئيسي**: https://[replit-deployment-url]
- **API Health**: https://[replit-deployment-url]/api/gis/health
- **لوحة التحكم**: https://[replit-deployment-url]/gis-data-management
- **أداة الرقمنة**: https://[replit-deployment-url]/digitization-tool

## الميزات المتاحة فوراً
1. **رفع وإدارة الملفات الجغرافية**
2. **خريطة تفاعلية مع 35 طبقة**
3. **أدوات الرقمنة البسيطة**
4. **لوحة تحكم إدارية شاملة**
5. **API كامل لجميع العمليات**

## خطة النشر الكامل (Docker)
للحصول على Phase 1 Processing كاملة:
1. **نسخ المشروع** إلى خادم يدعم Docker
2. **تشغيل**: `docker-compose -f docker-compose.phase1.yml up -d`
3. **اختبار**: `./e2e_phase1_run_and_report.sh`

## المطلوب للاختبار
- [ ] النقر على زر Deploy في Replit
- [ ] تأكيد عمل جميع الروابط
- [ ] اختبار رفع ملف GeoTIFF
- [ ] التحقق من عرض الطبقات على الخريطة