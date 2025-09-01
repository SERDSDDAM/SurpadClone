// محاكي السيناريوهات المتقدم
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TestTube } from 'lucide-react';

export function ScenarioSimulator() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TestTube className="h-5 w-5" />
          محاكي السيناريوهات المتقدم
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8">
          <TestTube className="h-16 w-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-semibold mb-2">محاكي السيناريوهات المتقدم</h3>
          <p className="text-gray-600">اختبر القوانين مع سيناريوهات متنوعة وحالات حقيقية</p>
        </div>
      </CardContent>
    </Card>
  );
}