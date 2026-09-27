'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  CheckCircle2,
  HelpCircle,
  Clock,
  Sparkles,
  ArrowRight,
  Activity,
  ShieldAlert,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { WhatChangedSummary, PlantChangeEvent } from '@/lib/intelligence/types';
import { SupportedLanguageCode, AssistantMode } from '@/lib/assistant/assistantConfig';
import { getLocalizedWhatChangedCopy, getLocalizedChangeEvent } from '@/lib/intelligence/farmerSemanticLayer';

interface WhatChangedCardProps {
  summary: WhatChangedSummary;
  language?: SupportedLanguageCode;
  userMode?: AssistantMode;
  onUserModeChange?: (mode: AssistantMode) => void;
  className?: string;
}

export function WhatChangedCard({
  summary,
  language = 'en',
  userMode = 'farmer',
  onUserModeChange,
  className = '',
}: WhatChangedCardProps) {
  const [isExpanded, setIsExpanded] = React.useState(false);
  const isKn = language === 'kn';

  const localizedCopy = getLocalizedWhatChangedCopy(summary, language);

  // Show all events instead of filtering by tab
  const filteredEvents = summary.events;

  const getSignificanceColor = (sig: string) => {
    switch (sig) {
      case 'CRITICAL':
        return 'text-rose-400 bg-rose-950/60 border-rose-800/80';
      case 'SIGNIFICANT':
        return 'text-amber-400 bg-amber-950/60 border-amber-800/80';
      case 'MODERATE':
        return 'text-cyan-400 bg-cyan-950/60 border-cyan-800/80';
      case 'MINOR':
        return 'text-emerald-400 bg-emerald-950/60 border-emerald-800/80';
      default:
        return 'text-slate-400 bg-slate-900 border-slate-800';
    }
  };

  const getDirectionIcon = (dir: string) => {
    switch (dir) {
      case 'improved':
      case 'recovered':
        return <TrendingUp className="w-4 h-4 text-emerald-400" />;
      case 'declined':
        return <TrendingDown className="w-4 h-4 text-rose-400" />;
      case 'changed':
        return <Activity className="w-4 h-4 text-amber-400" />;
      case 'unavailable':
        return <HelpCircle className="w-4 h-4 text-slate-400" />;
      default:
        return <Minus className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div
      className={`rounded-2xl border bg-slate-900/90 backdrop-blur-md shadow-xl overflow-hidden transition-all duration-300 ${
        summary.reviewRequiredItems.length > 0
          ? 'border-amber-500/50 shadow-amber-950/20'
          : summary.status === 'meaningful_changes' && summary.overallSignificance === 'CRITICAL'
          ? 'border-rose-500/40 shadow-rose-950/20'
          : summary.hasMeaningfulChange
          ? 'border-emerald-500/40 shadow-emerald-950/10'
          : 'border-slate-800 shadow-slate-950/30'
      } ${className}`}
    >
      {/* Top Banner / Review Alert */}
      {summary.reviewRequiredItems.length > 0 && (
        <div className="bg-amber-950/80 border-b border-amber-600/50 px-4 py-2.5 flex items-center justify-between text-amber-200 text-xs">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="font-semibold">
              {isKn ? 'ಪರಿಶೀಲನೆ ಅಗತ್ಯವಿದೆ:' : 'Review Required:'} {summary.reviewRequiredItems[0].summary}
            </span>
          </div>
          <span className="bg-amber-900/80 text-amber-300 px-2 py-0.5 rounded text-[11px] font-mono border border-amber-700/50">
            {isKn ? 'ಸಸ್ಯದ ತಳಿ ಬದಲಾಗಿದೆ' : 'Identity Shift'}
          </span>
        </div>
      )}

      {/* Main Header */}
      <div className="p-4 sm:p-5 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
              summary.status === 'stable_no_change'
                ? 'bg-emerald-950/60 border-emerald-700/50 text-emerald-400'
                : summary.status === 'insufficient_history'
                ? 'bg-slate-800/80 border-slate-700 text-slate-400'
                : 'bg-emerald-950/80 border-emerald-600/60 text-emerald-400'
            }`}
          >
            {summary.status === 'stable_no_change' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            ) : summary.status === 'insufficient_history' ? (
              <Clock className="w-5 h-5 text-slate-400" />
            ) : (
              <Sparkles className="w-5 h-5 text-emerald-400" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                {isKn ? 'ಏನು ಬದಲಾಗಿದೆ?' : 'What Changed?'}
              </h3>
              <span
                className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded-full border ${
                  summary.status === 'stable_no_change'
                    ? 'bg-emerald-950/50 text-emerald-400 border-emerald-800/60'
                    : summary.status === 'insufficient_history'
                    ? 'bg-slate-800 text-slate-400 border-slate-700'
                    : getSignificanceColor(summary.overallSignificance)
                }`}
              >
                {summary.status === 'stable_no_change'
                  ? isKn ? 'ಸ್ಥಿರವಾಗಿದೆ' : 'Stable'
                  : summary.status === 'insufficient_history'
                  ? isKn ? 'ಇತಿಹಾಸ ಬೇಕಿದೆ' : 'Pending History'
                  : `${summary.overallSignificance} DELTA`}
              </span>
            </div>
            <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              <span>
                {isKn
                  ? `ಅವಲೋಕನ: ${summary.timeframeDescription}`
                  : `Comparison timeframe: ${summary.timeframeDescription}`}
              </span>
              <span className="text-slate-600">•</span>
              <span>{summary.observationCount} {isKn ? 'ದಾಖಲೆಗಳು' : 'observations'}</span>
            </p>
          </div>
        </div>

      </div>

      {/* Primary Intelligence Section */}
      <div className="p-4 sm:p-5 space-y-4">
        {/* Core Narrative / Status Block */}
        <div
          className={`p-4 rounded-xl border transition-all ${
            summary.status === 'stable_no_change'
              ? 'bg-emerald-950/20 border-emerald-800/40 text-emerald-200'
              : summary.status === 'insufficient_history'
              ? 'bg-slate-800/40 border-slate-700/50 text-slate-300'
              : 'bg-slate-800/50 border-slate-700/60 text-slate-200'
          }`}
        >
          {userMode === 'farmer' ? (
            <div className="space-y-3">
              <div>
                <span className="text-[11px] uppercase tracking-wider font-semibold text-emerald-400 block mb-0.5">
                  {isKn ? 'ಏನು ಗಮನಿಸಲಾಗಿದೆ' : "What's happening"}
                </span>
                <p className="text-base font-semibold text-white leading-snug">
                  {localizedCopy.headline}
                </p>
              </div>

              <div>
                <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-400 block mb-0.5">
                  {isKn ? 'ಕಾರಣ / ಹಿನ್ನೆಲೆ' : 'Why this matters'}
                </span>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  {localizedCopy.why}
                </p>
              </div>

              <div className="pt-2 border-t border-slate-700/40 flex items-start gap-2">
                <span className="text-[11px] uppercase tracking-wider font-semibold text-amber-400 shrink-0 mt-0.5">
                  {isKn ? 'ಶಿಫಾರಸು ಮಾಡಿದ ಕ್ರಮ:' : 'Suggested Check:'}
                </span>
                <p className="text-xs sm:text-sm text-amber-200 font-medium leading-relaxed">
                  {localizedCopy.action}
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] uppercase tracking-wider font-mono text-cyan-400">
                  Longitudinal Telemetry Synthesis
                </span>
                <span className="text-[10px] font-mono text-slate-400">
                  Status: {summary.status.toUpperCase()}
                </span>
              </div>
              <p className="text-sm font-mono text-slate-100 font-medium">
                {summary.summaryHeadline}
              </p>
              <p className="text-xs font-mono text-slate-300 leading-relaxed">
                {summary.summaryExplanation}
              </p>
              {summary.limitations.length > 0 && (
                <div className="pt-2 border-t border-slate-700/50 text-[11px] font-mono text-amber-400/90 space-y-0.5">
                  {summary.limitations.map((lim, idx) => (
                    <div key={idx} className="flex items-center gap-1.5">
                      <span className="text-amber-500">•</span>
                      <span>{lim}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Change Breakdown Pills / Events Section */}
        {summary.events.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 overflow-x-auto pb-2 pt-1 px-1 text-[11px]">
                <span className="text-slate-400 font-medium">{summary.events.length} {isKn ? 'ದಾಖಲಾದ ಬದಲಾವಣೆಗಳು' : 'Changes Logged'}</span>
              </div>

              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-medium ml-2"
              >
                <span>{isExpanded ? (isKn ? 'ಕಡಿಮೆ ತೋರಿಸಿ' : 'Show less') : (isKn ? 'ವಿವರಗಳು' : 'Details')}</span>
                {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            </div>

            {/* Event List */}
            <div className="space-y-2">
              {(isExpanded ? filteredEvents : filteredEvents.slice(0, 3)).map((event: PlantChangeEvent) => {
                const eventCopy = getLocalizedChangeEvent(event, language);
                return (
                  <div
                    key={event.id}
                    className={`p-3 rounded-xl border transition-all ${
                      event.requiresReview
                        ? 'bg-amber-950/30 border-amber-700/50'
                        : event.isMeaningful
                        ? 'bg-slate-800/40 border-slate-700/60'
                        : 'bg-slate-900/40 border-slate-800/50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-2.5">
                        <div className="mt-0.5 p-1 rounded-lg bg-slate-800 border border-slate-700">
                          {getDirectionIcon(event.direction)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-semibold text-white">
                              {userMode === 'farmer' ? eventCopy.headline : event.label}
                            </span>
                            <span
                              className={`text-[9px] font-mono px-1.5 py-0.5 rounded border uppercase ${getSignificanceColor(
                                event.significance
                              )}`}
                            >
                              {event.significance}
                            </span>
                            {event.requiresReview && (
                              <span className="text-[9px] font-semibold text-amber-300 bg-amber-950/80 border border-amber-600/60 px-1.5 py-0.5 rounded">
                                {isKn ? 'ಪರಿಶೀಲಿಸಿ' : 'Verify'}
                              </span>
                            )}
                          </div>

                          <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                            {userMode === 'farmer' ? eventCopy.why : event.summary}
                          </p>

                          {isExpanded && (
                            <div className="mt-3 pt-3 border-t border-slate-800/80 text-[11px] text-slate-400 space-y-2">
                              <p className="text-amber-300/90 font-medium">
                                <span className="font-semibold">{isKn ? 'ಕ್ರಮ:' : 'Action:'}</span>{' '}
                                {userMode === 'farmer' ? eventCopy.action : event.farmerAction}
                              </p>
                              {userMode === 'technical' && (
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 font-mono text-[10px] text-slate-400">
                                  <div>
                                    <span className="text-slate-500">Prev: </span>
                                    {String(event.previousValue ?? 'N/A')}
                                  </div>
                                  <div>
                                    <span className="text-slate-500">Current: </span>
                                    {String(event.currentValue ?? 'N/A')}
                                  </div>
                                  <div>
                                    <span className="text-slate-500">Delta: </span>
                                    {event.delta !== undefined ? `${event.delta > 0 ? '+' : ''}${event.delta} ${event.unit || ''}` : 'N/A'}
                                  </div>
                                  <div>
                                    <span className="text-slate-500">Confidence: </span>
                                    {event.confidence}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {event.delta !== undefined && (
                        <div className="text-right shrink-0">
                          <span
                            className={`text-xs font-mono font-bold ${
                              event.direction === 'improved' || event.direction === 'recovered'
                                ? 'text-emerald-400'
                                : event.direction === 'declined'
                                ? 'text-rose-400'
                                : 'text-slate-300'
                            }`}
                          >
                            {event.delta > 0 ? `+${event.delta}` : event.delta} {event.unit || ''}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Footer Navigation Links */}
        <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
          <Link
            href="/dashboard/intelligence"
            className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-medium transition-colors"
          >
            <span>{isKn ? 'ತಾರ್ಕಿಕ ಪ್ರಯೋಗಾಲಯಕ್ಕೆ ಹೋಗಿ' : 'Open Reasoning Lab'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>

          <Link
            href="/dashboard/analytics"
            className="text-slate-400 hover:text-slate-200 flex items-center gap-1 transition-colors"
          >
            <Activity className="w-3.5 h-3.5 text-slate-400" />
            <span>{isKn ? 'ಸಸ್ಯ ಪ್ರವಾಸ' : 'Plant Journey'}</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
