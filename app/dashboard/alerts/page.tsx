'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Bell,
  AlertOctagon,
  AlertTriangle,
  Info,
  CheckCircle2,
  ArrowLeft,
} from 'lucide-react';
import { usePlantIntelligence } from '@/lib/intelligence/PlantIntelligenceContext';
import { PlantAlertCard } from '@/components/ui/PlantAlertCard';


export default function AlertsPage() {
  const {
    alertSummary,
    language,
    userMode,
    dismissAlert,
    acknowledgeAlert,
    plantProfile,
  } = usePlantIntelligence();

  const [activeTab, setActiveTab] = useState<'ACTIVE' | 'DISMISSED' | 'RESOLVED'>('ACTIVE');

  const { activeAlerts, dismissedAlerts, resolvedAlerts, urgentCount, attentionCount, infoCount } = alertSummary;

  const currentList = activeTab === 'ACTIVE'
    ? activeAlerts
    : activeTab === 'DISMISSED'
    ? dismissedAlerts
    : resolvedAlerts;

  const isKn = language === 'kn';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Top Navigation & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Link
              href="/dashboard"
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors"
              title={isKn ? 'ಡ್ಯಾಶ್‌ಬೋರ್ಡ್‌ಗೆ ಹಿಂತಿರುಗಿ' : 'Back to Dashboard'}
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 uppercase tracking-wider">
              <Bell className="w-3.5 h-3.5" />
              <span>{isKn ? 'ಹೈಡ್ರೋಸ್ಮಾರ್ಟ್ ಎಚ್ಚರಿಕೆ ವ್ಯವಸ್ಥೆ' : 'HydroSmart Intelligence'}</span>
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <span>{isKn ? 'ಗಿಡದ ಎಚ್ಚರಿಕೆಗಳು ಮತ್ತು ಅಧಿಸೂಚನೆಗಳು' : 'Plant Alerts & Notifications'}</span>
          </h1>
          <p className="text-sm text-white/60">
            {isKn
              ? `${plantProfile?.commonName || 'ಗಿಡ'}ಕ್ಕಾಗಿ ಸಾಕ್ಷ್ಯಾಧಾರಿತ ಎಚ್ಚರಿಕೆಗಳು ಮತ್ತು ಶಿಫಾರಸುಗಳು.`
              : `Confidence-aware, evidence-based alerts and actionable notifications for ${plantProfile?.commonName || 'your plant'}.`}
          </p>
        </div>

        {/* Severity Summary Counter Pills */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs font-bold">
            <AlertOctagon className="w-3.5 h-3.5 text-red-400" />
            <span>{urgentCount} {isKn ? 'ತುರ್ತು' : 'Urgent'}</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            <span>{attentionCount} {isKn ? 'ಗಮನಿಸಿ' : 'Attention'}</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-300 text-xs font-bold">
            <Info className="w-3.5 h-3.5 text-blue-400" />
            <span>{infoCount} {isKn ? 'ಮಾಹಿತಿ' : 'Info'}</span>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between gap-4 border-b border-white/5 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('ACTIVE')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === 'ACTIVE'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <span>{isKn ? 'ಸಕ್ರಿಯ ಎಚ್ಚರಿಕೆಗಳು' : 'Active Alerts'}</span>
            <span className="px-1.5 py-0.2 rounded-full bg-white/10 text-[10px]">
              {activeAlerts.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('RESOLVED')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === 'RESOLVED'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <span>{isKn ? 'ಪರಿಹರಿಸಲಾಗಿದೆ' : 'Resolved'}</span>
            <span className="px-1.5 py-0.2 rounded-full bg-white/10 text-[10px]">
              {resolvedAlerts.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('DISMISSED')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === 'DISMISSED'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <span>{isKn ? 'ವಜಾಗೊಳಿಸಲಾಗಿದೆ' : 'Dismissed'}</span>
            <span className="px-1.5 py-0.2 rounded-full bg-white/10 text-[10px]">
              {dismissedAlerts.length}
            </span>
          </button>
        </div>
      </div>

      {/* Alert Cards Container */}
      <div className="space-y-4">
        {currentList.length === 0 ? (
          <div className="p-12 text-center rounded-2xl border border-white/10 bg-slate-900/40 backdrop-blur-sm space-y-3">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
            <h3 className="text-lg font-bold text-white">
              {activeTab === 'ACTIVE'
                ? isKn
                  ? 'ಯಾವುದೇ ಸಕ್ರಿಯ ಎಚ್ಚರಿಕೆಗಳಿಲ್ಲ'
                  : 'All Systems Stable — No Active Alerts'
                : activeTab === 'DISMISSED'
                ? isKn
                  ? 'ಯಾವುದೇ ವಜಾಗೊಳಿಸಿದ ಎಚ್ಚರಿಕೆಗಳಿಲ್ಲ'
                  : 'No Dismissed Alerts'
                : isKn
                ? 'ಯಾವುದೇ ಪರಿಹರಿಸಿದ ಎಚ್ಚರಿಕೆಗಳಿಲ್ಲ'
                : 'No Resolved Alerts Yet'}
            </h3>
            <p className="text-sm text-white/50 max-w-md mx-auto">
              {activeTab === 'ACTIVE'
                ? isKn
                  ? 'ಗಿಡದ ಪರಿಸರ ಮತ್ತು ಎಲೆಗಳ ಆರೋಗ್ಯ ಸಹಜ ಸ್ಥಿತಿಯಲ್ಲಿದೆ. ನಿಯಮಿತ ನಿಗಾ ಮುಂದುವರಿಸಿ.'
                  : 'Environmental parameters and foliar metrics are within expected ranges. Continue routine monitoring.'
                : isKn
                ? 'ಇತಿಹಾಸದಲ್ಲಿ ಯಾವುದೇ ನಮೂದುಗಳಿಲ್ಲ.'
                : 'No records in this archive.'}
            </p>
            {activeTab === 'ACTIVE' && (
              <div className="pt-2">
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>{isKn ? 'ಡ್ಯಾಶ್‌ಬೋರ್ಡ್‌ಗೆ ಹಿಂತಿರುಗಿ' : 'Return to Dashboard'}</span>
                </Link>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {currentList.map(alert => (
              <PlantAlertCard
                key={alert.id}
                alert={alert}
                mode={userMode}
                language={language}
                onDismiss={activeTab === 'ACTIVE' ? dismissAlert : undefined}
                onAcknowledge={activeTab === 'ACTIVE' ? acknowledgeAlert : undefined}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
