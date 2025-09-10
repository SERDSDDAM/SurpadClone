// 🏡 إكمال استيراد العزل المتبقية بطريقة محسّنة

import fs from 'fs';
import pkg from 'pg';
const { Client } = pkg;

console.log('🚀 إكمال استيراد العزل المتبقية...');

const client = new Client({
  connectionString: process.env.DATABASE_URL
});

async function completeSubDistrictsImport() {
  try {
    await client.connect();
    console.log('✅ تم الاتصال بقاعدة البيانات');

    // قراءة بيانات العزل المعالجة
    const subDistrictsData = JSON.parse(fs.readFileSync('processed_sub_districts_data.json', 'utf8'));
    
    // التحقق من العزل المستوردة بالفعل
    const existingResult = await client.query('SELECT code FROM sub_districts');
    const existingCodes = new Set(existingResult.rows.map(row => row.code));
    
    console.log(`📊 العزل الموجودة: ${existingCodes.size}`);
    console.log(`📊 إجمالي العزل: ${subDistrictsData.subDistricts.length}`);
    
    // فلترة العزل المتبقية فقط
    const remainingSubDistricts = subDistrictsData.subDistricts.filter(
      subDistrict => !existingCodes.has(subDistrict.code)
    );
    
    console.log(`📦 العزل المتبقية للاستيراد: ${remainingSubDistricts.length}`);
    
    if (remainingSubDistricts.length === 0) {
      console.log('🎉 جميع العزل مستوردة بالفعل!');
      return;
    }

    let importedCount = 0;
    let skippedCount = 0;
    const batchSize = 100; // دفعات أكبر لتسريع العملية
    
    // معالجة البيانات على دفعات
    for (let i = 0; i < remainingSubDistricts.length; i += batchSize) {
      const batch = remainingSubDistricts.slice(i, i + batchSize);
      
      console.log(`📦 معالجة الدفعة ${Math.floor(i/batchSize) + 1}/${Math.ceil(remainingSubDistricts.length/batchSize)} (${batch.length} عزلة)...`);
      
      // استخدام transaction لتسريع العملية
      await client.query('BEGIN');
      
      try {
        for (const subDistrict of batch) {
          // البحث عن المديرية المرتبطة
          const districtResult = await client.query('SELECT id FROM districts WHERE code = $1', [subDistrict.districtCode]);
          
          if (districtResult.rows.length === 0) {
            skippedCount++;
            continue;
          }
          
          await client.query(`
            INSERT INTO sub_districts (
              code, district_id, name_ar, name_en, 
              coordinates_lng, coordinates_lat, geometry, bounds
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
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
          
          importedCount++;
        }
        
        await client.query('COMMIT');
        console.log(`   ✅ تم استيراد ${importedCount} عزلة، تم تخطي ${skippedCount}`);
        
        // تحديث تقدم كل 5 دفعات
        if ((Math.floor(i/batchSize) + 1) % 5 === 0) {
          const progress = Math.round((importedCount / remainingSubDistricts.length) * 100);
          console.log(`📈 التقدم: ${progress}% (${importedCount}/${remainingSubDistricts.length})`);
        }
        
      } catch (error) {
        await client.query('ROLLBACK');
        console.error(`❌ خطأ في الدفعة ${Math.floor(i/batchSize) + 1}:`, error.message);
        skippedCount += batch.length;
      }
    }
    
    // إحصائيات نهائية
    const finalCountResult = await client.query('SELECT COUNT(*) as count FROM sub_districts');
    const finalCount = parseInt(finalCountResult.rows[0].count);
    
    console.log(`\n🏡 اكتمل استيراد العزل:`);
    console.log(`   - تم الاستيراد في هذه الجلسة: ${importedCount} عزلة`);
    console.log(`   - تم التخطي: ${skippedCount} عزلة`);
    console.log(`   - إجمالي العزل في قاعدة البيانات: ${finalCount} عزلة`);
    console.log(`   - النسبة الإجمالية: ${Math.round((finalCount / subDistrictsData.subDistricts.length) * 100)}%`);
    
    if (finalCount === subDistrictsData.subDistricts.length) {
      console.log(`🎉 تم استيراد جميع العزل بنجاح!`);
    } else {
      console.log(`⚠️ متبقي ${subDistrictsData.subDistricts.length - finalCount} عزلة`);
    }

  } catch (error) {
    console.error('❌ خطأ في استيراد العزل:', error.message);
    throw error;
  } finally {
    await client.end();
  }
}

completeSubDistrictsImport().catch(console.error);