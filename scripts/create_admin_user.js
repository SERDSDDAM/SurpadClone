#!/usr/bin/env node

// Script لإنشاء مستخدم admin مع bcrypt hashing
import bcrypt from 'bcryptjs';
import { neonConfig, Pool } from '@neondatabase/serverless';
import ws from 'ws';

// Configure Neon serverless
neonConfig.webSocketConstructor = ws;

async function createAdminUser() {
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL not found in environment variables');
    process.exit(1);
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  
  try {
    console.log('🔐 إنشاء مستخدم admin...');
    
    // كلمة المرور الافتراضية
    const defaultPassword = 'Admin@2025!';
    const saltRounds = 12;
    
    // تشفير كلمة المرور
    console.log('🔒 تشفير كلمة المرور...');
    const passwordHash = await bcrypt.hash(defaultPassword, saltRounds);
    
    // إدراج أو تحديث المستخدم
    const query = `
      INSERT INTO users (
        national_id,
        username, 
        email, 
        password, 
        role, 
        first_name, 
        last_name,
        phone,
        is_active
      ) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      ON CONFLICT (username) 
      DO UPDATE SET 
        password = EXCLUDED.password,
        role = EXCLUDED.role,
        updated_at = NOW()
      RETURNING id, username, role;
    `;
    
    const values = [
      'ADM001',
      'admin',
      'admin@banna-yemen.gov.ye', 
      passwordHash,
      'admin',
      'مدير',
      'النظام',
      '+967-1-000000',
      true
    ];
    
    const result = await pool.query(query, values);
    const user = result.rows[0];
    
    console.log('✅ تم إنشاء/تحديث المستخدم بنجاح:');
    console.log(`   📧 اسم المستخدم: ${user.username}`);
    console.log(`   🔑 كلمة المرور: ${defaultPassword}`);
    console.log(`   👤 الدور: ${user.role}`);
    console.log(`   🆔 المعرف: ${user.id}`);
    
    // إنشاء مستخدم موظف اختباري أيضاً
    const employeePassword = 'Employee@2025!';
    const employeePasswordHash = await bcrypt.hash(employeePassword, saltRounds);
    
    const employeeQuery = `
      INSERT INTO users (
        national_id,
        username, 
        email, 
        password, 
        role, 
        first_name, 
        last_name,
        phone,
        is_active
      ) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      ON CONFLICT (username) 
      DO UPDATE SET 
        password = EXCLUDED.password,
        updated_at = NOW()
      RETURNING id, username, role;
    `;
    
    const employeeValues = [
      'SUR001',
      'surveyor1',
      'surveyor1@banna-yemen.gov.ye', 
      employeePasswordHash,
      'surveyor',
      'أحمد',
      'المساح',
      '+967-1-111111',
      true
    ];
    
    const employeeResult = await pool.query(employeeQuery, employeeValues);
    const employee = employeeResult.rows[0];
    
    console.log('✅ تم إنشاء/تحديث الموظف بنجاح:');
    console.log(`   📧 اسم المستخدم: ${employee.username}`);
    console.log(`   🔑 كلمة المرور: ${employeePassword}`);
    console.log(`   👤 الدور: ${employee.role}`);
    
    console.log('\n🎉 جميع المستخدمين جاهزون للاستخدام!');
    console.log('\n📝 يمكنك الآن تسجيل الدخول باستخدام:');
    console.log('   - المدير: admin / Admin@2025!');
    console.log('   - المساح: surveyor1 / Employee@2025!');
    
  } catch (error) {
    console.error('❌ خطأ في إنشاء المستخدمين:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// تشغيل الدالة
createAdminUser().catch(console.error);