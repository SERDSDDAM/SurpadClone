// Test script for upload functionality
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

async function testUploadSystem() {
  console.log('🔬 بدء اختبار شامل للنظام...');
  
  // Test 1: Check if Python is available
  console.log('\n1. اختبار Python...');
  try {
    const python = spawn('python3', ['--version']);
    python.stdout.on('data', (data) => {
      console.log('✅ Python متوفر:', data.toString().trim());
    });
    python.stderr.on('data', (data) => {
      console.log('Python stderr:', data.toString().trim());
    });
  } catch (error) {
    console.log('❌ خطأ في Python:', error);
  }
  
  // Test 2: Check directories
  console.log('\n2. اختبار المجلدات...');
  const dirs = [
    'temp-uploads',
    'temp-uploads/raw',
    'temp-uploads/processed'
  ];
  
  for (const dir of dirs) {
    try {
      await fs.promises.access(dir);
      console.log(`✅ المجلد موجود: ${dir}`);
    } catch (error) {
      console.log(`❌ المجلد مفقود: ${dir}`);
      await fs.promises.mkdir(dir, { recursive: true });
      console.log(`✅ تم إنشاء المجلد: ${dir}`);
    }
  }
  
  // Test 3: Check Python processor
  console.log('\n3. اختبار معالج Python...');
  const processorPath = path.join(process.cwd(), 'server', 'lib', 'enhanced-geotiff-processor.py');
  try {
    await fs.promises.access(processorPath);
    console.log('✅ معالج Python موجود');
  } catch (error) {
    console.log('❌ معالج Python مفقود');
  }
  
  // Test 4: Check test layer
  console.log('\n4. اختبار الطبقة التجريبية...');
  const testLayerPath = path.join(process.cwd(), 'temp-uploads', 'processed', 'test_layer_demo');
  try {
    await fs.promises.access(testLayerPath);
    const files = await fs.promises.readdir(testLayerPath);
    console.log('✅ الطبقة التجريبية موجودة:', files);
  } catch (error) {
    console.log('❌ الطبقة التجريبية مفقودة');
    // Create test layer
    await fs.promises.mkdir(testLayerPath, { recursive: true });
    console.log('✅ تم إنشاء مجلد الطبقة التجريبية');
  }
  
  console.log('\n🎯 انتهاء الاختبار الشامل');
}

if (require.main === module) {
  testUploadSystem().catch(console.error);
}

export { testUploadSystem };