// مساعد لإنشاء مستخدم admin افتراضي
const bcrypt = require('bcryptjs');
const { randomUUID } = require('crypto');

// إنشاء مستخدم admin افتراضي
const adminPassword = bcrypt.hashSync('Admin@2025!', 12);
const surveyorPassword = bcrypt.hashSync('Employee@2025!', 12);

const adminUser = {
  id: randomUUID(),
  nationalId: 'admin-default-001',
  username: 'admin',
  email: 'admin@banna-yemen.gov.ye',
  password: adminPassword,
  firstName: 'مدير',
  lastName: 'النظام',
  name: 'مدير النظام الرئيسي',
  role: 'admin',
  status: 'active',
  isActive: true,
  isVerified: true,
  phone: '+967-1-000000',
  department: 'إدارة النظام',
  position: 'مدير النظام',
  createdAt: new Date(),
  updatedAt: new Date()
};

const surveyorUser = {
  id: randomUUID(),
  nationalId: 'surveyor-default-001',
  username: 'surveyor1',
  email: 'surveyor@banna-yemen.gov.ye',
  password: surveyorPassword,
  firstName: 'مساح',
  lastName: 'ميداني',
  name: 'مساح ميداني أول',
  role: 'surveyor',
  status: 'active',
  isActive: true,
  isVerified: true,
  phone: '+967-1-111111',
  department: 'المسح الميداني',
  position: 'مساح ميداني',
  createdAt: new Date(),
  updatedAt: new Date()
};

console.log('Default users created:');
console.log('Admin User:', adminUser);
console.log('Surveyor User:', surveyorUser);

module.exports = { adminUser, surveyorUser };