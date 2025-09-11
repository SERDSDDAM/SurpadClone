import { db } from '../db';
import { featureCodes } from '../../shared/survey-schema';

const defaultFeatureCodes = [
  // Point Features
  { code: 'CORNER', nameAr: 'ركن مبنى', nameEn: 'Building Corner', category: 'point', description: 'ركن مبنى سكني أو تجاري' },
  { code: 'TREE', nameAr: 'شجرة', nameEn: 'Tree', category: 'point', description: 'شجرة طبيعية' },
  { code: 'LIGHT_POLE', nameAr: 'عمود إنارة', nameEn: 'Light Pole', category: 'point', description: 'عمود إنارة عامة' },
  { code: 'WATER_POINT', nameAr: 'نقطة مياه', nameEn: 'Water Point', category: 'point', description: 'نقطة مياه أو صنبور' },
  { code: 'BOUNDARY_STONE', nameAr: 'حجر حدود', nameEn: 'Boundary Stone', category: 'point', description: 'حجر تحديد حدود' },
  { code: 'WELL', nameAr: 'بئر', nameEn: 'Well', category: 'point', description: 'بئر مياه' },
  { code: 'ELECTRIC_POLE', nameAr: 'عمود كهرباء', nameEn: 'Electric Pole', category: 'point', description: 'عمود كهرباء' },

  // Line Features
  { code: 'FENCE', nameAr: 'سور', nameEn: 'Fence', category: 'line', description: 'سور حدود العقار' },
  { code: 'SIDEWALK', nameAr: 'رصيف', nameEn: 'Sidewalk', category: 'line', description: 'رصيف مشاة' },
  { code: 'BUILDING_EDGE', nameAr: 'ضلع مبنى', nameEn: 'Building Edge', category: 'line', description: 'حافة مبنى' },
  { code: 'POWER_LINE', nameAr: 'خط كهرباء', nameEn: 'Power Line', category: 'line', description: 'خط كهرباء علوي' },
  { code: 'ROAD_EDGE', nameAr: 'حافة طريق', nameEn: 'Road Edge', category: 'line', description: 'حافة طريق' },
  { code: 'WALL', nameAr: 'جدار', nameEn: 'Wall', category: 'line', description: 'جدار خارجي' },
  { code: 'WATER_PIPE', nameAr: 'أنبوب مياه', nameEn: 'Water Pipe', category: 'line', description: 'خط أنابيب مياه' },

  // Polygon Features
  { code: 'BUILDING', nameAr: 'مبنى', nameEn: 'Building', category: 'polygon', description: 'مبنى سكني أو تجاري' },
  { code: 'GARDEN', nameAr: 'حديقة', nameEn: 'Garden', category: 'polygon', description: 'مساحة خضراء' },
  { code: 'PARKING', nameAr: 'موقف سيارات', nameEn: 'Parking', category: 'polygon', description: 'منطقة وقوف سيارات' },
  { code: 'COURTYARD', nameAr: 'فناء', nameEn: 'Courtyard', category: 'polygon', description: 'فناء داخلي' },
  { code: 'WATER_TANK', nameAr: 'خزان مياه', nameEn: 'Water Tank', category: 'polygon', description: 'خزان مياه علوي أو أرضي' },
  { code: 'PLOT', nameAr: 'قطعة أرض', nameEn: 'Land Plot', category: 'polygon', description: 'قطعة أرض فضاء' },
  { code: 'POOL', nameAr: 'حمام سباحة', nameEn: 'Swimming Pool', category: 'polygon', description: 'حمام سباحة' },
  { code: 'AGRICULTURAL', nameAr: 'أرض زراعية', nameEn: 'Agricultural Land', category: 'polygon', description: 'أرض زراعية' }
];

export async function seedFeatureCodes() {
  try {
    console.log('🌱 Seeding feature codes...');
    
    for (const code of defaultFeatureCodes) {
      await db.insert(featureCodes)
        .values(code)
        .onConflictDoNothing();
    }
    
    console.log(`✅ Successfully seeded ${defaultFeatureCodes.length} feature codes`);
  } catch (error) {
    console.error('❌ Error seeding feature codes:', error);
    throw error;
  }
}