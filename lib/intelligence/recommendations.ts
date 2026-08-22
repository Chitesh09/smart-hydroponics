// ============================================================
// HydroSmart — Actionable Agronomic Recommendations Service
// ============================================================

import { AnomalyReport, CropTargetProfile, RecommendationItem } from './types';
import { DEFAULT_CROP_PROFILE } from './healthScore';

export function generateRecommendations(
  anomalies: AnomalyReport[],
  ph?: number,
  tds?: number,
  waterLevel?: number,
  cropProfile: CropTargetProfile = DEFAULT_CROP_PROFILE
): RecommendationItem[] {
  const recommendations: RecommendationItem[] = [];
  const now = Date.now();

  // 1. pH Action Items
  if (ph !== undefined) {
    if (ph < cropProfile.phMin) {
      recommendations.push({
        id: `rec_ph_up_${now}`,
        timestamp: now,
        priority: ph < cropProfile.phMin - 0.5 ? 'urgent' : 'high',
        title: 'Buffer Reservoir with pH-Up',
        action: `Dose potassium hydroxide (pH Up) solution to raise current pH from ${ph.toFixed(2)} toward target range (${cropProfile.phMin.toFixed(1)} - ${cropProfile.phMax.toFixed(1)}).`,
        reasoning: 'Acidic water dissolves root cell membranes and locks out nitrogen, phosphorus, and potassium.',
        category: 'ph',
        status: 'pending',
      });
    } else if (ph > cropProfile.phMax) {
      recommendations.push({
        id: `rec_ph_down_${now}`,
        timestamp: now,
        priority: ph > cropProfile.phMax + 0.5 ? 'urgent' : 'high',
        title: 'Dose Mild Phosphoric / Citric Acid (pH-Down)',
        action: `Add pH-Down buffer to lower pH from ${ph.toFixed(2)} toward target range (${cropProfile.phMin.toFixed(1)} - ${cropProfile.phMax.toFixed(1)}).`,
        reasoning: 'High pH precipitates micronutrients like iron and manganese into insoluble salts.',
        category: 'ph',
        status: 'pending',
      });
    }
  }

  // 2. TDS Nutrient Action Items
  if (tds !== undefined) {
    if (tds < cropProfile.tdsMin) {
      const deficit = Math.round(cropProfile.tdsMin - tds);
      recommendations.push({
        id: `rec_tds_add_${now}`,
        timestamp: now,
        priority: deficit > 300 ? 'urgent' : 'high',
        title: 'Replenish Hydroponic Nutrient Solution (Part A+B)',
        action: `Add concentrated nutrient stock to increase TDS by +${deficit} PPM up to target ${cropProfile.tdsMin} - ${cropProfile.tdsMax} PPM.`,
        reasoning: 'Active vegetative plant growth is depleting dissolved nitrogen and calcium salts from the solution.',
        category: 'nutrient',
        status: 'pending',
      });
    } else if (tds > cropProfile.tdsMax) {
      recommendations.push({
        id: `rec_tds_dilute_${now}`,
        timestamp: now,
        priority: 'high',
        title: 'Dilute Reservoir with Fresh RO/Dechlorinated Water',
        action: `Top off reservoir with pure freshwater to reduce TDS from ${Math.round(tds)} PPM down to ${cropProfile.tdsMax} PPM.`,
        reasoning: 'High salt concentration causes osmotic shock and burns delicate root tips.',
        category: 'nutrient',
        status: 'pending',
      });
    }
  }

  // 3. Water Level Action Items
  if (waterLevel !== undefined) {
    if (waterLevel < 25) {
      recommendations.push({
        id: `rec_water_refill_${now}`,
        timestamp: now,
        priority: waterLevel < 15 ? 'urgent' : 'medium',
        title: 'Top Up Main Water Reservoir Tank',
        action: `Add fresh water to bring reservoir level back above 75% capacity. Current level is ${Math.round(waterLevel)}%.`,
        reasoning: 'Low water volume accelerates nutrient concentration fluctuation and risks pump cavitation.',
        category: 'water',
        status: 'pending',
      });
    }
  }

  // If no anomalies exist, provide maintenance notice
  if (recommendations.length === 0 && anomalies.length === 0) {
    recommendations.push({
      id: `rec_nominal_${now}`,
      timestamp: now,
      priority: 'low',
      title: 'Maintain Current Nutrient Regimen',
      action: 'All chemical and physical telemetry are inside target biological parameters.',
      reasoning: 'Continuous monitoring confirms stable root-zone equilibrium.',
      category: 'inspection',
      status: 'pending',
    });
  }

  return recommendations;
}
