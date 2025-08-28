#!/usr/bin/env python3
"""
معالج GeoTIFF احترافي مستوحى من QGIS Web Publisher
يقوم بتحويل ملفات GeoTIFF من UTM إلى WGS84 مع صور PNG للويب
"""

import sys
import json
import os
import zipfile
import tempfile
import shutil
from pathlib import Path
from PIL import Image
import rasterio
from rasterio.warp import transform_bounds
from pyproj import Transformer
import numpy as np

class QGISWebProcessor:
    def __init__(self):
        # إعدادات المعالج
        self.supported_formats = ['.tif', '.tiff', '.geotiff']
        
    def process_zip_file(self, zip_path: str, output_dir: str) -> dict:
        """المعالجة الرئيسية لملف ZIP"""
        try:
            # 1. استخراج ملفات ZIP
            geotiff_files = self._extract_and_find_geotiff(zip_path)
            if not geotiff_files:
                raise ValueError("لم يتم العثور على ملفات GeoTIFF في الأرشيف")
            
            # 2. معالجة أول ملف GeoTIFF
            geotiff_path = geotiff_files[0]
            
            # 3. قراءة البيانات الجغرافية
            with rasterio.open(geotiff_path) as src:
                # قراءة نظام الإحداثيات الأصلي
                original_crs = src.crs
                bounds_utm = src.bounds
                transform = src.transform
                width = src.width
                height = src.height
                
                # قراءة البيانات كصورة
                image_data = src.read()
                
                # تحويل إلى RGB إذا لزم الأمر
                if image_data.shape[0] == 1:
                    # Grayscale to RGB
                    rgb_data = np.stack([image_data[0], image_data[0], image_data[0]], axis=0)
                elif image_data.shape[0] >= 3:
                    # استخدام أول 3 قنوات
                    rgb_data = image_data[:3]
                else:
                    raise ValueError("تنسيق الصورة غير مدعوم")
            
            # 4. تحويل الحدود من UTM إلى WGS84
            bounds_wgs84 = self._convert_bounds_to_wgs84(bounds_utm, original_crs)
            
            # 5. حفظ الصورة كـ PNG
            output_path = Path(output_dir)
            output_path.mkdir(parents=True, exist_ok=True)
            
            png_filename = f"{Path(geotiff_path).stem}.png"
            png_path = output_path / png_filename
            
            # تحويل البيانات إلى صيغة يمكن حفظها
            rgb_normalized = np.transpose(rgb_data, (1, 2, 0))
            rgb_normalized = np.clip(rgb_normalized, 0, 255).astype(np.uint8)
            
            # حفظ كـ PNG
            pil_image = Image.fromarray(rgb_normalized)
            pil_image.save(png_path, 'PNG', optimize=True)
            
            # 6. إعداد النتيجة النهائية
            result = {
                "success": True,
                "png_file": png_filename,
                "bounds_wgs84": {
                    "southwest": [bounds_wgs84[1], bounds_wgs84[0]],  # [lat, lng]
                    "northeast": [bounds_wgs84[3], bounds_wgs84[2]]   # [lat, lng]
                },
                "bounds_array": [[bounds_wgs84[1], bounds_wgs84[0]], 
                               [bounds_wgs84[3], bounds_wgs84[2]]],
                "original_crs": str(original_crs),
                "dimensions": {"width": width, "height": height},
                "output_directory": str(output_path),
                "transform": list(transform)[:6]
            }
            
            return result
            
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
    
    def _extract_and_find_geotiff(self, zip_path: str) -> list:
        """استخراج الملفات والبحث عن GeoTIFF"""
        temp_dir = tempfile.mkdtemp()
        geotiff_files = []
        
        try:
            with zipfile.ZipFile(zip_path, 'r') as zip_ref:
                zip_ref.extractall(temp_dir)
            
            # البحث عن ملفات GeoTIFF
            for root, dirs, files in os.walk(temp_dir):
                for file in files:
                    if any(file.lower().endswith(ext) for ext in self.supported_formats):
                        geotiff_files.append(os.path.join(root, file))
            
            return geotiff_files
            
        except Exception as e:
            if os.path.exists(temp_dir):
                shutil.rmtree(temp_dir)
            raise e
    
    def _convert_bounds_to_wgs84(self, bounds_utm, original_crs):
        """تحويل الحدود من UTM إلى WGS84"""
        try:
            # إنشاء محول الإحداثيات
            transformer = Transformer.from_crs(original_crs, 'EPSG:4326', always_xy=True)
            
            # تحويل الزوايا الأربع
            min_x, min_y, max_x, max_y = bounds_utm
            
            # تحويل الزاوية السفلية اليسرى
            sw_lng, sw_lat = transformer.transform(min_x, min_y)
            
            # تحويل الزاوية العلوية اليمنى  
            ne_lng, ne_lat = transformer.transform(max_x, max_y)
            
            return [sw_lng, sw_lat, ne_lng, ne_lat]  # [west, south, east, north]
            
        except Exception as e:
            raise ValueError(f"فشل في تحويل نظام الإحداثيات: {e}")

def main():
    """الدالة الرئيسية"""
    if len(sys.argv) != 3:
        error_result = {
            "success": False,
            "error": "Usage: python qgis-web-processor.py <input_zip> <output_dir>"
        }
        print(json.dumps(error_result))
        sys.exit(1)
    
    input_zip = sys.argv[1]
    output_dir = sys.argv[2]
    
    processor = QGISWebProcessor()
    result = processor.process_zip_file(input_zip, output_dir)
    
    print(json.dumps(result))
    
    if not result["success"]:
        sys.exit(1)

if __name__ == "__main__":
    main()