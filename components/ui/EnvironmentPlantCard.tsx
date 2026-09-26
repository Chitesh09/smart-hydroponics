'use client';

import React, { useState } from 'react';

import {
  Link2,
  AlertTriangle,
  Info,
  Clock,
  Sparkles,
  HelpCircle,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Layers,
  Droplets,
} from 'lucide-react';
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
  const [internalMode, setInternalMode] = useState<AssistantMode>(userMode);
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedAssocIndex, setSelectedAssocIndex] = useState(0);

  // Sync internal mode if prop changes
  React.useEffect(() => {
    setInternalMode(userMode);
  }, [userMode]);

  const effectiveMode = internalMode;
  const isKn = language === 'kn';

  const localizedSummary = getLocalizedCorrelationSummary(summary, language);
  const primaryAssoc = summary.primaryAssociation || (associations.length > 0 ? associations[0] : null);
  const activeAssoc = associations[selectedAssocIndex] || primaryAssoc;
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
      className={`rounded-2xl border bg-slate-900/90 backdrop-blur-md shadow-xl overflow-hidden transition-all duration-300 ${
        summary.status === 'active_associations'
          ? 'border-cyan-500/40 shadow-cyan-950/15'
          : summary.status === 'sensor_unavailable'
          ? 'border-rose-500/40 shadow-rose-950/15'
          : summary.status === 'insufficient_history'
          ? 'border-amber-500/30 shadow-amber-950/10'
          : 'border-slate-800 shadow-slate-950/30'
      } ${className}`}
    >
      {/* CARD HEADER */}
      <div className="p-4 sm:p-5 border-b border-slate-800/80 bg-slate-950/40">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-cyan-500/20 to-emerald-500/20 border border-cyan-500/30 text-cyan-400 shadow-inner">
              <Link2 className="w-5 h-5" />
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

            {/* Farmer / Technical Mode Toggle */}
            <div className="inline-flex p-0.5 rounded-lg bg-slate-950/80 border border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setInternalMode('farmer');
                  onUserModeChange?.('farmer');
                }}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
                  effectiveMode === 'farmer'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {isKn ? 'ರೈತ' : 'Farmer'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setInternalMode('technical');
                  onUserModeChange?.('technical');
                }}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
                  effectiveMode === 'technical'
                    ? 'bg-cyan-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {isKn ? 'ತಾಂತ್ರಿಕ' : 'Technical'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* CARD BODY */}
      <div className="p-4 sm:p-6 space-y-5">
        {/* CASE 1: SENSORS UNAVAILABLE */}
        {summary.status === 'sensor_unavailable' && (
          <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-800/40 text-slate-300">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
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
              <Clock className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
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
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg border ${getStrengthBadgeClass(
                  activeAssoc.associationStrength
                )}`}
              >
                {getLocalizedAssociationStrength(activeAssoc.associationStrength, language)}
              </span>

              <span className="px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-800/80 text-slate-300 border border-slate-700">
                {getLocalizedAssociationType(activeAssoc.associationType, language)}
              </span>

              <span
                className={`px-2.5 py-1 text-xs font-mono font-medium rounded-lg border ${getConfidenceBadgeClass(
                  activeAssoc.confidence
                )}`}
              >
                {isKn ? 'ವಿಶ್ವಾಸಾರ್ಹತೆ: ' : 'Confidence: '}
                {activeAssoc.confidence}
              </span>

              {activeAssoc.lagHours && (
                <span className="px-2.5 py-1 text-xs font-mono rounded-lg bg-purple-950/50 text-purple-300 border border-purple-800/60 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {activeAssoc.lagHours}h {isKn ? 'ವಿಳಂಬ' : 'Lag'}
                </span>
              )}

              <span className="px-2 py-1 text-[11px] text-slate-400 ml-auto">
                {isKn ? 'ಮಾದರಿ ಗಾತ್ರ: ' : 'N = '}
                <strong>{activeAssoc.sampleSize}</strong>
              </span>
            </div>

            {/* FARMER MODE DISPLAY */}
            {effectiveMode === 'farmer' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Step 1: What Changed? */}
                <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 transition-colors">
                  <div className="flex items-center gap-2 text-cyan-400 text-xs font-semibold uppercase tracking-wider mb-1.5">
                    <Droplets className="w-3.5 h-3.5" />
                    <span>{isKn ? '೧. ನೀರಿನಲ್ಲಿ ಏನು ಬದಲಾಗಿದೆ?' : '1. What Changed in the Water?'}</span>
                  </div>
                  <p className="text-sm font-medium text-slate-200 leading-snug">{localizedAssoc.whatChanged}</p>
                </div>

                {/* Step 2: What Happened Together? */}
                <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 transition-colors">
                  <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{isKn ? '೨. ಅದೇ ಸಮಯದಲ್ಲಿ ಗಿಡ ಹೇಗಿದೆ?' : '2. What Happened to the Plant?'}</span>
                  </div>
                  <p className="text-sm font-medium text-slate-200 leading-snug">
                    {localizedAssoc.whatHappenedTogether}
                  </p>
                </div>

                {/* Step 3: What It Means */}
                <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 transition-colors">
                  <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold uppercase tracking-wider mb-1.5">
                    <Info className="w-3.5 h-3.5" />
                    <span>{isKn ? '೩. ಇದರ ಅರ್ಥವೇನು?' : '3. What Does This Mean?'}</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">{localizedAssoc.whatItMeans}</p>
                </div>

                {/* Step 4: What Should I Do? */}
                <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-800/50 hover:border-emerald-700/60 transition-colors">
                  <div className="flex items-center gap-2 text-emerald-300 text-xs font-semibold uppercase tracking-wider mb-1.5">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>{isKn ? '೪. ನಾನು ಏನು ಮಾಡಬೇಕು?' : '4. What Should I Do?'}</span>
                  </div>
                  <p className="text-xs font-medium text-emerald-200 leading-relaxed">{localizedAssoc.whatToDo}</p>
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
              <div className="pt-2 border-t border-slate-800/60 flex items-center gap-2 overflow-x-auto text-xs">
                <span className="text-slate-400 text-[11px] shrink-0">
                  {isKn ? 'ಇತರ ಸಂಭವನೀಯ ಸಂಬಂಧಗಳು:' : 'Other Associations:'}
                </span>
                {associations.map((assoc, idx) => (
                  <button
                    key={assoc.id || idx}
                    type="button"
                    onClick={() => setSelectedAssocIndex(idx)}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-all ${
                      selectedAssocIndex === idx
                        ? 'bg-cyan-600 text-white shadow-sm'
                        : 'bg-slate-800/60 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {assoc.environmentMetric.toUpperCase()} ↔ {assoc.plantMetric}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* MULTI-SENSOR CONCURRENT CHANGES WARNING */}
        {summary.multiSensorAnalysis?.isMultiSensorEvent && (
          <div className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-800/40 text-amber-200 text-xs">
            <div className="flex items-start gap-2.5">
              <Layers className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
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
                <HelpCircle className="w-3.5 h-3.5 text-slate-500" />
                {isKn ? 'ಡೇಟಾ ಗುಣಮಟ್ಟ, ಅಂತರಗಳು ಮತ್ತು ಇತಿಮಿತಿಗಳು' : 'Data Integrity, Gaps & Scientific Limitations'}
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-400">
                  {summary.confoundingFactors.length + summary.limitations.length}
                </span>
              </span>
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
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
