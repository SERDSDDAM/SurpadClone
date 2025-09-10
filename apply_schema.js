// 🛠️ أداة تطبيق قاعدة البيانات تلقائياً

import { spawn } from 'child_process';

console.log('🚀 تطبيق مخطط قاعدة البيانات...');

const dbPush = spawn('npm', ['run', 'db:push', '--force'], {
  stdio: ['pipe', 'inherit', 'inherit']
});

// إرسال إجابة تلقائية لتأكيد إنشاء الجدول
setTimeout(() => {
  console.log('⚙️ إرسال تأكيد إنشاء الجدول...');
  dbPush.stdin.write('\n'); // اختيار الخيار الأول (create table)
}, 2000);

dbPush.on('close', (code) => {
  if (code === 0) {
    console.log('✅ تم تطبيق مخطط قاعدة البيانات بنجاح!');
  } else {
    console.error(`❌ فشل في تطبيق مخطط قاعدة البيانات. كود الخطأ: ${code}`);
  }
  process.exit(code);
});

dbPush.on('error', (error) => {
  console.error('❌ خطأ في تشغيل الأمر:', error);
  process.exit(1);
});