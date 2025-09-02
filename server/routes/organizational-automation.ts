// APIs لأتمتة الهيكل التنظيمي والإداري
import { Router } from 'express';
import { OrganizationalAutomationEngine } from '../services/OrganizationalAutomationEngine';

const router = Router();
const organizationalEngine = new OrganizationalAutomationEngine();

// تعيين المهام تلقائياً
router.post('/assign-task', async (req, res) => {
  try {
    const taskData = req.body;
    
    // التحقق من صحة البيانات
    if (!taskData.title || !taskData.type || !taskData.sector) {
      return res.status(400).json({
        success: false,
        error: 'البيانات الأساسية مطلوبة (العنوان، النوع، القطاع)'
      });
    }

    const result = await organizationalEngine.assignTask(taskData);
    
    res.json({
      success: true,
      assignment: result,
      message: 'تم تحليل المهمة وتعيينها بنجاح'
    });
  } catch (error) {
    console.error('خطأ في تعيين المهمة:', error);
    res.status(500).json({
      success: false,
      error: 'خطأ داخلي في النظام'
    });
  }
});

// إضافة مستوى تنظيمي جديد
router.post('/add-organizational-level', async (req, res) => {
  try {
    const levelData = req.body;
    const result = await organizationalEngine.addOrganizationalLevel(levelData);
    
    if (result.success) {
      res.json({
        success: true,
        level: result.level,
        message: result.message
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.message
      });
    }
  } catch (error) {
    console.error('خطأ في إضافة المستوى التنظيمي:', error);
    res.status(500).json({
      success: false,
      error: 'خطأ داخلي في النظام'
    });
  }
});

// إضافة مستوى وظيفي
router.post('/add-job-level/:levelId', async (req, res) => {
  try {
    const { levelId } = req.params;
    const jobLevelData = req.body;
    
    const result = await organizationalEngine.addJobLevel(levelId, jobLevelData);
    
    if (result.success) {
      res.json({
        success: true,
        jobLevel: result.jobLevel,
        message: result.message
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.message
      });
    }
  } catch (error) {
    console.error('خطأ في إضافة المستوى الوظيفي:', error);
    res.status(500).json({
      success: false,
      error: 'خطأ داخلي في النظام'
    });
  }
});

// الحصول على جميع المستويات التنظيمية
router.get('/organizational-levels', async (req, res) => {
  try {
    const levels = await organizationalEngine.getAllOrganizationalLevels();
    
    res.json({
      success: true,
      levels,
      totalCount: levels.length,
      message: 'تم جلب المستويات التنظيمية بنجاح'
    });
  } catch (error) {
    console.error('خطأ في جلب المستويات التنظيمية:', error);
    res.status(500).json({
      success: false,
      error: 'خطأ داخلي في النظام'
    });
  }
});

// الحصول على الهيكل التنظيمي الهرمي
router.get('/hierarchy', async (req, res) => {
  try {
    const hierarchyData = await organizationalEngine.getOrganizationalHierarchy();
    
    res.json({
      success: true,
      ...hierarchyData,
      message: 'تم جلب الهيكل التنظيمي بنجاح'
    });
  } catch (error) {
    console.error('خطأ في جلب الهيكل التنظيمي:', error);
    res.status(500).json({
      success: false,
      error: 'خطأ داخلي في النظام'
    });
  }
});

// البحث في الهيكل التنظيمي
router.get('/search', async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query || typeof query !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'نص البحث مطلوب'
      });
    }

    const results = await organizationalEngine.searchOrganizationalStructure(query);
    
    res.json({
      success: true,
      ...results,
      message: `تم العثور على ${results.totalResults} نتيجة`
    });
  } catch (error) {
    console.error('خطأ في البحث:', error);
    res.status(500).json({
      success: false,
      error: 'خطأ داخلي في النظام'
    });
  }
});

// الحصول على تفاصيل مستوى تنظيمي محدد
router.get('/organizational-level/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const levels = await organizationalEngine.getAllOrganizationalLevels();
    const level = levels.find(l => l.id === id);
    
    if (!level) {
      return res.status(404).json({
        success: false,
        error: 'المستوى التنظيمي غير موجود'
      });
    }

    res.json({
      success: true,
      level,
      message: 'تم جلب تفاصيل المستوى التنظيمي بنجاح'
    });
  } catch (error) {
    console.error('خطأ في جلب تفاصيل المستوى التنظيمي:', error);
    res.status(500).json({
      success: false,
      error: 'خطأ داخلي في النظام'
    });
  }
});

