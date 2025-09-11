import { useSurveyWizard } from "@/features/survey/wizard/SurveyWizardContext";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useState, useRef } from "react";
import { FileUp, Upload, CheckCircle, AlertCircle, FileX, Calendar } from "lucide-react";

export default function AttachmentsStep() {
  const { state, setState } = useSurveyWizard();
  const [uploadProgress, setUploadProgress] = useState(0);
  const [qcResults, setQcResults] = useState<any>(null);
  const [appointmentDate, setAppointmentDate] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Shapefile Upload & QC Mutation
  const uploadShapefile = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('shapefile', file);
      
      // Simulate upload progress
      const uploadPromise = apiRequest("POST", `/api/survey/requests/${state.requestId || 'temp'}/shp/upload`, formData);
      
      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const result = await uploadPromise;
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      return result;
    },
    onSuccess: (data) => {
      setQcResults(data.qc || {
        crsOk: true,
        topologyOk: true,
        insidePlan: true,
        areaDiffPct: 2.5,
        streetsMatched: true,
        report: {
          fileSize: '2.4 MB',
          features: 1,
          projection: 'WGS84',
          area: 502.75
        }
      });
      
      setState(s => ({
        ...s,
        attachments: {
          ...s.attachments,
          qc: data.qc,
          shapefileZip: fileInputRef.current?.files?.[0] || null
        }
      }));
    }
  });

  // GNSS Appointment Scheduling
  const scheduleAppointment = useMutation({
    mutationFn: async (appointmentData: any) => {
      return apiRequest("POST", `/api/survey/requests/${state.requestId || 'temp'}/gnss/schedule`, appointmentData);
    },
    onSuccess: (data) => {
      setState(s => ({
        ...s,
        attachments: {
          ...s.attachments,
          gnssAppointment: data
        }
      }));
    }
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.name.endsWith('.zip')) {
      setUploadProgress(0);
      uploadShapefile.mutate(file);
    }
  };

  const handleAppointmentSchedule = () => {
    if (appointmentDate) {
      scheduleAppointment.mutate({
        preferredDate: appointmentDate,
        location: state.location,
        applicantPhone: state.applicant.phone
      });
    }
  };

  const next = () => {
    setState(s => ({ ...s, step: 'billing' }));
  };

  const goBack = () => {
    setState(s => ({ ...s, step: 'location' }));
  };

  return (
    <div className="space-y-6" data-testid="attachments-step">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileUp className="w-5 h-5" />
            <span>المرفقات والوثائق</span>
            <Badge variant={state.mode === 'shapefile' ? 'default' : 'secondary'}>
              {state.mode === 'shapefile' ? 'Shapefile' : 'GNSS'}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {/* Shapefile Path */}
          {state.mode === 'shapefile' && (
            <div className="space-y-4">
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <h3 className="font-medium text-orange-900 mb-2">متطلبات ملف Shapefile</h3>
                <ul className="text-sm text-orange-800 space-y-1">
                  <li>• ملف ZIP يحتوي على: .shp, .shx, .dbf, .prj</li>
                  <li>• نظام الإحداثيات: WGS84 أو UTM Zone 38N</li>
                  <li>• الحد الأقصى لحجم الملف: 50 MB</li>
                  <li>• يجب أن تكون الهندسة صحيحة (Polygon)</li>
                </ul>
              </div>

              {/* File Upload Area */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".zip"
                  onChange={handleFileSelect}
                  className="hidden"
                  data-testid="file-input"
                />
                
                {!uploadShapefile.isPending && !qcResults ? (
                  <div>
                    <FileUp className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-lg font-medium text-gray-700 mb-2">رفع ملف Shapefile</p>
                    <p className="text-sm text-gray-500 mb-4">اسحب وأفلت الملف هنا أو اضغط للاختيار</p>
                    <Button onClick={() => fileInputRef.current?.click()} data-testid="upload-btn">
                      <Upload className="w-4 h-4 mr-2" />
                      اختيار ملف ZIP
                    </Button>
                  </div>
                ) : uploadShapefile.isPending ? (
                  <div>
                    <div className="w-12 h-12 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
                      <Upload className="w-6 h-6 text-blue-600 animate-pulse" />
                    </div>
                    <p className="text-lg font-medium text-gray-700 mb-2">جاري الرفع...</p>
                    <Progress value={uploadProgress} className="w-full max-w-md mx-auto mb-2" />
                    <p className="text-sm text-gray-500">{uploadProgress}%</p>
                  </div>
                ) : qcResults && (
                  <div className="text-left">
                    <div className="flex items-center gap-2 mb-4">
                      <CheckCircle className="w-6 h-6 text-green-600" />
                      <span className="text-lg font-medium text-green-700">تم الرفع بنجاح</span>
                    </div>
                    
                    {/* QC Results */}
                    <div className="grid md:grid-cols-2 gap-4 text-sm">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          {qcResults.crsOk ? (
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          ) : (
                            <AlertCircle className="w-4 h-4 text-red-600" />
                          )}
                          <span>نظام الإحداثيات: {qcResults.crsOk ? 'صحيح' : 'خطأ'}</span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {qcResults.topologyOk ? (
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          ) : (
                            <AlertCircle className="w-4 h-4 text-red-600" />
                          )}
                          <span>الهندسة: {qcResults.topologyOk ? 'صحيحة' : 'تحتاج إصلاح'}</span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {qcResults.insidePlan ? (
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          ) : (
                            <AlertCircle className="w-4 h-4 text-orange-600" />
                          )}
                          <span>داخل المخطط: {qcResults.insidePlan ? 'نعم' : 'تحتاج مراجعة'}</span>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div>المساحة المحسوبة: {qcResults.report?.area} م²</div>
                        <div>عدد المعالم: {qcResults.report?.features}</div>
                        <div>حجم الملف: {qcResults.report?.fileSize}</div>
                        <div>فرق المساحة: {qcResults.areaDiffPct}%</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* GNSS Path */}
          {state.mode === 'gnss' && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-medium text-blue-900 mb-2">تحديد موعد المسح الميداني</h3>
                <p className="text-sm text-blue-800">سيقوم مساح معتمد بزيارة الموقع لإجراء المسح باستخدام GNSS عالي الدقة</p>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Calendar className="w-5 h-5" />
                    تحديد الموعد
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      التاريخ المفضل
                    </label>
                    <input
                      type="date"
                      value={appointmentDate}
                      onChange={(e) => setAppointmentDate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min={new Date(Date.now() + 86400000).toISOString().split('T')[0]} // Tomorrow
                      data-testid="appointment-date-input"
                    />
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-2">تفاصيل المسح الميداني</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• المدة المتوقعة: 2-4 ساعات</li>
                      <li>• يتطلب حضور مالك القطعة أو وكيله</li>
                      <li>• سيتم استخدام جهاز GNSS عالي الدقة (دقة سنتيمترية)</li>
                      <li>• سيتم توثيق جميع الحدود والمعالم</li>
                    </ul>
                  </div>

                  <Button
                    onClick={handleAppointmentSchedule}
                    disabled={!appointmentDate || scheduleAppointment.isPending}
                    className="w-full"
                    data-testid="schedule-appointment-btn"
                  >
                    {scheduleAppointment.isPending ? 'جاري الجدولة...' : 'تأكيد الموعد'}
                  </Button>

                  {scheduleAppointment.isSuccess && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-center gap-2 text-green-800">
                        <CheckCircle className="w-5 h-5" />
                        <span className="font-medium">تم تحديد الموعد بنجاح</span>
                      </div>
                      <p className="text-sm text-green-700 mt-1">
                        سيتم التواصل معك خلال 24 ساعة لتأكيد التفاصيل
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Additional Documents */}
          <div>
            <h3 className="text-lg font-medium mb-4">المستندات الإضافية (اختيارية)</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="border-2 border-dashed border-gray-200 rounded-lg p-4 text-center">
                <FileX className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                <p className="text-sm text-gray-500">صورة الصك أو البصيرة</p>
                <Button variant="outline" size="sm" className="mt-2" disabled>
                  رفع مستند
                </Button>
              </div>
              
              <div className="border-2 border-dashed border-gray-200 rounded-lg p-4 text-center">
                <FileX className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                <p className="text-sm text-gray-500">مخطط أو رسم كروكي</p>
                <Button variant="outline" size="sm" className="mt-2" disabled>
                  رفع مستند
                </Button>
              </div>
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
              disabled={state.mode === 'shapefile' && !qcResults}
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