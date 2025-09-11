#!/usr/bin/env python3
"""
معالج GeoTIFF لتحويل الملفات إلى PNG مع ملفات الإسقاط
"""
import os
import sys
import json
import rasterio
from rasterio.warp import transform_bounds, calculate_default_transform, reproject, Resampling
from rasterio.enums import Resampling
from PIL import Image
import numpy as np
from pathlib import Path

def process_geotiff(input_path, output_dir):
    """
    تحويل GeoTIFF إلى PNG مع ملفات PGW و PRJ
    """
    try:
        output_dir = Path(output_dir)
        output_dir.mkdir(parents=True, exist_ok=True)
        
        with rasterio.open(input_path) as src:
            print(f"🔍 معالجة الملف: {input_path}")
            print(f"📊 الأبعاد: {src.width}x{src.height}")
            print(f"🗺️ نظام الإحداثيات: {src.crs}")
            print(f"📍 الحدود: {src.bounds}")
            
            # قراءة البيانات
            data = src.read()
            
            # التحقق من الأبعاد
            if data.shape[0] == 0 or len(data.shape) < 2:
                raise ValueError("البيانات غير صالحة أو فارغة")
            
            # تحويل إلى WGS84 إذا لم تكن كذلك
            if src.crs and src.crs != 'EPSG:4326':
                print("🔄 تحويل إلى WGS84...")
                dst_crs = 'EPSG:4326'
                transform, width, height = calculate_default_transform(
                    src.crs, dst_crs, src.width, src.height, *src.bounds
                )
                
                # إنشاء مصفوفة جديدة
                dst_data = np.zeros((src.count, height, width), dtype=src.dtypes[0] if src.dtypes else np.uint8)
                
                reproject(
                    source=data,
                    destination=dst_data,
                    src_transform=src.transform,
                    src_crs=src.crs,
                    dst_transform=transform,
                    dst_crs=dst_crs,
                    resampling=Resampling.nearest
                )
                
                # حساب الحدود الجديدة
                bounds = transform_bounds(src.crs, dst_crs, *src.bounds)
                
            else:
                # استخدام البيانات كما هي
                dst_data = data
                transform = src.transform
                bounds = src.bounds
                width, height = src.width, src.height
            
            # تحويل البيانات إلى صورة PNG
            print("🖼️ تحويل إلى PNG...")
            
            # تطبيع البيانات للعرض
            if dst_data.shape[0] >= 3:  # RGB
                rgb_data = dst_data[:3]
                # تطبيع كل قناة
                normalized = np.zeros_like(rgb_data, dtype=np.uint8)
                for i in range(3):
                    band = rgb_data[i]
                    if band.max() > band.min():
                        normalized[i] = ((band - band.min()) / (band.max() - band.min()) * 255).astype(np.uint8)
                    else:
                        normalized[i] = band.astype(np.uint8)
                
                # تحويل إلى تنسيق PIL
                img_array = np.transpose(normalized, (1, 2, 0))
                img = Image.fromarray(img_array, 'RGB')
            else:  # Grayscale
                band = dst_data[0]
                if band.max() > band.min():
                    normalized = ((band - band.min()) / (band.max() - band.min()) * 255).astype(np.uint8)
                else:
                    normalized = band.astype(np.uint8)
                img = Image.fromarray(normalized, 'L')
            
            # حفظ PNG
            png_path = output_dir / "image.png"
            img.save(png_path, 'PNG')
            print(f"✅ تم حفظ PNG: {png_path}")
            
            # إنشاء ملف PGW (World File)
            pgw_path = output_dir / "image.pgw"
            pixel_size_x = (bounds[2] - bounds[0]) / width
            pixel_size_y = (bounds[3] - bounds[1]) / height
            
            with open(pgw_path, 'w') as pgw:
                pgw.write(f"{pixel_size_x}\n")  # pixel size in x
                pgw.write("0.0\n")              # rotation term
                pgw.write("0.0\n")              # rotation term  
                pgw.write(f"{-pixel_size_y}\n") # pixel size in y (negative)
                pgw.write(f"{bounds[0] + pixel_size_x/2}\n")  # x coordinate of upper left
                pgw.write(f"{bounds[3] - pixel_size_y/2}\n")  # y coordinate of upper left
            
            print(f"✅ تم حفظ PGW: {pgw_path}")
            
            # إنشاء ملف PRJ (Projection)
            prj_path = output_dir / "image.prj"
            with open(prj_path, 'w') as prj:
                prj.write('GEOGCS["WGS 84",DATUM["WGS_1984",SPHEROID["WGS 84",6378137,298.257223563,AUTHORITY["EPSG","7030"]],AUTHORITY["EPSG","6326"]],PRIMEM["Greenwich",0,AUTHORITY["EPSG","8901"]],UNIT["degree",0.0174532925199433,AUTHORITY["EPSG","9122"]],AUTHORITY["EPSG","4326"]]')
            
            print(f"✅ تم حفظ PRJ: {prj_path}")
            
            # حساب bounds بتنسيق Leaflet [[south, west], [north, east]]
            leaflet_bounds = [[bounds[1], bounds[0]], [bounds[3], bounds[2]]]
            
            # إرجاع النتائج
            result = {
                "success": True,
                "imageUrl": f"/api/gis/layers/{output_dir.name}/image.png",
                "bounds": leaflet_bounds,
                "width": width,
                "height": height,
                "crs": "EPSG:4326"
            }
            
            print(f"🎯 نتيجة المعالجة: {result}")
            return result
            
    except Exception as e:
        print(f"❌ خطأ في معالجة GeoTIFF: {str(e)}")
        return {
            "success": False,
            "error": str(e)
        }

def main():
    if len(sys.argv) < 3:
        print("الاستخدام: python geotiff-processor.py <input_file> <output_dir>")
        sys.exit(1)
    
    input_file = sys.argv[1]
    output_dir = sys.argv[2]
    
    result = process_geotiff(input_file, output_dir)
    print(json.dumps(result, ensure_ascii=False, indent=2))

if __name__ == "__main__":
    main()