'use client';

import React, { useState } from 'react';


import {
  CorrelationAnalysisSummary,
  EnvironmentPlantAssociation,
  AssociationStrength,
  AssociationConfidenceLevel,
} from '@/lib/intelligence/types';
import { SupportedLanguageCode, AssistantMode } from '@/lib/assistant/assistantConfig';

import {
  getLocalizedCorrelationSummary,
  getLocalizedAssociation,
  getLocalizedAssociationType,
  getLocalizedAssociationStrength,
} from '@/lib/intelligence/farmerSemanticLayer';

interface EnvironmentPlantCardProps {
  summary: CorrelationAnalysisSummary;
  associations?: EnvironmentPlantAssociation[];
  language?: SupportedLanguageCode;
  userMode?: AssistantMode;
  onUserModeChange?: (mode: AssistantMode) => void;
  className?: string;
}

export function EnvironmentPlantCard({
  summary,
  associations = summary.associations,
  language = 'en',
  userMode = 'farmer',
  onUserModeChange,
  className = '',
}: EnvironmentPlantCardProps) {
  const [isExpanded, setIsExpanded] = React.useState(false);
  const isKn = language === 'kn';

  const localizedSummary = getLocalizedCorrelationSummary(summary, language);
  const primaryAssoc = summary.primaryAssociation || (associations.length > 0 ? associations[0] : null);
  const activeAssoc = primaryAssoc;
  const localizedAssoc = activeAssoc ? getLocalizedAssociation(activeAssoc, language) : null;

  const getStrengthBadgeClass = (strength: AssociationStrength) => {
    switch (strength) {
      case 'strong':
        return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
      case 'moderate':
        return 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30';
      case 'weak':
        return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
      case 'none':
      default:
        return 'bg-slate-800 text-slate-400 border-slate-700';
    }
  };

  const getConfidenceBadgeClass = (conf: AssociationConfidenceLevel) => {
    switch (conf) {
      case 'HIGH':
        return 'bg-emerald-950/60 text-emerald-400 border-emerald-800/80';
      case 'MODERATE':
        return 'bg-cyan-950/60 text-cyan-400 border-cyan-800/80';
      case 'LOW':
        return 'bg-amber-950/60 text-amber-400 border-amber-800/80';
      case 'INSUFFICIENT':
      default:
        return 'bg-slate-900 text-slate-500 border-slate-800';
    }
  };

  return (
    <div
      className={`rounded-md border bg-surface overflow-hidden transition-all duration-300 ${
        summary.status === 'active_associations'
          ? 'border-cyan-700/50'
          : summary.status === 'sensor_unavailable'
          ? 'border-rose-700/50'
          : summary.status === 'insufficient_history'
          ? 'border-amber-700/50'
          : 'border-slate-800'
      } ${className}`}
    >
      {/* CARD HEADER */}
      <div className="p-4 sm:p-5 border-b border-slate-800/80 bg-slate-950/40">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-sm bg-cyan-950/30 border border-cyan-800/40 text-cyan-400">
              <span className="font-bold">≡</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-slate-100 text-base sm:text-lg tracking-tight">
                  {isKn ? 'ಪರಿಸರ ↔ ಸಸ್ಯ ಪರಸ್ಪರ ಸಂಬಂಧ' : 'Environment ↔ Plant Correlation'}
                </h3>
                <span className="px-2 py-0.5 text-[10px] font-mono tracking-wider uppercase rounded-full bg-cyan-950/80 text-cyan-300 border border-cyan-800/60">
                  Phase 9
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {isKn
                  ? 'ನೀರಿನ ಸಂವೇದಕಗಳು ಮತ್ತು ಎಲೆಗಳ ದೃಶ್ಯ ಬದಲಾವಣೆಗಳ ವೈಜ್ಞಾನಿಕ ಪರಸ್ಪರ ಸಂಬಂಧ'
                  : 'Evidence-based associations between nutrient solution and visual foliage'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            {/* Status Badge */}
            <span
              className={`px-2.5 py-1 text-xs font-medium rounded-full border flex items-center gap-1.5 ${
                summary.status === 'active_associations'
                  ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30'
                  : summary.status === 'insufficient_history'
                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                  : summary.status === 'sensor_unavailable'
                  ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  summary.status === 'active_associations'
                    ? 'bg-cyan-400 animate-pulse'
                    : summary.status === 'insufficient_history'
                    ? 'bg-amber-400'
                    : summary.status === 'sensor_unavailable'
                    ? 'bg-rose-400'
                    : 'bg-slate-400'
                }`}
              />
              {localizedSummary.statusLabel}
            </span>

          </div>
        </div>
      </div>

      {/* CARD BODY */}
      <div className="p-4 sm:p-6 space-y-5">
        {/* CASE 1: SENSORS UNAVAILABLE */}
        {summary.status === 'sensor_unavailable' && (
          <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-800/40 text-slate-300">
            <div className="flex items-start gap-3">
              <span className="text-rose-400 font-bold shrink-0 mt-0.5">⚠</span>
              <div>
                <h4 className="text-sm font-semibold text-rose-200">{localizedSummary.headline}</h4>
                <p className="text-xs text-rose-300/80 mt-1 leading-relaxed">{localizedSummary.why}</p>
                <div className="mt-3 p-2.5 rounded-lg bg-slate-900/60 border border-rose-900/40 text-xs text-rose-200">
                  <span className="font-semibold">{isKn ? 'ಕ್ರಮ: ' : 'Action: '}</span>
                  {localizedSummary.action}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* CASE 2: INSUFFICIENT HISTORY */}
        {summary.status === 'insufficient_history' && (
          <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-800/40 text-slate-300">
            <div className="flex items-start gap-3">
              <span className="text-amber-400 font-bold shrink-0 mt-0.5">⏱</span>
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-amber-200">{localizedSummary.headline}</h4>
                <p className="text-xs text-amber-300/80 mt-1 leading-relaxed">{localizedSummary.why}</p>
                <div className="mt-3 flex items-center justify-between text-xs text-amber-400/90 bg-slate-900/60 p-2.5 rounded-lg border border-amber-900/40">
                  <span>
                    {isKn ? 'ದಾಖಲಾದ ಜೋಡಿ ಡೇಟಾ: ' : 'Paired Observations: '}
                    <strong>{summary.sampleSize} / 3</strong>
                  </span>
                  <span>{isKn ? 'ಕನಿಷ್ಠ 3 ಅಗತ್ಯ' : 'Need at least 3 for trend'}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* CASE 3: ACTIVE OR STABLE ASSOCIATIONS */}
        {(summary.status === 'active_associations' || summary.status === 'no_clear_association') && activeAssoc && localizedAssoc && (
          <div className="space-y-4">
            {/* Association Badges Bar */}
            <div className="mb-4">
              <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-400 block mb-2">
                {isKn ? 'ಸಂಬಂಧದ ಸ್ಥಿತಿ' : 'Association Status'}
              </span>
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`px-3 py-1 text-sm font-semibold rounded-lg border ${getStrengthBadgeClass(
                    activeAssoc.associationStrength
                  )}`}
                >
                  {getLocalizedAssociationStrength(activeAssoc.associationStrength, language)}
                </span>

                <span className="px-3 py-1 text-sm font-medium rounded-lg bg-slate-800/80 text-slate-300 border border-slate-700">
                  {getLocalizedAssociationType(activeAssoc.associationType, language)}
                </span>

                <span
                  className={`px-3 py-1 text-sm font-mono font-medium rounded-lg border ${getConfidenceBadgeClass(
                    activeAssoc.confidence
                  )}`}
                >
                  {isKn ? 'ವಿಶ್ವಾಸಾರ್ಹತೆ: ' : 'Confidence: '}
                  {activeAssoc.confidence}
                </span>

                {activeAssoc.lagHours && (
                  <span className="px-3 py-1 text-sm font-mono rounded-lg bg-purple-950/50 text-purple-300 border border-purple-800/60 flex items-center gap-1">
                    <span className="font-bold">⏱</span>
                    {activeAssoc.lagHours}h {isKn ? 'ವಿಳಂಬ' : 'Lag'}
                  </span>
                )}
              </div>
            </div>

            {/* FARMER MODE DISPLAY */}
            {userMode === 'farmer' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Step 1: Environment */}
                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 transition-colors">
                  <div className="flex items-center gap-2 text-cyan-400 text-[11px] font-semibold uppercase tracking-wider mb-2">
                    <span className="font-bold text-lg leading-none mt-[-2px]">≈</span>
                    <span>{isKn ? 'ಪರಿಸರ' : 'Environment'}</span>
                  </div>
                  <div className="text-base font-semibold text-white mb-0.5">{activeAssoc.environmentLabel}</div>
                  <div className="text-sm text-cyan-300 mb-2">{activeAssoc.environmentDirection}</div>
                  <p className="text-xs text-slate-400 leading-snug pt-2 border-t border-slate-800">{localizedAssoc.whatChanged}</p>
                </div>

                {/* Step 2: Plant */}
                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 transition-colors">
                  <div className="flex items-center gap-2 text-emerald-400 text-[11px] font-semibold uppercase tracking-wider mb-2">
                    <span className="font-bold text-lg leading-none mt-[-2px]">★</span>
                    <span>{isKn ? 'ಸಸ್ಯ' : 'Plant'}</span>
                  </div>
                  <div className="text-base font-semibold text-white mb-0.5">{activeAssoc.plantLabel}</div>
                  <div className="text-sm text-emerald-300 mb-2">{activeAssoc.plantDirection}</div>
                  <p className="text-xs text-slate-400 leading-snug pt-2 border-t border-slate-800">{localizedAssoc.whatHappenedTogether}</p>
                </div>

                {/* Step 3: What It Means */}
                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 transition-colors">
                  <div className="flex items-center gap-2 text-amber-400 text-[11px] font-semibold uppercase tracking-wider mb-2">
                    <span className="font-bold text-lg leading-none mt-[-2px]">ℹ</span>
                    <span>{isKn ? 'ಇದರ ಅರ್ಥವೇನು?' : 'What Does This Mean?'}</span>
                  </div>
                  <p className="text-sm text-slate-300 leading-relaxed">{localizedAssoc.whatItMeans}</p>
                </div>

                {/* Step 4: What Should I Do? */}
                <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-800/50 hover:border-emerald-700/60 transition-colors">
                  <div className="flex items-center gap-2 text-emerald-300 text-[11px] font-semibold uppercase tracking-wider mb-2">
                    <span className="font-bold text-lg leading-none mt-[-2px]">✓</span>
                    <span>{isKn ? 'ನಾನು ಏನು ಮಾಡಬೇಕು?' : 'What Should I Do?'}</span>
                  </div>
                  <p className="text-sm font-medium text-emerald-200 leading-relaxed">{localizedAssoc.whatToDo}</p>
                </div>
              </div>
            ) : (
              /* TECHNICAL MODE DISPLAY */
              <div className="space-y-3">
                <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800">
                  <div className="text-xs font-mono text-cyan-400 uppercase tracking-wider mb-1">
                    {isKn ? 'ವೈಜ್ಞಾನಿಕ ಸಾರಾಂಶ (ಅಕಾರಣ ತತ್ವ)' : 'Empirical Scientific Association'}
                  </div>
                  <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">{activeAssoc.summary}</p>
                </div>

                {/* Statistical Details Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div className="p-2.5 rounded-lg bg-slate-950/50 border border-slate-800">
                    <span className="text-[11px] text-slate-400 block">
                      {activeAssoc.correlationMethod === 'pearson' ? 'Pearson r' : 'Method'}
                    </span>
                    <span className="font-mono font-semibold text-slate-200 text-sm">
                      {activeAssoc.correlationCoefficient !== undefined
                        ? activeAssoc.correlationCoefficient.toFixed(3)
                        : activeAssoc.correlationMethod}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-950/50 border border-slate-800">
                    <span className="text-[11px] text-slate-400 block">{isKn ? 'ಪರಿಸರ ಅಳತೆ' : 'Environment Metric'}</span>
                    <span className="font-semibold text-slate-200 text-sm">
                      {activeAssoc.environmentLabel} ({activeAssoc.environmentDirection})
                    </span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-950/50 border border-slate-800">
                    <span className="text-[11px] text-slate-400 block">{isKn ? 'ಸಸ್ಯ ಅಳತೆ' : 'Plant Metric'}</span>
                    <span className="font-semibold text-slate-200 text-sm">
                      {activeAssoc.plantLabel} ({activeAssoc.plantDirection})
                    </span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-950/50 border border-slate-800">
                    <span className="text-[11px] text-slate-400 block">{isKn ? 'ಸಮಯ ವಿಂಡೋ' : 'Time Window'}</span>
                    <span className="font-mono text-slate-200 text-sm">
                      {activeAssoc.timeWindow} {activeAssoc.lagHours ? `(${activeAssoc.lagHours}h lag)` : ''}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Multiple Associations Selector (if > 1) */}
            {associations.length > 1 && (
              <div className="pt-4 mt-2 border-t border-slate-800/60">
                <span className="text-slate-400 text-[11px] uppercase tracking-wider font-semibold block mb-3">
                  {isKn ? 'ಇತರ ಸಂಭವನೀಯ ಸಂಬಂಧಗಳು' : 'Other Associations'}
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {associations.map((assoc, idx) => (
                    <div
                      key={assoc.id || idx}
                      className={`p-3 rounded-xl border text-left flex flex-col gap-1.5 ${
                        0 === idx
                          ? 'bg-cyan-950/30 border-cyan-700/50 shadow-sm'
                          : 'bg-slate-900/60 border-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2 text-sm font-semibold text-slate-200 truncate">
                        <span className="truncate">{assoc.environmentLabel}</span>
                        <span className="text-slate-500 shrink-0">↔</span>
                        <span className="truncate">{assoc.plantLabel}</span>
                      </div>
                      <div className="text-xs text-slate-400">
                        {getLocalizedAssociationStrength(assoc.associationStrength, language)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* MULTI-SENSOR CONCURRENT CHANGES WARNING */}
        {summary.multiSensorAnalysis?.isMultiSensorEvent && (
          <div className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-800/40 text-amber-200 text-xs">
            <div className="flex items-start gap-2.5">
              <span className="font-bold text-amber-400 text-lg leading-none shrink-0 mt-0.5">≡</span>
              <div>
                <span className="font-semibold text-amber-300">
                  {isKn ? 'ಬಹು-ಸಂವೇದಕ ಏಕಕಾಲಿಕ ಬದಲಾವಣೆ (Confounding Factors): ' : 'Concurrent Multi-Sensor Shift: '}
                </span>
                <span className="text-amber-200/90 leading-relaxed">{summary.multiSensorAnalysis.summary}</span>
              </div>
            </div>
          </div>
        )}

        {/* CONFOUNDING FACTORS & LIMITATIONS (COLLAPSIBLE) */}
        {(summary.confoundingFactors.length > 0 || summary.limitations.length > 0) && (
          <div className="border-t border-slate-800/80 pt-3">
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center justify-between w-full text-xs text-slate-400 hover:text-slate-200 transition-colors py-1"
            >
              <span className="flex items-center gap-1.5 font-medium">
                <span className="font-bold text-slate-500">?</span>
                {isKn ? 'ಡೇಟಾ ಸಮಗ್ರತೆ ಮತ್ತು ಇತಿಮಿತಿಗಳು' : 'Data integrity and limitations'}
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-400">
                  {summary.confoundingFactors.length + summary.limitations.length}
                </span>
              </span>
              <span className="font-bold text-[10px]">{isExpanded ? '↑' : '↓'}</span>
            </button>

            {isExpanded && (
              <div className="mt-2.5 p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300 space-y-2">
                {summary.confoundingFactors.map((cf, i) => (
                  <div key={i} className="flex items-start gap-2 text-amber-300/90">
                    <span className="text-amber-500 mt-0.5">•</span>
                    <span>{cf}</span>
                  </div>
                ))}
                {summary.limitations.map((lim, i) => (
                  <div key={i} className="flex items-start gap-2 text-slate-400">
                    <span className="text-slate-500 mt-0.5">•</span>
                    <span>{lim}</span>
                  </div>
                ))}
                <div className="pt-2 border-t border-slate-800/60 text-[11px] text-slate-500 italic">
                  {isKn
                    ? 'ಗಮನಿಸಿ: ಹೈಡ್ರೋಸ್ಮಾರ್ಟ್ ಕೇವಲ ಸಾಂದರ್ಭಿಕ ಸಂಬಂಧಗಳನ್ನು ಗುರುತಿಸುತ್ತದೆ. ಪ್ರತ್ಯೇಕ ಜೈವಿಕ ಸಾಕ್ಷ್ಯವನ್ನು ಸ್ವಯಂಚಾಲಿತವಾಗಿ ಸಾಬೀತುಪಡಿಸುವುದಿಲ್ಲ.'
                    : 'Note: Identifies empirical associations and temporal co-occurrences. Does not claim unsupported biological causation.'}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
