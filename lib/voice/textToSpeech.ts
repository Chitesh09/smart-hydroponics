// ============================================================
// HydroSmart — Text to Speech Abstraction
// ============================================================

import { SupportedLanguageCode } from './voiceConfig';

export interface TTSOptions {
  text: string;
  language: SupportedLanguageCode;
  rate?: number;
  pitch?: number;
  volume?: number;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (error: string) => void;
}

/**
 * Check if the current browser environment supports speech synthesis
 */
export function isSpeechSynthesisSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return Boolean(window.speechSynthesis && window.SpeechSynthesisUtterance);
}

/**
 * Find the best available voice in the browser for the target language code
 */
function findBestVoice(langCode: SupportedLanguageCode): SpeechSynthesisVoice | null {
  if (typeof window === 'undefined' || !window.speechSynthesis) return null;

  const voices = window.speechSynthesis.getVoices();
  if (!voices || voices.length === 0) return null;

  // 1. Exact match e.g. 'kn-IN', 'en-IN'
  const exactMatch = voices.find(v => v.lang.toLowerCase() === langCode.toLowerCase());
  if (exactMatch) return exactMatch;

  // 2. Prefix match e.g. 'kn', 'en'
  const prefix = langCode.split('-')[0].toLowerCase();
  const prefixMatch = voices.find(v => v.lang.toLowerCase().startsWith(prefix));
  if (prefixMatch) return prefixMatch;

  // 3. Fallback to default voice
  return voices.find(v => v.default) || voices[0] || null;
}

/**
 * Speak text in the target language using browser synthesis or external provider
 */
export function speakText(options: TTSOptions): boolean {
  if (!isSpeechSynthesisSupported()) {
    options.onError?.('Speech synthesis is not supported in this browser.');
    return false;
  }

  // Cancel any active speech first to prevent overlapping voices
  stopSpeaking();

  try {
    const utterance = new SpeechSynthesisUtterance(options.text);
    utterance.lang = options.language;
    utterance.rate = options.rate ?? (options.language === 'kn-IN' ? 0.95 : 1.0);
    utterance.pitch = options.pitch ?? 1.05;
    utterance.volume = options.volume ?? 1.0;

    const matchedVoice = findBestVoice(options.language);
    if (matchedVoice) {
      utterance.voice = matchedVoice;
    }

    utterance.onstart = () => {
      options.onStart?.();
    };

    utterance.onend = () => {
      options.onEnd?.();
    };

    utterance.onerror = (event) => {
      console.warn('[TTS] Speech synthesis error:', event.error);
      options.onError?.(`TTS error: ${event.error}`);
    };

    window.speechSynthesis.speak(utterance);
    return true;
  } catch (err) {
    console.error('[TTS] Failed to execute speech synthesis:', err);
    options.onError?.('Failed to play audio response.');
    return false;
  }
}

/**
 * Immediately stop and cancel all playing and queued speech
 */
export function stopSpeaking(): void {
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    try {
      window.speechSynthesis.cancel();
    } catch (_e) {
      // Ignored
    }
  }
}
