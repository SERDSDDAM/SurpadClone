# Phase 2 - Advanced Digitization & Vectorization
**المرحلة الثانية: أدوات الرقمنة المتقدمة والتحويل الآلي**

## المنهجية: "إتقان الأساسيات قبل التوسع"
تركز هذه المرحلة على بناء أدوات رسم احترافية، حفظ البيانات في PostGIS، وإضافة تحويل آلي من الصور النقطية إلى الفيكتور.

## الجدول الزمني: 4 سباقات (8 أسابيع)

### Sprint A: الرسم والحفظ الأساسي (أسبوعان)
**الهدف**: تمكين رسم وحفظ المعالم الجغرافية

#### المهام التقنية
- **Frontend**: أدوات رسم Leaflet + leaflet.draw (نقطة/خط/مضلع/مستطيل/دائرة)
- **Backend**: API endpoints للمعالم الجغرافية (CRUD)
- **Database**: جدول `gis.features` مع فهرسة مكانية
- **UI**: نموذج إدخال الخصائص + قائمة المعالم

#### معايير القبول
- رسم مضلع → حفظ → استرجاع عبر API → عرض بنفس الشكل
- حساب المساحة والطول صحيح
- واجهة عربية RTL كاملة

### Sprint B: التحرير والربط الطوبولوجي (أسبوعان)
**الهدف**: تحرير دقيق مع ربط ذكي والتحقق الطوبولوجي

#### المهام التقنية
- **Snapping**: ربط تلقائي بأقرب نقطة/خط
- **Modify**: تحرير المعالم الموجودة
- **Undo/Redo**: نظام استرجاع العمليات
- **Validation**: التحقق من صحة الأشكال الهندسية

#### معايير القبول
- تعديل نقطة مع snap للعقد المجاورة (تسامح 2م)
- حفظ تاريخ التغييرات واسترجاع الحالات السابقة
- تصحيح الأشكال المعطوبة تلقائياً

### Sprint C: التحويل الآلي التجريبي (أسبوعان)
**الهدف**: تحويل الصور النقطية إلى اقتراحات فيكتورية

#### المهام التقنية
- **Python Worker**: معالجة Raster → Vector بـ OpenCV + Shapely
- **API Integration**: ربط مع نظام Celery الموجود
- **Review UI**: واجهة لمراجعة وقبول/رفض الاقتراحات
- **Thumbnail Generation**: معاينات مرئية للنتائج

#### معايير القبول
- رفع GeoTIFF → تحويل آلي → اقتراحات GeoJSON صالحة
- واجهة مراجعة تفاعلية لقبول الاقتراحات
- حفظ المعالم المقبولة في قاعدة البيانات

### Sprint D: التصدير والاستيراد والتحسين (أسبوعان)
**الهدف**: إكمال دورة البيانات وتحسين الأداء

#### المهام التقنية
- **Export**: تصدير بصيغ GeoJSON, GPKG, Shapefile
- **Import**: استيراد Shapefile/GeoJSON
- **Performance**: فهرسة GIST ودعم Vector Tiles
- **Testing**: اختبارات شاملة E2E

#### معايير القبول
- تصدير GPKG قابل للقراءة في QGIS
- استيراد Shapefile يحافظ على الخصائص والهندسة
- أداء سلس مع 10,000+ معلم

## البنية التقنية المقترحة

### قاعدة البيانات
```sql
CREATE SCHEMA gis;
CREATE TABLE gis.features (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  layer_id varchar(255) NOT NULL,
  geometry geometry(Geometry, 4326),
  properties jsonb DEFAULT '{}',
  feature_type varchar(50),
  created_by varchar(255),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone
);
CREATE INDEX idx_gis_features_geom ON gis.features USING GIST (geometry);
```

### APIs الأساسية
- `POST /api/gis/features` - إنشاء معلم جديد
- `GET /api/gis/features?layerId=...` - جلب معالم طبقة
- `PATCH /api/gis/features/:id` - تحديث معلم
- `DELETE /api/gis/features/:id` - حذف معلم
- `POST /api/gis/vectorize` - بدء تحويل آلي
- `GET /api/gis/vectorize/:jobId` - حالة التحويل

### مكونات Frontend
- `DrawingToolbar`: شريط أدوات الرسم
- `FeatureList`: قائمة المعالم
- `AttributeEditor`: محرر الخصائص
- `VectorizationReviewer`: مراجع التحويل الآلي
- `ExportDialog`: حوار التصدير

## الموارد المطلوبة
- **Frontend Developer**: 1-2 مطور (4 أسابيع)
- **Backend Developer**: 1 مطور (3 أسابيع)  
- **GIS Specialist**: 0.5-1 مطور للتحويل الآلي (3 أسابيع)
- **DevOps**: دعم جزئي للبنية التحتية

## المخرجات
- أدوات رسم تفاعلية احترافية
- قاعدة بيانات مكانية كاملة مع PostGIS
- تحويل آلي تجريبي من Raster إلى Vector
- نظام تصدير/استيراد شامل
- واجهة عربية متكاملة RTL
- اختبارات شاملة ووثائق

**الحالة الحالية**: جاهز لبدء Sprint A
**التاريخ**: أغسطس 29، 2025