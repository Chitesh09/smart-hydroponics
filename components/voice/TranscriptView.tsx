'use client';

import React from 'react';
import styles from './PlantVoiceAssistant.module.css';

export interface DialogueItem {
  id: string;
  sender: 'farmer' | 'plant';
  text: string;
  timestamp: number;
  epistemicBadges?: Array<'measured_fact' | 'visual_observation' | 'mathematical_projection' | 'grower_advisory'>;
}

interface TranscriptViewProps {
  dialogue: DialogueItem[];
  interimTranscript?: string;
}

export function TranscriptView({
  dialogue,
  interimTranscript,
}: TranscriptViewProps) {
  if (dialogue.length === 0 && !interimTranscript) {
    return null;
  }

  return (
    <div className={styles.dialogueStream}>
      {dialogue.map((item) => (
        <div
          key={item.id}
          className={item.sender === 'farmer' ? styles.userBubble : styles.plantBubble}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: item.sender === 'farmer' ? '#00E5FF' : '#B7FF3C' }}>
              {item.sender === 'farmer' ? '👨🌾 You' : '🌱 HydroSmart'}
            </span>
            <span style={{ fontSize: '10px', color: '#5A738E' }}>
              {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>

          <div>{item.text}</div>

          {item.epistemicBadges && item.epistemicBadges.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '4px' }}>
              {item.epistemicBadges.map((badge, idx) => (
                <span
                  key={idx}
                  className={styles.badgePill}
                  style={{
                    background:
                      badge === 'measured_fact'
                        ? 'rgba(0, 229, 255, 0.15)'
                        : badge === 'visual_observation'
                          ? 'rgba(183, 255, 60, 0.15)'
                          : badge === 'mathematical_projection'
                            ? 'rgba(255, 200, 87, 0.15)'
                            : 'rgba(255, 107, 74, 0.15)',
                    color:
                      badge === 'measured_fact'
                        ? '#00E5FF'
                        : badge === 'visual_observation'
                          ? '#B7FF3C'
                          : badge === 'mathematical_projection'
                            ? '#FFC857'
                            : '#FF6B4A',
                    border: '1px solid currentColor',
                  }}
                >
                  {badge === 'measured_fact' && '✓ Fact'}
                  {badge === 'visual_observation' && '👁 Vision'}
                  {badge === 'mathematical_projection' && '📈 Trend'}
                  {badge === 'grower_advisory' && '💡 Advisory'}
                </span>
              ))}
            </div>
          )}
        </div>
      ))}

      {interimTranscript && (
        <div className={styles.userBubble} style={{ opacity: 0.7, fontStyle: 'italic' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#00E5FF', marginBottom: '2px' }}>
            👨🌾 Listening...
          </div>
          <div>&ldquo;{interimTranscript}&rdquo;</div>
        </div>
      )}
    </div>
  );
}
