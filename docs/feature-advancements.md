---
title: "تطبيق المساح — الميزات المتقدمة الجديدة"
source: attached_assets/تطبيق المساح - الميزات المتقدمة الجديدة_1755984166364.md
date: 2024-01-01
author: غير محدد (مُستخرج من المرفق)
---

هذا الملف هو نسخة منظمة من الملاحظات والميزات الواردة في المستند المرفق "تطبيق المساح - الميزات المتقدمة الجديدة".

الملف يغطي:
- متطلبات التطبيق (React Native / Web)
- قدرات GNSS المتقدمة، وضعيات التقاط النقاط، آليات التوجيه الميداني، وأدوات الرسم والتحرير (Snapping, Guided Survey, Feature Coding)
- إدارة الـ offline maps، تخزين الحزم، وتحميل البلاطات
- أمثلة تعليمية على إعداد Bluetooth GNSS وربطه بالتطبيق
- أمثلة كود إعدادات (BluetoothConfig, ARConfig, OfflineMapsConfig)

السجل الكامل للمحتوى الأصلي تم نقله إلى هنا مع رؤوس توضيحية لكل قسم لسهولة القراءة والبحث داخل المستودع.

مقاطع عملية (مقتطفات):

- مثال BluetoothConfig

```javascript
export const BluetoothConfig = {
  scanDuration: 10000, // مدة المسح بالملي ثانية
  connectionTimeout: 30000, // مهلة الاتصال
  supportedDevices: [
    'GNSS_RECEIVER',
    'LASER_DISTANCE_METER',
    'TOTAL_STATION'
  ],
  autoReconnect: true
};
```

- إعدادات AR (مختصر)

```javascript
export const ARConfig = {
  trackingMode: 'WORLD_TRACKING',
  planeDetection: 'HORIZONTAL',
  lightEstimation: true,
  maxAnchors: 50,
  renderDistance: 100 // متر
};
```

- إعدادات الخرائط بدون اتصال

```javascript
export const OfflineMapsConfig = {
  tileProviders: {
    osm: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    satellite: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
  },
  maxZoomLevel: 18,
  minZoomLevel: 1,
  concurrentDownloads: 3,
  retryAttempts: 3
};
```

كما يحتوي الملف على شرح لطريقة بناء الحزم الميدانية، متطلبات الأذونات على Android/iOS، ونماذج لنتائج الاختبار والأداء.
