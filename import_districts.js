// 🏘️ أداة استيراد البيانات الجغرافية للمديريات اليمنية
// استيراد مباشر من ملف GeoJSON المرفق

import fs from 'fs';
import path from 'path';

console.log('🚀 بدء استيراد بيانات المديريات اليمنية...');

// قراءة ملف المديريات
const districtsFile = 'attached_assets/dis_1757518247340.geojson';

if (!fs.existsSync(districtsFile)) {
  console.error('❌ لم يتم العثور على ملف المديريات:', districtsFile);
  process.exit(1);
}

console.log('📂 قراءة ملف المديريات:', districtsFile);

try {
  const fileContent = fs.readFileSync(districtsFile, 'utf8');
  const geoJsonData = JSON.parse(fileContent);
  
  if (geoJsonData.type !== 'FeatureCollection' || !Array.isArray(geoJsonData.features)) {
    console.error('❌ تنسيق GeoJSON غير صحيح');
    process.exit(1);
  }
  
  console.log(`📊 عدد المديريات في الملف: ${geoJsonData.features.length}`);
  
  // تحليل البيانات
  console.log('\n📋 تحليل البيانات:');
  
  const governoratesMap = new Map();
  const sampleData = [];
  
  geoJsonData.features.slice(0, 10).forEach((feature, index) => {
    const props = feature.properties;
    
    // جمع بيانات المحافظات
    if (props.admin1Pcod && !governoratesMap.has(props.admin1Pcod)) {
      governoratesMap.set(props.admin1Pcod, {
        code: props.admin1Pcod,
        count: 0
      });
    }
    
    if (props.admin1Pcod) {
      governoratesMap.get(props.admin1Pcod).count++;
    }
    
    // عينة من البيانات
    if (index < 5) {
      sampleData.push({
        districtCode: props.admin2Pcod,
        districtNameAr: props.admin2Na_1 || props.admin2Name,
        districtNameEn: props.admin2Name,
        governorateCode: props.admin1Pcod,
        hasGeometry: feature.geometry ? true : false,
        geometryType: feature.geometry?.type
      });
    }
  });
  
  console.log(`\n🏛️ المحافظات المكتشفة: ${governoratesMap.size}`);
  console.log('📋 قائمة المحافظات:');
  
  Array.from(governoratesMap.entries())
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 10)
    .forEach(([code, data]) => {
      console.log(`   ${code}: ${data.count} مديرية`);
    });
  
  console.log('\n📝 عينة من بيانات المديريات (أول 5):');
  sampleData.forEach((district, index) => {
    console.log(`${index + 1}. ${district.districtNameAr} (${district.districtCode})`);
    console.log(`   المحافظة: ${district.governorateCode}`);
    console.log(`   الاسم الإنجليزي: ${district.districtNameEn}`);
    console.log(`   هندسة جغرافية: ${district.hasGeometry ? '✅' : '❌'} (${district.geometryType || 'غير محدد'})`);
    console.log('');
  });
  
  // إحصائيات عامة
  const featuresWithGeometry = geoJsonData.features.filter(f => f.geometry).length;
  const featuresWithoutGeometry = geoJsonData.features.length - featuresWithGeometry;
  
  console.log('📊 إحصائيات عامة:');
  console.log(`   - إجمالي المديريات: ${geoJsonData.features.length}`);
  console.log(`   - مديريات بهندسة جغرافية: ${featuresWithGeometry}`);
  console.log(`   - مديريات بدون هندسة جغرافية: ${featuresWithoutGeometry}`);
  console.log(`   - المحافظات المكتشفة: ${governoratesMap.size}`);
  
  // حفظ البيانات المعالجة
  const processedData = {
    type: 'ProcessedGeoData',
    source: 'dis_1757518247340.geojson',
    processedAt: new Date().toISOString(),
    statistics: {
      totalDistricts: geoJsonData.features.length,
      districtsWithGeometry: featuresWithGeometry,
      districtsWithoutGeometry: featuresWithoutGeometry,
      governoratesCount: governoratesMap.size
    },
    governorates: Array.from(governoratesMap.entries()).map(([code, data]) => ({
      code,
      districtsCount: data.count
    })),
    sampleDistricts: sampleData,
    districts: geoJsonData.features.map(feature => ({
      code: feature.properties.admin2Pcod,
      nameAr: feature.properties.admin2Na_1 || feature.properties.admin2Name,
      nameEn: feature.properties.admin2Name,
      governorateCode: feature.properties.admin1Pcod,
      geometry: feature.geometry,
      bounds: calculateBounds(feature.geometry)
    }))
  };
  
  // حفظ البيانات المعالجة
  const outputFile = 'processed_districts_data.json';
  fs.writeFileSync(outputFile, JSON.stringify(processedData, null, 2));
  console.log(`\n💾 تم حفظ البيانات المعالجة في: ${outputFile}`);
  
  console.log('\n✅ اكتمل تحليل بيانات المديريات بنجاح!');
  
} catch (error) {
  console.error('❌ خطأ في معالجة الملف:', error.message);
  process.exit(1);
}

// دالة حساب الحدود الجغرافية
function calculateBounds(geometry) {
  if (!geometry || !geometry.coordinates) return null;

  let minLng = Infinity, minLat = Infinity;
  let maxLng = -Infinity, maxLat = -Infinity;

  const processCoords = (coords) => {
    if (Array.isArray(coords[0])) {
      coords.forEach(processCoords);
    } else {
      const [lng, lat] = coords;
      minLng = Math.min(minLng, lng);
      maxLng = Math.max(maxLng, lng);
      minLat = Math.min(minLat, lat);
      maxLat = Math.max(maxLat, lat);
    }
  };

  processCoords(geometry.coordinates);
  return [minLng, minLat, maxLng, maxLat];
}