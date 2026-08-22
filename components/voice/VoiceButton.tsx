'use client';

import React from 'react';
import { Mic, MicOff, Loader2, Square } from 'lucide-react';
import { VoiceState } from '@/lib/voice/voiceConfig';
import styles from './PlantVoiceAssistant.module.css';

interface VoiceButtonProps {
  voiceState: VoiceState;
  onToggleListen: () => void;
  onStopSpeaking: () => void;
  disabled?: boolean;
}

export function VoiceButton({
  voiceState,
  onToggleListen,
  onStopSpeaking,
  disabled = false,
}: VoiceButtonProps) {
  if (voiceState === 'speaking') {
    return (
      <button
        className={`${styles.micButton} ${styles.micSpeaking}`}
        onClick={onStopSpeaking}
        title="Stop speaking"
        aria-label="Stop audio playback"
      >
        <Square size={36} fill="#B7FF3C" />
      </button>
    );
  }

  if (voiceState === 'listening' || voiceState === 'transcribing') {
    return (
      <button
        className={`${styles.micButton} ${styles.micListening}`}
        onClick={onToggleListen}
        title="Stop listening"
        aria-label="Stop listening"
      >
        <MicOff size={36} />
      </button>
    );
  }

  if (voiceState === 'thinking') {
    return (
      <button
        className={`${styles.micButton} ${styles.micThinking}`}
        disabled
        aria-label="Processing response"
      >
        <Loader2 size={36} className="animate-spin" />
      </button>
    );
  }

  return (
    <button
      className={`${styles.micButton} ${styles.micIdle}`}
      onClick={onToggleListen}
      disabled={disabled}
      title="Tap to speak with your plant"
      aria-label="Tap to speak"
    >
      <Mic size={36} />
    </button>
  );
}
