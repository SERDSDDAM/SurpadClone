#!/usr/bin/env python3
"""
معالج GeoTIFF باستخدام rasterio - مكافئ للنظام القديم
يستخرج الحدود الحقيقية والبيانات الوصفية من ملفات GeoTIFF
"""
import sys
import json
import zipfile
import tempfile
import os
from pathlib import Path
import rasterio
from rasterio.enums import Resampling
import numpy as np
from PIL import Image

def extract_geotiff_metadata(zip_path):
    """استخراج البيانات الوصفية من ملف ZIP يحتوي على GeoTIFF"""
    try:
        print(f"🔍 Python - فتح ملف ZIP: {zip_path}", file=sys.stderr)
        
        with zipfile.ZipFile(zip_path, 'r') as zip_ref:
            # البحث عن ملف TIFF/TIF
            tiff_files = [f for f in zip_ref.namelist() 
                         if f.lower().endswith(('.tif', '.tiff'))]
            
            if not tiff_files:
                raise Exception("لا يوجد ملف GeoTIFF في الملف المضغوط")
            
            tiff_file = tiff_files[0]
            print(f"📁 عثر على ملف: {tiff_file}", file=sys.stderr)
            
            # استخراج الملف مؤقتاً
            with tempfile.TemporaryDirectory() as temp_dir:
                zip_ref.extract(tiff_file, temp_dir)
                tiff_path = os.path.join(temp_dir, tiff_file)
                
                # قراءة البيانات باستخدام rasterio
                with rasterio.open(tiff_path) as dataset:
                    print(f"📊 أبعاد الصورة: {dataset.width}x{dataset.height}", file=sys.stderr)
                    print(f"🗺️ CRS: {dataset.crs}", file=sys.stderr)
                    
                    # استخراج الحدود (bounds)
                    bounds = dataset.bounds
                    transform = dataset.transform
                    
                    print(f"📍 حدود الصورة: {bounds}", file=sys.stderr)
                    print(f"🔄 Transform: {transform}", file=sys.stderr)
                    
                    metadata = {
                        'filename': os.path.splitext(tiff_file)[0],
                        'width': dataset.width,
                        'height': dataset.height,
                        'crs': str(dataset.crs) if dataset.crs else 'UNKNOWN',
                        'bounds': {
                            'minX': float(bounds.left),
                            'minY': float(bounds.bottom),
                            'maxX': float(bounds.right),
                            'maxY': float(bounds.top)
                        },
                        'transform': list(transform)[:6],  # أول 6 قيم من التحويل
                        'pixel_size_x': abs(transform[0]),
                        'pixel_size_y': abs(transform[4]),
                        'band_count': dataset.count,
                        'dtype': str(dataset.dtypes[0])
                    }
                    
                    print(f"✅ تم استخراج البيانات بنجاح", file=sys.stderr)
                    return metadata
                    
    except Exception as e:
        print(f"❌ خطأ في معالجة الملف: {str(e)}", file=sys.stderr)
        raise

def create_preview_image(zip_path, output_path, max_size=1024):
    """إنشاء صورة معاينة مصغرة من GeoTIFF"""
    try:
        with zipfile.ZipFile(zip_path, 'r') as zip_ref:
            tiff_files = [f for f in zip_ref.namelist() 
                         if f.lower().endswith(('.tif', '.tiff'))]
            
            if not tiff_files:
                raise Exception("لا يوجد ملف GeoTIFF")
            
            tiff_file = tiff_files[0]
            
            with tempfile.TemporaryDirectory() as temp_dir:
                zip_ref.extract(tiff_file, temp_dir)
                tiff_path = os.path.join(temp_dir, tiff_file)
                
                with rasterio.open(tiff_path) as dataset:
                    # حساب عامل التصغير
                    scale_factor = min(max_size / dataset.width, max_size / dataset.height)
                    new_width = int(dataset.width * scale_factor)
                    new_height = int(dataset.height * scale_factor)
                    
                    # قراءة البيانات مع إعادة التحجيم
                    data = dataset.read(
                        out_shape=(dataset.count, new_height, new_width),
                        resampling=Resampling.bilinear
                    )
                    
                    # تحويل إلى صورة
                    if dataset.count == 1:
                        # صورة بالأبيض والأسود
                        img_array = data[0]
                        img_array = ((img_array - img_array.min()) / (img_array.max() - img_array.min()) * 255).astype(np.uint8)
                        image = Image.fromarray(img_array, mode='L')
                    elif dataset.count >= 3:
                        # صورة ملونة RGB
                        img_array = np.transpose(data[:3], (1, 2, 0))
                        # تطبيع القيم
                        for i in range(3):
                            band = img_array[:, :, i]
                            img_array[:, :, i] = ((band - band.min()) / (band.max() - band.min()) * 255).astype(np.uint8)
                        image = Image.fromarray(img_array.astype(np.uint8), mode='RGB')
                    else:
                        raise Exception("تنسيق الصورة غير مدعوم")
                    
                    # حفظ الصورة
                    image.save(output_path, 'PNG', optimize=True)
                    print(f"✅ تم إنشاء معاينة: {output_path}", file=sys.stderr)
                    
                    return {
                        'preview_width': new_width,
                        'preview_height': new_height,
                        'original_width': dataset.width,
                        'original_height': dataset.height
                    }
                    
    except Exception as e:
        print(f"❌ خطأ في إنشاء المعاينة: {str(e)}", file=sys.stderr)
        raise

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("الاستخدام: python geotiff_processor.py <zip_path> <command> [args]")
        sys.exit(1)
    
    zip_path = sys.argv[1]
    command = sys.argv[2]
    
    try:
        if command == "metadata":
            metadata = extract_geotiff_metadata(zip_path)
            print(json.dumps(metadata, ensure_ascii=False, indent=2))
        elif command == "preview":
            if len(sys.argv) < 4:
                print("الاستخدام: python geotiff_processor.py <zip_path> preview <output_path>")
                sys.exit(1)
            output_path = sys.argv[3]
            preview_info = create_preview_image(zip_path, output_path)
            print(json.dumps(preview_info, ensure_ascii=False, indent=2))
        else:
            print(f"أمر غير معروف: {command}")
            sys.exit(1)
            
    except Exception as e:
        print(f"خطأ: {str(e)}", file=sys.stderr)
        sys.exit(1)