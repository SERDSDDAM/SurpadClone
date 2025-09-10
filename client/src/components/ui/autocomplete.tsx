import React, { useState, useRef, useEffect } from 'react';
import { Command, CommandEmpty, CommandInput, CommandItem, CommandList, CommandGroup } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { 
  Search, 
  X, 
  ChevronDown, 
  MapPin, 
  Building2, 
  Loader2,
  Check,
  Navigation 
} from 'lucide-react';

// نوع البيانات المتوقع لكل اقتراح
interface AutocompleteOption {
  id: string;
  label: string; // النص الظاهر (عربي)
  secondaryLabel?: string; // النص الثانوي (إنجليزي أو معلومات إضافية)
  category: string; // المستوى الإداري
  icon?: React.ReactNode;
  metadata?: Record<string, any>; // بيانات إضافية
  parentPath?: string[]; // المسار الهرمي للوصول للعنصر
}

interface AutocompleteProps {
  placeholder?: string;
  options: AutocompleteOption[];
  value?: AutocompleteOption | null;
  onSelect: (option: AutocompleteOption | null) => void;
  onSearch?: (query: string) => void;
  isLoading?: boolean;
  multiple?: boolean;
  selectedOptions?: AutocompleteOption[];
  onSelectMultiple?: (options: AutocompleteOption[]) => void;
  disabled?: boolean;
  className?: string;
  maxHeight?: string;
  showCategories?: boolean;
  allowClear?: boolean;
  searchThreshold?: number; // الحد الأدنى للأحرف قبل البحث
  debounceMs?: number; // تأخير البحث
  emptyMessage?: string;
  noResultsMessage?: string;
}

