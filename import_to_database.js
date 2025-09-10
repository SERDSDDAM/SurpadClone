// 🏛️ استيراد البيانات الجغرافية اليمنية إلى قاعدة البيانات

import fs from 'fs';
import pkg from 'pg';
const { Client } = pkg;

console.log('🚀 بدء استيراد البيانات الجغرافية إلى قاعدة البيانات...');

// الاتصال بقاعدة البيانات
const client = new Client({
  connectionString: process.env.DATABASE_URL
});

async function importGeographicData() {
  try {
    await client.connect();
    console.log('✅ تم الاتصال بقاعدة البيانات');

    // قراءة بيانات المديريات
    console.log('📂 قراءة بيانات المديريات...');
    const districtsData = JSON.parse(fs.readFileSync('processed_districts_data.json', 'utf8'));
    
    // قراءة بيانات العزل
    console.log('📂 قراءة بيانات العزل...');
    const subDistrictsData = JSON.parse(fs.readFileSync('processed_sub_districts_data.json', 'utf8'));

    console.log(`📊 إحصائيات:`);
    console.log(`   - المديريات: ${districtsData.districts.length}`);
    console.log(`   - العزل: ${subDistrictsData.subDistricts.length}`);
    console.log(`   - المحافظات (مديريات): ${districtsData.governorates.length}`);
    console.log(`   - المحافظات (عزل): ${subDistrictsData.governorates.length}`);

    // إنشاء قائمة موحدة للمحافظات
    const allGovernorates = new Map();
    
    // جمع المحافظات من كلا المصدرين
    districtsData.governorates.forEach(gov => {
      allGovernorates.set(gov.code, {
        code: gov.code,
        districtsCount: gov.districtsCount,
        subDistrictsCount: 0
      });
    });
    
    subDistrictsData.governorates.forEach(gov => {
      if (allGovernorates.has(gov.code)) {
        allGovernorates.get(gov.code).subDistrictsCount = gov.subDistrictsCount;
      } else {
        allGovernorates.set(gov.code, {
          code: gov.code,
          districtsCount: 0,
          subDistrictsCount: gov.subDistrictsCount
        });
      }
    });

    console.log('\n🏛️ استيراد المحافظات...');
    
    // أسماء المحافظات اليمنية الحقيقية
    const governorateNames = {
      'YE11': { ar: 'عدن', en: 'Aden', capital_ar: 'عدن', capital_en: 'Aden' },
      'YE12': { ar: 'البيضاء', en: 'Al Bayda', capital_ar: 'البيضاء', capital_en: 'Al Bayda' },
      'YE13': { ar: 'الحديدة', en: 'Al Hudaydah', capital_ar: 'الحديدة', capital_en: 'Al Hudaydah' },
      'YE14': { ar: 'الجوف', en: 'Al Jawf', capital_ar: 'الحزم', capital_en: 'Al Hazm' },
      'YE15': { ar: 'المهرة', en: 'Al Mahrah', capital_ar: 'الغيضة', capital_en: 'Al Ghaydah' },
      'YE16': { ar: 'المحويت', en: 'Al Mahwit', capital_ar: 'المحويت', capital_en: 'Al Mahwit' },
      'YE17': { ar: 'عمران', en: 'Amran', capital_ar: 'عمران', capital_en: 'Amran' },
      'YE18': { ar: 'الضالع', en: 'Ad Dali', capital_ar: 'الضالع', capital_en: 'Ad Dali' },
      'YE19': { ar: 'ذمار', en: 'Dhamar', capital_ar: 'ذمار', capital_en: 'Dhamar' },
      'YE20': { ar: 'حضرموت', en: 'Hadramawt', capital_ar: 'المكلا', capital_en: 'Al Mukalla' },
      'YE21': { ar: 'حجة', en: 'Hajjah', capital_ar: 'حجة', capital_en: 'Hajjah' },
      'YE22': { ar: 'إب', en: 'Ibb', capital_ar: 'إب', capital_en: 'Ibb' },
      'YE23': { ar: 'لحج', en: 'Lahij', capital_ar: 'الحوطة', capital_en: 'Al Houta' },
      'YE24': { ar: 'مأرب', en: 'Marib', capital_ar: 'مأرب', capital_en: 'Marib' },
      'YE25': { ar: 'ريمة', en: 'Raymah', capital_ar: 'الجبين', capital_en: 'Al Jabin' },
      'YE26': { ar: 'صعدة', en: 'Saada', capital_ar: 'صعدة', capital_en: 'Saada' },
      'YE27': { ar: 'صنعاء', en: 'Sanaa', capital_ar: 'صنعاء', capital_en: 'Sanaa' },
      'YE28': { ar: 'شبوة', en: 'Shabwah', capital_ar: 'عتق', capital_en: 'Ataq' },
      'YE29': { ar: 'سقطرى', en: 'Socotra', capital_ar: 'حديبو', capital_en: 'Hadibo' },
      'YE30': { ar: 'تعز', en: 'Taizz', capital_ar: 'تعز', capital_en: 'Taizz' },
      'YE31': { ar: 'أبين', en: 'Abyan', capital_ar: 'زنجبار', capital_en: 'Zinjibar' }
    };

    // استيراد المحافظات
    let governoratesImported = 0;
    for (const [code, data] of allGovernorates) {
      const govInfo = governorateNames[code] || { 
        ar: `محافظة ${code}`, 
        en: `Governorate ${code}`, 
        capital_ar: 'غير محدد',
        capital_en: 'Not specified'
      };
      
      const result = await client.query(`
        INSERT INTO governorates (code, name_ar, name_en, capital_ar, capital_en, population)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (code) DO UPDATE SET 
          name_ar = EXCLUDED.name_ar,
          name_en = EXCLUDED.name_en,
          updated_at = NOW()
        RETURNING id, code, name_ar
      `, [code, govInfo.ar, govInfo.en, govInfo.capital_ar, govInfo.capital_en, (data.districtsCount + data.subDistrictsCount) * 15000]);
      
      if (result.rows.length > 0) {
        governoratesImported++;
        console.log(`   ✅ ${result.rows[0].name_ar} (${result.rows[0].code})`);
      }
    }
    
    console.log(`🏛️ تم استيراد ${governoratesImported} محافظة`);

    // استيراد المديريات
    console.log('\n🏘️ استيراد المديريات...');
    let districtsImported = 0;
    
    for (const district of districtsData.districts) {
      // البحث عن المحافظة المرتبطة
      const governorateResult = await client.query('SELECT id FROM governorates WHERE code = $1', [district.governorateCode]);
      
      if (governorateResult.rows.length === 0) {
        console.warn(`⚠️ لم يتم العثور على محافظة: ${district.governorateCode} للمديرية ${district.code}`);
        continue;
      }
      
      const result = await client.query(`
        INSERT INTO districts (code, governorate_id, name_ar, name_en, district_type, area_km2, geometry, bounds)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (code) DO UPDATE SET 
          name_ar = EXCLUDED.name_ar,
          name_en = EXCLUDED.name_en,
          area_km2 = EXCLUDED.area_km2,
          geometry = EXCLUDED.geometry,
          bounds = EXCLUDED.bounds,
          updated_at = NOW()
        RETURNING id, code, name_ar
      `, [
        district.code,
        governorateResult.rows[0].id,
        district.nameAr,
        district.nameEn,
        'مديرية',
        district.area,
        JSON.stringify(district.geometry),
        district.bounds
      ]);
      
      if (result.rows.length > 0) {
        districtsImported++;
        if (districtsImported <= 10) {
          console.log(`   ✅ ${result.rows[0].name_ar} (${result.rows[0].code})`);
        }
      }
    }
    
    console.log(`🏘️ تم استيراد ${districtsImported} مديرية`);

    console.log('\n✅ اكتمل استيراد البيانات الأساسية بنجاح!');
    console.log('📊 الخطوة التالية: استيراد العزل...');

  } catch (error) {
    console.error('❌ خطأ في استيراد البيانات:', error.message);
    throw error;
  } finally {
    await client.end();
  }
}

importGeographicData().catch(console.error);