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
from rasterio.warp import calculate_default_transform, reproject, Resampling
from rasterio import crs
from PIL import Image
import warnings
from pathlib import Path

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
            dst_crs = crs.CRS.from_epsg(4326)  # WGS84
            
            if src.crs != dst_crs:
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
                new_bounds = rasterio.transform.array_bounds(height, width, transform)
                
            else:
                # استخدام البيانات الأصلية
                transform = src.transform
                width, height = src.width, src.height
                new_bounds = src.bounds
            
            # تحويل البيانات إلى صورة PNG
            if src.count == 1:
                # صورة رمادية
                band_data = data[0]
                
                # تطبيع البيانات للعرض
                if band_data.dtype != np.uint8:
                    # تطبيع إلى 0-255
                    data_min = np.nanmin(band_data[band_data != src.nodata])
                    data_max = np.nanmax(band_data[band_data != src.nodata])
                    
                    if data_max > data_min:
                        normalized = ((band_data - data_min) / (data_max - data_min) * 255)
                        normalized = np.clip(normalized, 0, 255).astype(np.uint8)
                    else:
                        normalized = np.zeros_like(band_data, dtype=np.uint8)
                    
                    band_data = normalized
                
                # إنشاء صورة PIL
                img = Image.fromarray(band_data, mode='L')
                
            elif src.count >= 3:
                # صورة ملونة RGB
                r_band = data[0] if src.count > 0 else np.zeros((height, width), dtype=np.uint8)
                g_band = data[1] if src.count > 1 else np.zeros((height, width), dtype=np.uint8)
                b_band = data[2] if src.count > 2 else np.zeros((height, width), dtype=np.uint8)
                
                # تطبيع كل نطاق
                for band in [r_band, g_band, b_band]:
                    if band.dtype != np.uint8:
                        band_min = np.nanmin(band[band != src.nodata])
                        band_max = np.nanmax(band[band != src.nodata])
                        
                        if band_max > band_min:
                            band[:] = ((band - band_min) / (band_max - band_min) * 255)
                            band[:] = np.clip(band, 0, 255).astype(np.uint8)
                        else:
                            band[:] = 0
                
                # دمج النطاقات
                rgb_data = np.stack([r_band, g_band, b_band], axis=2)
                img = Image.fromarray(rgb_data.astype(np.uint8), mode='RGB')
            
            else:
                return {
                    "success": False,
                    "error": f"عدد النطاقات غير مدعوم: {src.count}"
                }
            
            # حفظ الصورة
            output_image_name = f"processed_{Path(input_file).stem}.png"
            output_image_path = os.path.join(output_dir, output_image_name)
            img.save(output_image_path, "PNG", optimize=True)
            
            # إنشاء ملف World File (.pgw)
            world_file_path = os.path.join(output_dir, f"processed_{Path(input_file).stem}.pgw")
            with open(world_file_path, 'w') as wf:
                wf.write(f"{transform.a}\n")  # pixel size in x direction
                wf.write(f"{transform.d}\n")  # rotation about y axis
                wf.write(f"{transform.b}\n")  # rotation about x axis  
                wf.write(f"{transform.e}\n")  # pixel size in y direction
                wf.write(f"{transform.c}\n")  # x coordinate of center of upper left pixel
                wf.write(f"{transform.f}\n")  # y coordinate of center of upper left pixel
            
            # حفظ ملف الإسقاط (.prj)
            prj_file_path = os.path.join(output_dir, f"processed_{Path(input_file).stem}.prj")
            with open(prj_file_path, 'w') as pf:
                pf.write(dst_crs.to_wkt())
            
            # حساب الحدود الجغرافية
            bounds = [
                [new_bounds[1], new_bounds[0]],  # southwest corner [lat, lng]
                [new_bounds[3], new_bounds[2]]   # northeast corner [lat, lng]
            ]
            
            # تكوين URL الصورة
            image_url = f"/api/gis/layers/{os.path.basename(output_dir)}/image/{output_image_name}"
            
            result = {
                "success": True,
                "imageUrl": image_url,
                "bounds": bounds,
                "width": width,
                "height": height,
                "crs": "EPSG:4326",
                "transform": {
                    "a": transform.a,
                    "b": transform.b,
                    "c": transform.c,
                    "d": transform.d,
                    "e": transform.e,
                    "f": transform.f
                },
                "files": {
                    "image": output_image_path,
                    "world": world_file_path,
                    "projection": prj_file_path
                }
            }
            
            print("✅ تمت معالجة الملف بنجاح")
            return result
            
    except Exception as e:
        error_msg = f"خطأ في معالجة الملف: {str(e)}"
        print(f"❌ {error_msg}")
        return {
            "success": False,
            "error": error_msg
        }

def main():
    """دالة رئيسية"""
    if len(sys.argv) != 3:
        print("الاستخدام: python enhanced-geotiff-processor.py <input_file> <output_dir>")
        sys.exit(1)
    
    input_file = sys.argv[1]
    output_dir = sys.argv[2]
    
    result = process_geotiff(input_file, output_dir)
    print(json.dumps(result, ensure_ascii=False, indent=2))

if __name__ == "__main__":
    main()