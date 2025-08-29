# 🚨 خطة العمل الفورية - Phase 0: Hotfixes & Stabilization

## 🎯 الهدف الفوري
**حل المشاكل الجوهرية في النظام الحالي خلال أسبوع واحد لضمان أساس مستقر قبل التوسع**

---

## 📋 المشاكل الحالية المحددة

### 1. مشكلة Visibility Persistence
**المشكلة**: الطبقات ترجع للحالة الافتراضية عند إعادة التحميل
**الأثر**: تجربة مستخدم سيئة وفقدان تفضيلات العمل

### 2. عدم توحيد Metadata
**المشكلة**: معالجات مختلفة تنتج تنسيقات مختلفة
**الأثر**: صعوبة في إدارة وعرض الطبقات

### 3. أخطاء استرداد الطبقات
**المشكلة**: أخطاء "metadata.json not found" عند بدء الخادم
**الأثر**: عدم استقرار النظام وفقدان طبقات معالجة

---

## ⚡ خطة التنفيذ الفورية (7 أيام)

### يوم 1-2: توحيد معيار Metadata
**المهام:**

1. **تحديث جميع معالجات Python**
```python
# معيار موحد لجميع المعالجات
def write_metadata(output_dir, data):
    metadata = {
        "success": True,
        "imageFile": "processed.png", 
        "bbox": [west, south, east, north],  # GeoJSON standard
        "leaflet_bounds": [[south,west], [north,east]],  # Leaflet ready
        "width": data.width,
        "height": data.height, 
        "crs": "EPSG:4326",
        "original_name": data.original_name,
        "processed_at": datetime.utcnow().isoformat() + "Z"
    }
    with open(os.path.join(output_dir, 'metadata.json'), 'w') as f:
        json.dump(metadata, f, indent=2)
```

2. **تطبيق المعيار على جميع المعالجات**
- `zip-processor.py`
- `enhanced-geotiff-processor.py` 
- أي معالجات إضافية

**معيار القبول**: جميع الطبقات الجديدة تحتوي على metadata.json موحد

### يوم 3-4: نظام Layer State المستمر
**المهام:**

1. **إنشاء نظام layer-state.json**
```typescript
// server/routes/enhanced-upload.ts
interface LayerState {
  id: string;
  imageFile: string;
  imageUrl: string;
  leaflet_bounds: [[number,number], [number,number]];
  bbox: [number,number,number,number];
  width: number;
  height: number;
  crs: string;
  visible: boolean;        // الحالة الرئيسية
  z_index: number;
  opacity: number;
  status: 'processed' | 'error' | 'processing';
  updatedAt: string;
}

async function finalizeLayerState(layerId: string, outputDir: string) {
  const metadataPath = path.join(outputDir, 'metadata.json');
  const statePath = path.join(outputDir, 'layer-state.json');
  
  // قراءة metadata.json
  const metadata = JSON.parse(await fs.readFile(metadataPath, 'utf8'));
  
  // إنشاء حالة الطبقة
  const layerState: LayerState = {
    id: layerId,
    imageFile: metadata.imageFile,
    imageUrl: `/api/gis/layers/${layerId}/image/${metadata.imageFile}`,
    leaflet_bounds: metadata.leaflet_bounds,
    bbox: metadata.bbox,
    width: metadata.width,
    height: metadata.height, 
    crs: metadata.crs,
    visible: false, // افتراضي: مخفية حتى يفعلها المستخدم
    z_index: 0,
    opacity: 1.0,
    status: 'processed',
    updatedAt: new Date().toISOString()
  };
  
  // حفظ الحالة
  await fs.writeFile(statePath, JSON.stringify(layerState, null, 2));
  
  // تحديث الذاكرة
  layerStates.set(layerId, layerState);
}
```

2. **تحديث hydrateLayersFromDisk**
```typescript
async function hydrateLayersFromDisk() {
  const processedDir = path.join(process.cwd(), 'temp-uploads', 'processed');
  const layerDirs = await fs.readdir(processedDir);
  
  for (const layerDir of layerDirs) {
    const statePath = path.join(processedDir, layerDir, 'layer-state.json');
    try {
      const stateData = await fs.readFile(statePath, 'utf8');
      const layerState = JSON.parse(stateData);
      layerStates.set(layerDir, layerState);
      console.log(`✅ تم استرداد الطبقة: ${layerDir}`);
    } catch (error) {
      // إذا لم يوجد layer-state.json، حاول إنشاؤه من metadata.json
      await finalizeLayerState(layerDir, path.join(processedDir, layerDir));
    }
  }
}
```

