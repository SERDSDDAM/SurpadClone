import { useSurveyWizard } from "@/features/survey/wizard/SurveyWizardContext";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { Receipt, CreditCard, Printer, CheckCircle, Clock } from "lucide-react";

export default function BillingStep() {
  const { state, setState } = useSurveyWizard();
  const [, navigate] = useLocation();
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'bank' | null>(null);

  // Calculate fees based on workflow mode
  const baseFee = 15000; // YER
  const shapefileDiscount = state.mode === 'shapefile' ? 5000 : 0;
  const serviceFee = 2000;
  const totalAmount = baseFee - shapefileDiscount + serviceFee;

  const generateInvoice = useMutation({
    mutationFn: async () => {
      const invoiceData = {
        applicant: state.applicant,
        location: state.location,
        mode: state.mode,
        fees: {
          baseFee,
          discount: shapefileDiscount,
          serviceFee,
          total: totalAmount
        }
      };

      return apiRequest("POST", "/api/invoices/generate", invoiceData);
    },
    onSuccess: (data) => {
      setState(s => ({ ...s, invoiceId: data.invoiceId }));
    }
  });

  const submitPayment = useMutation({
    mutationFn: async (paymentData: any) => {
      return apiRequest("POST", `/api/invoices/${state.invoiceId}/payment`, paymentData);
    },
    onSuccess: (data) => {
      // Navigate to payment confirmation
      navigate(`/cashier/invoice/${state.invoiceId}`);
    }
  });

  const handleGenerateInvoice = () => {
    generateInvoice.mutate();
  };

  const handlePayment = () => {
    if (paymentMethod && state.invoiceId) {
      submitPayment.mutate({
        method: paymentMethod,
        amount: totalAmount,
        reference: `INV-${Date.now()}`
      });
    }
  };

  const goBack = () => {
    setState(s => ({ ...s, step: 'attachments' }));
  };

  return (
    <div className="space-y-6" data-testid="billing-step">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="w-5 h-5" />
            <span>الفاتورة والسداد</span>
            <Badge variant={state.mode === 'shapefile' ? 'default' : 'secondary'}>
              {state.mode === 'shapefile' ? 'Shapefile' : 'GNSS'}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {/* Invoice Summary */}
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-medium mb-4">ملخص الطلب</h3>
            
            <div className="space-y-3">
              <div className="flex justify-between">
                <span>مقدم الطلب:</span>
                <span className="font-medium">{state.applicant.fullName}</span>
              </div>
              <div className="flex justify-between">
                <span>نوع الخدمة:</span>
                <span className="font-medium">قرار مساحي - {state.mode === 'shapefile' ? 'Shapefile' : 'GNSS'}</span>
              </div>
              <div className="flex justify-between">
                <span>الموقع:</span>
                <span className="font-medium">{state.location.governorate} - {state.location.district}</span>
              </div>
              <div className="flex justify-between">
                <span>المساحة المتوقعة:</span>
                <span className="font-medium">{state.applicant.areaFromDoc || 'غير محدد'} م²</span>
              </div>
            </div>
          </div>

          {/* Fee Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">تفصيل الرسوم</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>رسوم القرار المساحي الأساسية</span>
                  <span>{baseFee.toLocaleString()} ريال يمني</span>
                </div>
                
                {state.mode === 'shapefile' && (
                  <div className="flex justify-between text-green-600">
                    <span>خصم مسار Shapefile</span>
                    <span>- {shapefileDiscount.toLocaleString()} ريال يمني</span>
                  </div>
                )}
                
                <div className="flex justify-between">
                  <span>رسوم الخدمة الإلكترونية</span>
                  <span>{serviceFee.toLocaleString()} ريال يمني</span>
                </div>
                
                <Separator />
                
                <div className="flex justify-between text-lg font-bold">
                  <span>المجموع الكلي</span>
                  <span>{totalAmount.toLocaleString()} ريال يمني</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Generate Invoice */}
          {!state.invoiceId ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <Button
                    onClick={handleGenerateInvoice}
                    disabled={generateInvoice.isPending}
                    className="w-full"
                    data-testid="generate-invoice-btn"
                  >
                    <Receipt className="w-4 h-4 mr-2" />
                    {generateInvoice.isPending ? 'جاري إنشاء الفاتورة...' : 'إنشاء فاتورة'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            /* Payment Options */
            <div className="space-y-4">
              <Card className="bg-green-50 border-green-200">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 mb-4">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="font-medium text-green-800">تم إنشاء الفاتورة بنجاح</span>
                  </div>
                  <div className="text-sm text-green-700">
                    <p>رقم الفاتورة: <span className="font-mono">{state.invoiceId}</span></p>
                    <p>تاريخ الإنشاء: {new Date().toLocaleDateString('ar-YE')}</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>طرق الدفع</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <Card 
                      className={`cursor-pointer transition-all ${paymentMethod === 'cash' ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:shadow-md'}`}
                      onClick={() => setPaymentMethod('cash')}
                    >
                      <CardContent className="pt-4">
                        <div className="text-center">
                          <CreditCard className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                          <h4 className="font-medium">دفع نقدي</h4>
                          <p className="text-sm text-gray-500">في مكتب الخدمات</p>
                        </div>
                      </CardContent>
                    </Card>

                    <Card 
                      className={`cursor-pointer transition-all ${paymentMethod === 'bank' ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:shadow-md'}`}
                      onClick={() => setPaymentMethod('bank')}
                    >
                      <CardContent className="pt-4">
                        <div className="text-center">
                          <Receipt className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                          <h4 className="font-medium">تحويل بنكي</h4>
                          <p className="text-sm text-gray-500">إيداع في البنك</p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {paymentMethod && (
                    <div className="mt-4">
                      <Card className="bg-yellow-50 border-yellow-200">
                        <CardContent className="pt-4">
                          <div className="flex items-center gap-2 mb-2">
                            <Clock className="w-4 h-4 text-yellow-600" />
                            <span className="font-medium text-yellow-800">تعليمات الدفع</span>
                          </div>
                          {paymentMethod === 'cash' ? (
                            <div className="text-sm text-yellow-700">
                              <p>• توجه إلى مكتب الخدمات خلال 3 أيام عمل</p>
                              <p>• أحضر معك الفاتورة المطبوعة والهوية الشخصية</p>
                              <p>• ساعات العمل: 8:00 ص - 2:00 م (السبت - الخميس)</p>
                            </div>
                          ) : (
                            <div className="text-sm text-yellow-700">
                              <p>• رقم الحساب: 123456789</p>
                              <p>• اسم البنك: بنك اليمن والكويت</p>
                              <p>• أرسل إيصال التحويل عبر الواتس: 777123456</p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  )}

                  <Button
                    onClick={handlePayment}
                    disabled={!paymentMethod || submitPayment.isPending}
                    className="w-full"
                    data-testid="submit-payment-btn"
                  >
                    {submitPayment.isPending ? 'جاري المعالجة...' : 'تأكيد طريقة الدفع'}
                  </Button>
                </CardContent>
              </Card>

              {/* Print Invoice */}
              <Card>
                <CardContent className="pt-4">
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => window.print()}
                    data-testid="print-invoice-btn"
                  >
                    <Printer className="w-4 h-4 mr-2" />
                    طباعة الفاتورة
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}

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
            
            {state.invoiceId && paymentMethod && (
              <div className="text-sm text-gray-500 flex items-center gap-1">
                <CheckCircle className="w-4 h-4" />
                جاهز للانتقال لمرحلة السداد
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}