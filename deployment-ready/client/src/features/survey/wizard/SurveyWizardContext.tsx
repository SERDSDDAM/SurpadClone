import { createContext, useContext, useMemo, useState } from "react";

export type WorkflowMode = 'shapefile' | 'gnss';

export interface ApplicantData {
  nationalId?: string;
  fullName?: string;
  phone?: string;
  role?: 'self' | 'agent';
  documentType?: 'deed' | 'basira' | 'other';
  purpose?: string;
  areaFromDoc?: number;
}

export interface LocationData {
  governorate?: string;
  district?: string;
  subDistrict?: string;
  sector?: string;
  neighborhood?: string;
  planNo?: string;
  lng?: number;
  lat?: number;
  pnpContext?: any; // من خدمة PnP
  legacyFound?: boolean;
}

export interface WizardState {
  requestId?: string;
  step: 'choose-path'|'applicant'|'location'|'attachments'|'billing';
  mode?: WorkflowMode;
  applicant: ApplicantData;
  location: LocationData;
  attachments: {
    shapefileZip?: File | null;
    otherDocs?: File[];
    qc?: {
      crsOk?: boolean;
      topologyOk?: boolean;
      insidePlan?: boolean;
      areaDiffPct?: number;
      streetsMatched?: boolean;
      report?: any;
    }
  };
  invoiceId?: string;
}

const SurveyWizardCtx = createContext<{
  state: WizardState;
  setState: React.Dispatch<React.SetStateAction<WizardState>>;
} | null>(null);

export function SurveyWizardProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<WizardState>({
    step: 'choose-path',
    applicant: {},
    location: {},
    attachments: {}
  });
  const value = useMemo(()=>({state, setState}),[state]);
  return <SurveyWizardCtx.Provider value={value}>{children}</SurveyWizardCtx.Provider>;
}

export function useSurveyWizard() {
  const ctx = useContext(SurveyWizardCtx);
  if (!ctx) throw new Error("useSurveyWizard must be used within provider");
  return ctx;
}