**معيار القبول**: جميع الطبقات تُسترد بحالتها الصحيحة عند بدء الخادم

### يوم 5: API للتحكم في الرؤية
**المهام:**

1. **إضافة endpoint للتحكم في الرؤية**
```typescript
// server/routes/layer-visibility.ts
import express from 'express';
const router = express.Router();

router.patch('/layers/:layerId/visibility', async (req, res) => {
  try {
    const { layerId } = req.params;
    const { visible } = req.body;
    
    // التحقق من وجود الطبقة
    if (!layerStates.has(layerId)) {
      return res.status(404).json({ success: false, error: 'Layer not found' });
    }
    
    // تحديث الحالة في الذاكرة
    const currentState = layerStates.get(layerId)!;
    const updatedState = {
      ...currentState,
      visible: !!visible,
      updatedAt: new Date().toISOString()
    };
    layerStates.set(layerId, updatedState);
    
    // حفظ على القرص
    const layerDir = path.join(process.cwd(), 'temp-uploads', 'processed', layerId);
    const statePath = path.join(layerDir, 'layer-state.json');
    await fs.writeFile(statePath, JSON.stringify(updatedState, null, 2));
    
    res.json({ 
      success: true, 
      visible: !!visible,
      layerId,
      updatedAt: updatedState.updatedAt
    });
    
  } catch (error) {
    console.error('❌ خطأ في تحديث الرؤية:', error);
    res.status(500).json({ success: false, error: 'Failed to update visibility' });
  }
});

export default router;
```

2. **تحديث debug endpoint**
```typescript
// إضافة معلومات الرؤية للاستجابة
router.get('/debug/layers', (req, res) => {
  const layers = Array.from(layerStates.entries()).map(([id, state]) => ({
    id,
    name: state.imageFile?.replace(/\.[^/.]+$/, "") || id,
    fileName: state.imageFile || 'unknown',
    status: state.status,
    visible: state.visible, // إضافة حالة الرؤية
    opacity: state.opacity,
    z_index: state.z_index,
    bounds: state.leaflet_bounds,
    imageUrl: state.imageUrl,
    updatedAt: state.updatedAt
  }));
  
  res.json({
    success: true,
    layersCount: layers.length,
    layers: layers.sort((a, b) => b.z_index - a.z_index) // ترتيب حسب z-index
  });
});
```

**معيار القبول**: تغيير رؤية الطبقة يحفظ فوراً ويستمر بعد إعادة التحميل

### يوم 6: تحسينات Client-Side
**المهام:**

1. **إضافة localStorage للتخزين المحلي الفوري**
```typescript
// client/src/utils/layer-state.ts
interface LocalLayerOverrides {
  [layerId: string]: {
    visible?: boolean;
    opacity?: number;
    lastUpdated: string;
  };
}

export const layerStateManager = {
  // حفظ تفضيل محلي فوري
  setLocalOverride(layerId: string, overrides: Partial<LayerState>) {
    const stored = localStorage.getItem('layer_overrides');
    const current: LocalLayerOverrides = stored ? JSON.parse(stored) : {};
    
    current[layerId] = {
      ...current[layerId],
      ...overrides,
      lastUpdated: new Date().toISOString()
    };
    
    localStorage.setItem('layer_overrides', JSON.stringify(current));
  },
  
  // دمج التفضيلات المحلية مع بيانات الخادم
  mergeWithServerData(serverLayers: LayerData[]): LayerData[] {
    const stored = localStorage.getItem('layer_overrides');
    const overrides: LocalLayerOverrides = stored ? JSON.parse(stored) : {};
    
    return serverLayers.map(layer => ({
      ...layer,
      ...overrides[layer.id], // التفضيلات المحلية تفوق الخادم
    }));
  },
  
  // مزامنة مع الخادم في الخلفية
  async syncWithServer(layerId: string, changes: Partial<LayerState>) {
    try {
      await fetch(`/api/gis/layers/${layerId}/visibility`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(changes)
      });
    } catch (error) {
      console.warn('فشل في مزامنة التغيير مع الخادم:', error);
      // سيتم إعادة المحاولة في التحديث التالي
    }
  }
};
```

2. **تحديث AdvancedLayersPanel**
```typescript
// optimistic UI updates
const toggleLayerVisibility = async (layerId: string, visible: boolean) => {
  // تحديث فوري في UI
  setLayers(prev => prev.map(layer => 
    layer.id === layerId ? { ...layer, visible } : layer
  ));
  
  // حفظ محلي فوري
  layerStateManager.setLocalOverride(layerId, { visible });
  
  // مزامنة مع الخادم في الخلفية
  layerStateManager.syncWithServer(layerId, { visible });
};
```

