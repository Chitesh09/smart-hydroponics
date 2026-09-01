'use client';

import React, { useState, useEffect, useRef } from 'react';
import { usePlantIntelligence } from '@/lib/intelligence/PlantIntelligenceContext';
import {
  SupportedLanguageCode,
  AssistantMode,
  DEFAULT_LANGUAGE,
  SUPPORTED_LANGUAGES,
  SUGGESTED_PROMPTS,
  ASSISTANT_LANGUAGE_STORAGE_KEY,
  ASSISTANT_MODE_STORAGE_KEY
} from '@/lib/assistant/assistantConfig';
import { generatePlantTextResponse } from '@/lib/assistant/multilingualAssistantEngine';
import { BrandLogo } from '@/components/ui/BrandLogo';
import { Send, RotateCcw, Sparkles } from 'lucide-react';
import styles from './PlantTextAssistant.module.css';

export interface ChatMessage {
  id: string;
  sender: 'user' | 'plant';
  text: string;
  timestamp: number;
  epistemicBadges?: Array<'measured_fact' | 'visual_observation' | 'mathematical_projection' | 'grower_advisory'>;
}

export function PlantTextAssistant() {
  const { cropIdentity, multimodalAssessment, structuredPlantContext } = usePlantIntelligence();

  const [language, setLanguage] = useState<SupportedLanguageCode>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(ASSISTANT_LANGUAGE_STORAGE_KEY) as SupportedLanguageCode;
      if (saved === 'en' || saved === 'kn') return saved;
    }
    return DEFAULT_LANGUAGE;
  });

  const [mode, setMode] = useState<AssistantMode>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(ASSISTANT_MODE_STORAGE_KEY) as AssistantMode;
      if (saved === 'farmer' || saved === 'technical') return saved;
    }
    return 'farmer';
  });

  const [inputMessage, setInputMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const isKn = (typeof window !== 'undefined'
      ? (localStorage.getItem(ASSISTANT_LANGUAGE_STORAGE_KEY) as SupportedLanguageCode) || DEFAULT_LANGUAGE
      : DEFAULT_LANGUAGE) === 'kn';

    return [
      {
        id: 'welcome_msg',
        sender: 'plant',
        text: isKn
          ? 'ನಮಸ್ಕಾರ! ನಾನು ನಿಮ್ಮ ಹೈಡ್ರೋಪೋನಿಕ್ ಗಿಡದ ಡಿಜಿಟಲ್ ಸಹಾಯಕ. ನೀರು, ಗೊಬ್ಬರ (TDS), pH ಅಥವಾ ಎಲೆಗಳ ಸ್ಥಿತಿಯ ಬಗ್ಗೆ ಏನಾದರೂ ಕೇಳಿ.'
          : 'Hello grower! I am your monitored hydroponic plant assistant. Ask me anything about my water level, nutrients, pH, or leaf health!',
        timestamp: Date.now(),
        epistemicBadges: ['measured_fact'],
      },
    ];
  });

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleLanguageChange = (newLang: SupportedLanguageCode) => {
    setLanguage(newLang);
    if (typeof window !== 'undefined') {
      localStorage.setItem(ASSISTANT_LANGUAGE_STORAGE_KEY, newLang);
    }
  };

  const handleModeChange = (newMode: AssistantMode) => {
    setMode(newMode);
    if (typeof window !== 'undefined') {
      localStorage.setItem(ASSISTANT_MODE_STORAGE_KEY, newMode);
    }
  };

  const handleSendMessage = async (queryText: string) => {
    const trimmed = queryText.trim();
    if (!trimmed || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user_${Date.now()}`,
      sender: 'user',
      text: trimmed,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await generatePlantTextResponse(trimmed, structuredPlantContext, language, mode);
      const plantMsg: ChatMessage = {
        id: `plant_${Date.now()}`,
        sender: 'plant',
        text: response.text,
        timestamp: Date.now(),
        epistemicBadges: response.epistemicBadges,
      };
      setMessages((prev) => [...prev, plantMsg]);
    } catch {
      const errorMsg: ChatMessage = {
        id: `err_${Date.now()}`,
        sender: 'plant',
        text: language === 'kn'
          ? 'ಕ್ಷಮಿಸಿ, ಪ್ರತಿಕ್ರಿಯೆ ಸಿದ್ಧಪಡಿಸಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ. ದಯವಿಟ್ಟು ಮತ್ತೊಮ್ಮೆ ಪ್ರಯತ್ನಿಸಿ.'
          : 'I encountered an error generating a response from telemetry. Please try again.',
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: `reset_${Date.now()}`,
        sender: 'plant',
        text: language === 'kn'
          ? 'ಸಂಭಾಷಣೆ ಮರುಹೊಂದಿಸಲಾಗಿದೆ. ನಿಮ್ಮ ಗಿಡದ ಸ್ಥಿತಿಯ ಬಗ್ಗೆ ಯಾವುದೇ ಪ್ರಶ್ನೆಯನ್ನು ಕೇಳಿ.'
          : 'Conversation reset. Feel free to ask any question about your hydroponic plant!',
        timestamp: Date.now(),
        epistemicBadges: ['measured_fact'],
      },
    ]);
  };

  const isKn = language === 'kn';

  return (
    <div className={`glass-card ${styles.assistantContainer}`} style={{ padding: '24px' }}>
      
      {/* 1. Header with Plant Status, Language Selector & Farmer Mode Toggle */}
      <div className={styles.assistantHeader}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div className={styles.plantAvatar}>
            <BrandLogo size={28} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h3 className="text-base font-bold text-primary">{cropIdentity.commonName}</h3>
              <span className={`badge badge-${multimodalAssessment.overallHealthState === 'optimal' ? 'success' : multimodalAssessment.overallHealthState === 'warning' ? 'warning' : 'danger'}`}>
                {multimodalAssessment.overallHealthState === 'optimal' ? '● OPTIMAL' : multimodalAssessment.overallHealthState === 'warning' ? '● MILD STRESS' : '● ATTENTION'}
              </span>
            </div>
            <p className="text-xs text-secondary">
              {isKn ? 'ಲೈವ್ ಕ್ಯಾಮೆರಾ ಮತ್ತು ಸೆನ್ಸರ್‌ಗಳ ಆಧಾರಿತ ಡಿಜಿಟಲ್ ಸಹಾಯಕ' : 'Grounded in live ESP32 sensors & computer vision'}
            </p>
          </div>
        </div>

        {/* Controls: Language and Mode Selector */}
        <div className={styles.controlsRow}>
          {/* Language Selector */}
          <div className={styles.langPillGroup} title="Select Assistant Language">
            {SUPPORTED_LANGUAGES.map((l) => (
              <button
                key={l.code}
                className={`${styles.langPill} ${language === l.code ? styles.langPillActive : ''}`}
                onClick={() => handleLanguageChange(l.code)}
              >
                {l.nativeScript}
              </button>
            ))}
          </div>

          {/* Mode Selector */}
          <div className={styles.modePillGroup} title="Toggle Assistant Explanation Level">
            <button
              className={`${styles.modePill} ${mode === 'farmer' ? styles.modePillActive : ''}`}
              onClick={() => handleModeChange('farmer')}
            >
              {isKn ? '🌾 ಸರಳ' : '🌾 Farmer'}
            </button>
            <button
              className={`${styles.modePill} ${mode === 'technical' ? styles.modePillActive : ''}`}
              onClick={() => handleModeChange('technical')}
            >
              {isKn ? '⚙️ ತಾಂತ್ರಿಕ' : '⚙️ Technical'}
            </button>
          </div>

          {/* Reset Button */}
          <button
            className="btn btn-ghost"
            style={{ padding: '6px 10px', fontSize: '11px' }}
            onClick={handleClearChat}
            title={isKn ? 'ಸಂಭಾಷಣೆ ಮರುಹೊಂದಿಸಿ' : 'Reset chat'}
          >
            <RotateCcw size={13} />
          </button>
        </div>
      </div>

      {/* 2. Suggested Prompt Chips */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
          <Sparkles size={13} className="text-primary" />
          <span className="text-xs text-muted" style={{ fontWeight: 600 }}>
            {isKn ? 'ಸಲಹೆ ಪ್ರಶ್ನೆಗಳು (ಕ್ಲಿಕ್ ಮಾಡಿ):' : 'Suggested Questions (Click to ask):'}
          </span>
        </div>
        <div className={styles.promptChipsRow}>
          {SUGGESTED_PROMPTS.map((p) => (
            <button
              key={p.id}
              className={styles.promptChip}
              onClick={() => handleSendMessage(isKn ? p.promptKn : p.promptEn)}
              disabled={isLoading}
            >
              {isKn ? p.labelKn : p.labelEn}
            </button>
          ))}
        </div>
      </div>

      {/* 3. Messages Thread */}
      <div className={styles.chatMessagesThread}>
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={msg.sender === 'user' ? styles.chatBubbleUser : styles.chatBubblePlant}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: msg.sender === 'user' ? '#00E5FF' : '#B7FF3C' }}>
                {msg.sender === 'user' ? (isKn ? 'ನೀವು' : 'You') : `${cropIdentity.commonName} (${isKn ? 'ಗಿಡ' : 'Plant'})`}
              </span>
              <span style={{ fontSize: '10px', color: '#5A738E' }}>
                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>

            <div style={{ whiteSpace: 'pre-wrap' }}>{msg.text}</div>

            {/* Epistemic Grounding Badges */}
            {msg.epistemicBadges && msg.epistemicBadges.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '6px' }}>
                {msg.epistemicBadges.map((badge, idx) => (
                  <span
                    key={idx}
                    className={`${styles.epistemicBadge} ${
                      badge === 'measured_fact'
                        ? styles.badgeMeasuredFact
                        : badge === 'visual_observation'
                          ? styles.badgeVisualObservation
                          : badge === 'mathematical_projection'
                            ? styles.badgeProjection
                            : styles.badgeAdvisory
                    }`}
                  >
                    {badge === 'measured_fact' && (isKn ? '✓ ಅಳತೆ ಮಾಡಿದ ಡೇಟಾ' : '✓ Measured Fact')}
                    {badge === 'visual_observation' && (isKn ? '👁 ಕ್ಯಾಮೆರಾ ವೀಕ್ಷಣೆ' : '👁 Visual Observation')}
                    {badge === 'mathematical_projection' && (isKn ? '📈 ಮುನ್ಸೂಚನೆ' : '📈 Projection')}
                    {badge === 'grower_advisory' && (isKn ? '💡 ಸಲಹೆ' : '💡 Grower Advisory')}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className={styles.chatBubblePlant} style={{ fontStyle: 'italic', color: '#8FA3B8' }}>
            {isKn ? 'ಸೆನ್ಸರ್ ಮತ್ತು ಕ್ಯಾಮೆರಾ ಡೇಟಾ ವಿಶ್ಲೇಷಿಸಲಾಗುತ್ತಿದೆ...' : 'Evaluating live sensors & camera telemetry...'}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* 4. Text Input Bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage(inputMessage);
        }}
        className={styles.chatInputBar}
      >
        <input
          type="text"
          className={styles.chatInputField}
          placeholder={isKn ? 'ನಿಮ್ಮ ಗಿಡಕ್ಕೆ ಪ್ರಶ್ನೆ ಕೇಳಿ...' : 'Ask your plant a question...'}
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          disabled={isLoading}
        />
        <button
          type="submit"
          className="btn btn-primary"
          disabled={!inputMessage.trim() || isLoading}
          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <Send size={15} /> {isKn ? 'ಕಳುಹಿಸಿ' : 'Send'}
        </button>
      </form>

      {/* 5. Footer Note */}
      <div className={styles.footerNote}>
        <em>{isKn ? 'ಮಾಹಿತಿ:' : 'Note:'}</em>{' '}
        {isKn
          ? 'ಗಿಡದ ಎಲ್ಲಾ ಉತ್ತರಗಳು ಲೈವ್ ESP32 ಸೆನ್ಸರ್‌ಗಳು ಮತ್ತು ಕ್ಯಾಮೆರಾ ವೀಕ್ಷಣೆಗಳನ್ನು ಆಧರಿಸಿವೆ.'
          : 'All plant assistant responses are strictly grounded in live ESP32 telemetry and camera diagnostics.'}
      </div>

    </div>
  );
}
