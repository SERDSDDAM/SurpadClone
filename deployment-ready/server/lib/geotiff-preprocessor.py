#!/usr/bin/env python3
"""
نسخة محسنة من معالج GeoTIFF للتحويل إلى PNG+World Files
يحاكي سكربت convert_tifs_in_folder_to_png_with_georef.py
"""
import os
import sys
import json
import zipfile
import tempfile
from pathlib import Path
try:
    from PIL import Image
    import pyproj
    # محاولة استيراد geotiff كبديل لـ rasterio
    try:
        from geotiff import GeoTiff
        GEOTIFF_AVAILABLE = True
    except ImportError:
        GEOTIFF_AVAILABLE = False
        print("تحذير: geotiff library غير متوفرة، سيتم استخدام معالجة بسيطة", file=sys.stderr)
except ImportError as e:
    print(f"خطأ في استيراد المكتبات المطلوبة: {e}", file=sys.stderr)
    sys.exit(1)

class GeoTIFFPreprocessor:
    def __init__(self, temp_dir=None):
        self.temp_dir = temp_dir or tempfile.mkdtemp()
        
    def process_zip_file(self, zip_path, output_dir):
        """
        معالجة ملف ZIP يحتوي على GeoTIFF
        التحويل إلى PNG + .pgw + .prj
        """
        print(f"🔄 بدء معالجة الملف: {zip_path}", file=sys.stderr)
        
        # فك ضغط الملف
        extracted_dir = os.path.join(self.temp_dir, 'extracted')
        os.makedirs(extracted_dir, exist_ok=True)
        
        with zipfile.ZipFile(zip_path, 'r') as zip_ref:
            zip_ref.extractall(extracted_dir)
            
        # فحص شامل لمحتويات الـ ZIP
        all_files = []
        geotiff_files = []
        reference_files = []
        
        for root, dirs, files in os.walk(extracted_dir):
            for file in files:
                file_path = os.path.join(root, file)
                file_lower = file.lower()
                all_files.append(file)
                
                # البحث عن ملفات GeoTIFF
                if file_lower.endswith(('.tif', '.tiff')):
                    geotiff_files.append(file_path)
                    
                # البحث عن ملفات الإسناد الجغرافي
                if file_lower.endswith(('.tfw', '.tifw', '.prj', '.wld')):
                    reference_files.append(file_path)
        
        print(f"📋 محتويات الـ ZIP: {', '.join(all_files)}", file=sys.stderr)
        print(f"📍 ملفات GeoTIFF: {len(geotiff_files)}", file=sys.stderr)
        print(f"🗺️ ملفات الإسناد: {len(reference_files)}", file=sys.stderr)
        
        # التحقق من وجود ملفات GeoTIFF
        if not geotiff_files:
            raise ValueError("خطأ: ملف الـ ZIP المرفوع لا يحتوي على صورة بصيغة GeoTIFF (.tif/.tiff)")
        
        # التحقق من وجود ملفات الإسناد الجغرافي (اختياري للاختبار)
        if not reference_files:
            print("⚠️ تحذير: لم يتم العثور على ملفات الإسناد الجغرافي (.prj/.tfw) - سيتم إنشاء ملف افتراضي", file=sys.stderr)
                    
        # اختيار أول ملف GeoTIFF
        image_files = geotiff_files
            
        # معالجة أول ملف صورة
        image_path = image_files[0]
        print(f"📂 معالجة الملف: {os.path.basename(image_path)}", file=sys.stderr)
        
        return self._convert_image_to_png_with_world_file(image_path, output_dir)
    
    def _convert_image_to_png_with_world_file(self, image_path, output_dir):
        """تحويل صورة إلى PNG + World File"""
        base_name = Path(image_path).stem
        
        # قراءة الصورة الأساسية
        with Image.open(image_path) as img:
            # تحويل إلى RGB إذا كانت RGBA أو grayscale
            if img.mode in ('RGBA', 'L', 'P'):
                img = img.convert('RGB')
                
            # حفظ كـ PNG
            png_path = os.path.join(output_dir, f"{base_name}.png")
            img.save(png_path, 'PNG', optimize=True)
            
            width, height = img.size
            print(f"📐 أبعاد الصورة: {width}x{height}", file=sys.stderr)
            
        # استخراج معلومات جغرافية
        if GEOTIFF_AVAILABLE and image_path.lower().endswith(('.tif', '.tiff')):
            try:
                geo_info = self._extract_geo_info_with_geotiff(image_path)
            except Exception as e:
                print(f"تحذير: فشل في استخراج البيانات الجغرافية: {e}", file=sys.stderr)
                geo_info = self._create_default_geo_info(width, height)
        else:
            geo_info = self._create_default_geo_info(width, height)
            
        # إنشاء World File (.pgw)
        pgw_path = os.path.join(output_dir, f"{base_name}.pgw")
        self._create_world_file(pgw_path, geo_info, width, height)
        
        # إنشاء Projection File (.prj)
        prj_path = os.path.join(output_dir, f"{base_name}.prj")
        self._create_projection_file(prj_path, geo_info.get('crs', 'EPSG:32638'))
        
        return {
            'success': True,
            'png_path': png_path,
            'pgw_path': pgw_path,
            'prj_path': prj_path,
            'metadata': {
                'filename': base_name,
                'width': width,
                'height': height,
                'crs': geo_info.get('crs', 'EPSG:32638'),
                'bounds': geo_info['bounds'],
                'pixel_size': geo_info['pixel_size']
            }
        }
        
    def _extract_geo_info_with_geotiff(self, tiff_path):
        """استخراج المعلومات الجغرافية باستخدام geotiff library"""
        try:
            from geotiff import GeoTiff
            geo_tiff = GeoTiff(tiff_path)
            
            # استخراج التحويل الجغرافي
            try:
                # محاولة استخراج Bounding Box
                if hasattr(geo_tiff, 'tif_bBox'):
                    bbox = geo_tiff.tif_bBox
                    x_min, y_min, x_max, y_max = bbox[0], bbox[1], bbox[2], bbox[3]
                elif hasattr(geo_tiff, 'tif_bounding_box'):
                    bbox = geo_tiff.tif_bounding_box
                    x_min, y_max, x_max, y_min = bbox[0], bbox[1], bbox[2], bbox[3]
                else:
                    raise ValueError("لا يمكن استخراج Bounding Box من ملف GeoTIFF")
                
                # استخراج نظام الإحداثيات
                crs_info = getattr(geo_tiff, 'crs_code', None)
                if not crs_info and hasattr(geo_tiff, 'epsg'):
                    crs_info = geo_tiff.epsg
                
                # حساب حجم البكسل
                if hasattr(geo_tiff, 'tif_shape'):
                    height, width = geo_tiff.tif_shape[:2]
                    pixel_x = (x_max - x_min) / width
                    pixel_y = (y_max - y_min) / height
                else:
                    pixel_x, pixel_y = 10, 10  # قيمة افتراضية
                
                return {
                    'crs': f'EPSG:{crs_info}' if crs_info else 'EPSG:32638',
                    'bounds': {
                        'minX': x_min,
                        'minY': y_min, 
                        'maxX': x_max,
                        'maxY': y_max
                    },
                    'pixel_size': {
                        'x': pixel_x,
                        'y': -pixel_y  # سالب لأن Y ينقص نحو الأسفل
                    }
                }
            except Exception as extract_error:
                print(f"⚠️ خطأ في استخراج البيانات من GeoTIFF: {extract_error}", file=sys.stderr)
                raise
                
        except ImportError:
            print("❌ مكتبة geotiff غير متوفرة", file=sys.stderr)
            raise
        except Exception as e:
            print(f"❌ خطأ في قراءة GeoTIFF: {e}", file=sys.stderr)
            raise
            
    def _create_default_geo_info(self, width, height):
        """إنشاء معلومات جغرافية افتراضية لليمن (UTM Zone 38N)"""
        # إحداثيات افتراضية لمنطقة صنعاء
        x_min = 400000  # UTM Easting
        y_max = 1700000  # UTM Northing (upper)
        pixel_size = 10  # 10 meters per pixel
        
        x_max = x_min + (width * pixel_size)
        y_min = y_max - (height * pixel_size)
        
        return {
            'crs': 'EPSG:32638',  # UTM Zone 38N
            'bounds': {
                'minX': x_min,
                'minY': y_min,
                'maxX': x_max,
                'maxY': y_max
            },
            'pixel_size': {'x': pixel_size, 'y': -pixel_size}
        }
        
    def _create_world_file(self, pgw_path, geo_info, width, height):
        """إنشاء ملف World File (.pgw)"""
        bounds = geo_info['bounds']
        pixel_size = geo_info['pixel_size']
        
        # World File format:
        # Line 1: X-scale (pixel width)
        # Line 2: Y-skew (rotation)
        # Line 3: X-skew (rotation) 
        # Line 4: Y-scale (pixel height, negative)
        # Line 5: X-coordinate of upper-left pixel center
        # Line 6: Y-coordinate of upper-left pixel center
        
        x_scale = pixel_size['x'] 
        y_scale = pixel_size['y'] if pixel_size['y'] < 0 else -pixel_size['y']
        
        # إحداثيات مركز البكسل العلوي الأيسر
        x_center = bounds['minX'] + (x_scale / 2)
        y_center = bounds['maxY'] - (abs(y_scale) / 2)
        
        with open(pgw_path, 'w') as f:
            f.write(f"{x_scale}\n")      # X pixel size
            f.write("0.0\n")             # Y skew
            f.write("0.0\n")             # X skew
            f.write(f"{y_scale}\n")      # Y pixel size (negative)
            f.write(f"{x_center}\n")     # X coordinate of center of upper-left pixel
            f.write(f"{y_center}\n")     # Y coordinate of center of upper-left pixel
            
        print(f"✅ تم إنشاء World File: {pgw_path}", file=sys.stderr)
        
    def _create_projection_file(self, prj_path, crs):
        """إنشاء ملف الإسقاط (.prj)"""
        # WKT for common CRS in Yemen
        wkt_definitions = {
            'EPSG:32638': '''PROJCS["WGS 84 / UTM zone 38N",GEOGCS["WGS 84",DATUM["WGS_1984",SPHEROID["WGS 84",6378137,298.257223563,AUTHORITY["EPSG","7030"]],AUTHORITY["EPSG","6326"]],PRIMEM["Greenwich",0,AUTHORITY["EPSG","8901"]],UNIT["degree",0.01745329251994328,AUTHORITY["EPSG","9122"]],AUTHORITY["EPSG","4326"]],UNIT["metre",1,AUTHORITY["EPSG","9001"]],PROJECTION["Transverse_Mercator"],PARAMETER["latitude_of_origin",0],PARAMETER["central_meridian",45],PARAMETER["scale_factor",0.9996],PARAMETER["false_easting",500000],PARAMETER["false_northing",0],AUTHORITY["EPSG","32638"]]''',
            'EPSG:4326': '''GEOGCS["WGS 84",DATUM["WGS_1984",SPHEROID["WGS 84",6378137,298.257223563,AUTHORITY["EPSG","7030"]],AUTHORITY["EPSG","6326"]],PRIMEM["Greenwich",0,AUTHORITY["EPSG","8901"]],UNIT["degree",0.01745329251994328,AUTHORITY["EPSG","9122"]],AUTHORITY["EPSG","4326"]]'''
        }
        
        wkt = wkt_definitions.get(crs, wkt_definitions['EPSG:32638'])
        
        with open(prj_path, 'w') as f:
            f.write(wkt)
            
        print(f"✅ تم إنشاء ملف الإسقاط: {prj_path}", file=sys.stderr)

def main():
    if len(sys.argv) < 3:
        print("الاستخدام: python geotiff-preprocessor.py <zip_path> <output_dir>")
        sys.exit(1)
        
    zip_path = sys.argv[1]
    output_dir = sys.argv[2]
    
    # إنشاء مجلد الإخراج
    os.makedirs(output_dir, exist_ok=True)
    
    try:
        processor = GeoTIFFPreprocessor()
        result = processor.process_zip_file(zip_path, output_dir)
        
        # إرجاع النتيجة كـ JSON
        print(json.dumps(result))
        
    except Exception as e:
        error_result = {
            'success': False,
            'error': str(e)
        }
        print(json.dumps(error_result))
        sys.exit(1)

if __name__ == "__main__":
    main()