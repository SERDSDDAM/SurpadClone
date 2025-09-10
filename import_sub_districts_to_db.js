// 🏡 استيراد بيانات العزل إلى قاعدة البيانات

import fs from 'fs';
import pkg from 'pg';
const { Client } = pkg;

console.log('🚀 بدء استيراد بيانات العزل إلى قاعدة البيانات...');

const client = new Client({
  connectionString: process.env.DATABASE_URL
});

async function importSubDistricts() {
  try {
    await client.connect();
    console.log('✅ تم الاتصال بقاعدة البيانات');

    // قراءة بيانات العزل المعالجة
    const subDistrictsData = JSON.parse(fs.readFileSync('processed_sub_districts_data.json', 'utf8'));
    
    console.log(`📊 استيراد ${subDistrictsData.subDistricts.length} عزلة...`);

    let importedCount = 0;
    let skippedCount = 0;
    const batchSize = 50;
    
    // معالجة البيانات على دفعات
    for (let i = 0; i < subDistrictsData.subDistricts.length; i += batchSize) {
      const batch = subDistrictsData.subDistricts.slice(i, i + batchSize);
      
      console.log(`📦 معالجة الدفعة ${Math.floor(i/batchSize) + 1} (${batch.length} عزلة)...`);
      
      for (const subDistrict of batch) {
        try {
          // البحث عن المديرية المرتبطة
          const districtResult = await client.query('SELECT id FROM districts WHERE code = $1', [subDistrict.districtCode]);
          
          if (districtResult.rows.length === 0) {
            skippedCount++;
            if (skippedCount <= 5) {
              console.warn(`⚠️ لم يتم العثور على مديرية: ${subDistrict.districtCode} للعزلة ${subDistrict.code}`);
            }
            continue;
          }
          
          const result = await client.query(`
            INSERT INTO sub_districts (
              code, district_id, name_ar, name_en, 
              coordinates_lng, coordinates_lat, geometry, bounds
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            ON CONFLICT (code) DO UPDATE SET 
              name_ar = EXCLUDED.name_ar,
              name_en = EXCLUDED.name_en,
              coordinates_lng = EXCLUDED.coordinates_lng,
              coordinates_lat = EXCLUDED.coordinates_lat,
              geometry = EXCLUDED.geometry,
              bounds = EXCLUDED.bounds,
              updated_at = NOW()
            RETURNING id, code, name_ar
          `, [
            subDistrict.code,
            districtResult.rows[0].id,
            subDistrict.nameAr,
            subDistrict.nameEn,
            subDistrict.coordinates.lng,
            subDistrict.coordinates.lat,
            JSON.stringify(subDistrict.geometry),
            subDistrict.bounds
          ]);
          
          if (result.rows.length > 0) {
            importedCount++;
            
            // طباعة أول 10 عزل فقط
            if (importedCount <= 10) {
              console.log(`   ✅ ${result.rows[0].name_ar} (${result.rows[0].code})`);
            }
          }
          
        } catch (error) {
          console.error(`❌ خطأ في استيراد العزلة ${subDistrict.code}:`, error.message);
          skippedCount++;
        }
      }
      
      // تقرير تقدم كل دفعة
      console.log(`   📈 تم استيراد ${importedCount} عزلة، تم تخطي ${skippedCount}`);
    }
    
    console.log(`\n🏡 اكتمل استيراد العزل:`);
    console.log(`   - تم الاستيراد: ${importedCount} عزلة`);
    console.log(`   - تم التخطي: ${skippedCount} عزلة`);
    console.log(`   - النسبة: ${Math.round((importedCount / subDistrictsData.subDistricts.length) * 100)}%`);

  } catch (error) {
    console.error('❌ خطأ في استيراد العزل:', error.message);
    throw error;
  } finally {
    await client.end();
  }
}

importSubDistricts().catch(console.error);