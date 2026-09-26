'use client';

import React, { useState } from 'react';
import {
  AlertTriangle,
  AlertOctagon,
  Info,
  X,
  ChevronDown,
  ChevronUp,
  Clock,
  ShieldCheck,
  Check,
} from 'lucide-react';
import {
  PlantAlert,
} from '@/lib/intelligence/types';
import { SupportedLanguageCode, AssistantMode } from '@/lib/assistant/assistantConfig';
import {
  getLocalizedAlert,
  getLocalizedAlertSeverity,
  getLocalizedAlertCategory,
  getLocalizedAlertStatus,
} from '@/lib/intelligence/farmerSemanticLayer';

export interface PlantAlertCardProps {
  alert: PlantAlert;
  mode?: AssistantMode;
  language?: SupportedLanguageCode;
  onDismiss?: (alertId: string) => void;
  onAcknowledge?: (alertId: string) => void;
  compact?: boolean;
}

export const PlantAlertCard: React.FC<PlantAlertCardProps> = ({
  alert,
  mode = 'farmer',
  language = 'en',
  onDismiss,
  onAcknowledge,
  compact = false,
}) => {
  const [showTechnicalDetails, setShowTechnicalDetails] = useState<boolean>(false);

  const loc = getLocalizedAlert(alert, language);
  const severityLabel = getLocalizedAlertSeverity(alert.severity, language);
  const categoryLabel = getLocalizedAlertCategory(alert.category, language);
  const statusLabel = getLocalizedAlertStatus(alert.status, language);

  const isUrgent = alert.severity === 'URGENT';
  const isAttention = alert.severity === 'ATTENTION';

  // Severity styling
  const containerClasses = isUrgent
    ? 'border-red-500/40 bg-red-950/20 text-red-100'
    : isAttention
    ? 'border-amber-500/40 bg-amber-950/20 text-amber-100'
    : 'border-blue-500/30 bg-blue-950/20 text-blue-100';

  const badgeClasses = isUrgent
    ? 'bg-red-500/20 text-red-300 border-red-500/40'
    : isAttention
    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
    : 'bg-blue-500/20 text-blue-300 border-blue-500/40';

  const iconColor = isUrgent
    ? 'text-red-400'
    : isAttention
    ? 'text-amber-400'
    : 'text-blue-400';

  const renderIcon = () => {
    if (isUrgent) return <AlertOctagon className={`w-5 h-5 ${iconColor} shrink-0`} />;
    if (isAttention) return <AlertTriangle className={`w-5 h-5 ${iconColor} shrink-0`} />;
    return <Info className={`w-5 h-5 ${iconColor} shrink-0`} />;
  };

  const formattedTime = new Date(alert.lastDetectedAt).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  // Compact Farmer View (e.g. for dashboard summary banner)
  if (compact) {
    return (
      <div className={`p-3.5 rounded-xl border flex items-start justify-between gap-3 shadow-sm ${containerClasses}`}>
        <div className="flex items-start gap-2.5 min-w-0">
          {renderIcon()}
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border ${badgeClasses}`}>
                {severityLabel}
              </span>
              <span className="text-xs text-white/50">{categoryLabel}</span>
              <span className="text-xs text-white/40 flex items-center gap-1">
                <Clock className="w-3 h-3 inline" /> {formattedTime}
              </span>
            </div>
            <h4 className="text-sm font-semibold text-white truncate">{loc.title}</h4>
            <p className="text-xs text-white/80 line-clamp-2 mt-0.5">{loc.farmerMessage}</p>
          </div>
        </div>
        {onDismiss && (
          <button
            onClick={() => onDismiss(alert.id)}
            className="p-1 rounded-lg hover:bg-white/10 text-white/50 hover:text-white transition-colors shrink-0"
            title={language === 'kn' ? 'ವಜಾಗೊಳಿಸಿ' : 'Dismiss'}
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={`rounded-2xl border p-5 shadow-lg backdrop-blur-sm transition-all duration-200 ${containerClasses}`}>
      {/* Header Bar */}
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex items-center gap-2.5 flex-wrap">
          {renderIcon()}
          <span className={`text-xs uppercase font-extrabold tracking-wider px-2.5 py-0.5 rounded-full border ${badgeClasses}`}>
            {severityLabel}
          </span>
          <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-white/70">
            {categoryLabel}
          </span>
          {alert.occurrenceCount > 1 && (
            <span className="text-xs px-2 py-0.5 rounded-md bg-white/5 text-white/50 border border-white/5">
              {language === 'kn' ? `${alert.occurrenceCount} ಬಾರಿ ಪತ್ತೆಯಾಗಿದೆ` : `${alert.occurrenceCount}x detected`}
            </span>
          )}
          <span className="text-xs text-white/40 flex items-center gap-1">
            <Clock className="w-3 h-3 inline" /> {formattedTime}
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {onAcknowledge && alert.status === 'ACTIVE' && (
            <button
              onClick={() => onAcknowledge(alert.id)}
              className="text-xs px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/15 text-white/80 transition-colors flex items-center gap-1"
              title={language === 'kn' ? 'ಪರಿಶೀಲಿಸಲಾಗಿದೆ ಎಂದು ಗುರುತಿಸಿ' : 'Acknowledge'}
            >
              <Check className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{language === 'kn' ? 'ಪರಿಶೀಲಿಸಲಾಗಿದೆ' : 'Ack'}</span>
            </button>
          )}
          {onDismiss && alert.status !== 'DISMISSED' && (
            <button
              onClick={() => onDismiss(alert.id)}
              className="p-1.5 rounded-lg hover:bg-white/10 text-white/50 hover:text-white transition-colors"
              title={language === 'kn' ? 'ವಜಾಗೊಳಿಸಿ' : 'Dismiss Alert'}
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Main Title */}
      <h3 className="text-base font-bold text-white mb-2 tracking-tight">
        {loc.title}
      </h3>

      {/* Farmer Presentation: What, Why, What to do */}
      <div className="space-y-3 bg-black/25 rounded-xl p-4 border border-white/5">
        <div>
          <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-400 block mb-0.5">
            {language === 'kn' ? 'ಏನು ಸಂಭವಿಸಿದೆ?' : 'What Is Happening'}
          </span>
          <p className="text-sm text-white/90 leading-relaxed">{loc.farmerMessage}</p>
        </div>

        <div>
          <span className="text-[10px] uppercase font-bold tracking-wider text-amber-400 block mb-0.5">
            {language === 'kn' ? 'ಏಕೆ ಹೀಗಾಗಿದೆ?' : 'Why Am I Seeing This'}
          </span>
          <p className="text-sm text-white/80 leading-relaxed">{loc.farmerWhy}</p>
        </div>

        <div>
          <span className="text-[10px] uppercase font-bold tracking-wider text-cyan-400 block mb-0.5">
            {language === 'kn' ? 'ಮುಂದಿನ ಕ್ರಮ' : 'Recommended Action'}
          </span>
          <p className="text-sm font-medium text-cyan-200 leading-relaxed flex items-start gap-1.5">
            <span className="inline-block mt-1 w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0" />
            <span>{loc.farmerAction}</span>
          </p>
        </div>

        {loc.limitation && (
          <div className="pt-2 border-t border-white/5 text-[11px] text-white/50 italic flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 shrink-0 text-white/40" />
            <span>{loc.limitation}</span>
          </div>
        )}
      </div>

      {/* Technical Mode Toggle & Details */}
      {(mode === 'technical' || showTechnicalDetails) && (
        <div className="mt-4 pt-3 border-t border-white/10 space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div className="bg-black/30 p-2.5 rounded-lg border border-white/5">
              <span className="text-white/40 block text-[10px] uppercase font-bold">{language === 'kn' ? 'ನಿಯತಾಂಕ' : 'Metric'}</span>
              <span className="font-mono font-medium text-white">{alert.metric || 'general'}</span>
            </div>
            <div className="bg-black/30 p-2.5 rounded-lg border border-white/5">
              <span className="text-white/40 block text-[10px] uppercase font-bold">{language === 'kn' ? 'ಪ್ರಸ್ತುತ ಮೌಲ್ಯ' : 'Current Value'}</span>
              <span className="font-mono font-medium text-emerald-300">{alert.currentValue ?? '--'}</span>
            </div>
            <div className="bg-black/30 p-2.5 rounded-lg border border-white/5">
              <span className="text-white/40 block text-[10px] uppercase font-bold">{language === 'kn' ? 'ಮೂಲ ಮೌಲ್ಯ' : 'Baseline'}</span>
              <span className="font-mono font-medium text-white/70">{alert.baselineValue ?? '--'}</span>
            </div>
            <div className="bg-black/30 p-2.5 rounded-lg border border-white/5">
              <span className="text-white/40 block text-[10px] uppercase font-bold">{language === 'kn' ? 'ಮಿತಿ' : 'Threshold'}</span>
              <span className="font-mono font-medium text-amber-300">{alert.threshold ?? '--'}</span>
            </div>
          </div>

          <div className="bg-black/40 p-3 rounded-lg border border-white/5 text-xs space-y-1.5 font-mono text-white/70">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-white/40">TRIGGER TYPE:</span>
              <span className="text-white">{alert.triggerType}</span>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-white/40">CONFIDENCE:</span>
              <span className={`font-bold ${alert.confidence === 'HIGH' ? 'text-emerald-400' : alert.confidence === 'MODERATE' ? 'text-amber-400' : 'text-blue-400'}`}>
                {alert.confidence}
              </span>
            </div>
            <div className="text-[11px] text-white/60">
              <span className="text-white/40 block mb-0.5">CONFIDENCE REASON:</span>
              <span>{alert.confidenceReason}</span>
            </div>
            <div className="text-[11px] text-white/60 pt-1 border-t border-white/5">
              <span className="text-white/40 block mb-0.5">TECHNICAL LOG:</span>
              <span>{alert.technicalMessage}</span>
            </div>
            <div className="flex items-center justify-between text-[10px] text-white/40 pt-1 border-t border-white/5">
              <span>ALERT ID: {alert.id}</span>
              <span>STATUS: {statusLabel}</span>
            </div>
          </div>
        </div>
      )}

      {/* Mode toggle button if in Farmer mode */}
      {mode === 'farmer' && (
        <div className="mt-3 flex justify-end">
          <button
            onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
            className="text-[11px] text-white/40 hover:text-white/80 transition-colors flex items-center gap-1"
          >
            {showTechnicalDetails ? (
              <>
                <span>{language === 'kn' ? 'ವಿವರಗಳನ್ನು ಮರೆಮಾಡಿ' : 'Hide diagnostics'}</span>
                <ChevronUp className="w-3.5 h-3.5" />
              </>
            ) : (
              <>
                <span>{language === 'kn' ? 'ತಾಂತ್ರಿಕ ವಿವರಗಳು' : 'Diagnostic details'}</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};
