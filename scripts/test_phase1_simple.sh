#!/bin/bash
# Simple Phase 1 Test Script
# اختبار بسيط للمرحلة الأولى

set -e

echo "🧪 بدء اختبار Phase 1..."

# Test 1: Health Check
echo "1. فحص صحة النظام..."
HEALTH=$(curl -s "http://localhost:5000/api/gis/health" || echo "{\"error\":\"no response\"}")
echo "Health Response: $HEALTH"

# Test 2: Layers API
echo "2. اختبار API الطبقات..."
LAYERS=$(curl -s "http://localhost:5000/api/gis/layers" || echo "{\"error\":\"no response\"}")
echo "Current layers count: $(echo "$LAYERS" | grep -o '"layers"' | wc -l || echo "0")"

# Test 3: Check if test file exists
echo "3. فحص ملف الاختبار..."
TEST_FILE="temp-uploads/test_geotiff.tif"
if [ -f "$TEST_FILE" ]; then
    echo "✅ ملف الاختبار موجود: $TEST_FILE"
    FILE_SIZE=$(stat -c%s "$TEST_FILE" 2>/dev/null || stat -f%z "$TEST_FILE" 2>/dev/null || echo "unknown")
    echo "حجم الملف: $FILE_SIZE bytes"
else
    echo "❌ ملف الاختبار غير موجود: $TEST_FILE"
    echo "الملفات الموجودة:"
    ls -la temp-uploads/ | head -10
    exit 1
fi

# Test 4: Try upload with existing Phase 0 system
echo "4. اختبار الرفع مع Phase 0..."
UPLOAD_RESULT=$(curl -s -X POST "http://localhost:5000/api/gis/upload" \
    -F "file=@${TEST_FILE}" \
    -H "Accept: application/json" || echo "{\"error\":\"upload failed\"}")

echo "Upload result:"
echo "$UPLOAD_RESULT"

# Test 5: Check if Phase 1 routes work
echo "5. اختبار routes للمرحلة الأولى..."
PHASE1_HEALTH=$(curl -s "http://localhost:8001/health" 2>/dev/null || echo "{\"error\":\"Phase 1 dispatcher not running\"}")
echo "Phase 1 Dispatcher: $PHASE1_HEALTH"

echo ""
echo "🏁 انتهاء الاختبار البسيط"
echo "للاختبار الشامل، استخدم:"
echo "./scripts/e2e_phase1_test.sh"