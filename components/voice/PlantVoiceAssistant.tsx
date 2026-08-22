'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { usePlantIntelligence } from '@/lib/intelligence/PlantIntelligenceContext';
import {
  SupportedLanguageCode,
  DEFAULT_LANGUAGE,
  VOICE_LANGUAGE_STORAGE_KEY,
  VOICE_MODE_STORAGE_KEY,
  VoiceState,
  AssistantMode
} from '@/lib/voice/voiceConfig';
import {
  startSpeechRecognition,
  stopSpeechRecognition,
  isSpeechRecognitionSupported
} from '@/lib/voice/speechToText';
import {
  speakText,
  stopSpeaking,
  isSpeechSynthesisSupported
} from '@/lib/voice/textToSpeech';
import { generateMultilingualPlantResponse } from '@/lib/voice/multilingualAssistantEngine';
import { LanguageSelector } from './LanguageSelector';
import { VoiceButton } from './VoiceButton';
import { VoiceStatus } from './VoiceStatus';
import { TranscriptView, DialogueItem } from './TranscriptView';
import { Sparkles, VolumeX, Send, RotateCcw } from 'lucide-react';
import styles from './PlantVoiceAssistant.module.css';

export function PlantVoiceAssistant() {
  const { structuredPlantContext } = usePlantIntelligence();

  // Lazy Initializers for State
  const [language, setLanguage] = useState<SupportedLanguageCode>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(VOICE_LANGUAGE_STORAGE_KEY) as SupportedLanguageCode;
      if (saved) return saved;
    }
    return DEFAULT_LANGUAGE;
  });

  const [mode, setMode] = useState<AssistantMode>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(VOICE_MODE_STORAGE_KEY) as AssistantMode;
      if (saved) return saved;
    }
    return 'farmer';
  });

  const [voiceState, setVoiceState] = useState<VoiceState>('idle');

  const [dialogue, setDialogue] = useState<DialogueItem[]>(() => {
    const isKn = (typeof window !== 'undefined'
      ? (localStorage.getItem(VOICE_LANGUAGE_STORAGE_KEY) as SupportedLanguageCode) || DEFAULT_LANGUAGE
      : DEFAULT_LANGUAGE) === 'kn-IN';

    return [
      {
        id: 'welcome_1',
        sender: 'plant',
        text: isKn
          ? 'ನಮಸ್ಕಾರ! ನಾನು ನಿಮ್ಮ ಗಿಡದ ಧ್ವನಿ ಸಹಾಯಕ. ಮಾತನಾಡಲು ಕೆಳಗಿನ ಮೈಕ್ರೋಫೋನ್ ಬಟನ್ ಒತ್ತಿ.'
          : 'Hello! I am your plant voice assistant. Tap the microphone button to talk to me.',
        timestamp: Date.now(),
        epistemicBadges: ['measured_fact'],
      },
    ];
  });

  const [interimTranscript, setInterimTranscript] = useState<string>('');
  const [customError, setCustomError] = useState<string | undefined>(undefined);
  const [textInput, setTextInput] = useState<string>('');

  const [hasSTT] = useState<boolean>(() => {
    if (typeof window !== 'undefined') return isSpeechRecognitionSupported();
    return true;
  });

  const [hasTTS] = useState<boolean>(() => {
    if (typeof window !== 'undefined') return isSpeechSynthesisSupported();
    return true;
  });

  const contextRef = useRef(structuredPlantContext);

  useEffect(() => {
    contextRef.current = structuredPlantContext;
  }, [structuredPlantContext]);

  // Clean up speech recognition & synthesis on unmount
  useEffect(() => {
    return () => {
      stopSpeechRecognition();
      stopSpeaking();
    };
  }, []);

  const handleLanguageChange = (newLang: SupportedLanguageCode) => {
    stopSpeaking();
    stopSpeechRecognition();
    setVoiceState('idle');
    setLanguage(newLang);
    if (typeof window !== 'undefined') {
      localStorage.setItem(VOICE_LANGUAGE_STORAGE_KEY, newLang);
    }
  };

  const handleModeChange = (newMode: AssistantMode) => {
    setMode(newMode);
    if (typeof window !== 'undefined') {
      localStorage.setItem(VOICE_MODE_STORAGE_KEY, newMode);
    }
  };

  // Process user speech or text through the grounded multilingual engine
  const processQuery = useCallback(async (queryText: string) => {
    if (!queryText.trim()) return;

    setVoiceState('thinking');
    setInterimTranscript('');

    const userEntry: DialogueItem = {
      id: `user_${Date.now()}`,
      sender: 'farmer',
      text: queryText.trim(),
      timestamp: Date.now(),
    };

    setDialogue(prev => [...prev, userEntry]);

    try {
      const response = await generateMultilingualPlantResponse(
        queryText,
        contextRef.current,
        language,
        mode
      );

      const plantEntry: DialogueItem = {
        id: `plant_${Date.now()}`,
        sender: 'plant',
        text: response.displayText,
        timestamp: Date.now(),
        epistemicBadges: response.epistemicBadges,
      };

      setDialogue(prev => [...prev, plantEntry]);

      // Speak response in chosen language
      if (hasTTS) {
        setVoiceState('speaking');
        speakText({
          text: response.spokenText,
          language,
          onEnd: () => {
            setVoiceState('idle');
          },
          onError: () => {
            setVoiceState('idle');
          },
        });
      } else {
        setVoiceState('idle');
      }
    } catch (err) {
      console.error('[VoiceAssistant] Error processing query:', err);
      setVoiceState('error');
      setCustomError('Error evaluating plant telemetry.');
      setTimeout(() => setVoiceState('idle'), 3000);
    }
  }, [language, mode, hasTTS]);

  // Handle tap to listen
  const handleToggleListen = () => {
    if (voiceState === 'listening' || voiceState === 'transcribing') {
      stopSpeechRecognition();
      setVoiceState('idle');
      return;
    }

    stopSpeaking();
    setCustomError(undefined);
    setInterimTranscript('');

    const success = startSpeechRecognition({
      language,
      onStart: () => {
        setVoiceState('listening');
      },
      onResult: (transcript, isFinal) => {
        if (isFinal) {
          setVoiceState('transcribing');
          setInterimTranscript(transcript);
          processQuery(transcript);
        } else {
          setInterimTranscript(transcript);
        }
      },
      onError: (errMsg) => {
        setVoiceState('error');
        setCustomError(errMsg);
        setTimeout(() => setVoiceState('idle'), 4000);
      },
      onEnd: () => {
        setVoiceState(prev => (prev === 'listening' || prev === 'transcribing' ? 'idle' : prev));
      },
    });

    if (!success) {
      setVoiceState('error');
      setCustomError('Speech recognition is unavailable.');
    }
  };

  const handleStopSpeaking = () => {
    stopSpeaking();
    setVoiceState('idle');
  };

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!textInput.trim() || voiceState === 'thinking') return;
    const q = textInput;
    setTextInput('');
    processQuery(q);
  };

  const handleReset = () => {
    stopSpeaking();
    stopSpeechRecognition();
    setVoiceState('idle');
    setInterimTranscript('');
    const isKn = language === 'kn-IN';
    setDialogue([
      {
        id: `welcome_${Date.now()}`,
        sender: 'plant',
        text: isKn
          ? 'ಸಂಭಾಷಣೆ ಮರುಹೊಂದಿಸಲಾಗಿದೆ. ಮಾತನಾಡಲು ಕೆಳಗಿನ ಮೈಕ್ರೋಫೋನ್ ಒತ್ತಿ.'
          : 'Conversation reset. Tap the microphone to speak with your plant.',
        timestamp: Date.now(),
        epistemicBadges: ['measured_fact'],
      },
    ]);
  };

  return (
    <div className={styles.assistantCard}>
      
      {/* 1. Header: Language and Mode Selector */}
      <div className={styles.assistantHeader}>
        <div className={styles.headerTitle}>
          <div className={styles.headerIcon}>
            <Sparkles size={20} />
          </div>
          <div>
            <h3 className="text-md font-bold text-primary">🌱 Multilingual Plant Voice Assistant</h3>
            <p className="text-xs text-secondary">
              Voice-to-voice interaction in Kannada (ಕನ್ನಡ) & English
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          {/* Language Selector */}
          <LanguageSelector
            selectedLanguage={language}
            onLanguageChange={handleLanguageChange}
            disabled={voiceState === 'listening' || voiceState === 'thinking'}
          />

          {/* Farmer vs Technical Mode Toggle */}
          <div className={styles.modeToggle}>
            <button
              className={`${styles.modeBtn} ${mode === 'farmer' ? styles.modeBtnActive : ''}`}
              onClick={() => handleModeChange('farmer')}
              title="Simple, friendly language for farmers"
            >
              👨🌾 Farmer
            </button>
            <button
              className={`${styles.modeBtn} ${mode === 'technical' ? styles.modeBtnActive : ''}`}
              onClick={() => handleModeChange('technical')}
              title="Detailed sensor values and drift rates"
            >
              🔬 Technical
            </button>
          </div>

          <button
            className="btn btn-ghost"
            style={{ fontSize: '11px', padding: '6px 8px' }}
            onClick={handleReset}
            title="Reset conversation"
          >
            <RotateCcw size={13} />
          </button>
        </div>
      </div>

      {/* 2. Interactive Microphone Stage */}
      <div className={styles.micStage}>
        <VoiceButton
          voiceState={voiceState}
          onToggleListen={handleToggleListen}
          onStopSpeaking={handleStopSpeaking}
        />

        <VoiceStatus
          voiceState={voiceState}
          language={language}
          customError={customError}
        />

        {voiceState === 'speaking' && (
          <button
            className="btn btn-danger"
            style={{ fontSize: '11px', padding: '4px 12px', display: 'flex', alignItems: 'center', gap: '6px' }}
            onClick={handleStopSpeaking}
          >
            <VolumeX size={14} /> Stop Speaking
          </button>
        )}
      </div>

      {/* 3. Conversation & Transcript Stream */}
      <TranscriptView
        dialogue={dialogue}
        interimTranscript={interimTranscript}
      />

      {/* 4. Text Input Fallback */}
      <form onSubmit={handleTextSubmit} style={{ display: 'flex', gap: '8px' }}>
        <input
          type="text"
          className="input"
          style={{ flex: 1, fontSize: '12.5px', padding: '10px 14px' }}
          placeholder={
            language === 'kn-IN'
              ? 'ಪ್ರಶ್ನೆ ಬರೆಯಿರಿ (ಉದಾ: ನನ್ನ ಗಿಡ ಹೇಗಿದೆ? ಅಥವಾ ನೀರು ಬೇಕೆ?)...'
              : 'Type your question (e.g., How is my plant? or Does it need water?)...'
          }
          value={textInput}
          onChange={(e) => setTextInput(e.target.value)}
          disabled={voiceState === 'thinking'}
        />
        <button
          type="submit"
          className="btn btn-primary"
          style={{ padding: '10px 18px' }}
          disabled={!textInput.trim() || voiceState === 'thinking'}
        >
          <Send size={15} />
        </button>
      </form>

      {!hasSTT && (
        <div style={{ fontSize: '11px', color: '#FFC857', textAlign: 'center' }}>
          ℹ️ Voice speech recognition is not natively supported in this browser. You can type questions above in Kannada or English.
        </div>
      )}

    </div>
  );
}
