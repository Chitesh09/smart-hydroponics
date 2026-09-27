'use client';

import React, { useState } from 'react';
import Link from 'next/link';

import { WhatChangedSummary, PlantChangeEvent } from '@/lib/intelligence/types';
import { SupportedLanguageCode, AssistantMode } from '@/lib/assistant/assistantConfig';
import { getLocalizedWhatChangedCopy, getLocalizedChangeEvent } from '@/lib/intelligence/farmerSemanticLayer';

interface WhatChangedCardProps {
  summary?: WhatChangedSummary | null;
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
  const [activeTab, setActiveTab] = React.useState<'all' | 'sensor' | 'visual' | 'growth'>('all');
  const isKn = language === 'kn';

  const localizedCopy = summary ? getLocalizedWhatChangedCopy(summary, language) : null;

  const filteredEvents = summary?.events.filter(e => {
    if (activeTab === 'sensor') return e.category === 'sensor';
    if (activeTab === 'visual') return e.category === 'visual';
    if (activeTab === 'growth') return e.category === 'growth';
    return true;
  }) || [];

  const getSignificanceColor = (sig: string) => {
    switch (sig) {
      case 'CRITICAL':
        return 'text-[var(--color-red)] bg-[var(--bg-tint-red)] border-[var(--color-red)]/30';
      case 'SIGNIFICANT':
        return 'text-[var(--color-amber)] bg-[var(--bg-tint-amber)] border-[var(--color-amber)]/30';
      case 'MODERATE':
        return 'text-[var(--color-teal)] bg-[var(--bg-tint-teal)] border-[var(--color-teal)]/30';
      case 'MINOR':
        return 'text-[var(--color-green)] bg-[var(--bg-tint-green)] border-[var(--color-green)]/30';
      default:
        return 'text-[var(--text-muted)] bg-[var(--bg-canvas)] border-[var(--border-default)]';
    }
  };

  const getDirectionIcon = (dir: string) => {
    switch (dir) {
      case 'improved':
      case 'recovered':
        return <span className="text-[var(--color-green)] font-bold">↗</span>;
      case 'declined':
        return <span className="text-[var(--color-red)] font-bold">↘</span>;
      case 'changed':
        return <span className="text-[var(--color-amber)] font-bold">≈</span>;
      case 'unavailable':
        return <span className="text-[var(--text-muted)] font-bold">?</span>;
      default:
        return <span className="text-[var(--text-muted)] font-bold">−</span>;
    }
  };