// اختبار توزيع المهام (محاكاة)
router.post('/simulate-task-assignment', async (req, res) => {
  try {
    const { taskData, scenarios } = req.body;
    
    if (!taskData) {
      return res.status(400).json({
        success: false,
        error: 'بيانات المهمة مطلوبة'
      });
    }

    const results = [];
    
    // اختبار السيناريو الأساسي
    const baseResult = await organizationalEngine.assignTask(taskData);
    results.push({
      scenario: 'السيناريو الأساسي',
      result: baseResult
    });
    
    // اختبار سيناريوهات إضافية إذا تم توفيرها
    if (scenarios && Array.isArray(scenarios)) {
      for (const scenario of scenarios) {
        const modifiedTaskData = { ...taskData, ...scenario.modifications };
        const scenarioResult = await organizationalEngine.assignTask(modifiedTaskData);
        results.push({
          scenario: scenario.name,
          result: scenarioResult
        });
      }
    }

    res.json({
      success: true,
      simulationResults: results,
      message: 'تم تشغيل محاكاة توزيع المهام بنجاح'
    });
  } catch (error) {
    console.error('خطأ في محاكاة توزيع المهام:', error);
    res.status(500).json({
      success: false,
      error: 'خطأ داخلي في النظام'
    });
  }
});

// إحصائيات الهيكل التنظيمي
router.get('/statistics', async (req, res) => {
  try {
    const levels = await organizationalEngine.getAllOrganizationalLevels();
    
    // إحصائيات عامة
    const statistics = {
      totalOrganizationalLevels: levels.length,
      levelsByType: {} as Record<string, number>,
      totalJobLevels: 0,
      totalOrganizationalUnits: 0,
      totalEmployees: 0,
      totalBudget: 0,
      activeEntities: 0,
      averageEmployeesPerLevel: 0,
      levelDistribution: {} as Record<number, number>
    };
    
    // حساب الإحصائيات
    for (const level of levels) {
      // التجميع حسب النوع
      if (!statistics.levelsByType[level.type]) {
        statistics.levelsByType[level.type] = 0;
      }
      statistics.levelsByType[level.type]++;
      
      // العدد الإجمالي للمستويات الوظيفية
      statistics.totalJobLevels += level.jobLevels.length;
      
      // العدد الإجمالي للوحدات التنظيمية
      statistics.totalOrganizationalUnits += level.organizationalUnits.length;
      
      // العدد الإجمالي للموظفين
      if (level.employeeCount) {
        statistics.totalEmployees += level.employeeCount;
      }
      
      // الميزانية الإجمالية
      if (level.budget) {
        statistics.totalBudget += level.budget;
      }
      
      // الكيانات النشطة
      if (level.isActive) {
        statistics.activeEntities++;
      }
      
      // التوزيع حسب المستوى
      if (!statistics.levelDistribution[level.level]) {
        statistics.levelDistribution[level.level] = 0;
      }
      statistics.levelDistribution[level.level]++;
    }
    
    // متوسط الموظفين لكل مستوى
    statistics.averageEmployeesPerLevel = statistics.totalEmployees / levels.length;

    res.json({
      success: true,
      statistics,
      message: 'تم جلب إحصائيات الهيكل التنظيمي بنجاح'
    });
  } catch (error) {
    console.error('خطأ في جلب الإحصائيات:', error);
    res.status(500).json({
      success: false,
      error: 'خطأ داخلي في النظام'
    });
  }
});

