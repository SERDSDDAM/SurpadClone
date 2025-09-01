import { Router } from 'express';
import { authenticateToken } from '../routes/working-auth';
import { predictiveEngine } from '../services/PredictiveEngine';
import { db } from '../db';
import { 
  userPatterns, 
  predictionsLog, 
  smartRecommendations,
  predictiveModels 
} from '../../shared/advanced-rbac-schema';
import { eq, desc, and, gte } from 'drizzle-orm';

const router = Router();

/**
 * تحليل أنماط المستخدم
 */
router.get('/patterns/:userId', authenticateToken, async (req: any, res) => {
  try {
    const { userId } = req.params;
    
    // التحقق من صلاحية الوصول
    if (req.user?.claims?.sub !== userId && req.user?.role !== 'admin') {
      return res.status(403).json({ 
        error: 'غير مصرح لك بالوصول لهذه البيانات' 
      });
    }

    const patterns = await predictiveEngine.analyzeUserPatterns(userId);
    
    // حفظ النتائج في قاعدة البيانات
    await db.insert(userPatterns).values({
      userId,
      patternType: 'comprehensive_analysis',
      patternData: patterns,
      frequency: 1,
      confidenceScore: patterns.behaviorScore.toString()
    }).onConflictDoUpdate({
      target: [userPatterns.userId, userPatterns.patternType],
      set: {
        patternData: patterns,
        lastUpdated: new Date()
      }
    });

    res.json({
      success: true,
      data: patterns,
      message: 'تم تحليل أنماط المستخدم بنجاح'
    });
  } catch (error) {
    console.error('خطأ في تحليل أنماط المستخدم:', error);
    res.status(500).json({
      error: 'فشل في تحليل أنماط المستخدم',
      details: error instanceof Error ? error.message : 'خطأ غير معروف'
    });
  }
});

/**
 * التنبؤ بالاحتياجات المستقبلية
 */
router.get('/predictions/:userId', authenticateToken, async (req: any, res) => {
  try {
    const { userId } = req.params;
    
    // التحقق من صلاحية الوصول
    if (req.user?.claims?.sub !== userId && req.user?.role !== 'admin') {
      return res.status(403).json({ 
        error: 'غير مصرح لك بالوصول لهذه البيانات' 
      });
    }

    const predictions = await predictiveEngine.predictUserNeeds(userId);
    
    // حفظ التنبؤات في السجل
    await db.insert(predictionsLog).values({
      userId,
      predictionType: 'user_needs',
      predictedValue: predictions
    });

    res.json({
      success: true,
      data: predictions,
      message: 'تم إنتاج التنبؤات بنجاح'
    });
  } catch (error) {
    console.error('خطأ في التنبؤ بالاحتياجات:', error);
    res.status(500).json({
      error: 'فشل في التنبؤ بالاحتياجات',
      details: error instanceof Error ? error.message : 'خطأ غير معروف'
    });
  }
});

/**
 * التوصيات الذكية للمستخدم
 */