export default function Autocomplete({
  placeholder = "ابحث...",
  options = [],
  value,
  onSelect,
  onSearch,
  isLoading = false,
  multiple = false,
  selectedOptions = [],
  onSelectMultiple,
  disabled = false,
  className,
  maxHeight = "300px",
  showCategories = true,
  allowClear = true,
  searchThreshold = 1,
  debounceMs = 300,
  emptyMessage = "لا توجد خيارات",
  noResultsMessage = "لا توجد نتائج"
}: AutocompleteProps) {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const searchTimeoutRef = useRef<NodeJS.Timeout>();
  
  // التعامل مع البحث المؤجل (debounced)
  const handleSearch = (query: string) => {
    setInputValue(query);
    
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    searchTimeoutRef.current = setTimeout(() => {
      if (query.length >= searchThreshold && onSearch) {
        onSearch(query);
      }
    }, debounceMs);
  };

  // تنظيف timeout عند إلغاء المكون
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  // تجميع الخيارات بحسب الفئة
  const groupedOptions = showCategories 
    ? options.reduce((acc, option) => {
        const category = option.category || 'أخرى';
        if (!acc[category]) {
          acc[category] = [];
        }
        acc[category].push(option);
        return acc;
      }, {} as Record<string, AutocompleteOption[]>)
    : { 'جميع النتائج': options };

  // التعامل مع الاختيار الواحد
  const handleSingleSelect = (option: AutocompleteOption) => {
    setOpen(false);
    setInputValue('');
    onSelect(option);
  };

  // التعامل مع الاختيار المتعدد
  const handleMultipleSelect = (option: AutocompleteOption) => {
    if (!onSelectMultiple) return;
    
    const isSelected = selectedOptions.some(selected => selected.id === option.id);
    
    if (isSelected) {
      // إزالة من المحدد
      const newSelected = selectedOptions.filter(selected => selected.id !== option.id);
      onSelectMultiple(newSelected);
    } else {
      // إضافة للمحدد
      onSelectMultiple([...selectedOptions, option]);
    }
  };

  // إزالة خيار من المختارات المتعددة
  const removeSelectedOption = (optionId: string) => {
    if (!onSelectMultiple) return;
    const newSelected = selectedOptions.filter(option => option.id !== optionId);
    onSelectMultiple(newSelected);
  };

  // مسح الاختيار
  const clearSelection = () => {
    if (multiple && onSelectMultiple) {
      onSelectMultiple([]);
    } else {
      onSelect(null);
    }
    setInputValue('');
  };

  // تحديد النص الظاهر في الحقل
  const getDisplayValue = () => {
    if (multiple) {
      return selectedOptions.length > 0 
        ? `تم اختيار ${selectedOptions.length} عنصر` 
        : '';
    }
    return value ? value.label : '';
  };

  return (
    <div className={cn("relative", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn(
              "w-full justify-between text-right h-10 px-3",
              disabled && "opacity-50 cursor-not-allowed"
            )}
            disabled={disabled}
            data-testid="autocomplete-trigger"
          >
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <Search className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span className={cn(
                "truncate text-sm",
                !getDisplayValue() && "text-muted-foreground"
              )}>
                {getDisplayValue() || placeholder}
              </span>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              {isLoading && (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              )}
              {allowClear && (getDisplayValue() || selectedOptions.length > 0) && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 hover:bg-destructive hover:text-destructive-foreground"
                  onClick={(e) => {
                    e.stopPropagation();
                    clearSelection();
                  }}
                  data-testid="autocomplete-clear"
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </div>
          </Button>
        </PopoverTrigger>
        
        <PopoverContent 
          className="w-full p-0" 
          style={{ width: 'var(--radix-popover-trigger-width)' }}
          align="start"
          data-testid="autocomplete-content"
        >
          <Command>
            <div className="flex items-center border-b px-3">
              <Search className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
              <CommandInput
                placeholder={placeholder}
                value={inputValue}
                onValueChange={handleSearch}
                className="border-0 px-0 focus:ring-0 text-right"
                dir="rtl"
                data-testid="autocomplete-search"
              />
            </div>
            
            <CommandList style={{ maxHeight }}>
              <ScrollArea className="h-full">
                {isLoading ? (
                  <div className="p-4 text-center">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">جاري البحث...</p>
                  </div>
                ) : Object.keys(groupedOptions).length === 0 ? (
                  <CommandEmpty data-testid="autocomplete-empty">
                    <div className="p-4 text-center">
                      <Navigation className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">{emptyMessage}</p>
                    </div>
                  </CommandEmpty>
                ) : (
                  Object.entries(groupedOptions).map(([category, categoryOptions]) => (
                    <CommandGroup key={category} heading={showCategories ? category : undefined}>
                      {categoryOptions.length === 0 ? (
                        <div className="p-2 text-center text-sm text-muted-foreground">
                          {noResultsMessage}
                        </div>
                      ) : (
                        categoryOptions.map((option) => {
                          const isSelected = multiple 
                            ? selectedOptions.some(selected => selected.id === option.id)
                            : value?.id === option.id;

                          return (
                            <CommandItem
                              key={option.id}
                              value={option.id}
                              onSelect={() => {
                                multiple 
                                  ? handleMultipleSelect(option)
                                  : handleSingleSelect(option);
                              }}
                              className="flex items-center gap-2 p-2 cursor-pointer"
                              data-testid={`autocomplete-option-${option.id}`}
                            >
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                {option.icon || <MapPin className="h-4 w-4 text-muted-foreground" />}
                                <div className="flex-1 min-w-0">
                                  <div className="text-sm font-medium truncate text-right">
                                    {option.label}
                                  </div>
                                  {option.secondaryLabel && (
                                    <div className="text-xs text-muted-foreground truncate text-right">
                                      {option.secondaryLabel}
                                    </div>
                                  )}
                                  {option.parentPath && (
                                    <div className="text-xs text-muted-foreground truncate text-right">
                                      {option.parentPath.join(' ← ')}
                                    </div>
                                  )}
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-1 flex-shrink-0">
                                <Badge variant="outline" className="text-xs">
                                  {option.category}
                                </Badge>
                                {isSelected && (
                                  <Check className="h-4 w-4 text-primary" />
                                )}
                              </div>
                            </CommandItem>
                          );
                        })
                      )}
                    </CommandGroup>
                  ))
                )}
              </ScrollArea>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* عرض العناصر المختارة في الوضع المتعدد */}
      {multiple && selectedOptions.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2" data-testid="autocomplete-selected-items">
          {selectedOptions.map((option) => (
            <Badge
              key={option.id}
              variant="secondary"
              className="flex items-center gap-1 text-xs"
            >
              {option.icon && React.cloneElement(option.icon as React.ReactElement, { className: "h-3 w-3" })}
              <span className="max-w-24 truncate">{option.label}</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                onClick={() => removeSelectedOption(option.id)}
                data-testid={`remove-selected-${option.id}`}
              >
                <X className="h-2 w-2" />
              </Button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}