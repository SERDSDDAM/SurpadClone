import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { WifiOff, Upload, RefreshCw, CheckCircle, XCircle, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface QueueItem {
  id: string;
  type: 'point' | 'line' | 'polygon' | 'complete';
  data: any;
  timestamp: number;
  retryCount: number;
  status: 'pending' | 'syncing' | 'success' | 'failed';
}

interface OfflineQueueProps {
  requestId: string;
  isOnline: boolean;
  onSyncComplete?: () => void;
}

// IndexedDB للتخزين المحلي
class OfflineStorage {
  private dbName = 'surveyapp_offline';
  private version = 1;
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        if (!db.objectStoreNames.contains('queue')) {
          const store = db.createObjectStore('queue', { keyPath: 'id' });
          store.createIndex('timestamp', 'timestamp', { unique: false });
          store.createIndex('status', 'status', { unique: false });
        }
      };
    });
  }

  async addToQueue(item: Omit<QueueItem, 'id' | 'timestamp' | 'retryCount' | 'status'>): Promise<void> {
    if (!this.db) await this.init();
    
    const queueItem: QueueItem = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      timestamp: Date.now(),
      retryCount: 0,
      status: 'pending',
      ...item
    };

    const transaction = this.db!.transaction(['queue'], 'readwrite');
    const store = transaction.objectStore('queue');
    store.add(queueItem);
  }

  async getQueue(): Promise<QueueItem[]> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['queue'], 'readonly');
      const store = transaction.objectStore('queue');
      const request = store.getAll();
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async updateItem(id: string, updates: Partial<QueueItem>): Promise<void> {
    if (!this.db) await this.init();
    
    const transaction = this.db!.transaction(['queue'], 'readwrite');
    const store = transaction.objectStore('queue');
    const request = store.get(id);
    
    request.onsuccess = () => {
      const item = request.result;
      if (item) {
        Object.assign(item, updates);
        store.put(item);
      }
    };
  }

  async removeItem(id: string): Promise<void> {
    if (!this.db) await this.init();
    
    const transaction = this.db!.transaction(['queue'], 'readwrite');
    const store = transaction.objectStore('queue');
    store.delete(id);
  }

  async clearCompleted(): Promise<void> {
    if (!this.db) await this.init();
    
    const transaction = this.db!.transaction(['queue'], 'readwrite');
    const store = transaction.objectStore('queue');
    const index = store.index('status');
    const request = index.openCursor(IDBKeyRange.only('success'));
    
    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest).result;
      if (cursor) {
        cursor.delete();
        cursor.continue();
      }
    };
  }
}