// تقرير الكفاءة التنظيمية
router.get('/efficiency-report', async (req, res) => {
  try {
    const levels = await organizationalEngine.getAllOrganizationalLevels();
    
    const efficiencyReport = {
      organizationalHealth: {
        score: 0,
        factors: [] as Array<{name: string, score: number, status: string}>
      },
      recommendations: [] as string[],
      strengths: [] as string[],
      weaknesses: [] as string[],
      opportunities: [] as string[]
    };
    
    // تقييم الصحة التنظيمية
    let healthScore = 0;
    let totalFactors = 0;
    
    // عامل 1: التوزيع المتوازن للمستويات
    const levelCounts = levels.reduce((acc, level) => {
      acc[level.level] = (acc[level.level] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);
    
    const isBalanced = Object.values(levelCounts).every((count: number) => count <= 10);
    if (isBalanced) {
      healthScore += 25;
      efficiencyReport.organizationalHealth.factors.push({
        name: 'التوزيع المتوازن للمستويات',
        score: 25,
        status: 'جيد'
      });
    } else {
      efficiencyReport.organizationalHealth.factors.push({
        name: 'التوزيع المتوازن للمستويات',
        score: 10,
        status: 'يحتاج تحسين'
      });
      healthScore += 10;
    }
    totalFactors++;
    
    // عامل 2: وضوح المسؤوليات
    const levelsWithResponsibilities = levels.filter(l => l.responsibilities.length > 0).length;
    const responsibilityScore = (levelsWithResponsibilities / levels.length) * 25;
    healthScore += responsibilityScore;
    efficiencyReport.organizationalHealth.factors.push({
      name: 'وضوح المسؤوليات',
      score: responsibilityScore,
      status: responsibilityScore > 20 ? 'ممتاز' : responsibilityScore > 15 ? 'جيد' : 'يحتاج تحسين'
    });
    totalFactors++;
    
    // عامل 3: تنوع المستويات الوظيفية
    const totalJobLevels = levels.reduce((sum, level) => sum + level.jobLevels.length, 0);
    const jobLevelScore = Math.min((totalJobLevels / levels.length) * 5, 25);
    healthScore += jobLevelScore;
    efficiencyReport.organizationalHealth.factors.push({
      name: 'تنوع المستويات الوظيفية',
      score: jobLevelScore,
      status: jobLevelScore > 20 ? 'ممتاز' : jobLevelScore > 15 ? 'جيد' : 'يحتاج تحسين'
    });
    totalFactors++;
    
    // عامل 4: الكيانات النشطة
    const activePercentage = (levels.filter(l => l.isActive).length / levels.length) * 25;
    healthScore += activePercentage;
    efficiencyReport.organizationalHealth.factors.push({
      name: 'نسبة الكيانات النشطة',
      score: activePercentage,
      status: activePercentage > 20 ? 'ممتاز' : activePercentage > 15 ? 'جيد' : 'يحتاج تحسين'
    });
    totalFactors++;
    
    efficiencyReport.organizationalHealth.score = Math.round(healthScore);
    
    // التوصيات
    if (healthScore < 60) {
      efficiencyReport.recommendations.push("مراجعة شاملة للهيكل التنظيمي");
      efficiencyReport.recommendations.push("تحديث المسؤوليات والاختصاصات");
    }
    
    if (responsibilityScore < 15) {
      efficiencyReport.recommendations.push("تحديد المسؤوليات بوضوح أكبر");
    }
    
    if (jobLevelScore < 15) {
      efficiencyReport.recommendations.push("إضافة مستويات وظيفية متنوعة");
    }
    
    // نقاط القوة
    if (isBalanced) {
      efficiencyReport.strengths.push("توزيع متوازن للمستويات التنظيمية");
    }
    
    if (activePercentage > 20) {
      efficiencyReport.strengths.push("نسبة عالية من الكيانات النشطة");
    }
    
    // نقاط الضعف
    if (!isBalanced) {
      efficiencyReport.weaknesses.push("عدم توازن في توزيع المستويات التنظيمية");
    }
    
    if (responsibilityScore < 15) {
      efficiencyReport.weaknesses.push("عدم وضوح في تحديد المسؤوليات");
    }
    
    // الفرص
    efficiencyReport.opportunities.push("تطبيق أتمتة أكبر في توزيع المهام");
    efficiencyReport.opportunities.push("تحسين التنسيق بين المستويات التنظيمية");
    efficiencyReport.opportunities.push("تطوير نظام مراقبة الأداء");

    res.json({
      success: true,
      efficiencyReport,
      message: 'تم إنشاء تقرير الكفاءة التنظيمية بنجاح'
    });
  } catch (error) {
    console.error('خطأ في إنشاء تقرير الكفاءة:', error);
    res.status(500).json({
      success: false,
      error: 'خطأ داخلي في النظام'
    });
  }
});

export default router;