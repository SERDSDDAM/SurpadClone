import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FileText,
  Clock,
  User,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Send,
  Eye,
  Calendar,
  MapPin
} from "lucide-react";

interface WorkflowState {
  id: string;
  name: string;
  description: string;
  requiredActions: string[];
  nextStates: string[];
  autoTransition?: boolean;
  durationEstimate: number; // in hours
}

interface SurveyWorkflow {
  currentState: string;
  requestId: string;
  requestNumber: string;
  ownerName: string;
  assignedSurveyor: string | null;
  assignedReviewer: string | null;
  progress: number;
  estimatedCompletion: Date | null;
  blockers: string[];
  lastAction: {
    action: string;
    user: string;
    timestamp: Date;
    comment?: string;
  } | null;
}

interface WorkflowManagerProps {
  workflow: SurveyWorkflow;
  onStateChange: (newState: string, comment?: string) => void;
  onAssignUser: (userId: string, role: "surveyor" | "reviewer") => void;
  availableUsers: { id: string; name: string; role: string }[];
  className?: string;
}

// Define survey workflow states
const WORKFLOW_STATES: Record<string, WorkflowState> = {
  "submitted": {
    id: "submitted",
    name: "مقدم",
    description: "تم تقديم الطلب وينتظر المراجعة المبدئية",
    requiredActions: ["التدقيق المبدئي", "فحص الوثائق"],
    nextStates: ["under_initial_review", "rejected"],
    durationEstimate: 2
  },
  "under_initial_review": {
    id: "under_initial_review",
    name: "قيد المراجعة المبدئية",
    description: "يتم مراجعة الطلب والوثائق المرفقة",
    requiredActions: ["مراجعة الوثائق", "التحقق من الصحة"],
    nextStates: ["assigned", "pending_documents", "rejected"],
    durationEstimate: 4
  },
  "pending_documents": {
    id: "pending_documents",
    name: "في انتظار الوثائق",
    description: "الطلب يحتاج لوثائق إضافية من المتقدم",
    requiredActions: ["تقديم الوثائق المطلوبة"],
    nextStates: ["under_initial_review"],
    durationEstimate: 72
  },
  "assigned": {
    id: "assigned",
    name: "تم التكليف",
    description: "تم تعيين مساح ميداني للقيام بالرفع المساحي",
    requiredActions: ["تحديد موعد الزيارة", "التواصل مع المالك"],
    nextStates: ["in_progress"],
    durationEstimate: 8
  },
  "in_progress": {
    id: "in_progress",
    name: "قيد الرفع الميداني",
    description: "المساح يقوم بالرفع المساحي في الموقع",
    requiredActions: ["رفع النقاط", "توثيق المعالم", "أخذ الصور"],
    nextStates: ["data_submitted", "on_hold"],
    durationEstimate: 6
  },
  "on_hold": {
    id: "on_hold",
    name: "معلق مؤقتاً",
    description: "الرفع معلق لأسباب فنية أو لوجستية",
    requiredActions: ["حل العوائق", "جدولة زيارة جديدة"],
    nextStates: ["in_progress", "cancelled"],
    durationEstimate: 24
  },
  "data_submitted": {
    id: "data_submitted",
    name: "تم رفع البيانات",
    description: "المساح أنهى العمل الميداني ورفع البيانات",
    requiredActions: ["مراجعة البيانات", "التحقق من الدقة"],
    nextStates: ["under_technical_review"],
    autoTransition: true,
    durationEstimate: 1
  },
  "under_technical_review": {
    id: "under_technical_review",
    name: "قيد المراجعة الفنية",
    description: "مراجع فني يدقق البيانات المساحية",
    requiredActions: ["مراجعة الإحداثيات", "فحص الدقة", "التحقق من المطابقة"],
    nextStates: ["approved", "needs_revision", "rejected"],
    durationEstimate: 8
  },
  "needs_revision": {
    id: "needs_revision",
    name: "يحتاج مراجعة",
    description: "البيانات تحتاج لمراجعة أو تصحيح من المساح",
    requiredActions: ["تصحيح البيانات", "إعادة الرفع إذا لزم"],
    nextStates: ["in_progress", "data_submitted"],
    durationEstimate: 12
  },
  "approved": {
    id: "approved",
    name: "معتمد",
    description: "تم اعتماد البيانات المساحية وهي جاهزة لإصدار القرار",
    requiredActions: ["توليد القرار المساحي", "المراجعة النهائية"],
    nextStates: ["issued"],
    durationEstimate: 4
  },
  "issued": {
    id: "issued",
    name: "صادر",
    description: "تم إصدار القرار المساحي النهائي",
    requiredActions: ["تسليم القرار", "أرشفة الملف"],
    nextStates: [],
    durationEstimate: 2
  },
  "rejected": {
    id: "rejected",
    name: "مرفوض",
    description: "تم رفض الطلب لعدم استيفاء الشروط",
    requiredActions: ["إشعار المتقدم", "أرشفة الملف"],
    nextStates: [],
    durationEstimate: 1
  },
  "cancelled": {
    id: "cancelled",
    name: "ملغي",
    description: "تم إلغاء الطلب بناءً على طلب المتقدم أو لأسباب أخرى",
    requiredActions: ["أرشفة الملف", "إشعار الأطراف المعنية"],
    nextStates: [],
    durationEstimate: 1
  }
};