router.get('/recommendations/:userId', authenticateToken, async (req: any, res) => {
  try {
    const { userId } = req.params;
    
    // التحقق من صلاحية الوصول
    if (req.user?.claims?.sub !== userId && req.user?.role !== 'admin') {
      return res.status(403).json({ 
        error: 'غير مصرح لك بالوصول لهذه البيانات' 
      });
    }

    // جلب التوصيات النشطة للمستخدم
    const recommendations = await db
      .select()
      .from(smartRecommendations)
      .where(
        and(
          eq(smartRecommendations.userId, userId),
          eq(smartRecommendations.status, 'pending')
        )
      )
      .orderBy(desc(smartRecommendations.priority));

    // إنتاج توصيات جديدة إذا لم تكن موجودة
    if (recommendations.length === 0) {
      const predictions = await predictiveEngine.predictUserNeeds(userId);
      
      // إنشاء توصيات بناءً على التنبؤات
      const newRecommendations = [];
      
      // توصيات الصلاحيات
      for (const perm of predictions.upcomingPermissions.slice(0, 3)) {
        const recommendation = {
          userId,
          recommendationType: 'permission_optimization',
          title: `تحسين صلاحية ${perm.permission}`,
          description: `${perm.reasoning} - يُنصح بتفعيل هذه الصلاحية مسبقاً`,
          priority: Math.ceil(perm.probability * 10),
          recommendationData: {
            permission: perm.permission,
            probability: perm.probability,
            estimatedTime: perm.estimatedTime
          },
          expectedBenefit: `توفير ${Math.round(perm.probability * 30)} دقيقة في المعالجة`,
          confidenceScore: perm.probability.toString(),
          validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // أسبوع
        };
        
        newRecommendations.push(recommendation);
      }

      // توصيات تدفق العمل
      for (const workflow of predictions.suggestedWorkflows.slice(0, 2)) {
        const recommendation = {
          userId,
          recommendationType: 'workflow_optimization',
          title: `تحسين تدفق العمل: ${workflow.workflow}`,
          description: workflow.description,
          priority: Math.ceil(workflow.efficiency * 10),
          recommendationData: {
            workflow: workflow.workflow,
            efficiency: workflow.efficiency
          },
          expectedBenefit: `تحسين الكفاءة بنسبة ${Math.round(workflow.efficiency * 100)}%`,
          confidenceScore: workflow.efficiency.toString(),
          validUntil: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) // أسبوعين
        };
        
        newRecommendations.push(recommendation);
      }

      // حفظ التوصيات الجديدة
      if (newRecommendations.length > 0) {
        await db.insert(smartRecommendations).values(newRecommendations);
        
        // جلب التوصيات المحفوظة
        const savedRecommendations = await db
          .select()
          .from(smartRecommendations)
          .where(
            and(
              eq(smartRecommendations.userId, userId),
              eq(smartRecommendations.status, 'pending')
            )
          )
          .orderBy(desc(smartRecommendations.priority));

        return res.json({
          success: true,
          data: savedRecommendations,
          message: 'تم إنتاج توصيات جديدة بنجاح'
        });
      }
    }

    res.json({
      success: true,
      data: recommendations,
      message: 'تم جلب التوصيات بنجاح'
    });
  } catch (error) {
    console.error('خطأ في جلب التوصيات:', error);
    res.status(500).json({
      error: 'فشل في جلب التوصيات',
      details: error instanceof Error ? error.message : 'خطأ غير معروف'
    });
  }
});

/**
 * تنفيذ توصية
 */
router.put('/recommendations/:recommendationId/implement', authenticateToken, async (req: any, res) => {
  try {
    const { recommendationId } = req.params;
    const { feedback, rating } = req.body;

    const [recommendation] = await db
      .select()
      .from(smartRecommendations)
      .where(eq(smartRecommendations.id, recommendationId));

    if (!recommendation) {
      return res.status(404).json({ error: 'التوصية غير موجودة' });
    }

    // التحقق من صلاحية الوصول
    if (req.user?.claims?.sub !== recommendation.userId && req.user?.role !== 'admin') {
      return res.status(403).json({ 
        error: 'غير مصرح لك بتنفيذ هذه التوصية' 
      });
    }

    // تحديث حالة التوصية
    await db
      .update(smartRecommendations)
      .set({
        status: 'implemented',
        implementedAt: new Date(),
        userFeedback: { feedback, rating },
        effectivenessScore: rating ? (rating / 5).toString() : null,
        updatedAt: new Date()
      })
      .where(eq(smartRecommendations.id, recommendationId));

    res.json({
      success: true,
      message: 'تم تنفيذ التوصية بنجاح'
    });
  } catch (error) {
    console.error('خطأ في تنفيذ التوصية:', error);
    res.status(500).json({
      error: 'فشل في تنفيذ التوصية',
      details: error instanceof Error ? error.message : 'خطأ غير معروف'
    });
  }
});

/**
 * رفض توصية
 */
router.put('/recommendations/:recommendationId/reject', authenticateToken, async (req: any, res) => {
  try {
    const { recommendationId } = req.params;
    const { reason } = req.body;

    const [recommendation] = await db
      .select()
      .from(smartRecommendations)
      .where(eq(smartRecommendations.id, recommendationId));

    if (!recommendation) {
      return res.status(404).json({ error: 'التوصية غير موجودة' });
    }

    // التحقق من صلاحية الوصول
    if (req.user?.claims?.sub !== recommendation.userId && req.user?.role !== 'admin') {
      return res.status(403).json({ 
        error: 'غير مصرح لك برفض هذه التوصية' 
      });
    }

    // تحديث حالة التوصية
    await db
      .update(smartRecommendations)
      .set({
        status: 'rejected',
        userFeedback: { reason },
        updatedAt: new Date()
      })
      .where(eq(smartRecommendations.id, recommendationId));

    res.json({
      success: true,
      message: 'تم رفض التوصية'
    });
  } catch (error) {
    console.error('خطأ في رفض التوصية:', error);
    res.status(500).json({
      error: 'فشل في رفض التوصية',
      details: error instanceof Error ? error.message : 'خطأ غير معروف'
    });
  }
});

