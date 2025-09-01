import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const router = express.Router();

// مستخدمون مُعرّفون مسبقاً (للاختبار)
const SIMPLE_USERS = [
  {
    id: '1',
    username: 'admin',
    password: 'test', // Plain text for now
    firstName: 'مدير',
    lastName: 'النظام',
    role: 'admin',
    email: 'admin@banna-yemen.gov.ye'
  },
  {
    id: '2', 
    username: 'surveyor1',
    password: 'test', // Plain text for now
    firstName: 'أحمد',
    lastName: 'المساح',
    role: 'staff',
    email: 'surveyor1@banna-yemen.gov.ye'
  }
];

// إنشاء كلمات المرور المشفرة
async function generatePasswords() {
  console.log('Admin password hash:', await bcrypt.hash('Admin@2025!', 10));
  console.log('Employee password hash:', await bcrypt.hash('Employee@2025!', 10));
}

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ 
        error: 'Username and password are required',
        message: 'اسم المستخدم وكلمة المرور مطلوبان'
      });
    }

    // البحث عن المستخدم
    const user = SIMPLE_USERS.find(u => u.username === username);
    if (!user) {
      return res.status(401).json({ 
        error: 'Invalid credentials',
        message: 'اسم المستخدم أو كلمة المرور غير صحيحة'
      });
    }

    // التحقق من كلمة المرور (مبسط للاختبار)
    console.log('🔍 Password check - Input:', password, 'Expected:', user.password);
    const isPasswordValid = password === user.password || await bcrypt.compare(password, user.password);
    console.log('✅ Password validation result:', isPasswordValid);
    if (!isPasswordValid) {
      return res.status(401).json({ 
        error: 'Invalid credentials',
        message: 'اسم المستخدم أو كلمة المرور غير صحيحة'
      });
    }

    // إنشاء JWT Token
    const token = jwt.sign(
      {
        sub: user.id,
        username: user.username,
        role: user.role,
        email: user.email,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + (8 * 60 * 60), // 8 hours
        aud: 'banna-yemen-users',
        iss: 'banna-yemen-auth'
      }, 
      process.env.JWT_SECRET || 'fallback-secret-key-for-dev'
    );

    // إرجاع النتيجة
    res.json({
      success: true,
      message: 'تم تسجيل الدخول بنجاح',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: `${user.firstName} ${user.lastName}`
      },
      token
    });

  } catch (error) {
    console.error('🔴 Simple JWT Auth Login error:', error.message || error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'خطأ في الخادم. يرجى المحاولة مرة أخرى'
    });
  }
});

// التحقق من صحة الرمز المميز
router.get('/verify', (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret-key-for-dev');
    const user = SIMPLE_USERS.find(u => u.id === decoded.sub);
    
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    res.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: `${user.firstName} ${user.lastName}`
      }
    });

  } catch (error) {
    console.error('Token verification error:', error.message);
    res.status(401).json({ error: 'Invalid token' });
  }
});

// تسجيل الخروج (مجرد رسالة نجاح)
router.post('/logout', (req, res) => {
  res.json({ 
    success: true, 
    message: 'تم تسجيل الخروج بنجاح' 
  });
});

export default router;