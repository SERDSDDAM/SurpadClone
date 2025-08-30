# استخدام صورة Node.js الرسمية
FROM node:18-alpine

# إعداد مجلد العمل
WORKDIR /app

# نسخ ملفات package للاستفادة من التخزين المؤقت
COPY package*.json ./
COPY tsconfig.json ./
COPY vite.config.ts ./
COPY tailwind.config.ts ./
COPY postcss.config.js ./
COPY components.json ./
COPY drizzle.config.ts ./

# تثبيت التبعيات
RUN npm ci --only=production

# تثبيت أدوات التطوير المطلوبة
RUN npm install -g tsx typescript

# نسخ المصدر الكامل
COPY . .

# إنشاء مجلدات مطلوبة
RUN mkdir -p temp-uploads
RUN mkdir -p attached_assets
RUN mkdir -p logs

# إعطاء صلاحيات للمجلدات
RUN chmod 755 temp-uploads attached_assets logs

# إعداد متغيرات البيئة للتطوير  
ENV NODE_ENV=development
ENV PORT=5000

# كشف المنفذ
EXPOSE 5000

# الأمر الافتراضي لتشغيل التطبيق
CMD ["npm", "run", "dev"]