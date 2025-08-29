/**
 * Layer State Manager - Phase 0 Visibility Persistence
 * نظام إدارة حالة الطبقات مع الحفظ المستمر
 */

import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';

// نوع بيانات حالة الطبقة
interface LayerVisibilityState {
  visible: boolean;
  opacity: number;
  zIndex: number;
  lastUpdated: string;
}

// نوع ملف layer-state.json العالمي
interface GlobalLayerStates {
  layers: Record<string, LayerVisibilityState>;
  lastModified: string;
  version: string;
}

const LAYER_STATE_FILE = 'temp-uploads/processed/layer-state.json';
const DEFAULT_OPACITY = 1.0;
const DEFAULT_Z_INDEX = 1000;

/**
 * قراءة حالة الطبقات العالمية من layer-state.json
 */
export async function loadGlobalLayerStates(): Promise<GlobalLayerStates> {
  try {
    // التأكد من وجود المجلد
    await fs.mkdir(path.dirname(LAYER_STATE_FILE), { recursive: true });
    
    // التحقق من وجود الملف
    if (!fsSync.existsSync(LAYER_STATE_FILE)) {
      // إنشاء ملف جديد
      const defaultState: GlobalLayerStates = {
        layers: {},
        lastModified: new Date().toISOString(),
        version: "1.0.0"
      };
      await saveGlobalLayerStates(defaultState);
      return defaultState;
    }

    const rawData = await fs.readFile(LAYER_STATE_FILE, 'utf8');
    const states = JSON.parse(rawData) as GlobalLayerStates;
    
    // التحقق من صحة الهيكل
    if (!states.layers || typeof states.layers !== 'object') {
      throw new Error('Invalid layer states structure');
    }

    return states;
  } catch (error) {
    console.error('❌ خطأ في قراءة حالة الطبقات:', error);
    // إرجاع حالة افتراضية في حالة الخطأ
    return {
      layers: {},
      lastModified: new Date().toISOString(),
      version: "1.0.0"
    };
  }
}

/**
 * حفظ حالة الطبقات العالمية إلى layer-state.json
 */
export async function saveGlobalLayerStates(states: GlobalLayerStates): Promise<void> {
  try {
    // التأكد من وجود المجلد
    await fs.mkdir(path.dirname(LAYER_STATE_FILE), { recursive: true });
    
    // تحديث وقت التعديل
    states.lastModified = new Date().toISOString();
    
    // حفظ الملف مع تنسيق جميل
    await fs.writeFile(
      LAYER_STATE_FILE, 
      JSON.stringify(states, null, 2), 
      'utf8'
    );
    
    console.log(`✅ تم حفظ حالة ${Object.keys(states.layers).length} طبقة`);
  } catch (error) {
    console.error('❌ خطأ في حفظ حالة الطبقات:', error);
    throw error;
  }
}

/**
 * تحديث حالة طبقة واحدة
 */
export async function updateLayerVisibilityState(
  layerId: string, 
  updates: Partial<LayerVisibilityState>
): Promise<void> {
  try {
    const states = await loadGlobalLayerStates();
    
    // الحصول على الحالة الحالية أو إنشاء جديدة
    const currentState = states.layers[layerId] || {
      visible: true,
      opacity: DEFAULT_OPACITY,
      zIndex: DEFAULT_Z_INDEX,
      lastUpdated: new Date().toISOString()
    };
    
    // تطبيق التحديثات
    const updatedState: LayerVisibilityState = {
      ...currentState,
      ...updates,
      lastUpdated: new Date().toISOString()
    };
    
    // حفظ الحالة الجديدة
    states.layers[layerId] = updatedState;
    await saveGlobalLayerStates(states);
    
    console.log(`✅ تم تحديث حالة الطبقة ${layerId}:`, updatedState);
  } catch (error) {
    console.error(`❌ خطأ في تحديث حالة الطبقة ${layerId}:`, error);
    throw error;
  }
}

/**
 * الحصول على حالة طبقة محددة
 */
export async function getLayerVisibilityState(layerId: string): Promise<LayerVisibilityState | null> {
  try {
    const states = await loadGlobalLayerStates();
    return states.layers[layerId] || null;
  } catch (error) {
    console.error(`❌ خطأ في قراءة حالة الطبقة ${layerId}:`, error);
    return null;
  }
}

/**
 * حذف طبقة من حالة الرؤية
 */
export async function removeLayerVisibilityState(layerId: string): Promise<void> {
  try {
    const states = await loadGlobalLayerStates();
    
    if (states.layers[layerId]) {
      delete states.layers[layerId];
      await saveGlobalLayerStates(states);
      console.log(`✅ تم حذف حالة الطبقة ${layerId}`);
    }
  } catch (error) {
    console.error(`❌ خطأ في حذف حالة الطبقة ${layerId}:`, error);
    throw error;
  }
}

/**
 * الحصول على جميع الطبقات المرئية
 */
export async function getVisibleLayers(): Promise<string[]> {
  try {
    const states = await loadGlobalLayerStates();
    return Object.entries(states.layers)
      .filter(([_, state]) => state.visible)
      .map(([layerId, _]) => layerId);
  } catch (error) {
    console.error('❌ خطأ في الحصول على الطبقات المرئية:', error);
    return [];
  }
}

/**
 * تصدير حالة جميع الطبقات (للنسخ الاحتياطي)
 */
export async function exportLayerStates(): Promise<GlobalLayerStates> {
  return await loadGlobalLayerStates();
}

/**
 * استيراد حالة الطبقات (من النسخ الاحتياطي)
 */
export async function importLayerStates(states: GlobalLayerStates): Promise<void> {
  await saveGlobalLayerStates(states);
}

/**
 * تنظيف حالات الطبقات المحذوفة
 */
export async function cleanupOrphanedStates(validLayerIds: string[]): Promise<void> {
  try {
    const states = await loadGlobalLayerStates();
    let cleanupCount = 0;
    
    // إزالة الحالات للطبقات غير الموجودة
    for (const layerId of Object.keys(states.layers)) {
      if (!validLayerIds.includes(layerId)) {
        delete states.layers[layerId];
        cleanupCount++;
      }
    }
    
    if (cleanupCount > 0) {
      await saveGlobalLayerStates(states);
      console.log(`✅ تم تنظيف ${cleanupCount} حالة طبقة محذوفة`);
    }
  } catch (error) {
    console.error('❌ خطأ في تنظيف حالات الطبقات:', error);
  }
}