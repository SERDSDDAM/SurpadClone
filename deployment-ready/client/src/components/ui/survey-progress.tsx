import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Target, 
  Route, 
  Square, 
  Clock, 
  CheckCircle, 
  Activity,
  TrendingUp 
} from "lucide-react";

export interface SurveyProgressProps {
  stats: {
    pointsCount: number;
    linesCount: number;
    polygonsCount: number;
  };
  sessionTime?: number;
  completionPercentage?: number;
}

export function SurveyProgress({ 
  stats, 
  sessionTime = 0,
  completionPercentage = 0
}: SurveyProgressProps) {
  const totalFeatures = stats.pointsCount + stats.linesCount + stats.polygonsCount;
  
  // Format session time
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-lg">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            <span>تقدم المسح</span>
          </div>
          <Badge variant="outline" className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {formatTime(sessionTime)}
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Overall Progress */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">التقدم الإجمالي</span>
            <span className="text-sm font-bold">{completionPercentage.toFixed(0)}%</span>
          </div>
          <Progress value={completionPercentage} className="h-2" />
        </div>
        
        {/* Feature Statistics */}
        <div className="grid grid-cols-3 gap-3">
          {/* Points */}
          <div className="text-center p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
            <Target className="h-6 w-6 mx-auto text-blue-600 mb-1" />
            <div className="text-2xl font-bold text-blue-600">{stats.pointsCount}</div>
            <div className="text-xs text-gray-600 dark:text-gray-400">نقطة</div>
          </div>
          
          {/* Lines */}
          <div className="text-center p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
            <Route className="h-6 w-6 mx-auto text-green-600 mb-1" />
            <div className="text-2xl font-bold text-green-600">{stats.linesCount}</div>
            <div className="text-xs text-gray-600 dark:text-gray-400">خط</div>
          </div>
          
          {/* Polygons */}
          <div className="text-center p-3 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
            <Square className="h-6 w-6 mx-auto text-purple-600 mb-1" />
            <div className="text-2xl font-bold text-purple-600">{stats.polygonsCount}</div>
            <div className="text-xs text-gray-600 dark:text-gray-400">مضلع</div>
          </div>
        </div>
        
        {/* Summary */}
        <div className="flex items-center justify-between pt-3 border-t">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-gray-500" />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              المجموع: {totalFeatures} معلم
            </span>
          </div>
          
          {totalFeatures > 0 && (
            <Badge variant="default" className="bg-green-600">
              <CheckCircle className="h-3 w-3 ml-1" />
              نشط
            </Badge>
          )}
        </div>
        
        {/* Quality Indicators */}
        <div className="grid grid-cols-2 gap-3 pt-2 border-t">
          <div className="text-center">
            <div className="text-lg font-bold text-green-600">عالية</div>
            <div className="text-xs text-gray-500">جودة GPS</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-blue-600">متصل</div>
            <div className="text-xs text-gray-500">حالة المزامنة</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}