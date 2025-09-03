import puppeteer from 'puppeteer';
import QRCode from 'qrcode';
import Handlebars from 'handlebars';
import fs from 'fs/promises';
import path from 'path';
// import { db } from '../../db';
// import { surveyRequests, streetStatusDecisions } from '../../shared/survey-schema';
// import { eq } from 'drizzle-orm';

export async function generateDecisionPdf(requestId: string) {
  try {
    // 1) جلب البيانات الأساسية - بيانات محاكاة للتطوير السريع
    const r = {
      id: requestId,
      request_number: 'SR-2025-' + Date.now().toString().slice(-6),
      owner_name: 'محمد أحمد اليمني',
      owner_phone: '777123456',
      governorate: 'صنعاء',
      directorate: 'شعوب',
      purpose: 'رخصة بناء سكنية',
      geometry_source: 'uploaded_shp',
      workflow_mode: 'shapefile',
      office_review_required: true,
      area: 500
    };

    // جلب قرار المكتب إن وجد - محاكاة
    const officeDecision = {
      streetCode: 'ST-MAIN-001',
      widthM: '15.0',
      classification: 'main',
      decidedBy: 'المهندس محمد الصنعاني',
      createdAt: new Date()
    };

    // 2) إعداد بيانات العرض
    const decisionNumber = `QM-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`;
    const verifyUrl = `${process.env.PUBLIC_URL || 'https://banaa.gov.ye'}/verify/${decisionNumber}`;
    const qrDataUrl = await QRCode.toDataURL(verifyUrl, { width: 256 });

    // حساب الاشتراطات حسب قرار المكتب
    let setbacks = null as null | { front: number; sides: number; rear: number };
    if (officeDecision?.widthM) {
      const widthM = parseFloat(officeDecision.widthM);
      setbacks = { 
        front: widthM >= 12 ? 5 : widthM >= 8 ? 3 : 2, 
        sides: 2, 
        rear: 2 
      };
    }

    // بيانات الحدود (محاكاة من البيانات المتاحة)
    const boundaries = [
      { side: 'الشمال', neighbor_type: 'شارع', length_m: 25.5, street_code: officeDecision?.streetCode || 'ST-001', street_width_m: officeDecision?.widthM || '12.0' },
      { side: 'الجنوب', neighbor_type: 'قطعة', length_m: 25.5, street_code: 'P-456', street_width_m: '-' },
      { side: 'الشرق', neighbor_type: 'قطعة', length_m: 20.0, street_code: 'P-457', street_width_m: '-' },
      { side: 'الغرب', neighbor_type: 'قطعة', length_m: 20.0, street_code: 'P-458', street_width_m: '-' }
    ];

    // 3) توليد HTML من القالب
    const templatePath = path.join(process.cwd(), 'server', 'templates', 'decision.hbs');
    let template: string;
    
    try {
      template = await fs.readFile(templatePath, 'utf8');
    } catch (error) {
      // استخدام قالب مدمج إذا لم يوجد الملف
      template = getEmbeddedTemplate();
    }
    
    const compile = Handlebars.compile(template);

    const html = compile({
      header: {
        decisionNumber,
        date: new Date().toLocaleDateString('ar-EG'),
        dateHijri: '1446/02/28هـ', // محاكاة
        governorate: r.governorate || 'صنعاء',
        directorate: r.directorate || 'شعوب',
        qrDataUrl
      },
      owner: { 
        name: r.ownerName || 'غير محدد', 
        phone: r.ownerPhone || '-',
        nationalId: '-' // مخفي للخصوصية
      },
      request: {
        requestNumber: r.requestNumber,
        purpose: r.purpose || 'قرار مساحي',
        geometrySource: r.geometrySource === 'uploaded_shp' ? 'ملف شيب فايل' : 'مسح GNSS ميداني',
        workflowMode: r.workflowMode === 'shapefile' ? 'المسار السريع' : 'المسار الميداني'
      },
      officeDecision: officeDecision ? {
        streetCode: officeDecision.streetCode,
        width: officeDecision.widthM,
        classification: officeDecision.classification === 'main' ? 'رئيسي' : 'فرعي',
        decidedBy: officeDecision.decidedBy,
        date: new Date(officeDecision.createdAt).toLocaleDateString('ar-EG')
      } : null,
      setbacks,
      boundaries,
      areas: {
        byPlan: r.area || null,
        byNature: r.area || null,
        difference: '0.0'
      },
      footer: {
        engineer: 'المهندس محمد الصنعاني',
        office: 'مكتب الأشغال العامة والطرق - المحافظة',
        note: r.geometrySource === 'uploaded_shp' ? 'تم الاعتماد عبر ملف الإسقاط السابق' : 'تم الاعتماد عبر المسح الميداني'
      }
    });

    // 4) تحويل HTML → PDF
    const browser = await puppeteer.launch({ 
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '10mm', right: '15mm', bottom: '12mm', left: '15mm' }
    });
    
    await browser.close();

    // 5) إعادة البيانات
    return { 
      pdf, 
      decisionNumber,
      requestData: {
        ownerName: r.ownerName,
        requestNumber: r.requestNumber,
        geometrySource: r.geometrySource,
        hasOfficeDecision: !!officeDecision
      }
    };

  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error(`Failed to generate PDF: ${error.message}`);
  }
}

