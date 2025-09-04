# ===============================================
# Dockerfile لنظام بنّاء اليمن - النشر المحلي
# ===============================================

# استخدام صورة Node.js الرسمية مع Alpine Linux
FROM node:18-alpine

# إعداد متغيرات البيئة
ENV NODE_ENV=development
ENV PORT=5000
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

# تثبيت Chromium وأدوات النظام المطلوبة
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    python3 \
    py3-pip \
    build-base \
    postgresql-client \
    curl \
    && rm -rf /var/cache/apk/*

# إعداد Puppeteer لاستخدام Chromium المثبت
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

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
RUN npm ci

# تثبيت أدوات التطوير العالمية
RUN npm install -g tsx typescript drizzle-kit

# نسخ المصدر الكامل
COPY . .

# إنشاء مجلدات مطلوبة
RUN mkdir -p temp-uploads attached_assets logs dist && \
    chmod 755 temp-uploads attached_assets logs dist

# إنشاء مستخدم غير مخول للأمان
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# تغيير ملكية المجلدات
RUN chown -R nextjs:nodejs /app

# التبديل إلى المستخدم الآمن
USER nextjs

# كشف المنفذ
EXPOSE 5000

# فحص صحة التطبيق
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:5000/api/health || exit 1

# الأمر الافتراضي لتشغيل التطبيق
CMD ["npm", "run", "dev"]