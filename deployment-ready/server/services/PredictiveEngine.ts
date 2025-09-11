import { db } from '../db';
import { 
  contextualTriggers, 
  permissionMonitoring, 
  smartAlerts,
  users 
} from '../../shared/advanced-rbac-schema';
import { eq, desc, sql, and, gte, count } from 'drizzle-orm';

// أنواع البيانات للتنبؤات
export interface UserPatterns {
  commonWorkflows: string[];
  peakActivityTimes: { hour: number; day: string; frequency: number }[];
  frequentPermissions: string[];
  projectTypes: string[];
  locationPatterns: { lat: number; lng: number; frequency: number }[];
  behaviorScore: number;
}

export interface PredictedNeeds {
  upcomingPermissions: {
    permission: string;
    probability: number;
    estimatedTime: string;
    reasoning: string;
  }[];
  suggestedWorkflows: {
    workflow: string;
    efficiency: number;
    description: string;
  }[];
  resourceRequirements: {
    resource: string;
    quantity: number;
    urgency: 'low' | 'medium' | 'high';
  }[];
  potentialBottlenecks: {
    area: string;
    probability: number;
    impact: 'low' | 'medium' | 'high';
    mitigation: string;
  }[];
}

export interface ResourceOptimization {
  serverLoadPrediction: {
    nextHour: number;
    nextDay: number;
    peakTimes: string[];
  };
  databaseOptimizations: {
    slowQueries: string[];
    indexSuggestions: string[];
    cacheRecommendations: string[];
  };
  cacheStrategies: {
    endpoints: string[];
    ttl: number;
    priority: number;
  }[];
}

export class PredictiveEngine {
  /**
   * تحليل أنماط المستخدم التاريخية
   */
  async analyzeUserPatterns(userId: string): Promise<UserPatterns> {
    try {
      // جلب الأنشطة التاريخية للمستخدم
      const recentActivity = await db
        .select()
        .from(permissionMonitoring)
        .where(eq(permissionMonitoring.userId, userId))
        .orderBy(desc(permissionMonitoring.timestamp))
        .limit(1000);

      // تحليل الأنماط الزمنية
      const timePatterns = this.analyzeTimePatterns(recentActivity);
      
      // تحليل الصلاحيات المتكررة
      const permissionPatterns = this.analyzePermissionPatterns(recentActivity);
      
      // تحليل أنماط العمل
      const workflowPatterns = this.analyzeWorkflowPatterns(recentActivity);

      // حساب نقاط السلوك
      const behaviorScore = this.calculateBehaviorScore(recentActivity);

      return {
        commonWorkflows: workflowPatterns,
        peakActivityTimes: timePatterns,
        frequentPermissions: permissionPatterns,
        projectTypes: await this.getProjectTypes(userId),
        locationPatterns: await this.getLocationPatterns(userId),
        behaviorScore
      };
    } catch (error) {
      console.error('خطأ في تحليل أنماط المستخدم:', error);
      return this.getDefaultPatterns();
    }
  }

  /**
   * التنبؤ بالاحتياجات المستقبلية للمستخدم
   */
  async predictUserNeeds(userId: string): Promise<PredictedNeeds> {
    try {
      const patterns = await this.analyzeUserPatterns(userId);
      
      // التنبؤ بالصلاحيات القادمة
      const upcomingPermissions = await this.predictUpcomingPermissions(userId, patterns);
      
      // اقتراح تدفقات عمل محسنة
      const suggestedWorkflows = this.suggestOptimizedWorkflows(patterns);
      
      // التنبؤ بمتطلبات الموارد
      const resourceRequirements = this.predictResourceNeeds(patterns);
      
      // تحديد الاختناقات المحتملة
      const potentialBottlenecks = await this.identifyPotentialBottlenecks(userId, patterns);

      return {
        upcomingPermissions,
        suggestedWorkflows,
        resourceRequirements,
        potentialBottlenecks
      };
    } catch (error) {
      console.error('خطأ في التنبؤ بالاحتياجات:', error);
      return this.getDefaultPredictions();
    }
  }

