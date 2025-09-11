#!/usr/bin/env python3
"""
معالج ملفات ZIP للطبقات المساحية
يدعم استخراج وتحويل ملفات GeoTIFF من ملفات ZIP
"""

import sys
import os
import json
import zipfile
import tempfile
import shutil
import numpy as np
import rasterio
from rasterio.warp import calculate_default_transform, reproject, Resampling, transform_bounds
from rasterio.crs import CRS
from PIL import Image
import warnings
from pathlib import Path
from datetime import datetime

warnings.filterwarnings('ignore')

def find_geotiff_in_zip(zip_path):
    """البحث عن ملفات GeoTIFF داخل ملف ZIP"""
    geotiff_extensions = ['.tif', '.tiff', '.geotiff']
    
    try:
        with zipfile.ZipFile(zip_path, 'r') as zip_file:
            for file_info in zip_file.filelist:
                file_name = file_info.filename.lower()
                if any(file_name.endswith(ext) for ext in geotiff_extensions):
                    return file_info.filename
    except Exception as e:
        print(f"❌ خطأ في قراءة ZIP: {e}")
        return None
    
    return None

def extract_and_process_zip(zip_path, output_dir):
    """استخراج ومعالجة ملف ZIP"""
    try:
        print(f"📦 معالجة ملف ZIP: {zip_path}")
        
        # البحث عن ملف GeoTIFF
        geotiff_name = find_geotiff_in_zip(zip_path)
        if not geotiff_name:
            return {
                "success": False,
                "error": "لم يتم العثور على ملف GeoTIFF في الملف المضغوط"
            }
        
        print(f"🎯 تم العثور على ملف GeoTIFF: {geotiff_name}")
        
        # إنشاء مجلد مؤقت للاستخراج
        with tempfile.TemporaryDirectory() as temp_dir:
            # استخراج الملفات
            with zipfile.ZipFile(zip_path, 'r') as zip_file:
                zip_file.extractall(temp_dir)
            
            # مسار ملف GeoTIFF المستخرج
            extracted_geotiff = os.path.join(temp_dir, geotiff_name)
            
            if not os.path.exists(extracted_geotiff):
                return {
                    "success": False,
                    "error": f"فشل في استخراج الملف: {geotiff_name}"
                }
            
            # معالجة ملف GeoTIFF المستخرج
            return process_geotiff(extracted_geotiff, output_dir, geotiff_name)
            
    except Exception as e:
        print(f"❌ خطأ في معالجة ZIP: {e}")
        return {
            "success": False,
            "error": f"خطأ في معالجة الملف المضغوط: {str(e)}"
        }

def process_geotiff(input_file, output_dir, original_name=None):
    """معالجة ملف GeoTIFF"""
    try:
        print(f"📊 معالجة GeoTIFF: {input_file}")
        
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
            
            # الحصول على الحدود الأصلية
            original_bounds = src.bounds
            original_crs = src.crs
            
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
                
                # تحديث البيانات والمعايير
                data = reprojected_data
                final_transform = transform
                final_crs = dst_crs
                
                # حساب الحدود الجديدة
                from rasterio.warp import transform_bounds
                final_bounds = transform_bounds(src.crs, dst_crs, *src.bounds)
                
            else:
                print("✅ نظام الإحداثيات مناسب بالفعل")
                final_transform = src.transform
                final_crs = src.crs if src.crs else dst_crs
                final_bounds = src.bounds
                width, height = src.width, src.height
            
            # تحويل إلى صورة PNG
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
                "imageFile": os.path.basename(output_image_path),  # e.g. "processed.png"
                "bbox": [final_bounds[0], final_bounds[1], final_bounds[2], final_bounds[3]],  # [west, south, east, north]
                "leaflet_bounds": [[final_bounds[1], final_bounds[0]], [final_bounds[3], final_bounds[2]]],  # [[south,west],[north,east]]
                "width": width,
                "height": height,
                "crs": "EPSG:4326",
                "original_name": original_name or os.path.basename(input_file)
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
        print("Usage: python zip-processor.py <input_zip> <output_dir> <original_name>")
        sys.exit(1)
    
    input_file = sys.argv[1]
    output_dir = sys.argv[2]
    original_name = sys.argv[3]
    
    print(f"🚀 بدء معالجة ملف: {input_file}")
    print(f"📁 مجلد الإخراج: {output_dir}")
    print(f"📄 الاسم الأصلي: {original_name}")
    
    # التحقق من نوع الملف
    if input_file.lower().endswith('.zip'):
        result = extract_and_process_zip(input_file, output_dir)
    else:
        result = process_geotiff(input_file, output_dir, original_name)
    
    # طباعة النتيجة
    print(json.dumps(result, ensure_ascii=False))
    
    if not result["success"]:
        sys.exit(1)

if __name__ == "__main__":
    main()