const fs = require('fs');
const FormData = require('form-data');
const fetch = require('node-fetch');

async function testDirectUpload() {
  console.log('🧪 اختبار الرفع المباشر...');
  
  try {
    // Check if image exists
    const imagePath = './attached_assets/image_1756416108776.png';
    if (!fs.existsSync(imagePath)) {
      console.log('❌ الصورة التجريبية غير موجودة');
      return;
    }
    
    console.log('✅ وجدت الصورة التجريبية');
    
    // Test enhanced upload endpoint
    const formData = new FormData();
    formData.append('file', fs.createReadStream(imagePath));
    
    console.log('🚀 إرسال طلب رفع محسن...');
    const response = await fetch('http://localhost:5000/api/gis/upload', {
      method: 'POST',
      body: formData,
      headers: formData.getHeaders()
    });
    
    const result = await response.json();
    console.log('📋 نتيجة الرفع:', result);
    
    if (result.layerId) {
      console.log('✅ تم الحصول على layerId:', result.layerId);
      
      // Wait and check status
      console.log('⏳ انتظار 3 ثوان للمعالجة...');
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      console.log('🔍 فحص حالة المعالجة...');
      const statusResponse = await fetch(`http://localhost:5000/api/gis/layers/${result.layerId}/status`);
      const statusResult = await statusResponse.json();
      console.log('📊 حالة المعالجة:', statusResult);
    }
    
  } catch (error) {
    console.error('❌ خطأ في الاختبار:', error.message);
  }
}

testDirectUpload();