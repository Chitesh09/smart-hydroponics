// ============================================================
// HydroSmart — Speech to Text Abstraction
// ============================================================

import { SupportedLanguageCode } from './voiceConfig';

// Browser Web Speech API Type Declarations
interface SpeechRecognitionErrorEvent extends Event {
  readonly error: string;
  readonly message?: string;
}

interface SpeechRecognitionEvent extends Event {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultList;
}

interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  onaudiostart: ((this: SpeechRecognitionInstance, ev: Event) => void) | null;
  onspeechstart: ((this: SpeechRecognitionInstance, ev: Event) => void) | null;
  onspeechend: ((this: SpeechRecognitionInstance, ev: Event) => void) | null;
  onstart: ((this: SpeechRecognitionInstance, ev: Event) => void) | null;
  onend: ((this: SpeechRecognitionInstance, ev: Event) => void) | null;
  onerror: ((this: SpeechRecognitionInstance, ev: SpeechRecognitionErrorEvent) => void) | null;
  onresult: ((this: SpeechRecognitionInstance, ev: SpeechRecognitionEvent) => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognitionInstance;
}

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

export interface STTOptions {
  language: SupportedLanguageCode;
  continuous?: boolean;
  interimResults?: boolean;
  onStart?: () => void;
  onResult?: (transcript: string, isFinal: boolean, confidence: number) => void;
  onError?: (errorMessage: string, isPermissionError: boolean) => void;
  onEnd?: () => void;
}

let activeRecognitionInstance: SpeechRecognitionInstance | null = null;

/**
 * Check if the current browser environment supports speech recognition
 */
export function isSpeechRecognitionSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);
}

/**
 * Start listening and capturing speech in the specified language
 */
export function startSpeechRecognition(options: STTOptions): boolean {
  if (!isSpeechRecognitionSupported()) {
    options.onError?.('Speech recognition is not supported in this browser. Please use Chrome, Edge, or text input.', false);
    return false;
  }

  // Stop any active previous session
  stopSpeechRecognition();

  try {
    const SpeechConstructor = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechConstructor) return false;

    const recognition = new SpeechConstructor();
    activeRecognitionInstance = recognition;

    recognition.lang = options.language;
    recognition.continuous = options.continuous ?? false;
    recognition.interimResults = options.interimResults ?? true;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      options.onStart?.();
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interimTranscript = '';
      let finalTranscript = '';
      let confidence = 0.9;

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript;
          confidence = result[0].confidence || 0.95;
        } else {
          interimTranscript += result[0].transcript;
          confidence = result[0].confidence || 0.7;
        }
      }

      if (finalTranscript.trim()) {
        options.onResult?.(finalTranscript.trim(), true, confidence);
      } else if (interimTranscript.trim()) {
        options.onResult?.(interimTranscript.trim(), false, confidence);
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.warn('[STT] Speech recognition error event:', event.error, event.message);
      
      let userFriendlyMsg = 'Speech recognition error. Please try speaking again.';
      let isPermission = false;

      switch (event.error) {
        case 'not-allowed':
        case 'service-not-allowed':
          userFriendlyMsg = 'Microphone permission denied. Please allow microphone access in your browser settings to talk to your plant.';
          isPermission = true;
          break;
        case 'no-speech':
          userFriendlyMsg = 'No speech detected. Please speak closer to your microphone.';
          break;
        case 'audio-capture':
          userFriendlyMsg = 'Microphone not detected or already in use by another app.';
          break;
        case 'network':
          userFriendlyMsg = 'Network connection issue during speech recognition.';
          break;
        default:
          userFriendlyMsg = `Recognition error: ${event.error}`;
      }

      options.onError?.(userFriendlyMsg, isPermission);
    };

    recognition.onend = () => {
      activeRecognitionInstance = null;
      options.onEnd?.();
    };

    recognition.start();
    return true;
  } catch (err) {
    console.error('[STT] Failed to initialize speech recognition:', err);
    options.onError?.('Failed to start microphone listener.', false);
    return false;
  }
}

/**
 * Abort/stop any active speech recognition session
 */
export function stopSpeechRecognition(): void {
  if (activeRecognitionInstance) {
    try {
      activeRecognitionInstance.abort();
    } catch (_e) {
      // Ignored
    }
    activeRecognitionInstance = null;
  }
}
