import { NextResponse } from 'next/server';
import { setRealReading } from '@/lib/telemetryStore';
import { pushSensorReading, firebaseAvailable, pushAlert } from '@/lib/firebase';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { ph, tds, temperature, waterLevel } = body;

    // Validate incoming telemetry parameters
    if (ph === undefined || tds === undefined || temperature === undefined || waterLevel === undefined) {
      return NextResponse.json({ error: 'Missing required telemetry fields (ph, tds, temperature, waterLevel)' }, { status: 400 });
    }

    const reading = {
      ph: Number(ph),
      tds: Number(tds),
      temperature: Number(temperature),
      waterLevel: Number(waterLevel),
    };

    // Update in-memory telemetry store
    setRealReading(reading);

    // Push to Firebase RTDB if online
    if (firebaseAvailable) {
      const timestampedReading = {
        ...reading,
        timestamp: Date.now(),
      };
      await pushSensorReading(timestampedReading);

      if (reading.waterLevel < 15) {
        await pushAlert({
          id: Date.now().toString(),
          type: 'danger',
          title: 'Low Water Level Alert',
          message: `Real sensor reports reservoir water level is critically low: ${reading.waterLevel}%`,
          timestamp: Date.now(),
        });
      }
    }

    return NextResponse.json({ success: true, mode: 'hardware' });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to ingest hardware telemetry' }, { status: 500 });
  }
}
