#!/usr/bin/env bash
# Phase1 E2E Runner: تشغيل Docker services واختبار E2E شامل
# محاولة تشغيل Docker services، إذا لم تتوفر فالتبديل إلى اختبار التكامل البديل (node-only).

set -euo pipefail

API_BASE="${API_BASE:-http://localhost:5000}"
TEST_FILE="${1:-temp-uploads/test_geotiff.tif}"
REPORT_DIR="./e2e-reports"

echo "=== Phase1 E2E Runner: بدء المهمة ==="
echo "API_BASE = $API_BASE"
echo "Test file = $TEST_FILE"

# 0) تجهيز مجلدات
mkdir -p "$REPORT_DIR"

# 1) محاولة تشغيل Docker Compose / phase1-start.sh
DOCKER_AVAILABLE=0
if command -v docker >/dev/null 2>&1; then
  echo "Docker متاح. محاولة تشغيل docker-compose.phase1.yml أو scripts/phase1-start.sh..."
  DOCKER_AVAILABLE=1
  if [ -f scripts/phase1-start.sh ]; then
    chmod +x scripts/phase1-start.sh || true
    echo "تشغيل scripts/phase1-start.sh ..."
    ./scripts/phase1-start.sh || echo "scripts/phase1-start.sh فشل (نتابع المحاولة مع docker-compose)"
  fi
  if [ -f docker-compose.phase1.yml ]; then
    echo "تشغيل docker-compose.phase1.yml ..."
    docker compose -f docker-compose.phase1.yml up -d || echo "docker compose up فشل أو جزء منه"
  else
    echo "docker-compose.phase1.yml غير موجود"
  fi
else
  echo "Docker غير متاح في البيئة — سننتقل لاختبار node-only fallback."
fi

# 2) التحقق من صحة Dispatcher (FastAPI) على المنفذ 8001
DISPATCHER_OK=0
if curl -sS --max-time 3 "http://localhost:8001/health" >/dev/null 2>&1; then
  echo "Dispatcher متاح على http://localhost:8001"
  DISPATCHER_OK=1
else
  echo "Dispatcher غير متاح (port 8001 غير مستجيب). سنستخدم fallback إذا لزم الأمر."
fi

# 3) شغّل اختبار E2E المناسب
REPORT_RUN=0
if [ "$DOCKER_AVAILABLE" -eq 1 ] && [ "$DISPATCHER_OK" -eq 1 ] && [ -f ./scripts/e2e_phase1_test.sh ]; then
  echo "تشغيل الاختبار الكامل (Docker-enabled) عبر scripts/e2e_phase1_test.sh ..."
  chmod +x ./scripts/e2e_phase1_test.sh || true
  ./scripts/e2e_phase1_test.sh "$TEST_FILE"
  REPORT_RUN=1
else
  echo "تشغيل اختبار fallback (node-only) لأن Docker/Dispatcher غير جاهزين أو السكربت غير موجود."
  # جرب سكربت التكامل البديل الموجود في scripts/
  if [ -f ./scripts/e2e_phase1_fallback_test.sh ]; then
    chmod +x ./scripts/e2e_phase1_fallback_test.sh || true
    ./scripts/e2e_phase1_fallback_test.sh "$TEST_FILE" || true
    REPORT_RUN=1
  elif [ -f ./scripts/test_phase1_integration_only.sh ]; then
    chmod +x ./scripts/test_phase1_integration_only.sh || true
    ./scripts/test_phase1_integration_only.sh "$TEST_FILE" || true
    REPORT_RUN=1
  elif [ -f ./scripts/test_phase1_simple.sh ]; then
    chmod +x ./scripts/test_phase1_simple.sh || true
    ./scripts/test_phase1_simple.sh "$TEST_FILE" || true
    REPORT_RUN=1
  else
    echo "لا يوجد سكربت اختبار متاح. انتهى التنفيذ." >&2
  fi
fi

# 4) تحديد أحدث تقرير وraw dir
LATEST_REPORT="$(ls -t ${REPORT_DIR}/phase1-e2e-report-*.md 2>/dev/null | head -n 1 || true)"
RAW_DIR="$(ls -d ${REPORT_DIR}/raw-* 2>/dev/null | head -n 1 || true)"

echo "=== نتائج التنفيذ ==="
echo "أحدث تقرير: $LATEST_REPORT"
echo "مجلد raw (إن وجد): $RAW_DIR"

# 5) اطبع مقتطف من التقرير (حتى 400 سطر) ليُعاد هنا في الدردشة
if [ -n "$LATEST_REPORT" ]; then
  echo "---- بداية مقتطف التقرير (حتى 400 سطر) ----"
  sed -n '1,400p' "$LATEST_REPORT" || true
  echo "---- نهاية المقتطف ----"
else
  echo "لم يتم إنشاء تقرير. محتويات المجلد e2e-reports:"
  ls -la "$REPORT_DIR" || true
fi

# 6) إن Docker متاح، اجلب آخر لوقات الحاويات المفيدة (worker, dispatcher, postgres, minio)
if command -v docker >/dev/null 2>&1 && [ -f docker-compose.phase1.yml ]; then
  echo "=== جمع لوقات الحاويات (آخر 200 سطر) ==="
  docker compose -f docker-compose.phase1.yml logs --no-color --tail=200 worker dispatcher postgres minio || true
fi

# 7) ما أرجو إرساله لي (الـassistant)
# - المسار الكامل للتقرير (variable $LATEST_REPORT)
# - مجلد raw ($RAW_DIR)
# - موجز حالة: تم/فشل + إن وجدت أخطاء باللوق
echo "انتهى التنفيذ. أعد لي قيمة LATEST_REPORT و RAW_DIR وملخص موجز (نجاح/فشل)."