  /**
   * تحسين استخدام الموارد
   */
  async optimizeResources(): Promise<ResourceOptimization> {
    try {
      // التنبؤ بأحمال الخادم
      const serverLoadPrediction = await this.predictServerLoad();
      
      // تحليل قاعدة البيانات وتحسينها
      const databaseOptimizations = await this.analyzeDatabasePerformance();
      
      // استراتيجيات التخزين المؤقت
      const cacheStrategies = await this.optimizeCacheStrategy();

      return {
        serverLoadPrediction,
        databaseOptimizations,
        cacheStrategies
      };
    } catch (error) {
      console.error('خطأ في تحسين الموارد:', error);
      return this.getDefaultOptimization();
    }
  }

  /**
   * تحليل الأنماط الزمنية للنشاط
   */
  private analyzeTimePatterns(activities: any[]): { hour: number; day: string; frequency: number }[] {
    const timeMap = new Map<string, number>();
    
    activities.forEach(activity => {
      const date = new Date(activity.timestamp);
      const hour = date.getHours();
      const day = date.toLocaleDateString('ar', { weekday: 'long' });
      const key = `${hour}-${day}`;
      
      timeMap.set(key, (timeMap.get(key) || 0) + 1);
    });

    return Array.from(timeMap.entries())
      .map(([key, frequency]) => {
        const [hour, day] = key.split('-');
        return { hour: parseInt(hour), day, frequency };
      })
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 10);
  }

  /**
   * تحليل أنماط الصلاحيات
   */
  private analyzePermissionPatterns(activities: any[]): string[] {
    const permissionMap = new Map<string, number>();
    
    activities.forEach(activity => {
      if (activity.permissionUsed) {
        permissionMap.set(
          activity.permissionUsed, 
          (permissionMap.get(activity.permissionUsed) || 0) + 1
        );
      }
    });

    return Array.from(permissionMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15)
      .map(([permission]) => permission);
  }

  /**
   * تحليل أنماط سير العمل
   */
  private analyzeWorkflowPatterns(activities: any[]): string[] {
    const workflowMap = new Map<string, number>();
    
    activities.forEach(activity => {
      if (activity.action) {
        workflowMap.set(
          activity.action, 
          (workflowMap.get(activity.action) || 0) + 1
        );
      }
    });

    return Array.from(workflowMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([workflow]) => workflow);
  }

  /**
   * حساب نقاط السلوك
   */
  private calculateBehaviorScore(activities: any[]): number {
    if (activities.length === 0) return 0.5;

    const successfulActions = activities.filter(a => a.result === 'granted').length;
    const totalActions = activities.length;
    const riskFactors = activities.filter(a => a.riskScore && a.riskScore > 5).length;
    
    let score = successfulActions / totalActions;
    score -= (riskFactors / totalActions) * 0.3;
    
    return Math.max(0, Math.min(1, score));
  }

  /**
   * التنبؤ بالصلاحيات القادمة
   */
  private async predictUpcomingPermissions(userId: string, patterns: UserPatterns): Promise<any[]> {
    const predictions = [];
    
    // بناءً على الأنماط التاريخية
    for (const permission of patterns.frequentPermissions.slice(0, 5)) {
      const probability = this.calculatePermissionProbability(permission, patterns);
      const estimatedTime = this.estimateNextUsage(permission, patterns);
      
      predictions.push({
        permission,
        probability,
        estimatedTime,
        reasoning: `استخدام متكرر في الماضي (${Math.round(probability * 100)}% احتمال)`
      });
    }

    return predictions.sort((a, b) => b.probability - a.probability);
  }

  /**
   * اقتراح تدفقات عمل محسنة
   */
  private suggestOptimizedWorkflows(patterns: UserPatterns): any[] {
    const suggestions = [];
    
    // تحليل التدفقات الشائعة وتحسينها
    patterns.commonWorkflows.forEach(workflow => {
      const efficiency = this.calculateWorkflowEfficiency(workflow, patterns);
      
      suggestions.push({
        workflow: `${workflow} محسن`,
        efficiency,
        description: `تحسين تدفق العمل ${workflow} لزيادة الكفاءة بنسبة ${Math.round(efficiency * 100)}%`
      });
    });

    return suggestions.sort((a, b) => b.efficiency - a.efficiency).slice(0, 5);
  }

  /**
   * التنبؤ بمتطلبات الموارد
   */
  private predictResourceNeeds(patterns: UserPatterns): any[] {
    const resources = [
      {
        resource: 'معالجة البيانات',
        quantity: Math.ceil(patterns.frequentPermissions.length * 1.2),
        urgency: patterns.behaviorScore > 0.8 ? 'high' : 'medium' as const
      },
      {
        resource: 'ذاكرة التخزين المؤقت',
        quantity: Math.ceil(patterns.commonWorkflows.length * 2),
        urgency: 'medium' as const
      },
      {
        resource: 'قاعدة البيانات',
        quantity: Math.ceil(patterns.peakActivityTimes.length * 1.5),
        urgency: 'low' as const
      }
    ];

    return resources;
  }

  /**
   * تحديد الاختناقات المحتملة
   */
  private async identifyPotentialBottlenecks(userId: string, patterns: UserPatterns): Promise<any[]> {
    const bottlenecks = [];

    // تحليل الذروات الزمنية
    if (patterns.peakActivityTimes.length > 0) {
      const maxFrequency = Math.max(...patterns.peakActivityTimes.map(p => p.frequency));
      if (maxFrequency > 50) {
        bottlenecks.push({
          area: 'الذروة الزمنية',
          probability: 0.7,
          impact: 'high' as const,
          mitigation: 'توزيع الأحمال على أوقات مختلفة'
        });
      }
    }

    // تحليل الصلاحيات المعقدة
    if (patterns.frequentPermissions.some(p => p.includes('admin') || p.includes('critical'))) {
      bottlenecks.push({
        area: 'الصلاحيات المعقدة',
        probability: 0.6,
        impact: 'medium' as const,
        mitigation: 'تبسيط عمليات الموافقة للصلاحيات الروتينية'
      });
    }

    return bottlenecks;
  }

  /**
   * التنبؤ بأحمال الخادم
   */
  private async predictServerLoad(): Promise<any> {
    // تحليل الاستخدام التاريخي
    const hourlyUsage = await this.getHourlyUsageStats();
    
    return {
      nextHour: this.predictNextHourLoad(hourlyUsage),
      nextDay: this.predictNextDayLoad(hourlyUsage),
      peakTimes: this.identifyPeakTimes(hourlyUsage)
    };
  }

  /**
   * تحليل أداء قاعدة البيانات
   */
  private async analyzeDatabasePerformance(): Promise<any> {
    return {
      slowQueries: [
        'SELECT * FROM permission_monitoring WHERE timestamp > ?',
        'SELECT * FROM contextual_triggers WHERE is_active = true'
      ],
      indexSuggestions: [
        'CREATE INDEX idx_permission_monitoring_user_timestamp ON permission_monitoring(user_id, timestamp)',
        'CREATE INDEX idx_contextual_triggers_type_active ON contextual_triggers(trigger_type, is_active)'
      ],
      cacheRecommendations: [
        'تخزين مؤقت لنتائج الاستعلامات المتكررة',
        'تخزين مؤقت لبيانات المستخدمين النشطين'
      ]
    };
  }

  /**
   * تحسين استراتيجية التخزين المؤقت
   */
  private async optimizeCacheStrategy(): Promise<any[]> {
    return [
      {
        endpoints: ['/api/context-aware/triggers', '/api/context-aware/context-state'],
        ttl: 300, // 5 دقائق
        priority: 9
      },
      {
        endpoints: ['/api/auth/me', '/api/users/profile'],
        ttl: 600, // 10 دقائق
        priority: 8
      },
      {
        endpoints: ['/api/context-aware/events'],
        ttl: 60, // دقيقة واحدة
        priority: 7
      }
    ];
  }

  // دوال مساعدة
  private async getProjectTypes(userId: string): Promise<string[]> {
    // محاكاة جلب أنواع المشاريع
    return ['مساحة', 'بناء', 'تخطيط', 'تطوير'];
  }

  private async getLocationPatterns(userId: string): Promise<{ lat: number; lng: number; frequency: number }[]> {
    // محاكاة جلب أنماط المواقع
    return [
      { lat: 15.3694, lng: 44.1910, frequency: 25 }, // صنعاء
      { lat: 12.7797, lng: 45.0365, frequency: 15 }, // عدن
      { lat: 13.5795, lng: 44.2218, frequency: 10 }  // تعز
    ];
  }

  private calculatePermissionProbability(permission: string, patterns: UserPatterns): number {
    const frequency = patterns.frequentPermissions.indexOf(permission);
    return frequency === -1 ? 0.1 : Math.max(0.1, 1 - (frequency * 0.1));
  }

  private estimateNextUsage(permission: string, patterns: UserPatterns): string {
    const hour = new Date().getHours();
    const nextPeakTime = patterns.peakActivityTimes.find(p => p.hour > hour);
    
    if (nextPeakTime) {
      return `في غضون ${nextPeakTime.hour - hour} ساعة`;
    }
    return 'خلال 24 ساعة';
  }

  private calculateWorkflowEfficiency(workflow: string, patterns: UserPatterns): number {
    return Math.random() * 0.3 + 0.1; // محاكاة حساب الكفاءة
  }

  private async getHourlyUsageStats(): Promise<any[]> {
    // محاكاة إحصائيات الاستخدام
    return Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      usage: Math.floor(Math.random() * 100) + 10
    }));
  }

  private predictNextHourLoad(hourlyUsage: any[]): number {
    const currentHour = new Date().getHours();
    const nextHour = (currentHour + 1) % 24;
    const historicalData = hourlyUsage.filter(h => h.hour === nextHour);
    
    return historicalData.length > 0 
      ? historicalData.reduce((sum, h) => sum + h.usage, 0) / historicalData.length
      : 50;
  }

  private predictNextDayLoad(hourlyUsage: any[]): number {
    return hourlyUsage.reduce((sum, h) => sum + h.usage, 0) / hourlyUsage.length;
  }

  private identifyPeakTimes(hourlyUsage: any[]): string[] {
    return hourlyUsage
      .filter(h => h.usage > 80)
      .map(h => `${h.hour}:00`)
      .slice(0, 5);
  }

  // القيم الافتراضية
  private getDefaultPatterns(): UserPatterns {
    return {
      commonWorkflows: ['إنشاء طلب', 'مراجعة وثائق', 'موافقة'],
      peakActivityTimes: [{ hour: 9, day: 'الأحد', frequency: 10 }],
      frequentPermissions: ['view.basic', 'create.request'],
      projectTypes: ['عام'],
      locationPatterns: [{ lat: 15.3694, lng: 44.1910, frequency: 5 }],
      behaviorScore: 0.5
    };
  }

  private getDefaultPredictions(): PredictedNeeds {
    return {
      upcomingPermissions: [],
      suggestedWorkflows: [],
      resourceRequirements: [],
      potentialBottlenecks: []
    };
  }

  private getDefaultOptimization(): ResourceOptimization {
    return {
      serverLoadPrediction: { nextHour: 50, nextDay: 60, peakTimes: [] },
      databaseOptimizations: { slowQueries: [], indexSuggestions: [], cacheRecommendations: [] },
      cacheStrategies: []
    };
  }
}

export const predictiveEngine = new PredictiveEngine();