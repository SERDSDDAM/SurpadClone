import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  X, 
  Target, 
  Trash2, 
  Link as LinkIcon, 
  Layers, 
  Move, 
  Edit3, 
  MapPin,
  Menu
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface FloatingAction {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  onClick: () => void;
  disabled?: boolean;
}

interface FloatingActionButtonProps {
  onAddPoint: () => void;
  onDeletePoint: () => void;
  onToggleSnap: () => void;
  onToggleLayers: () => void;
  onMovePoint: () => void;
  onAddCoordinate: () => void;
  onCurrentLocation: () => void;
  onRecordGPS: () => void;
  snapEnabled: boolean;
  layersVisible: boolean;
  isCapturing: boolean;
}

export function FloatingActionButton({
  onAddPoint,
  onDeletePoint, 
  onToggleSnap,
  onToggleLayers,
  onMovePoint,
  onAddCoordinate,
  onCurrentLocation,
  onRecordGPS,
  snapEnabled,
  layersVisible,
  isCapturing
}: FloatingActionButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  const actions: FloatingAction[] = [
    {
      id: "current-location",
      label: "Current Location",
      icon: MapPin,
      color: "bg-blue-600 hover:bg-blue-700",
      onClick: onCurrentLocation
    },
    {
      id: "snap-toggle", 
      label: snapEnabled ? "Snap On" : "Snap Off",
      icon: LinkIcon,
      color: snapEnabled ? "bg-green-600 hover:bg-green-700" : "bg-gray-600 hover:bg-gray-700",
      onClick: onToggleSnap
    },
    {
      id: "record-gps",
      label: "Record Using GPS", 
      icon: Target,
      color: "bg-teal-600 hover:bg-teal-700",
      onClick: onRecordGPS,
      disabled: isCapturing
    },
    {
      id: "layers",
      label: "Layers",
      icon: Layers, 
      color: layersVisible ? "bg-purple-600 hover:bg-purple-700" : "bg-gray-600 hover:bg-gray-700",
      onClick: onToggleLayers
    },
    {
      id: "move-point",
      label: "Move Point",
      icon: Move,
      color: "bg-yellow-600 hover:bg-yellow-700", 
      onClick: onMovePoint
    },
    {
      id: "delete-point",
      label: "Delete Point",
      icon: Trash2,
      color: "bg-red-600 hover:bg-red-700",
      onClick: onDeletePoint
    },
    {
      id: "add-coordinate",
      label: "Add Coordinate",
      icon: Edit3,
      color: "bg-indigo-600 hover:bg-indigo-700",
      onClick: onAddCoordinate
    },
    {
      id: "add-point",
      label: "Add Point", 
      icon: Plus,
      color: "bg-teal-600 hover:bg-teal-700",
      onClick: onAddPoint,
      disabled: isCapturing
    }
  ];

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute bottom-16 right-0 space-y-3"
          >
            {actions.map((action, index) => {
              const IconComponent = action.icon;
              
              return (
                <motion.div
                  key={action.id}
                  initial={{ scale: 0, x: 20 }}
                  animate={{ scale: 1, x: 0 }}
                  exit={{ scale: 0, x: 20 }}
                  transition={{ 
                    delay: index * 0.05,
                    type: "spring",
                    stiffness: 200,
                    damping: 15
                  }}
                  className="flex items-center gap-3"
                >
                  {/* Label */}
                  <div className="bg-black/80 text-white px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap">
                    {action.label}
                  </div>
                  
                  {/* Action Button */}
                  <Button
                    size="sm"
                    className={`w-12 h-12 rounded-full shadow-lg ${action.color} text-white border-0 ${
                      action.disabled ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                    onClick={action.onClick}
                    disabled={action.disabled}
                  >
                    <IconComponent className="h-5 w-5" />
                  </Button>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Main FAB */}
      <motion.div
        whileTap={{ scale: 0.95 }}
        whileHover={{ scale: 1.05 }}
      >
        <Button
          size="lg"
          className={`w-14 h-14 rounded-full shadow-xl transition-all duration-200 ${
            isOpen 
              ? 'bg-red-600 hover:bg-red-700 rotate-45' 
              : 'bg-teal-600 hover:bg-teal-700'
          } text-white border-0`}
          onClick={toggleMenu}
        >
          {isOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <Menu className="h-6 w-6" />
          )}
        </Button>
      </motion.div>

      {/* Capturing Indicator */}
      {isCapturing && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -top-2 -right-2"
        >
          <Badge className="bg-red-500 text-white animate-pulse">
            جاري الرفع
          </Badge>
        </motion.div>
      )}
    </div>
  );
}