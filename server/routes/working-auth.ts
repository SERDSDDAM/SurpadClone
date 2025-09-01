import express from 'express';
import jwt from 'jsonwebtoken';

const router = express.Router();

// مستخدمون للاختبار
const TEST_USERS = [
  {
    id: '1',
    username: 'admin',
    password: 'admin123',
    firstName: 'مدير',
    lastName: 'النظام',
    role: 'admin',
    email: 'admin@banna-yemen.gov.ye'
  },
  {
    id: '2',
    username: 'surveyor1',
    password: 'surveyor123',
    firstName: 'أحمد',
    lastName: 'المساح',
    role: 'staff',
    email: 'surveyor1@banna-yemen.gov.ye'
  }
];

router.post('/login', (req, res) => {
  try {
    const { username, password } = req.body;
    
    console.log('🔍 Login attempt:', { username, password });
    
    if (!username || !password) {
      return res.status(400).json({ 
        error: 'Username and password are required',
        message: 'اسم المستخدم وكلمة المرور مطلوبان'
      });
    }

    // البحث عن المستخدم
    const user = TEST_USERS.find(u => u.username === username);
    if (!user) {
      console.log('❌ User not found:', username);
      return res.status(401).json({ 
        error: 'Invalid credentials',
        message: 'اسم المستخدم أو كلمة المرور غير صحيحة'
      });
    }

    // التحقق من كلمة المرور
    if (password !== user.password) {
      console.log('❌ Wrong password for:', username);
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
        email: user.email
      }, 
      process.env.JWT_SECRET || 'dev-secret-key',
      { expiresIn: '8h' }
    );

    console.log('✅ Login successful for:', username);

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
    console.error('🔴 Login error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'خطأ في الخادم. يرجى المحاولة مرة أخرى'
    });
  }
});

// endpoint للتحقق من صحة التوكن
router.get('/me', (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        error: 'No token provided',
        message: 'لم يتم توفير رمز المصادقة'
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret-key') as any;
      
      // البحث عن المستخدم
      const user = TEST_USERS.find(u => u.id === decoded.sub);
      if (!user) {
        return res.status(401).json({ 
          error: 'User not found',
          message: 'المستخدم غير موجود'
        });
      }

      console.log('✅ Token verified for user:', user.username);

      res.json({
        success: true,
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

    } catch (jwtError) {
      console.log('❌ Invalid token:', jwtError);
      return res.status(401).json({ 
        error: 'Invalid token',
        message: 'رمز المصادقة غير صالح'
      });
    }

  } catch (error) {
    console.error('🔴 Token verification error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'خطأ في الخادم'
    });
  }
});

export default router;