**معيار القبول**: تغيير رؤية الطبقة يظهر فوراً ويبقى حتى لو فشلت المزامنة

### يوم 7: اختبارات شاملة وإصلاحات
**المهام:**

1. **اختبارات E2E**
```bash
# Test Script
#!/bin/bash

echo "🧪 اختبار persistence للرؤية..."

# اختبار 1: تغيير رؤية طبقة
LAYER_ID="layer_1756429692013_m86tij"
curl -X PATCH "http://localhost:5000/api/gis/layers/$LAYER_ID/visibility" \
  -H "Content-Type: application/json" \
  -d '{"visible": false}'

# اختبار 2: تحقق من الحفظ
echo "✅ تحقق من الحفظ في القرص..."
cat "temp-uploads/processed/$LAYER_ID/layer-state.json" | jq '.visible'

# اختبار 3: إعادة تشغيل الخادم
echo "🔄 إعادة تشغيل الخادم..."
pkill -f "node.*5000" && npm run dev &
sleep 10

# اختبار 4: تحقق من الاسترداد
echo "🔍 تحقق من استرداد الحالة..."
curl -s "http://localhost:5000/api/gis/debug/layers" | jq ".layers[] | select(.id==\"$LAYER_ID\") | .visible"

echo "✅ اختبار مكتمل"
```

2. **إصلاح أي مشاكل متبقية**
- تنظيف رسائل الأخطاء
- تحسين أداء التحميل
- تحديث التوثيق

**معيار القبول**: جميع الاختبارات تمر بنجاح

---

## 📊 معايير القبول الشاملة

### ✅ يجب أن تعمل هذه السيناريوهات:

1. **سيناريو الرؤية الأساسي:**
   - فتح التطبيق → رؤية طبقة معروضة
   - إخفاء الطبقة → تختفي فوراً
   - إعادة تحميل الصفحة → تبقى مخفية
   - إعادة تشغيل الخادم → تبقى مخفية

2. **سيناريو الاستقرار:**
   - رفع ملف جديد → معالجة → metadata موحد
   - إعادة تشغيل الخادم → جميع الطبقات تُسترد بحالاتها
   - لا أخطاء في console الخادم

3. **سيناريو الأداء:**
   - تغيير رؤية طبقة < 100ms
   - استرداد 32+ طبقة عند البدء < 5 ثواني
   - لا تجمد في UI أثناء العمليات

---

## 🚀 ملفات التنفيذ المطلوبة

### ملفات للتحديث:
1. `server/lib/zip-processor.py` - إضافة metadata موحد
2. `server/lib/enhanced-geotiff-processor.py` - إضافة metadata موحد  
3. `server/routes/enhanced-upload.ts` - finalizeLayerState + hydrateLayersFromDisk
4. `server/routes/layer-visibility.ts` - جديد
5. `client/src/utils/layer-state.ts` - جديد
6. `client/src/components/AdvancedLayersPanel.tsx` - optimistic UI
7. `client/src/components/CleanLeafletMap.tsx` - دعم حالة الرؤية

### ملفات للإنشاء:
1. `layer-state.json` - لكل طبقة في مجلد المعالجة
2. `tests/e2e-visibility.sh` - اختبارات E2E
3. `PHASE_0_COMPLETION_REPORT.md` - تقرير الإنجاز

---

## 📈 النتائج المتوقعة بعد أسبوع

### ✅ سيكون لدينا:
- نظام مستقر مع 0 أخطاء استرداد
- persistence كامل لتفضيلات المستخدم
- metadata موحد لجميع الطبقات
- أساس قوي للمراحل القادمة

### 📊 مقاييس النجاح:
- **استقرار**: 0 أخطاء في console الخادم
- **سرعة**: تغيير الرؤية < 100ms
- **persistence**: 100% من التفضيلات تُحفظ
- **دقة**: جميع الطبقات تُعرض في مواقعها الصحيحة

---

## 🎯 الخطوة التالية بعد Phase 0

بمجرد إنجاز Phase 0، سنكون جاهزين للانتقال إلى **Phase 1: Processing Pipeline** مع:
- نظام queue (Celery + Redis)
- معالجة غير متزامنة
- job status tracking
- نظام إعادة المحاولة

**هل تريد البدء فوراً في Phase 0؟**