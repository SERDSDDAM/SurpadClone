import { Router } from 'express';
import type { Request, Response } from 'express';
import { generateDecisionPdf } from '../services/pdf/decisionPdf';

const router = Router();

// مسار PDF منفصل ومبسط - يتجنب مشاكل قاعدة البيانات
router.get('/pdf/decisions/:decisionNumber/download', async (req: Request, res: Response) => {
  try {
    const requestId = String(req.query.requestId || 'demo-request');
    
    // توليد PDF مباشرة بدون تعقيدات قاعدة البيانات
    const { pdf, decisionNumber } = await generateDecisionPdf(requestId);
    
    // إعداد headers للـ PDF
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="قرار-مساحي-${decisionNumber}.pdf"`);
    res.setHeader('Content-Length', pdf.length);
    res.setHeader('Cache-Control', 'no-cache');
    
    res.send(pdf);
    
    console.log(`✅ PDF generated successfully: ${pdf.length} bytes for request ${requestId}`);
    
  } catch (error) {
    console.error('PDF generation error:', error);
    res.status(500).json({ 
      error: 'Failed to generate PDF',
      details: error.message,
      requestId: req.query.requestId
    });
  }
});

export default router;