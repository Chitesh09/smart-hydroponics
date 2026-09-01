// ============================================================
// HydroSmart — Secure Server-Side Plant Identification API
// Interfaces with Pl@ntNet / PlantCLEF Multi-Species ML Inference
// API Key is strictly server-side (PLANTNET_API_KEY)
// ============================================================

import { NextResponse } from 'next/server';

export interface PlantNetCandidate {
  id: string;
  commonName: string;
  scientificName: string;
  family: string;
  confidence: number; // 0 - 100%
  similarityScore: number; // 0.0 - 1.0
  confidenceLevel: 'high' | 'medium' | 'low' | 'uncertain';
}

export interface IdentificationApiResponse {
  status: 'success' | 'low_confidence' | 'no_plant' | 'unconfigured_api' | 'error';
  primaryCandidate: PlantNetCandidate | null;
  rankedCandidates: PlantNetCandidate[];
  overallConfidence: number;
  confidenceLevel: 'high' | 'medium' | 'low' | 'uncertain';
  guidanceMessage: string;
  source: 'plantnet_api' | 'plantclef_model' | 'fallback' | 'offline';
  timestamp: number;
  latencyMs?: number;
}

export async function POST(request: Request) {
  const startTime = Date.now();
  const timestamp = Date.now();

  try {
    const body = await request.json();
    const { image, organ = 'leaf' } = body;

    if (!image || typeof image !== 'string') {
      return NextResponse.json(
        {
          status: 'error',
          primaryCandidate: null,
          rankedCandidates: [],
          overallConfidence: 0,
          confidenceLevel: 'uncertain',
          guidanceMessage: 'No valid image data provided for identification.',
          source: 'offline',
          timestamp,
        },
        { status: 400 }
      );
    }

    const apiKey = process.env.PLANTNET_API_KEY || process.env.PLANTCLEF_API_KEY;

    // If Pl@ntNet API Key is unconfigured, return honest structured status
    if (!apiKey) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn(
          '[PlantNet API] PLANTNET_API_KEY environment variable is not configured. Real ML identification requires this key.'
        );
      }

      return NextResponse.json({
        status: 'unconfigured_api',
        primaryCandidate: null,
        rankedCandidates: [],
        overallConfidence: 0,
        confidenceLevel: 'uncertain',
        guidanceMessage:
          'Pl@ntNet API key (PLANTNET_API_KEY) is not set in server environment. Set PLANTNET_API_KEY in .env.local to enable live model identification.',
        source: 'offline',
        timestamp,
        latencyMs: Date.now() - startTime,
      });
    }

    // Convert Base64 data URL into binary Buffer
    const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    const blob = new Blob([buffer], { type: 'image/jpeg' });

    // Prepare multipart form for Pl@ntNet API
    const formData = new FormData();
    formData.append('images', blob, 'plant_crop.jpg');
    formData.append('organs', organ === 'auto' ? 'auto' : 'leaf');

    // Call Pl@ntNet Identification API
    const plantNetUrl = `https://my-api.plantnet.org/v2/identify/all?api-key=${encodeURIComponent(apiKey)}&include-related-images=false`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000); // 12s timeout

    const apiResponse = await fetch(plantNetUrl, {
      method: 'POST',
      body: formData,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const latencyMs = Date.now() - startTime;

    if (!apiResponse.ok) {
      const errorText = await apiResponse.text().catch(() => '');
      if (process.env.NODE_ENV !== 'production') {
        console.error(`[PlantNet API Error ${apiResponse.status}]:`, errorText);
      }

      if (apiResponse.status === 404) {
        return NextResponse.json({
          status: 'low_confidence',
          primaryCandidate: null,
          rankedCandidates: [],
          overallConfidence: 0,
          confidenceLevel: 'uncertain',
          guidanceMessage: 'Plant not recognized by Pl@ntNet model (No matching botanical species).',
          source: 'plantnet_api',
          timestamp,
          latencyMs,
        });
      }

      if (apiResponse.status === 429) {
        return NextResponse.json({
          status: 'error',
          primaryCandidate: null,
          rankedCandidates: [],
          overallConfidence: 0,
          confidenceLevel: 'uncertain',
          guidanceMessage: 'Pl@ntNet API rate limit exceeded. Please wait a moment before re-identifying.',
          source: 'plantnet_api',
          timestamp,
          latencyMs,
        });
      }

      return NextResponse.json({
        status: 'error',
        primaryCandidate: null,
        rankedCandidates: [],
        overallConfidence: 0,
        confidenceLevel: 'uncertain',
        guidanceMessage: `Botanical identification service error (${apiResponse.status}).`,
        source: 'plantnet_api',
        timestamp,
        latencyMs,
      });
    }

    const data = await apiResponse.json();
    const results = data.results || [];

    if (results.length === 0) {
      return NextResponse.json({
        status: 'low_confidence',
        primaryCandidate: null,
        rankedCandidates: [],
        overallConfidence: 0,
        confidenceLevel: 'uncertain',
        guidanceMessage: 'No confident botanical match detected in frame.',
        source: 'plantnet_api',
        timestamp,
        latencyMs,
      });
    }

    // Map top 3 predictions
    const rankedCandidates: PlantNetCandidate[] = results.slice(0, 3).map((res: {
      score: number;
      species: {
        scientificNameWithoutAuthor: string;
        family?: { scientificNameWithoutAuthor?: string };
        commonNames?: string[];
      };
    }) => {
      const score = Math.min(1.0, Math.max(0, res.score || 0));
      const confidence = Math.round(score * 100);
      const scientificName = res.species.scientificNameWithoutAuthor || 'Unknown species';
      const commonName =
        res.species.commonNames && res.species.commonNames.length > 0
          ? res.species.commonNames[0].charAt(0).toUpperCase() + res.species.commonNames[0].slice(1)
          : scientificName;
      const family = res.species.family?.scientificNameWithoutAuthor || 'Botanical Family';

      let confidenceLevel: 'high' | 'medium' | 'low' | 'uncertain' = 'uncertain';
      if (confidence >= 75) confidenceLevel = 'high';
      else if (confidence >= 50) confidenceLevel = 'medium';
      else if (confidence >= 25) confidenceLevel = 'low';

      return {
        id: scientificName.toLowerCase().replace(/\s+/g, '_'),
        commonName,
        scientificName,
        family,
        confidence,
        similarityScore: score,
        confidenceLevel,
      };
    });

    const top1 = rankedCandidates[0];
    const overallConfidence = top1 ? top1.confidence : 0;

    // Logging in development
    if (process.env.NODE_ENV !== 'production') {
      console.log(
        `[PlantNet Identification] Top Match: ${top1?.commonName} (${top1?.scientificName}) | Confidence: ${overallConfidence}% | Latency: ${latencyMs}ms`
      );
    }

    // High confidence acceptance threshold (>= 70%)
    if (overallConfidence >= 70 && top1) {
      return NextResponse.json({
        status: 'success',
        primaryCandidate: top1,
        rankedCandidates,
        overallConfidence,
        confidenceLevel: 'high',
        guidanceMessage: `Confirmed identification as ${top1.commonName} (${top1.scientificName}) with ${overallConfidence}% confidence.`,
        source: 'plantnet_api',
        timestamp,
        latencyMs,
      });
    }

    // Moderate / Low confidence rejection (Do NOT force winner)
    return NextResponse.json({
      status: 'low_confidence',
      primaryCandidate: null,
      rankedCandidates,
      overallConfidence,
      confidenceLevel: overallConfidence >= 45 ? 'medium' : 'uncertain',
      guidanceMessage: `Plant detected, but species could not be identified confidently (${top1?.commonName || 'Unknown'} ~${overallConfidence}%).`,
      source: 'plantnet_api',
      timestamp,
      latencyMs,
    });
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown server error';
    if (process.env.NODE_ENV !== 'production') {
      console.error('[PlantNet Route Handler Error]:', errorMsg);
    }

    return NextResponse.json(
      {
        status: 'error',
        primaryCandidate: null,
        rankedCandidates: [],
        overallConfidence: 0,
        confidenceLevel: 'uncertain',
        guidanceMessage: 'Identification service encountered a network or processing error.',
        source: 'plantnet_api',
        timestamp,
      },
      { status: 500 }
    );
  }
}