export function WorkflowManager({
  workflow,
  onStateChange,
  onAssignUser,
  availableUsers,
  className = ""
}: WorkflowManagerProps) {
  const [selectedNextState, setSelectedNextState] = useState<string>("");
  const [transitionComment, setTransitionComment] = useState("");
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignRole, setAssignRole] = useState<"surveyor" | "reviewer">("surveyor");
  const [selectedUser, setSelectedUser] = useState("");

  const currentState = WORKFLOW_STATES[workflow.currentState];
  const nextStates = currentState?.nextStates || [];

  // Calculate estimated completion time
  const calculateEstimatedCompletion = () => {
    if (!currentState) return null;
    
    const now = new Date();
    const hoursToAdd = currentState.durationEstimate;
    const estimated = new Date(now.getTime() + hoursToAdd * 60 * 60 * 1000);
    
    return estimated;
  };

  // Get state color
  const getStateColor = (stateId: string) => {
    switch (stateId) {
      case "issued":
      case "approved":
        return "bg-green-100 text-green-800 border-green-200";
      case "rejected":
      case "cancelled":
        return "bg-red-100 text-red-800 border-red-200";
      case "on_hold":
      case "pending_documents":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "in_progress":
      case "data_submitted":
        return "bg-blue-100 text-blue-800 border-blue-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  // Get state icon
  const getStateIcon = (stateId: string) => {
    switch (stateId) {
      case "issued":
      case "approved":
        return <CheckCircle className="w-4 h-4" />;
      case "rejected":
      case "cancelled":
        return <AlertCircle className="w-4 h-4" />;
      case "on_hold":
      case "pending_documents":
        return <Clock className="w-4 h-4" />;
      case "in_progress":
        return <MapPin className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  // Handle state transition
  const handleStateTransition = () => {
    if (!selectedNextState) return;
    
    onStateChange(selectedNextState, transitionComment);
    setSelectedNextState("");
    setTransitionComment("");
  };

  // Handle user assignment
  const handleUserAssignment = () => {
    if (!selectedUser) return;
    
    onAssignUser(selectedUser, assignRole);
    setShowAssignModal(false);
    setSelectedUser("");
  };

  return (
    <Card className={`${className}`} data-testid="workflow-manager">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-blue-600" />
          إدارة سير العمل
          <Badge className={`mr-auto ${getStateColor(workflow.currentState)}`}>
            {getStateIcon(workflow.currentState)}
            <span className="mr-1">{currentState?.name}</span>
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        
        {/* Current State Info */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-medium text-blue-900">الحالة الحالية</h3>
                  <p className="text-sm text-blue-700 mt-1">
                    {currentState?.description}
                  </p>
                </div>
                <div className="text-right text-sm text-blue-600">
                  <div>رقم الطلب: {workflow.requestNumber}</div>
                  <div>المالك: {workflow.ownerName}</div>
                </div>
              </div>
              
              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>التقدم</span>
                  <span>{workflow.progress}%</span>
                </div>
                <Progress value={workflow.progress} className="w-full" />
              </div>
              
              {/* Estimated Completion */}
              {currentState && (
                <div className="flex items-center gap-2 text-sm text-blue-600">
                  <Calendar className="w-4 h-4" />
                  <span>
                    الإنجاز المقدر: {currentState.durationEstimate} ساعة
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Required Actions */}
        {currentState?.requiredActions && currentState.requiredActions.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-medium text-gray-900">الإجراءات المطلوبة</h3>
            <div className="space-y-2">
              {currentState.requiredActions.map((action, index) => (
                <div 
                  key={index}
                  className="flex items-center gap-2 text-sm p-2 bg-yellow-50 border border-yellow-200 rounded"
                  data-testid={`required-action-${index}`}
                >
                  <AlertCircle className="w-4 h-4 text-yellow-600" />
                  <span>{action}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Blockers */}
        {workflow.blockers && workflow.blockers.length > 0 && (
          <Alert className="border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-700">
              <div className="font-medium mb-2">عوائق:</div>
              <ul className="list-disc list-inside space-y-1">
                {workflow.blockers.map((blocker, index) => (
                  <li key={index} className="text-sm">{blocker}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        <Separator />

        {/* Assignments */}
        <div className="space-y-4">
          <h3 className="font-medium text-gray-900">التكليفات</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm">المساح المكلف</Label>
              <div className="flex items-center gap-2">
                {workflow.assignedSurveyor ? (
                  <Badge variant="outline" className="flex items-center gap-1">
                    <User className="w-3 h-3" />
                    {workflow.assignedSurveyor}
                  </Badge>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setAssignRole("surveyor");
                      setShowAssignModal(true);
                    }}
                    data-testid="assign-surveyor-btn"
                  >
                    تعيين مساح
                  </Button>
                )}
              </div>
            </div>
            
            <div className="space-y-2">
              <Label className="text-sm">المراجع المكلف</Label>
              <div className="flex items-center gap-2">
                {workflow.assignedReviewer ? (
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Eye className="w-3 h-3" />
                    {workflow.assignedReviewer}
                  </Badge>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setAssignRole("reviewer");
                      setShowAssignModal(true);
                    }}
                    data-testid="assign-reviewer-btn"
                  >
                    تعيين مراجع
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        <Separator />

        {/* State Transition */}
        {nextStates.length > 0 && (
          <div className="space-y-4">
            <h3 className="font-medium text-gray-900">تغيير حالة الطلب</h3>
            
            <div className="space-y-3">
              <div className="space-y-2">
                <Label className="text-sm">الحالة التالية</Label>
                <Select value={selectedNextState} onValueChange={setSelectedNextState}>
                  <SelectTrigger data-testid="next-state-select">
                    <SelectValue placeholder="اختر الحالة التالية" />
                  </SelectTrigger>
                  <SelectContent>
                    {nextStates.map(stateId => (
                      <SelectItem key={stateId} value={stateId}>
                        <div className="flex items-center gap-2">
                          {getStateIcon(stateId)}
                          <span>{WORKFLOW_STATES[stateId]?.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm">تعليق (اختياري)</Label>
                <Textarea
                  value={transitionComment}
                  onChange={(e) => setTransitionComment(e.target.value)}
                  placeholder="أضف تعليق حول سبب التغيير..."
                  className="text-sm"
                  rows={3}
                  data-testid="transition-comment"
                />
              </div>
              
              <Button
                onClick={handleStateTransition}
                disabled={!selectedNextState}
                className="w-full flex items-center gap-2"
                data-testid="transition-btn"
              >
                <ArrowRight className="w-4 h-4" />
                تحويل إلى {selectedNextState ? WORKFLOW_STATES[selectedNextState]?.name : "..."}
              </Button>
            </div>
          </div>
        )}

        {/* Last Action */}
        {workflow.lastAction && (
          <div className="pt-4 border-t">
            <h4 className="font-medium text-gray-900 mb-2">آخر إجراء</h4>
            <div className="text-sm text-gray-600 space-y-1">
              <div className="flex items-center gap-2">
                <User className="w-3 h-3" />
                <span>{workflow.lastAction.user}</span>
                <span>•</span>
                <span>{workflow.lastAction.action}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-3 h-3" />
                <span>{workflow.lastAction.timestamp.toLocaleString('ar-YE')}</span>
              </div>
              {workflow.lastAction.comment && (
                <div className="mt-1 p-2 bg-gray-50 rounded text-xs">
                  {workflow.lastAction.comment}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Assignment Modal */}
        {showAssignModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="w-96 max-w-md">
              <CardHeader>
                <CardTitle>تعيين {assignRole === "surveyor" ? "مساح" : "مراجع"}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm">اختر المستخدم</Label>
                  <Select value={selectedUser} onValueChange={setSelectedUser}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر من القائمة" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableUsers
                        .filter(user => 
                          assignRole === "surveyor" 
                            ? user.role === "surveyor" 
                            : user.role === "reviewer"
                        )
                        .map(user => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    onClick={handleUserAssignment}
                    disabled={!selectedUser}
                    className="flex-1"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    تعيين
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowAssignModal(false)}
                    className="flex-1"
                  >
                    إلغاء
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </CardContent>
    </Card>
  );
}