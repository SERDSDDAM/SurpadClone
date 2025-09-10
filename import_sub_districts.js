// 🏡 أداة استيراد البيانات الجغرافية للعزل اليمنية
// استيراد مباشر من ملف GeoJSON المرفق

import fs from 'fs';
import path from 'path';

console.log('🚀 بدء استيراد بيانات العزل اليمنية...');

// قراءة ملف العزل
const subDistrictsFile = 'attached_assets/azal_1757518247339.geojson';

if (!fs.existsSync(subDistrictsFile)) {
  console.error('❌ لم يتم العثور على ملف العزل:', subDistrictsFile);
  process.exit(1);
}

console.log('📂 قراءة ملف العزل:', subDistrictsFile);

try {
  const fileContent = fs.readFileSync(subDistrictsFile, 'utf8');
  const geoJsonData = JSON.parse(fileContent);
  
  if (geoJsonData.type !== 'FeatureCollection' || !Array.isArray(geoJsonData.features)) {
    console.error('❌ تنسيق GeoJSON غير صحيح');
    process.exit(1);
  }
  
  console.log(`📊 عدد العزل في الملف: ${geoJsonData.features.length}`);
  
  // تحليل البيانات
  console.log('\n📋 تحليل البيانات:');
  
  const governoratesMap = new Map();
  const districtsMap = new Map();
  const sampleData = [];
  
  geoJsonData.features.slice(0, 20).forEach((feature, index) => {
    const props = feature.properties;
    
    // جمع بيانات المحافظات
    if (props.admin1Pcod && !governoratesMap.has(props.admin1Pcod)) {
      governoratesMap.set(props.admin1Pcod, {
        code: props.admin1Pcod,
        count: 0
      });
    }
    
    // جمع بيانات المديريات
    if (props.admin2Pcod && !districtsMap.has(props.admin2Pcod)) {
      districtsMap.set(props.admin2Pcod, {
        code: props.admin2Pcod,
        governorateCode: props.admin1Pcod,
        count: 0
      });
    }
    
    if (props.admin1Pcod) {
      governoratesMap.get(props.admin1Pcod).count++;
    }
    
    if (props.admin2Pcod) {
      districtsMap.get(props.admin2Pcod).count++;
    }
    
    // عينة من البيانات
    if (index < 8) {
      sampleData.push({
        subDistrictCode: props.admin3Pcod,
        subDistrictNameAr: props.admin3Na_1 || props.admin3Name,
        subDistrictNameEn: props.admin3Name,
        districtCode: props.admin2Pcod,
        governorateCode: props.admin1Pcod,
        hasGeometry: feature.geometry ? true : false,
        geometryType: feature.geometry?.type,
        lng: props.lang,
        lat: props.lat
      });
    }
  });
  
  console.log(`\n🏛️ المحافظات المكتشفة: ${governoratesMap.size}`);
  console.log('📋 قائمة المحافظات:');
  
  Array.from(governoratesMap.entries())
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 10)
    .forEach(([code, data]) => {
      console.log(`   ${code}: ${data.count} عزلة`);
    });
  
  console.log(`\n🏘️ المديريات المكتشفة: ${districtsMap.size}`);
  console.log('📋 أهم المديريات (حسب عدد العزل):');
  
  Array.from(districtsMap.entries())
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 10)
    .forEach(([code, data]) => {
      console.log(`   ${code} (${data.governorateCode}): ${data.count} عزلة`);
    });
  
  console.log('\n📝 عينة من بيانات العزل (أول 8):');
  sampleData.forEach((subDistrict, index) => {
    console.log(`${index + 1}. ${subDistrict.subDistrictNameAr} (${subDistrict.subDistrictCode})`);
    console.log(`   المديرية: ${subDistrict.districtCode}`);
    console.log(`   المحافظة: ${subDistrict.governorateCode}`);
    console.log(`   الاسم الإنجليزي: ${subDistrict.subDistrictNameEn}`);
    console.log(`   هندسة جغرافية: ${subDistrict.hasGeometry ? '✅' : '❌'} (${subDistrict.geometryType || 'غير محدد'})`);
    console.log(`   الإحداثيات: ${subDistrict.lng}, ${subDistrict.lat}`);
    console.log('');
  });
  
  // إحصائيات عامة
  const featuresWithGeometry = geoJsonData.features.filter(f => f.geometry).length;
  const featuresWithoutGeometry = geoJsonData.features.length - featuresWithGeometry;
  
  // تحليل الربط بين العزل والمديريات
  const districtSubDistrictRelation = {};
  geoJsonData.features.forEach(feature => {
    const props = feature.properties;
    if (props.admin2Pcod && props.admin3Pcod) {
      if (!districtSubDistrictRelation[props.admin2Pcod]) {
        districtSubDistrictRelation[props.admin2Pcod] = [];
      }
      districtSubDistrictRelation[props.admin2Pcod].push({
        code: props.admin3Pcod,
        nameAr: props.admin3Na_1 || props.admin3Name,
        nameEn: props.admin3Name
      });
    }
  });
  
  console.log('📊 إحصائيات عامة:');
  console.log(`   - إجمالي العزل: ${geoJsonData.features.length}`);
  console.log(`   - عزل بهندسة جغرافية: ${featuresWithGeometry}`);
  console.log(`   - عزل بدون هندسة جغرافية: ${featuresWithoutGeometry}`);
  console.log(`   - المحافظات المكتشفة: ${governoratesMap.size}`);
  console.log(`   - المديريات المكتشفة: ${districtsMap.size}`);
  console.log(`   - علاقات الربط: ${Object.keys(districtSubDistrictRelation).length} مديرية مرتبطة`);
  
  // حفظ البيانات المعالجة
  const processedData = {
    type: 'ProcessedSubDistrictsGeoData',
    source: 'azal_1757518247339.geojson',
    processedAt: new Date().toISOString(),
    statistics: {
      totalSubDistricts: geoJsonData.features.length,
      subDistrictsWithGeometry: featuresWithGeometry,
      subDistrictsWithoutGeometry: featuresWithoutGeometry,
      governoratesCount: governoratesMap.size,
      districtsCount: districtsMap.size,
      connectedDistricts: Object.keys(districtSubDistrictRelation).length
    },
    governorates: Array.from(governoratesMap.entries()).map(([code, data]) => ({
      code,
      subDistrictsCount: data.count
    })),
    districts: Array.from(districtsMap.entries()).map(([code, data]) => ({
      code,
      governorateCode: data.governorateCode,
      subDistrictsCount: data.count
    })),
    districtSubDistrictRelations: districtSubDistrictRelation,
    sampleSubDistricts: sampleData,
    subDistricts: geoJsonData.features.map(feature => ({
      code: feature.properties.admin3Pcod,
      nameAr: feature.properties.admin3Na_1 || feature.properties.admin3Name,
      nameEn: feature.properties.admin3Name,
      districtCode: feature.properties.admin2Pcod,
      governorateCode: feature.properties.admin1Pcod,
      coordinates: {
        lng: parseFloat(feature.properties.lang),
        lat: parseFloat(feature.properties.lat)
      },
      geometry: feature.geometry,
      bounds: calculateBounds(feature.geometry)
    }))
  };
  
  // حفظ البيانات المعالجة
  const outputFile = 'processed_sub_districts_data.json';
  fs.writeFileSync(outputFile, JSON.stringify(processedData, null, 2));
  console.log(`\n💾 تم حفظ البيانات المعالجة في: ${outputFile}`);
  
  console.log('\n✅ اكتمل تحليل بيانات العزل بنجاح!');
  
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