  return (
    <div
      className={`rounded-md border bg-[var(--bg-surface)] overflow-hidden transition-all duration-300 ${
        summary?.reviewRequiredItems?.length ? 'border-[var(--color-amber)]/50'
          : summary?.status === 'meaningful_changes' && summary?.overallSignificance === 'CRITICAL'
          ? 'border-[var(--color-red)]/50'
          : summary?.hasMeaningfulChange
          ? 'border-[var(--color-green)]/50'
          : 'border-[var(--border-default)]'
      } ${className}`}
    >
      {/* Top Banner / Review Alert */}
      {summary?.reviewRequiredItems && summary.reviewRequiredItems.length > 0 && (
        <div className="bg-[var(--bg-tint-amber)] border-b border-[var(--color-amber)]/50 px-4 py-2.5 flex items-center justify-between text-[var(--color-amber)] text-xs">
          <div className="flex items-center gap-2">
            <span className="text-[var(--color-amber)] font-bold shrink-0">⚠</span>
            <span className="font-semibold text-[var(--text-primary)]">
              {isKn ? 'ಪರಿಶೀಲನೆ ಅಗತ್ಯವಿದೆ:' : 'Review Required:'} {summary.reviewRequiredItems[0].summary}
            </span>
          </div>
          <span className="bg-[var(--bg-canvas)] text-[var(--color-amber)] px-2 py-0.5 rounded text-[11px] font-mono border border-[var(--color-amber)]/50">
            {isKn ? 'ಸಸ್ಯದ ತಳಿ ಬದಲಾಗಿದೆ' : 'Identity Shift'}
          </span>
        </div>
      )}

      {/* Main Header */}
      <div className="p-4 sm:p-5 border-b border-[var(--border-default)] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-md flex items-center justify-center border ${
              !summary || summary.status === 'insufficient_history'
                ? 'bg-[var(--bg-canvas)] border-[var(--border-default)] text-[var(--text-muted)]'
                : summary.status === 'stable_no_change'
                ? 'bg-[var(--bg-tint-green)] border-[var(--color-green)]/30 text-[var(--color-green)]'
                : 'bg-[var(--bg-tint-amber)] border-[var(--color-amber)]/30 text-[var(--color-amber)]'
            }`}
          >
            {!summary || summary.status === 'insufficient_history' ? (
              <span className="text-[var(--text-muted)] font-bold text-xl leading-none">⏱</span>
            ) : summary.status === 'stable_no_change' ? (
              <span className="text-[var(--color-green)] font-bold text-xl leading-none">✓</span>
            ) : (
              <span className="text-[var(--color-amber)] font-bold text-xl leading-none">∆</span>
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-bold text-[var(--text-primary)] tracking-tight">
                {isKn ? 'ಏನು ಬದಲಾಗಿದೆ?' : 'What Changed?'}
              </h3>
              {summary && (
                <span
                  className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded-full border ${
                    summary.status === 'stable_no_change'
                      ? 'bg-[var(--bg-tint-green)] text-[var(--color-green)] border-[var(--color-green)]/30'
                      : summary.status === 'insufficient_history'
                      ? 'bg-[var(--bg-canvas)] text-[var(--text-muted)] border-[var(--border-default)]'
                      : getSignificanceColor(summary.overallSignificance)
                  }`}
                >
                  {summary.status === 'stable_no_change'
                    ? isKn ? 'ಸ್ಥಿರವಾಗಿದೆ' : 'Stable'
                    : summary.status === 'insufficient_history'
                    ? isKn ? 'ಇತಿಹಾಸ ಬೇಕಿದೆ' : 'Pending History'
                    : `${summary.overallSignificance} DELTA`}
                </span>
              )}
            </div>
            {summary ? (
              <p className="text-xs text-[var(--text-muted)] flex items-center gap-1.5 mt-0.5">
                <span className="text-[var(--text-secondary)] font-bold">⏱</span>
                <span>
                  {isKn
                    ? `ಅವಲೋಕನ: ${summary.timeframeDescription}`
                    : `Comparison timeframe: ${summary.timeframeDescription}`}
                </span>
                <span className="text-[var(--text-dim)]">•</span>
                <span>{summary.observationCount} {isKn ? 'ದಾಖಲೆಗಳು' : 'observations'}</span>
              </p>
            ) : (
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                {isKn ? 'ಸಾಕಷ್ಟು ಡೇಟಾ ಇಲ್ಲ' : 'Insufficient historical data'}
              </p>
            )}
          </div>
        </div>
      </div>

      {!summary || !localizedCopy ? (
        <div className="p-8 text-center flex flex-col items-center justify-center text-[var(--text-muted)] bg-[var(--bg-canvas)]">
          <span className="text-3xl mb-3 opacity-20">∆</span>
          <p className="text-sm font-medium">{isKn ? 'ಬದಲಾವಣೆಯನ್ನು ಗುರುತಿಸಲು ಸಾಕಷ್ಟು ಡೇಟಾ ಇಲ್ಲ.' : 'Not enough historical data to identify a meaningful change.'}</p>
          <p className="text-xs opacity-70 mt-1">{isKn ? 'ಹೆಚ್ಚಿನ ಡೇಟಾ ಲಭ್ಯವಾದಾಗ ಇದು ನವೀಕರಿಸಲ್ಪಡುತ್ತದೆ.' : 'This will populate as more observation cycles are completed.'}</p>
        </div>
      ) : (
        <>

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
              <div className="flex items-center gap-1 overflow-x-auto pb-2 pt-1 px-1">
                <button
                  onClick={() => setActiveTab('all')}
                  className={`px-3 py-1.5 rounded-sm font-medium transition-colors border ${
                    activeTab === 'all'
                      ? 'bg-slate-800 border-slate-600 text-champagne'
                      : 'bg-transparent border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  {isKn ? 'ಎಲ್ಲಾ ಬದಲಾವಣೆಗಳು' : 'All Events'} {summary.events.length}
                </button>
                <button
                  onClick={() => setActiveTab('sensor')}
                  className={`px-3 py-1.5 rounded-sm font-medium transition-colors border ${
                    activeTab === 'sensor'
                      ? 'bg-slate-800 border-slate-600 text-champagne'
                      : 'bg-transparent border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  {isKn ? 'ಸಂವೇದಕಗಳು' : 'Sensors'} {summary.sensorChanges.length}
                </button>
                <button
                  onClick={() => setActiveTab('visual')}
                  className={`px-3 py-1.5 rounded-sm font-medium transition-colors border ${
                    activeTab === 'visual'
                      ? 'bg-slate-800 border-slate-600 text-champagne'
                      : 'bg-transparent border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  {isKn ? 'ದೃಶ್ಯ' : 'Visual'} {summary.visualChanges.length}
                </button>
                <button
                  onClick={() => setActiveTab('growth')}
                  className={`px-3 py-1.5 rounded-sm font-medium transition-colors border ${
                    activeTab === 'growth'
                      ? 'bg-slate-800 border-slate-600 text-champagne'
                      : 'bg-transparent border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  {isKn ? 'ಬೆಳವಣಿಗೆ' : 'Growth'} {summary.growthChanges.length}
                </button>
              </div>

              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-medium ml-2 shrink-0"
              >
                <span>{isExpanded ? (isKn ? 'ಕಡಿಮೆ ತೋರಿಸಿ' : 'Show less') : (isKn ? 'ವಿವರಗಳು' : 'Details')}</span>
                <span className="font-bold text-[10px]">{isExpanded ? '↑' : '↓'}</span>
              </button>
            </div>

            {/* Event List */}
            <div className="space-y-2">
              {(isExpanded ? filteredEvents : filteredEvents.slice(0, 3)).map((event: PlantChangeEvent) => {
                const eventCopy = getLocalizedChangeEvent(event, language);
                return (
                  <div
                    key={event.id}
                    className={`p-4 rounded-md border transition-all ${
                      event.requiresReview
                        ? 'bg-amber-950/20 border-amber-800/40'
                        : event.isMeaningful
                        ? 'bg-slate-800/30 border-slate-700/50'
                        : 'bg-slate-900/30 border-slate-800/40'
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
                            <div className="mt-3 pt-3 border-t border-slate-800/80 text-[12px] text-slate-400 space-y-2">
                              <div className="flex flex-col gap-1">
                                <span className="font-semibold text-[10px] uppercase tracking-wider text-slate-500">{isKn ? 'ಏಕೆ ಮುಖ್ಯ' : 'Why it matters'}</span>
                                <span className="text-slate-300 leading-relaxed">{userMode === 'farmer' ? eventCopy.why : event.summary}</span>
                              </div>
                              <div className="flex flex-col gap-1 mt-2">
                                <span className="font-semibold text-[10px] uppercase tracking-wider text-amber-500/80">{isKn ? 'ಕ್ರಮ:' : 'Related Action'}</span>
                                <span className="text-amber-200/90 font-medium">
                                  {userMode === 'farmer' ? eventCopy.action : event.farmerAction}
                                </span>
                              </div>
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
            <span className="font-bold text-[14px] leading-none">→</span>
          </Link>

          <Link
            href="/dashboard/analytics"
            className="text-slate-400 hover:text-slate-200 flex items-center gap-1 transition-colors"
          >
            <span className="font-bold text-[14px] text-slate-400">~</span>
            <span>{isKn ? 'ಸಸ್ಯ ಪ್ರವಾಸ' : 'Plant Journey'}</span>
          </Link>
        </div>
      </div>
      </>
      )}
    </div>
  );
}
