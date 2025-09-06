# بدائل إنتاج PDF بدون Chromium

## 🎯 الهدف
إضافة إنتاج PDF للنسخة المبسطة بدون استخدام Puppeteer/Chromium

## 🔧 البدائل المتاحة

### 1. wkhtmltopdf (الأسرع للتطبيق)
```dockerfile
# إضافة للـ Dockerfile.production
RUN apk add --no-cache wkhtmltopdf
```

```javascript
// استبدال puppeteer بـ wkhtmltopdf
const wkhtmltopdf = require('wkhtmltopdf');

const generatePDF = (htmlContent) => {
  return new Promise((resolve, reject) => {
    wkhtmltopdf(htmlContent, { pageSize: 'A4' }, (err, stream) => {
      if (err) return reject(err);
      resolve(stream);
    });
  });
};
```

### 2. jsPDF (JavaScript خالص)
```bash
npm install jspdf html2canvas
```

```javascript
// إنتاج PDF من الواجهة الأمامية
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const generateClientPDF = async (elementId) => {
  const canvas = await html2canvas(document.getElementById(elementId));
  const imgData = canvas.toDataURL('image/png');
  
  const pdf = new jsPDF();
  pdf.addImage(imgData, 'PNG', 0, 0);
  return pdf;
};
```

### 3. PDFKit (للمستندات المنسقة)
```bash
npm install pdfkit
```

```javascript
// إنشاء PDF منسق برمجياً
const PDFDocument = require('pdfkit');

const createStructuredPDF = (data) => {
  const doc = new PDFDocument();
  doc.fontSize(20).text('القرار المساحي', 100, 100);
  doc.fontSize(12).text(`رقم القرار: ${data.decisionNumber}`, 100, 150);
  return doc;
};
```

### 4. HTML-PDF (Node.js)
```bash
npm install html-pdf
```

```javascript
const pdf = require('html-pdf');

const htmlToPdf = (html) => {
  return new Promise((resolve, reject) => {
    pdf.create(html, { format: 'A4' }).toBuffer((err, buffer) => {
      if (err) return reject(err);
      resolve(buffer);
    });
  });
};
```

## 🚀 التوصية للتطبيق السريع

**استخدم wkhtmltopdf** - الأسرع والأكثر موثوقية:

1. **إضافة للـ Dockerfile.production:**
```dockerfile
RUN apk add --no-cache wkhtmltopdf ttf-dejavu
```

2. **تحديث server/services/pdf/decisionPdf.ts:**
```javascript
import { exec } from 'child_process';
import { writeFileSync, readFileSync } from 'fs';

export const generateDecisionPDF = async (htmlContent: string) => {
  const tempHtmlPath = `/tmp/decision-${Date.now()}.html`;
  const tempPdfPath = `/tmp/decision-${Date.now()}.pdf`;
  
  writeFileSync(tempHtmlPath, htmlContent);
  
  return new Promise((resolve, reject) => {
    exec(`wkhtmltopdf ${tempHtmlPath} ${tempPdfPath}`, (error) => {
      if (error) return reject(error);
      const pdfBuffer = readFileSync(tempPdfPath);
      resolve(pdfBuffer);
    });
  });
};
```

3. **تفعيل في docker-compose.production.yml:**
```yaml
environment:
  - PDF_SERVICE_ENABLED=true
  - PDF_ENGINE=wkhtmltopdf
```

## 📊 مقارنة البدائل

| البديل | حجم إضافي | سرعة | جودة | تعقيد |
|--------|-----------|------|------|--------|
| wkhtmltopdf | ~50MB | ⚡⚡⚡ | ⭐⭐⭐ | ⭐ |
| jsPDF | ~5MB | ⚡⚡ | ⭐⭐ | ⭐⭐ |
| PDFKit | ~2MB | ⚡⚡⚡ | ⭐⭐⭐⭐ | ⭐⭐⭐ |
| html-pdf | ~30MB | ⚡⚡ | ⭐⭐⭐ | ⭐⭐ |

**wkhtmltopdf هو الخيار الأمثل للبداية**