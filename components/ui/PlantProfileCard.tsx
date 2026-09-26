'use client';

import React, { useState } from 'react';
import {
  Sprout,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  Droplets,
  FlaskConical,
  ShieldCheck,
} from 'lucide-react';
import { PlantProfile } from '@/lib/intelligence/types';
import { SupportedLanguageCode, AssistantMode } from '@/lib/assistant/assistantConfig';
import {
  getLocalizedLifecycleState,
  getLocalizedMonitoringStatus,
  getLocalizedIdentificationStatus,
  getLocalizedCompletenessStatus,
  getLocalizedDigitalProfileSummary,
} from '@/lib/intelligence/farmerSemanticLayer';

interface PlantProfileCardProps {
  profile: PlantProfile;
  observationsCount?: number;
  language?: SupportedLanguageCode;
  userMode?: AssistantMode;
  compact?: boolean;
}

export function PlantProfileCard({
  profile,
  observationsCount,
  language = 'en',
  userMode = 'farmer',
  compact = false,
}: PlantProfileCardProps) {
  const [internalMode, setInternalMode] = useState<AssistantMode>(userMode);

  React.useEffect(() => {
    setInternalMode(userMode);
  }, [userMode]);

  const isKn = language === 'kn';
  const effectiveMode = internalMode;

  const isIdentified = Boolean(
    profile.species &&
    profile.species !== 'Unknown Plant' &&
    profile.species !== 'unknown_plant'
  );

  const plantName = isIdentified
    ? (profile.commonName || profile.species)
    : (isKn ? 'ಗಿಡ' : 'Plant');

  const speciesSubtitle = isIdentified
    ? (profile.scientificName || (isKn ? 'ವರ್ಗೀಕರಿಸಿದ ಪ್ರಭೇದ' : 'Botanical Specimen'))
    : (isKn ? 'ಗಿಡದ ಪ್ರಕಾರ ಇನ್ನೂ ಗುರುತಿಸಲಾಗಿಲ್ಲ' : 'Plant type not identified yet');

  const [now, setNow] = useState<number | null>(null);

  React.useEffect(() => {
    setNow(Date.now());
  }, []);

  const ageDays = (now && profile.createdAt)
    ? Math.max(1, Math.round((now - profile.createdAt) / 86400000) + 1)
    : 1;
  const totalObs = observationsCount !== undefined ? observationsCount : profile.observationCount;

  // Format relative last observed string
  const lastObservedStr = React.useMemo(() => {
    if (!profile.lastObservedAt || !now) {
      return isKn ? 'ದಾಖಲೆಯಿಲ್ಲ' : 'No records yet';
    }
    const diffMs = now - profile.lastObservedAt;
    const diffMin = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMin / 60);

    if (diffMin < 2) return isKn ? 'ಈಗಷ್ಟೇ' : 'Just now';
    if (diffMin < 60) return isKn ? `${diffMin} ನಿಮಿಷದ ಹಿಂದೆ` : `${diffMin}m ago`;
    if (diffHours < 24) return isKn ? `${diffHours} ಗಂಟೆಯ ಹಿಂದೆ` : `${diffHours}h ago`;
    return new Date(profile.lastObservedAt).toLocaleDateString(isKn ? 'kn-IN' : 'en-US', {
      month: 'short',
      day: 'numeric',
    });
  }, [profile.lastObservedAt, now, isKn]);

  // Derived Digital Profile Summary
  const profileSummary = getLocalizedDigitalProfileSummary(profile, language);
  const completeness = profile.completeness;
  const lifecycleState = profile.lifecycle?.lifecycleState || 'STABLE';
  const monitoringStatus = profile.lifecycle?.monitoringStatus || 'ACTIVE';
  const identificationStatus = profile.identity?.identificationStatus || (isIdentified ? 'IDENTIFIED' : 'UNKNOWN');

  return (
    <div
      className={`rounded-2xl border transition-all duration-300 overflow-hidden ${
        lifecycleState === 'ATTENTION'
          ? 'bg-slate-900/90 border-amber-600/40 shadow-xl shadow-amber-950/20'
          : lifecycleState === 'RECOVERING'
          ? 'bg-slate-900/90 border-emerald-500/40 shadow-xl shadow-emerald-950/15'
          : 'bg-slate-900/90 border-slate-800 shadow-xl shadow-slate-950/30'
      }`}
    >
      {/* Top Header Bar */}
      <div className="p-4 sm:p-5 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-950/60 border border-emerald-700/50 flex items-center justify-center text-emerald-400">
            <Sprout className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                {isKn ? 'ಸಸ್ಯ ಡಿಜಿಟಲ್ ಪ್ರೊಫೈಲ್' : 'Plant Digital Profile'}
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full border bg-slate-800 text-slate-300 border-slate-700">
                {profile.plantId}
              </span>
            </div>
            <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
              <span>{isKn ? `ದಿನ ${ageDays}` : `Day ${ageDays}`}</span>
              <span className="text-slate-600">•</span>
              <span>{totalObs} {isKn ? 'ತಪಾಸಣೆಗಳು' : 'observations'}</span>
              <span className="text-slate-600">•</span>
              <span className="text-emerald-400 font-medium">
                {getLocalizedLifecycleState(lifecycleState, language)}
              </span>
              <span className="text-slate-600">•</span>
              <span className="text-slate-400">{lastObservedStr}</span>
            </p>
          </div>
        </div>

        {/* Right Badges & Mode Toggle */}
        <div className="flex items-center gap-2">
          <span
            className={`text-xs font-mono uppercase px-2.5 py-1 rounded-lg border font-semibold ${
              monitoringStatus === 'ACTIVE'
                ? 'bg-emerald-950/70 text-emerald-300 border-emerald-700/60'
                : monitoringStatus === 'PAUSED'
                ? 'bg-amber-950/70 text-amber-300 border-amber-700/60'
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}
          >
            {getLocalizedMonitoringStatus(monitoringStatus, language)}
          </span>

          {!compact && (
            <div className="bg-slate-800/90 rounded-lg p-0.5 border border-slate-700/60 flex text-xs">
              <button
                onClick={() => setInternalMode('farmer')}
                className={`px-2 py-0.5 rounded-md font-medium transition-all ${
                  effectiveMode === 'farmer'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {isKn ? 'ರೈತ' : 'Farmer'}
              </button>
              <button
                onClick={() => setInternalMode('technical')}
                className={`px-2 py-0.5 rounded-md font-medium transition-all ${
                  effectiveMode === 'technical'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {isKn ? 'ತಾಂತ್ರಿಕ' : 'Technical'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Specimen Details */}
      <div className="p-4 sm:p-5 space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                {plantName}
              </span>
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded-full border uppercase ${
                  identificationStatus === 'IDENTIFIED'
                    ? 'bg-emerald-950/50 text-emerald-400 border-emerald-800/60'
                    : identificationStatus === 'REVIEW_REQUIRED'
                    ? 'bg-amber-950/70 text-amber-300 border-amber-600/70'
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}
              >
                {getLocalizedIdentificationStatus(identificationStatus, language)}
              </span>
            </div>
            <div className="text-xs text-slate-400 italic mt-0.5">
              {speciesSubtitle}
            </div>
          </div>

          {/* Identification Confidence */}
          <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl px-3.5 py-2 text-right">
            <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 block">
              {isKn ? 'ವಿಶ್ವಾಸಾರ್ಹತೆ' : 'ML CONFIDENCE'}
            </span>
            <span className="text-sm font-bold font-mono text-emerald-400">
              {profile.speciesConfidence ? `${profile.speciesConfidence}%` : (isIdentified ? '90%' : '--')}
            </span>
          </div>
        </div>

        {/* Farmer Mode Narrative Story */}
        {effectiveMode === 'farmer' ? (
          <div className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-700/50 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-emerald-400">
                {profileSummary.stateLabel}
              </span>
              <span className="text-slate-400">
                {profileSummary.growthLabel}
              </span>
            </div>
            <p className="text-sm text-slate-200 leading-relaxed font-medium">
              {profileSummary.story}
            </p>
            <div className="pt-2 border-t border-slate-700/40 text-xs text-amber-300/90 flex items-center gap-1.5">
              <span className="font-semibold">{isKn ? 'ಕ್ರಮ:' : 'Action:'}</span>
              <span>{profileSummary.action}</span>
            </div>
          </div>
        ) : (
          /* Technical Mode Matrix */
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 font-mono text-xs">
            <div className="p-2.5 rounded-xl bg-slate-800/40 border border-slate-700/50">
              <span className="text-[10px] text-slate-400 uppercase block">Lifecycle State</span>
              <span className="font-bold text-slate-100">{lifecycleState}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-800/40 border border-slate-700/50">
              <span className="text-[10px] text-slate-400 uppercase block">Monitoring</span>
              <span className="font-bold text-slate-100">{monitoringStatus}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-800/40 border border-slate-700/50">
              <span className="text-[10px] text-slate-400 uppercase block">Health State</span>
              <span className="font-bold text-slate-100">{String(profile.currentHealthStatus)}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-800/40 border border-slate-700/50">
              <span className="text-[10px] text-slate-400 uppercase block">Confidence</span>
              <span className="font-bold text-slate-100">{profile.healthConfidence || 'moderate'}</span>
            </div>
          </div>
        )}

        {/* Growth & Environmental Preview Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
          <div className="flex items-center gap-2.5 p-2 rounded-lg bg-slate-800/30 border border-slate-800">
            <TrendingUp className="w-4 h-4 text-emerald-400 shrink-0" />
            <div>
              <span className="text-[10px] text-slate-400 block">{isKn ? 'ಎಲೆಗಳ ವ್ಯಾಪ್ತಿ' : 'Canopy Area'}</span>
              <span className="text-xs font-bold font-mono text-white">
                {profile.growth?.latestCanopyCoverage !== undefined ? `${profile.growth.latestCanopyCoverage}%` : '--'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 p-2 rounded-lg bg-slate-800/30 border border-slate-800">
            <FlaskConical className="w-4 h-4 text-teal-400 shrink-0" />
            <div>
              <span className="text-[10px] text-slate-400 block">{isKn ? 'ದ್ರಾವಣ pH' : 'Solution pH'}</span>
              <span className="text-xs font-bold font-mono text-white">
                {profile.environment?.latestPH !== undefined ? profile.environment.latestPH.toFixed(2) : '--'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 p-2 rounded-lg bg-slate-800/30 border border-slate-800">
            <Sparkles className="w-4 h-4 text-green-400 shrink-0" />
            <div>
              <span className="text-[10px] text-slate-400 block">{isKn ? 'ಪೋಷಕಾಂಶಗಳು' : 'Nutrients TDS'}</span>
              <span className="text-xs font-bold font-mono text-white">
                {profile.environment?.latestTDS !== undefined ? `${Math.round(profile.environment.latestTDS)} PPM` : '--'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 p-2 rounded-lg bg-slate-800/30 border border-slate-800">
            <Droplets className="w-4 h-4 text-cyan-400 shrink-0" />
            <div>
              <span className="text-[10px] text-slate-400 block">{isKn ? 'ನೀರಿನ ಮಟ್ಟ' : 'Water Level'}</span>
              <span className="text-xs font-bold font-mono text-white">
                {profile.environment?.latestWaterLevel !== undefined ? `${Math.round(profile.environment.latestWaterLevel)}%` : '--'}
              </span>
            </div>
          </div>
        </div>

        {/* Profile Completeness Audit (Section 19) */}
        {completeness && (
          <div className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-700/50 space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-teal-400" />
                <span className="font-semibold text-white">
                  {isKn ? 'ಪ್ರೊಫೈಲ್ ಪೂರ್ಣತೆಯ ಪರಿಶೀಲನೆ' : 'Profile Evidence Completeness'}
                </span>
              </div>
              <span className="font-mono text-xs font-bold text-teal-300">
                {completeness.score}% ({getLocalizedCompletenessStatus(completeness.status, language)})
              </span>
            </div>

            {/* Progress bar */}
            <div className="w-full h-1.5 rounded-full bg-slate-700 overflow-hidden">
              <div
                className={`h-full transition-all duration-500 rounded-full ${
                  completeness.score >= 90
                    ? 'bg-emerald-500'
                    : completeness.score >= 60
                    ? 'bg-teal-500'
                    : 'bg-amber-500'
                }`}
                style={{ width: `${completeness.score}%` }}
              />
            </div>

            {/* Checklist of 5 categories */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1 text-[11px]">
              {Object.entries(completeness.categories).map(([key, cat]) => (
                <div key={key} className="flex items-center gap-1.5">
                  {cat.available ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  )}
                  <span className={cat.available ? 'text-slate-200' : 'text-slate-500'}>
                    {cat.label}
                  </span>
                </div>
              ))}
            </div>

            {completeness.missingItems.length > 0 && (
              <p className="text-[11px] text-slate-400 border-t border-slate-700/40 pt-2 mt-1">
                <span className="text-amber-400/90 font-medium">
                  {isKn ? 'ಬಾಕಿ ಇರುವ ಮಾಹಿತಿ: ' : 'Pending evidence: '}
                </span>
                {completeness.missingItems.join(' • ')}
              </p>
            )}
          </div>
        )}

        {/* Non-biomass Growth Disclaimer */}
        <div className="text-[10px] text-slate-500 font-mono leading-relaxed pt-1">
          {profile.growth?.disclaimer ||
            'IMAGE-DERIVED GROWTH ESTIMATES: Values represent 2D optical canopy surface area changes detected by the camera and do not claim physical biomass measurement.'}
        </div>
      </div>
    </div>
  );
}