// قالب HTML مدمج للطوارئ
function getEmbeddedTemplate(): string {
  return `<!doctype html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8" />
<style>
  body { 
    font-family: "Amiri", "Tahoma", "Arial Unicode MS", sans-serif; 
    direction: rtl; 
    color: #111; 
    line-height: 1.6;
    margin: 0;
    padding: 20px;
  }
  .header { 
    display: flex; 
    justify-content: space-between; 
    align-items: flex-start; 
    border-bottom: 2px solid #0066cc; 
    padding-bottom: 15px; 
    margin-bottom: 20px;
  }
  .header-info { flex: 1; }
  .title { font-size: 24px; font-weight: bold; color: #0066cc; margin-bottom: 10px; }
  .header-details { font-size: 14px; color: #333; }
  .qr-section { margin-right: 20px; text-align: center; }
  .section { margin-bottom: 20px; }
  .section-title { 
    font-size: 16px; 
    font-weight: bold; 
    background: #f0f7ff; 
    padding: 8px 12px; 
    border-right: 4px solid #0066cc;
    margin-bottom: 10px;
  }
  table { 
    width: 100%; 
    border-collapse: collapse; 
    margin-bottom: 15px;
  }
  th, td { 
    border: 1px solid #ddd; 
    padding: 8px; 
    font-size: 12px; 
    text-align: center;
  }
  th { background: #f8f9fa; font-weight: bold; }
  .footer { 
    margin-top: 30px; 
    border-top: 1px solid #ccc; 
    padding-top: 15px; 
    display: flex; 
    justify-content: space-between; 
    font-size: 11px; 
    color: #666;
  }
  .stamp-area {
    width: 150px;
    height: 100px;
    border: 2px dashed #ccc;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #999;
    font-size: 10px;
  }
</style>
</head>
<body>
<div class="header">
  <div class="header-info">
    <div class="title">الجمهورية اليمنية - قرار مساحي</div>
    <div class="header-details">
      <strong>رقم القرار:</strong> {{header.decisionNumber}}<br>
      <strong>التاريخ الميلادي:</strong> {{header.date}}<br>
      <strong>المحافظة:</strong> {{header.governorate}} - <strong>المديرية:</strong> {{header.directorate}}
    </div>
  </div>
  <div class="qr-section">
    <img src="{{header.qrDataUrl}}" alt="QR للتحقق" width="100" /><br>
    <small>رمز التحقق</small>
  </div>
</div>

<div class="section">
  <div class="section-title">بيانات صاحب الطلب</div>
  <table>
    <tr>
      <th>الاسم الكامل</th>
      <td>{{owner.name}}</td>
      <th>رقم الهاتف</th>
      <td>{{owner.phone}}</td>
    </tr>
    <tr>
      <th>رقم الطلب</th>
      <td>{{request.requestNumber}}</td>
      <th>الغرض من القرار</th>
      <td>{{request.purpose}}</td>
    </tr>
    <tr>
      <th>مصدر البيانات</th>
      <td>{{request.geometrySource}}</td>
      <th>نوع المسار</th>
      <td>{{request.workflowMode}}</td>
    </tr>
  </table>
</div>

{{#if officeDecision}}
<div class="section">
  <div class="section-title">قرار المكتب الإشرافي</div>
  <table>
    <tr>
      <th>رمز الشارع</th>
      <td>{{officeDecision.streetCode}}</td>
      <th>عرض الشارع (م)</th>
      <td>{{officeDecision.width}}</td>
    </tr>
    <tr>
      <th>تصنيف الشارع</th>
      <td>{{officeDecision.classification}}</td>
      <th>تاريخ القرار</th>
      <td>{{officeDecision.date}}</td>
    </tr>
  </table>
</div>
{{/if}}

<div class="section">
  <div class="section-title">الحدود والأطوال</div>
  <table>
    <tr>
      <th>الاتجاه</th>
      <th>نوع الجار</th>
      <th>الطول (متر)</th>
      <th>رمز الشارع/القطعة</th>
      <th>عرض الشارع (م)</th>
    </tr>
    {{#each boundaries}}
    <tr>
      <td>{{this.side}}</td>
      <td>{{this.neighbor_type}}</td>
      <td>{{this.length_m}}</td>
      <td>{{this.street_code}}</td>
      <td>{{this.street_width_m}}</td>
    </tr>
    {{/each}}
  </table>
</div>

{{#if setbacks}}
<div class="section">
  <div class="section-title">الاشتراطات والارتدادات (بالمتر)</div>
  <table>
    <tr>
      <th>الارتداد الأمامي</th>
      <th>الارتداد الجانبي</th>
      <th>الارتداد الخلفي</th>
    </tr>
    <tr>
      <td>{{setbacks.front}}</td>
      <td>{{setbacks.sides}}</td>
      <td>{{setbacks.rear}}</td>
    </tr>
  </table>
</div>
{{/if}}

<div class="section">
  <div class="section-title">المساحات</div>
  <table>
    <tr>
      <th>المساحة حسب المخطط</th>
      <th>المساحة الطبيعية</th>
      <th>الفرق</th>
    </tr>
    <tr>
      <td>{{areas.byPlan}} م²</td>
      <td>{{areas.byNature}} م²</td>
      <td>{{areas.difference}} م²</td>
    </tr>
  </table>
</div>

<div class="footer">
  <div>
    <strong>المهندس المشرف:</strong> {{footer.engineer}}<br>
    <strong>الجهة:</strong> {{footer.office}}
  </div>
  <div class="stamp-area">
    منطقة الختم<br>والتوقيع
  </div>
  <div>
    <strong>ملاحظة:</strong> {{footer.note}}<br>
    <small>هذا القرار صادر إلكترونياً ولا يحتاج ختم</small>
  </div>
</div>
</body>
</html>`;
}