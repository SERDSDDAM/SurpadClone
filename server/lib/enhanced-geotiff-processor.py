#!/usr/bin/env python3
"""
معالج ملفات GeoTIFF المحسن
معالجة شاملة لملفات GeoTIFF مع دعم متقدم للإحداثيات والقص
"""

import sys
import os
import json
import numpy as np
import rasterio
from rasterio.warp import calculate_default_transform, reproject, Resampling, transform_bounds
from rasterio.crs import CRS
from rasterio import transform as rio_transform
from PIL import Image
import warnings
from pathlib import Path
from datetime import datetime

warnings.filterwarnings('ignore')

def process_geotiff(input_file, output_dir):
    """
    معالجة ملف GeoTIFF شامل
    """
    try:
        # التحقق من وجود الملف
        if not os.path.exists(input_file):
            return {
                "success": False,
                "error": f"الملف غير موجود: {input_file}"
            }
        
        # إنشاء مجلد الإخراج
        os.makedirs(output_dir, exist_ok=True)
        
        # فتح ملف GeoTIFF
        with rasterio.open(input_file) as src:
            print(f"📊 معالجة: {input_file}")
            print(f"📏 الأبعاد: {src.width}x{src.height}")
            print(f"🗺️ نظام الإحداثيات: {src.crs}")
            print(f"📍 الحدود: {src.bounds}")
            print(f"🎨 عدد النطاقات: {src.count}")
            
            # قراءة البيانات
            data = src.read()
            
            # التحقق من صحة البيانات
            if data.size == 0:
                return {
                    "success": False,
                    "error": "ملف فارغ أو تالف"
                }
            
            # تحويل إلى WGS84 إذا لزم الأمر
            dst_crs = CRS.from_epsg(4326)  # WGS84
            
            if src.crs and src.crs != dst_crs:
                print("🔄 تحويل نظام الإحداثيات إلى WGS84...")
                
                # حساب التحويل
                transform, width, height = calculate_default_transform(
                    src.crs, dst_crs, src.width, src.height, *src.bounds
                )
                
                # تحضير البيانات المحولة
                reprojected_data = np.zeros((src.count, height, width), dtype=src.dtypes[0])
                
                # تطبيق التحويل
                reproject(
                    source=data,
                    destination=reprojected_data,
                    src_transform=src.transform,
                    src_crs=src.crs,
                    dst_transform=transform,
                    dst_crs=dst_crs,
                    resampling=Resampling.bilinear
                )
                
                # تحديث المتغيرات
                data = reprojected_data
                new_bounds = rio_transform.array_bounds(height, width, transform)
                
                # حساب الحدود في WGS84
                final_bounds = transform_bounds(src.crs, dst_crs, *src.bounds)
                final_transform = transform
                final_crs = dst_crs
                
            else:
                # استخدام البيانات الأصلية
                transform = src.transform
                width, height = src.width, src.height
                new_bounds = src.bounds
                final_bounds = src.bounds
                final_transform = src.transform
                final_crs = src.crs if src.crs else dst_crs
            
            # تحويل البيانات إلى صورة PNG
            if data.ndim == 3 and data.shape[0] >= 3:
                # RGB image
                rgb_data = data[:3]  # أخذ أول 3 نطاقات
                
                # تطبيع البيانات
                for i in range(3):
                    band_data = rgb_data[i]
                    if band_data.max() > band_data.min():
                        band_min, band_max = np.percentile(band_data[band_data > 0], [2, 98])
                        rgb_data[i] = np.clip((band_data - band_min) / (band_max - band_min) * 255, 0, 255)
                
                # إنشاء صورة RGB
                rgb_image = np.transpose(rgb_data, (1, 2, 0)).astype(np.uint8)
                
            elif data.ndim == 2 or (data.ndim == 3 and data.shape[0] == 1):
                # Grayscale image
                if data.ndim == 3:
                    gray_data = data[0]
                else:
                    gray_data = data
                
                # تطبيع البيانات
                if gray_data.max() > gray_data.min():
                    gray_min, gray_max = np.percentile(gray_data[gray_data > 0], [2, 98])
                    gray_normalized = np.clip((gray_data - gray_min) / (gray_max - gray_min) * 255, 0, 255)
                else:
                    gray_normalized = np.zeros_like(gray_data)
                
                # تحويل إلى RGB
                rgb_image = np.stack([gray_normalized] * 3, axis=-1).astype(np.uint8)
            else:
                return {
                    "success": False,
                    "error": f"تنسيق غير مدعوم للصورة: {data.shape}"
                }
            
            # حفظ الصورة المعالجة  
            output_image_path = os.path.join(output_dir, 'processed.png')
            pil_image = Image.fromarray(rgb_image)
            pil_image.save(output_image_path, 'PNG', optimize=True)
            
            print(f"✅ تم حفظ الصورة: {output_image_path}")
            
            # إعداد معلومات النتيجة الموحدة
            # final_bounds هي [west, south, east, north]
            metadata = {
                "success": True,
                "imageFile": "processed.png",
                "bbox": [final_bounds[0], final_bounds[1], final_bounds[2], final_bounds[3]],  # [west, south, east, north]
                "leaflet_bounds": [[final_bounds[1], final_bounds[0]], [final_bounds[3], final_bounds[2]]],  # [[south,west],[north,east]]
                "width": width,
                "height": height,
                "crs": "EPSG:4326",
                "original_name": os.path.basename(input_file),
                "processed_at": datetime.utcnow().isoformat() + "Z"
            }
            
            # حفظ معلومات الطبقة الموحدة
            metadata_path = os.path.join(output_dir, 'metadata.json')
            with open(metadata_path, 'w', encoding='utf-8') as f:
                json.dump(metadata, f, indent=2, ensure_ascii=False)
            
            print("✅ تمت المعالجة بنجاح")
            print(f"📄 النتيجة: {json.dumps(metadata, ensure_ascii=False, indent=2)}")
            
            # طباعة النتيجة النهائية كـJSON للخلفية
            print(json.dumps(metadata, ensure_ascii=False))
            
            return metadata
            
    except Exception as e:
        print(f"❌ خطأ في معالجة GeoTIFF: {e}")
        import traceback
        traceback.print_exc()
        return {
            "success": False,
            "error": f"خطأ في معالجة الملف: {str(e)}"
        }

def main():
    if len(sys.argv) != 4:
        print("Usage: python enhanced-geotiff-processor.py <input_file> <output_dir> <original_name>")
        sys.exit(1)
    
    input_file = sys.argv[1]
    output_dir = sys.argv[2]
    original_name = sys.argv[3]
    
    print(f"🚀 بدء معالجة ملف GeoTIFF: {input_file}")
    print(f"📁 مجلد الإخراج: {output_dir}")
    print(f"📄 الاسم الأصلي: {original_name}")
    
    result = process_geotiff(input_file, output_dir)
    
    # طباعة النتيجة
    print(json.dumps(result, ensure_ascii=False))
    
    if not result["success"]:
        sys.exit(1)

if __name__ == "__main__":
    main()