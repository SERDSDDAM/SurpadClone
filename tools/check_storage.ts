#!/usr/bin/env -S node --loader tsx
import { storage as memStorage } from '../server/storage';
import { randomUUID } from 'crypto';

async function testMemStorage() {
  console.log('Testing MemStorage...');
  const before = await memStorage.getSurveyRequests();
  console.log(`  existing requests: ${before.length}`);

  const reqId = randomUUID();
  const newReq = await memStorage.createSurveyRequest({
    requestNumber: `TEST-${Date.now()}`,
    ownerName: 'Automated Test',
    region: 'unit-test',
    assignedSurveyor: null,
    status: 'submitted',
    documents: [],
    notes: 'created by tools/check_storage'
  } as any);

  console.log('  created request id=', newReq.id);

  const point = await memStorage.createSurveyPoint({
    requestId: newReq.id,
    pointNumber: 'P-TEST-1',
    featureCode: 'TEST',
    featureType: 'POINT',
    longitude: 45.0,
    latitude: 15.0,
    elevation: 10,
    accuracy: 1.2,
    notes: 'point from test',
    photos: [],
    capturedBy: 'tools'
  } as any);

  console.log('  created point id=', point.id);

  const points = await memStorage.getSurveyPoints(newReq.id);
  console.log(`  points for request: ${points.length}`);

  const deleted = await memStorage.deleteSurveyPoint(point.id);
  console.log('  deleted point ->', deleted);

  const stats = await memStorage.getStats();
  console.log('  stats:', stats);
}

async function tryPostgis() {
  // Try to load PostgisStorage only if DB env present
  if (!process.env.DB_HOST) {
    console.log('Skipping PostgisStorage test — DB_HOST not set');
    return;
  }

  try {
    const { PostgisStorage } = await import('../server/postgis-storage');
    const pg = new PostgisStorage();
    console.log('Testing PostgisStorage (will run lightweight calls)...');

    const requests = await pg.getSurveyRequests();
    console.log(`  survey requests (db): ${requests.length}`);

    // do not write to production DB by default; only attempt read operations here
  } catch (err) {
    console.error('PostgisStorage test failed:', err);
  }
}

async function main() {
  try {
    await testMemStorage();
    await tryPostgis();
    console.log('\nStorage smoke tests completed.');
    process.exit(0);
  } catch (err) {
    console.error('Storage smoke tests failed:', err);
    process.exit(2);
  }
}

main();