export default function OfflineQueue({ requestId, isOnline, onSyncComplete }: OfflineQueueProps) {
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const { toast } = useToast();
  
  const storage = new OfflineStorage();

  // تحميل البيانات المحلية
  const loadQueue = async () => {
    try {
      const items = await storage.getQueue();
      setQueue(items);
    } catch (error) {
      console.error('Error loading offline queue:', error);
    }
  };

  // إضافة عنصر للطابور
  const addToOfflineQueue = async (type: QueueItem['type'], data: any) => {
    try {
      await storage.addToQueue({ type, data });
      await loadQueue();
      
      toast({
        title: "حُفظ محلياً",
        description: "سيتم المزامنة عند الاتصال",
        variant: "default",
      });
    } catch (error) {
      console.error('Error adding to offline queue:', error);
    }
  };

  // مزامنة العناصر المعلقة
  const syncQueue = async () => {
    if (!isOnline || syncing) return;
    
    setSyncing(true);
    setSyncProgress(0);
    
    const pendingItems = queue.filter(item => item.status === 'pending' || item.status === 'failed');
    const total = pendingItems.length;
    
    if (total === 0) {
      setSyncing(false);
      return;
    }

    let completed = 0;
    
    for (const item of pendingItems) {
      try {
        await storage.updateItem(item.id, { status: 'syncing' });
        
        let endpoint = '';
        switch (item.type) {
          case 'point':
            endpoint = `/api/survey-requests/${requestId}/points`;
            break;
          case 'line':
            endpoint = `/api/survey-requests/${requestId}/lines`;
            break;
          case 'polygon':
            endpoint = `/api/survey-requests/${requestId}/polygons`;
            break;
          case 'complete':
            endpoint = `/api/survey-requests/${requestId}/complete`;
            break;
        }

        const response = await apiRequest(endpoint, {
          method: 'POST',
          body: item.data
        });

        if (response) {
          await storage.updateItem(item.id, { status: 'success' });
          setTimeout(() => storage.removeItem(item.id), 5000); // حذف بعد 5 ثواني
        } else {
          throw new Error('Failed to sync');
        }
        
      } catch (error) {
        console.error(`Error syncing item ${item.id}:`, error);
        await storage.updateItem(item.id, { 
          status: 'failed', 
          retryCount: item.retryCount + 1 
        });
      }
      
      completed++;
      setSyncProgress((completed / total) * 100);
    }
    
    await loadQueue();
    setSyncing(false);
    
    toast({
      title: "مزامنة مكتملة",
      description: `تم مزامنة ${completed} من ${total} عنصر`,
      variant: "default",
    });

    onSyncComplete?.();
  };

  // تنظيف العناصر المكتملة
  const clearCompleted = async () => {
    try {
      await storage.clearCompleted();
      await loadQueue();
    } catch (error) {
      console.error('Error clearing completed items:', error);
    }
  };

  // تحميل البيانات عند التهيئة
  useEffect(() => {
    loadQueue();
  }, []);

  // مزامنة تلقائية عند الاتصال
  useEffect(() => {
    if (isOnline && queue.some(item => item.status === 'pending' || item.status === 'failed')) {
      syncQueue();
    }
  }, [isOnline]);

  const pendingCount = queue.filter(item => item.status === 'pending' || item.status === 'failed').length;
  const successCount = queue.filter(item => item.status === 'success').length;

  if (queue.length === 0) {
    return null;
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <WifiOff className="h-5 w-5 text-orange-500" />
          الطابور المحلي
          {pendingCount > 0 && (
            <Badge variant="secondary" className="ml-auto">
              {pendingCount} معلق
            </Badge>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* مؤشر التقدم */}
        {syncing && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>جاري المزامنة...</span>
              <span>{Math.round(syncProgress)}%</span>
            </div>
            <Progress value={syncProgress} className="h-2" />
          </div>
        )}

        {/* الإحصائيات */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="space-y-1">
            <div className="text-2xl font-bold text-orange-500">{pendingCount}</div>
            <div className="text-xs text-muted-foreground">معلق</div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-bold text-blue-500">{syncing ? '...' : '0'}</div>
            <div className="text-xs text-muted-foreground">جاري المزامنة</div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-bold text-green-500">{successCount}</div>
            <div className="text-xs text-muted-foreground">مكتمل</div>
          </div>
        </div>

        <Separator />

        {/* العناصر */}
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {queue.slice(-10).reverse().map((item) => (
            <div key={item.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2">
                {item.status === 'success' && <CheckCircle className="h-4 w-4 text-green-500" />}
                {item.status === 'failed' && <XCircle className="h-4 w-4 text-red-500" />}
                {item.status === 'pending' && <Clock className="h-4 w-4 text-orange-500" />}
                {item.status === 'syncing' && <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />}
                
                <div className="text-sm">
                  <div className="font-medium">
                    {item.type === 'point' && 'نقطة مسح'}
                    {item.type === 'line' && 'خط مسح'}
                    {item.type === 'polygon' && 'مضلع مسح'}
                    {item.type === 'complete' && 'إكمال المسح'}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(item.timestamp).toLocaleTimeString('ar-EG')}
                  </div>
                </div>
              </div>
              
              <Badge variant={
                item.status === 'success' ? 'default' :
                item.status === 'failed' ? 'destructive' :
                item.status === 'syncing' ? 'secondary' : 'outline'
              }>
                {item.status === 'success' && 'نجح'}
                {item.status === 'failed' && 'فشل'}
                {item.status === 'pending' && 'انتظار'}
                {item.status === 'syncing' && 'مزامنة'}
              </Badge>
            </div>
          ))}
        </div>

        {/* أزرار التحكم */}
        <div className="flex gap-2">
          <Button 
            onClick={syncQueue}
            disabled={!isOnline || syncing || pendingCount === 0}
            className="flex-1"
            variant="outline"
          >
            <Upload className="h-4 w-4 mr-2" />
            مزامنة الآن
          </Button>
          
          {successCount > 0 && (
            <Button 
              onClick={clearCompleted}
              variant="ghost"
              size="sm"
            >
              تنظيف
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Hook للاستخدام السهل
export function useOfflineQueue(requestId: string) {
  const storage = new OfflineStorage();
  
  const addToQueue = async (type: QueueItem['type'], data: any) => {
    await storage.addToQueue({ type, data });
  };

  return { addToQueue };
}