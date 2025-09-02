import { useEffect } from "react";
import { useLocation } from "wouter";
import { useSurveyWizard } from "@/features/survey/wizard/SurveyWizardContext";
import ChoosePathStep from "./steps/ChoosePathStep";
import ApplicantStep from "./steps/ApplicantStep";
import LocationStep from "./steps/LocationStep";
import AttachmentsStep from "./steps/AttachmentsStep";
import BillingStep from "./steps/BillingStep";

const steps = [
  { key: 'choose-path', title: 'اختيار المسار' },
  { key: 'applicant', title: 'بيانات مقدم الطلب' },
  { key: 'location', title: 'الموقع الجغرافي' },
  { key: 'attachments', title: 'المرفقات' },
  { key: 'billing', title: 'الفاتورة والسداد' }
] as const;

function Stepper({ steps, current }: { steps: string[]; current: number }) {
  return (
    <div className="flex items-center justify-between mb-8" data-testid="stepper-container">
      {steps.map((step, index) => (
        <div key={index} className="flex items-center" data-testid={`step-${index}`}>
          <div className={`
            w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
            ${index <= current 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-300 text-gray-600'
            }
          `}>
            {index + 1}
          </div>
          <div className={`text-sm ml-2 ${index <= current ? 'text-blue-600 font-medium' : 'text-gray-500'}`}>
            {step}
          </div>
          {index < steps.length - 1 && (
            <div className={`w-12 h-1 mx-4 ${index < current ? 'bg-blue-600' : 'bg-gray-300'}`} />
          )}
        </div>
      ))}
    </div>
  );
}

export default function SurveyWizard() {
  const { state } = useSurveyWizard();
  const [, navigate] = useLocation();

  useEffect(() => { 
    navigate(`/survey/wizard?step=${state.step}`, { replace: true }); 
  }, [state.step]);

  return (
    <div className="container mx-auto p-4 space-y-4" data-testid="survey-wizard">
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h1 className="text-2xl font-bold text-center mb-6">طلب قرار مساحي</h1>
        <Stepper steps={steps.map(s=>s.title)} current={steps.findIndex(s => s.key === state.step)} />
        
        {state.step === 'choose-path' && <ChoosePathStep />}
        {state.step === 'applicant' && <ApplicantStep />}
        {state.step === 'location' && <LocationStep />}
        {state.step === 'attachments' && <AttachmentsStep />}
        {state.step === 'billing' && <BillingStep />}
      </div>
    </div>
  );
}