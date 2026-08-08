import { NextResponse } from 'next/server';
import { tick, TargetRanges, resetSimulator } from '@/lib/simulator';
import { pushSensorReading, firebaseAvailable, pushAlert } from '@/lib/firebase';

import { getRealReading } from '@/lib/telemetryStore';

// Mock targets (would normally come from DB)
const currentTargets: TargetRanges = {
  phMin: 5.5,
  phMax: 6.5,
  tdsMin: 800,
  tdsMax: 1200,
  tempMin: 18,
  tempMax: 26
};

// Global to hold control mode between API requests in memory (demo only)
let currentMode: 'auto' | 'manual' = 'auto';

export async function GET() {
  // Check if we have active real hardware data
  const realReading = getRealReading();
  if (realReading) {
    return NextResponse.json({
      reading: realReading,
      pumps: { phUp: false, phDown: false, nutrient: false, circulation: true },
      controlMode: 'manual',
      status: realReading.waterLevel < 15 ? 'fault' : 'stable',
      activeCorrection: null,
      faultMessage: realReading.waterLevel < 15 ? 'Water level critically low — check reservoir (Hardware)' : null,
      correctionCount: 0,
      lastCorrectionTime: null
    });
  }

  // Fall back to simulator if no real hardware is currently reporting
  const state = tick(currentTargets, currentMode);
  
  // Conditionally push to Firebase if configured
  if (firebaseAvailable) {
    await pushSensorReading(state.reading);
    
    if (state.status === 'fault' && state.faultMessage) {
       await pushAlert({
         id: Date.now().toString(),
         type: 'danger',
         title: 'Fault Detected',
         message: state.faultMessage,
         timestamp: Date.now()
       });
    }
  }

  return NextResponse.json(state);
}

export async function POST(request: Request) {
  const body = await request.json();
  
  if (body.action === 'setMode') {
    currentMode = body.mode;
    return NextResponse.json({ success: true, mode: currentMode });
  }
  
  if (body.action === 'reset') {
    resetSimulator(body.ph || 6.0, body.tds || 1000);
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}
