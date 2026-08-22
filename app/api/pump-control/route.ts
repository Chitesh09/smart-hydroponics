import { NextResponse } from 'next/server';
import { manualPumpActivate, PumpState } from '@/lib/simulator';
import { pushAlert, firebaseAvailable } from '@/lib/firebase';

export async function POST(request: Request) {
  try {
    const { pumpId, duration } = await request.json();

    if (!pumpId || !duration) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    // Trigger simulator manual activate
    manualPumpActivate(pumpId as keyof PumpState, duration * 1000);

    if (firebaseAvailable) {
      await pushAlert({
        id: Date.now().toString(),
        type: 'info',
        title: 'Manual Override',
        message: `Pump ${pumpId} activated manually for ${duration}s`,
        timestamp: Date.now()
      });
    }

    return NextResponse.json({ success: true, pumpId, duration });
    
  } catch (_err) {
    return NextResponse.json({ error: 'Failed to trigger pump' }, { status: 500 });
  }
}
