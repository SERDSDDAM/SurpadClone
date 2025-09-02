import { useSurveyWizard } from "@/features/survey/wizard/SurveyWizardContext";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { MapPin, Loader2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

export default function LocationStep() {
  const { state, setState } = useSurveyWizard();
  const [coords, setCoords] = useState({ 
    lat: state.location.lat || 15.3694, 
    lng: state.location.lng || 44.1910 
  });
  const [runningPnP, setRunningPnP] = useState(false);
  const [pnpResults, setPnpResults] = useState<any>(null);

  const yemenGovernorates = [
    'صنعاء', 'عدن', 'تعز', 'الحديدة', 'إب', 'ذمار', 'البيضاء', 
    'أبين', 'حجة', 'الجوف', 'مأرب', 'صعدة', 'شبوة', 'لحج', 
    'المحويت', 'عمران', 'الضالع', 'ريمة', 'المهرة', 'حضرموت', 'سقطرى'
  ];

  const runPnP = async () => {
    setRunningPnP(true);
    try {
      // Point-in-Polygon Analysis
      const pnp = await apiRequest("POST", "/api/gis/point-in-polygon", { 
        latitude: coords.lat, 
        longitude: coords.lng 
      });
      setPnpResults(pnp);

      // Legacy Decision Check
      const legacyCheck = await apiRequest("POST", `/api/survey/requests/temp/workflow/detect`, {
        latitude: coords.lat,
        longitude: coords.lng,
        planNo: state.location.planNo
      });

      const newLocationData = {
        ...state.location,
        lat: coords.lat,
        lng: coords.lng,
        pnpContext: pnp,
        legacyFound: legacyCheck?.detectedWorkflow === 'shapefile'
      };

      setState(s => ({
        ...s,
        location: newLocationData,
        // Update workflow if legacy found and current mode allows it
        mode: legacyCheck?.detectedWorkflow === 'shapefile' && !s.mode ? 'shapefile' : s.mode
      }));

    } catch (error) {
      console.error('PnP analysis failed:', error);
    } finally {
      setRunningPnP(false);
    }
  };

  const updateLocation = (field: string, value: string) => {
    setState(s => ({
      ...s,
      location: { ...s.location, [field]: value }
    }));
  };

  const next = async () => {
    if (!pnpResults) {
      await runPnP();
    }
    setState(s => ({ ...s, step: 'attachments' }));
  };

  const goBack = () => {
    setState(s => ({ ...s, step: 'applicant' }));
  };

  return (
    <div className="space-y-6" data-testid="location-step">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            <span>تحديد الموقع الجغرافي</span>
            {state.mode && (
              <Badge variant={state.mode === 'shapefile' ? 'default' : 'secondary'}>
                {state.mode === 'shapefile' ? 'Shapefile' : 'GNSS'}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Administrative Location */}
          <div>
            <h3 className="text-lg font-medium mb-4">الموقع الإداري</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="governorate">المحافظة *</Label>
                <Select 
                  onValueChange={(value) => updateLocation('governorate', value)}
                  defaultValue={state.location.governorate}
                >
                  <SelectTrigger data-testid="governorate-select">
                    <SelectValue placeholder="اختر المحافظة" />
                  </SelectTrigger>
                  <SelectContent>
                    {yemenGovernorates.map(gov => (
                      <SelectItem key={gov} value={gov}>{gov}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="district">المديرية *</Label>
                <Input 
                  id="district"
                  placeholder="أدخل اسم المديرية" 
                  value={state.location.district || ''} 
                  onChange={(e) => updateLocation('district', e.target.value)}
                  data-testid="district-input"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="subDistrict">العزلة</Label>
                <Input 
                  id="subDistrict"
                  placeholder="أدخل اسم العزلة" 
                  value={state.location.subDistrict || ''} 
                  onChange={(e) => updateLocation('subDistrict', e.target.value)}
                  data-testid="subDistrict-input"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sector">القطاع</Label>
                <Input 
                  id="sector"
                  placeholder="أدخل اسم القطاع" 
                  value={state.location.sector || ''} 
                  onChange={(e) => updateLocation('sector', e.target.value)}
                  data-testid="sector-input"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="neighborhood">الحي</Label>
                <Input 
                  id="neighborhood"
                  placeholder="أدخل اسم الحي" 
                  value={state.location.neighborhood || ''} 
                  onChange={(e) => updateLocation('neighborhood', e.target.value)}
                  data-testid="neighborhood-input"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="planNo">رقم المخطط</Label>
                <Input 
                  id="planNo"
                  placeholder="مثال: PL-SANAA-001" 
                  value={state.location.planNo || ''} 
                  onChange={(e) => updateLocation('planNo', e.target.value)}
                  data-testid="planNo-input"
                />
              </div>
            </div>
          </div>

          {/* Geographic Coordinates */}
          <div>
            <h3 className="text-lg font-medium mb-4">الإحداثيات الجغرافية</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="latitude">خط العرض (Latitude)</Label>
                <Input 
                  id="latitude"
                  type="number" 
                  step="0.000001" 
                  placeholder="15.3694" 
                  value={coords.lat} 
                  onChange={(e) => setCoords(prev => ({ ...prev, lat: parseFloat(e.target.value) || 0 }))}
                  data-testid="latitude-input"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="longitude">خط الطول (Longitude)</Label>
                <Input 
                  id="longitude"
                  type="number" 
                  step="0.000001" 
                  placeholder="44.1910" 
                  value={coords.lng} 
                  onChange={(e) => setCoords(prev => ({ ...prev, lng: parseFloat(e.target.value) || 0 }))}
                  data-testid="longitude-input"
                />
              </div>
            </div>

            <Button 
              onClick={runPnP} 
              disabled={runningPnP} 
              className="mt-4 w-full"
              data-testid="run-pnp-btn"
            >
              {runningPnP ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  جاري التحليل المكاني...
                </>
              ) : (
                <>
                  <MapPin className="w-4 h-4 mr-2" />
                  تحليل الموقع (Point-in-Polygon)
                </>
              )}
            </Button>
          </div>

          {/* PnP Results */}
          {pnpResults && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-medium text-green-900 mb-2">نتائج التحليل المكاني</h4>
              <div className="text-sm text-green-800 space-y-2">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <strong>المنطقة:</strong> {pnpResults.region || 'غير محدد'}
                  </div>
                  <div>
                    <strong>المخطط:</strong> {pnpResults.planArea || 'غير محدد'}
                  </div>
                  <div>
                    <strong>المنطقة الحضرية:</strong> {pnpResults.urbanArea ? 'نعم' : 'لا'}
                  </div>
                  <div>
                    <strong>داخل الحدود الإدارية:</strong> {pnpResults.withinBounds ? 'نعم' : 'لا'}
                  </div>
                </div>
                {state.location.legacyFound && (
                  <div className="bg-yellow-100 border border-yellow-300 rounded p-2 mt-2">
                    <strong className="text-yellow-800">تم العثور على قرار سابق - مُوصى باستخدام مسار Shapefile</strong>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Map Placeholder */}
          <div className="bg-gray-100 rounded-lg h-64 flex items-center justify-center border-2 border-dashed border-gray-300">
            <div className="text-center text-gray-500">
              <MapPin className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>سيتم إضافة خريطة تفاعلية هنا</p>
              <p className="text-sm">الإحداثيات: {coords.lat.toFixed(6)}, {coords.lng.toFixed(6)}</p>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex justify-between pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={goBack}
              data-testid="back-btn"
            >
              رجوع
            </Button>
            <Button 
              onClick={next}
              data-testid="next-btn"
            >
              التالي
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}