/**
 * تحسين استخدام الموارد
 */
router.get('/optimization/resources', authenticateToken, async (req: any, res) => {
  try {
    // التحقق من صلاحية الإدارة
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ 
        error: 'مطلوب صلاحيات إدارية للوصول لتحسين الموارد' 
      });
    }

    const optimization = await predictiveEngine.optimizeResources();

    res.json({
      success: true,
      data: optimization,
      message: 'تم تحليل تحسين الموارد بنجاح'
    });
  } catch (error) {
    console.error('خطأ في تحسين الموارد:', error);
    res.status(500).json({
      error: 'فشل في تحسين الموارد',
      details: error instanceof Error ? error.message : 'خطأ غير معروف'
    });
  }
});

/**
 * إحصائيات النماذج التنبؤية
 */
router.get('/models/stats', authenticateToken, async (req: any, res) => {
  try {
    // التحقق من صلاحية الإدارة
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ 
        error: 'مطلوب صلاحيات إدارية للوصول لإحصائيات النماذج' 
      });
    }

    const models = await db
      .select()
      .from(predictiveModels)
      .where(eq(predictiveModels.isActive, true));

    // إحصائيات التنبؤات
    const recentPredictions = await db
      .select()
      .from(predictionsLog)
      .where(gte(predictionsLog.predictionTimestamp, new Date(Date.now() - 24 * 60 * 60 * 1000)))
      .orderBy(desc(predictionsLog.predictionTimestamp));

    const stats = {
      activeModels: models.length,
      totalPredictions: recentPredictions.length,
      averageAccuracy: models.reduce((sum, model) => 
        sum + (parseFloat(model.accuracyScore || '0') || 0), 0) / (models.length || 1),
      recentPredictionTypes: recentPredictions.reduce((acc, pred) => {
        acc[pred.predictionType] = (acc[pred.predictionType] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    };

    res.json({
      success: true,
      data: {
        models,
        statistics: stats,
        recentPredictions: recentPredictions.slice(0, 10)
      },
      message: 'تم جلب إحصائيات النماذج بنجاح'
    });
  } catch (error) {
    console.error('خطأ في جلب إحصائيات النماذج:', error);
    res.status(500).json({
      error: 'فشل في جلب إحصائيات النماذج',
      details: error instanceof Error ? error.message : 'خطأ غير معروف'
    });
  }
});

/**
 * لوحة تحكم الذكاء التنبؤي
 */
router.get('/dashboard/:userId', authenticateToken, async (req: any, res) => {
  try {
    const { userId } = req.params;
    
    // التحقق من صلاحية الوصول
    if (req.user?.claims?.sub !== userId && req.user?.role !== 'admin') {
      return res.status(403).json({ 
        error: 'غير مصرح لك بالوصول لهذه اللوحة' 
      });
    }

    // جلب البيانات المختلفة
    const [patterns, predictions, recommendations] = await Promise.all([
      predictiveEngine.analyzeUserPatterns(userId),
      predictiveEngine.predictUserNeeds(userId),
      db.select()
        .from(smartRecommendations)
        .where(
          and(
            eq(smartRecommendations.userId, userId),
            eq(smartRecommendations.status, 'pending')
          )
        )
        .orderBy(desc(smartRecommendations.priority))
        .limit(5)
    ]);

    const dashboard = {
      userPatterns: patterns,
      predictions,
      activeRecommendations: recommendations,
      summary: {
        behaviorScore: patterns.behaviorScore,
        upcomingPermissions: predictions.upcomingPermissions.length,
        activeRecommendations: recommendations.length,
        efficiency: patterns.behaviorScore > 0.8 ? 'عالية' : patterns.behaviorScore > 0.5 ? 'متوسطة' : 'منخفضة'
      }
    };

    res.json({
      success: true,
      data: dashboard,
      message: 'تم جلب لوحة التحكم التنبؤية بنجاح'
    });
  } catch (error) {
    console.error('خطأ في جلب لوحة التحكم:', error);
    res.status(500).json({
      error: 'فشل في جلب لوحة التحكم التنبؤية',
      details: error instanceof Error ? error.message : 'خطأ غير معروف'
    });
  }
});

export default router;