import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SurveyStats } from "@/types/survey";

interface SurveyProgressProps {
  stats: SurveyStats;
}

export function SurveyProgress({ stats }: SurveyProgressProps) {
  return (
    <Card className="bg-gray-50">
      <CardHeader>
        <CardTitle className="text-gray-800">تقدم المساحة</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-primary" data-testid="points-count">
              {stats.pointsCount}
            </div>
            <div className="text-sm text-gray-600">نقاط مرفوعة</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600" data-testid="lines-count">
              {stats.linesCount}
            </div>
            <div className="text-sm text-gray-600">خطوط مرسومة</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-orange-600" data-testid="polygons-count">
              {stats.polygonsCount}
            </div>
            <div className="text-sm text-gray-600">مضلعات مكتملة</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
