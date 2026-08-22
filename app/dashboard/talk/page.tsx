'use client';

import { useState } from 'react';
import { usePlantIntelligence } from '@/lib/intelligence/PlantIntelligenceContext';
import { useESP32Serial } from '@/lib/esp32/ESP32SerialContext';
import { useCamera } from '@/lib/camera/CameraContext';
import { PlantVoiceAssistant } from '@/components/voice/PlantVoiceAssistant';
import {
  Camera,
  CameraOff,
  Cpu,
  Activity,
  Scan,
  Leaf,
  Send,
  TrendingUp,
  RotateCcw,
  Mic,
  MessageSquare
} from 'lucide-react';
import styles from './page.module.css';

export default function TalkToPlantPage() {
  const { mode, isStale, latestReading } = useESP32Serial();
  const {
    status: cameraStatus,
    videoRef,
    availableDevices,
    startCamera,
    stopCamera,
    switchDevice
  } = useCamera();

  const {
    cropIdentity,
    latestDetection,
    multimodalAssessment,
    growthMetrics,
    aiMessages,
    isAILoading,
    askPlant,
    clearChat
  } = usePlantIntelligence();

  const [activeTab, setActiveTab] = useState<'voice' | 'text'>('voice');
  const [chatInput, setChatInput] = useState<string>('');

  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!chatInput.trim() || isAILoading) return;
    const query = chatInput;
    setChatInput('');
    askPlant(query);
  };

  const handlePromptChipClick = (chipPrompt: string) => {
    if (isAILoading) return;
    askPlant(chipPrompt);
  };

  // State colors
  const overallColor = {
    optimal: '#B7FF3C',
    warning: '#FFC857',
    critical: '#FF6B4A',
  }[multimodalAssessment.overallHealthState];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* 1. Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 className="text-3xl font-bold text-primary">🌱 Talk to Your Plant</h1>
            <span className="badge badge-success" style={{ fontSize: '10px' }}>Voice-to-Voice Farmer Assistant</span>
          </div>
          <p className="text-secondary" style={{ marginTop: '4px' }}>
            Speak directly with your monitored plant in Kannada (ಕನ್ನಡ) or English. All responses are 100% grounded in real-time camera vision and ESP32 telemetry.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="badge badge-info" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Leaf size={13} />
            <span>Active Plant: <strong>{cropIdentity.commonName}</strong></span>
          </span>
        </div>
      </div>

      {/* Mode Switcher Tabs (Voice-to-Voice vs Text Terminal) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button
          className={`btn btn-${activeTab === 'voice' ? 'primary' : 'ghost'}`}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}
          onClick={() => setActiveTab('voice')}
        >
          <Mic size={15} /> 🎙️ Voice Assistant (ಧ್ವನಿ ಸಹಾಯಕ)
        </button>
        <button
          className={`btn btn-${activeTab === 'text' ? 'primary' : 'ghost'}`}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}
          onClick={() => setActiveTab('text')}
        >
          <MessageSquare size={15} /> 💬 Text Terminal
        </button>
      </div>

      {/* 2. Main Talk Stage Layout */}
      <div className={styles.talkLayout}>
        
        {/* Left Column: LIVE PLANT VIEW + STATUS + ENVIRONMENT */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Live Camera Viewport */}
          <div className="glass-card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Camera size={18} className="text-primary" />
                <h3 className="text-sm font-bold uppercase tracking-wider">LIVE PLANT CAMERA</h3>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                {cameraStatus === 'connected' && (
                  <span className={`badge badge-${latestDetection?.isPlantDetected ? 'success' : 'warning'}`}>
                    {latestDetection?.isPlantDetected ? `● PLANT DETECTED (${latestDetection.confidence}%)` : '○ STANDBY'}
                  </span>
                )}
                <span className={`badge badge-${cameraStatus === 'connected' ? 'success' : 'info'}`}>
                  ● {cameraStatus.toUpperCase()}
                </span>
              </div>
            </div>

            <div className={styles.videoViewport}>
              <video 
                ref={videoRef} 
                className={styles.videoElement} 
                autoPlay 
                playsInline 
                muted 
                style={{ display: cameraStatus === 'connected' ? 'block' : 'none' }}
              />

              {cameraStatus === 'connected' && (
                <>
                  <div className={styles.videoOverlayGrid} />

                  <div className={styles.cameraHudBar}>
                    <div className={styles.hudPill} style={{ color: '#00E5FF' }}>
                      <Activity size={12} />
                      <span>FPS: 60 (Live)</span>
                    </div>

                    <div 
                      className={styles.hudPill} 
                      style={{ color: latestDetection?.isPlantDetected ? '#B7FF3C' : '#FFC857' }}
                    >
                      <Scan size={12} />
                      <span>
                        {latestDetection?.isPlantDetected 
                          ? `CANOPY: ${latestDetection.canopyCoveragePercent}%` 
                          : 'STANDBY'}
                      </span>
                    </div>
                  </div>

                  {latestDetection?.isPlantDetected && latestDetection.boundingBox && (
                    <div 
                      className={styles.boundingBoxOverlay}
                      style={{
                        left: `${latestDetection.boundingBox.x * 100}%`,
                        top: `${latestDetection.boundingBox.y * 100}%`,
                        width: `${latestDetection.boundingBox.width * 100}%`,
                        height: `${latestDetection.boundingBox.height * 100}%`,
                      }}
                    >
                      <span className={styles.boundingBoxTag}>
                        {cropIdentity.commonName} · {latestDetection.confidence}%
                      </span>
                    </div>
                  )}
                </>
              )}

              {cameraStatus !== 'connected' && (
                <div className={styles.videoPlaceholder}>
                  <CameraOff size={38} style={{ color: '#5A738E' }} />
                  <div>
                    <div style={{ fontWeight: 700, color: '#F4F7FB', fontSize: '14px' }}>Plant Camera Inactive</div>
                    <div style={{ fontSize: '11.5px', color: '#8FA3B8', marginTop: '2px' }}>
                      Activate webcam to allow your plant to see and evaluate its leaves during voice chat.
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '14px', flexWrap: 'wrap' }}>
              {cameraStatus === 'connected' ? (
                <button className="btn btn-ghost" onClick={stopCamera}>
                  <CameraOff size={15} /> Stop Camera
                </button>
              ) : (
                <button className="btn btn-primary" onClick={() => startCamera()}>
                  <Camera size={15} /> Start Camera Preview
                </button>
              )}

              {availableDevices.length > 1 && (
                <select 
                  className="select" 
                  style={{ fontSize: '11px', padding: '6px 20px 6px 10px' }}
                  onChange={(e) => switchDevice(e.target.value)}
                >
                  {availableDevices.map(d => (
                    <option key={d.deviceId} value={d.deviceId}>{d.label}</option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* Plant Condition & Health Bar */}
          <div className="glass-card" style={{ padding: '18px', borderLeft: `4px solid ${overallColor}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span className="text-xs text-muted uppercase tracking-wider">Overall Multimodal Health</span>
                <div style={{ fontSize: '18px', fontWeight: 800, color: '#F4F7FB', marginTop: '2px' }}>
                  {multimodalAssessment.overallHealthState.toUpperCase()} CONDITION
                </div>
                <div style={{ fontSize: '11.5px', color: '#8FA3B8' }}>
                  Visual: {multimodalAssessment.visualState.replace('_', ' ')} · Trend: {multimodalAssessment.trend}
                </div>
              </div>

              <div 
                className={styles.healthScoreCircle}
                style={{ borderColor: overallColor, color: overallColor }}
              >
                {multimodalAssessment.overallScore}
              </div>
            </div>
          </div>

          {/* Synchronized Environmental Telemetry Grid */}
          <div className="glass-card" style={{ padding: '18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Cpu size={16} className="text-accent" />
                <span className="text-xs font-bold text-secondary uppercase tracking-wider">Live Environment</span>
              </div>
              <span className="badge badge-info">{mode === 'real' && !isStale ? 'ESP32 HARDWARE' : 'SIMULATION'}</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
              <div style={{ background: 'rgba(7, 17, 31, 0.5)', padding: '10px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <span className="text-xs text-muted">pH Level</span>
                <div style={{ fontSize: '16px', fontWeight: 800, color: '#00E5FF', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
                  {latestReading?.ph ? latestReading.ph.toFixed(2) : '--'}
                </div>
              </div>

              <div style={{ background: 'rgba(7, 17, 31, 0.5)', padding: '10px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <span className="text-xs text-muted">TDS Nutrients</span>
                <div style={{ fontSize: '16px', fontWeight: 800, color: '#B7FF3C', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
                  {latestReading?.tds ? `${Math.round(latestReading.tds)}` : '--'} <span style={{ fontSize: '9px', fontWeight: 400 }}>PPM</span>
                </div>
              </div>

              <div style={{ background: 'rgba(7, 17, 31, 0.5)', padding: '10px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <span className="text-xs text-muted">Water Level</span>
                <div style={{ fontSize: '16px', fontWeight: 800, color: '#00E5FF', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
                  {latestReading?.waterLevel ? `${Math.round(latestReading.waterLevel)}%` : '--'}
                </div>
              </div>

              <div style={{ background: 'rgba(7, 17, 31, 0.5)', padding: '10px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <span className="text-xs text-muted">Distance</span>
                <div style={{ fontSize: '16px', fontWeight: 800, color: '#F4F7FB', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
                  {latestReading?.distance ? `${latestReading.distance.toFixed(1)}` : '--'} <span style={{ fontSize: '9px', fontWeight: 400 }}>cm</span>
                </div>
              </div>
            </div>
          </div>

          {/* Growth Summary Pill */}
          <div className="glass-card" style={{ padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <TrendingUp size={16} className="text-primary" />
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#F4F7FB' }}>
                Image-Derived Growth: {growthMetrics.cumulativeGrowthDelta >= 0 ? `+${growthMetrics.cumulativeGrowthDelta}%` : `${growthMetrics.cumulativeGrowthDelta}%`} Canopy
              </span>
            </div>
            <span className="text-xs text-muted">{growthMetrics.daysMonitored} Days Monitored</span>
          </div>

        </div>

        {/* Right Column: VOICE ASSISTANT or TEXT TERMINAL */}
        <div>
          {activeTab === 'voice' ? (
            <PlantVoiceAssistant />
          ) : (
            <div className={styles.chatCard}>
              
              {/* Header with Plant Avatar & Reset */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div className={styles.chatAvatar}>
                    <Leaf size={24} />
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <h3 className="text-lg font-bold text-primary">{cropIdentity.commonName}</h3>
                      <span className={`badge badge-${multimodalAssessment.overallHealthState === 'optimal' ? 'success' : multimodalAssessment.overallHealthState === 'warning' ? 'warning' : 'danger'}`}>
                        {multimodalAssessment.overallHealthState === 'optimal' ? '● VIBRANT' : multimodalAssessment.overallHealthState === 'warning' ? '● MILD STRESS' : '● ATTENTION NEEDED'}
                      </span>
                    </div>
                    <p className="text-xs text-secondary">
                      Grounded in live sensors, computer vision, and historical observations
                    </p>
                  </div>
                </div>

                <button
                  className="btn btn-ghost"
                  style={{ fontSize: '11px', padding: '6px 10px' }}
                  onClick={clearChat}
                  title="Reset conversation"
                >
                  <RotateCcw size={13} /> Reset
                </button>
              </div>

              {/* Quick Prompt Suggestion Chips */}
              <div>
                <span className="text-xs text-muted mb-xs" style={{ display: 'block' }}>
                  Sample Questions (Click to Ask):
                </span>
                <div className={styles.promptChipsRow}>
                  <button 
                    className={styles.promptChip}
                    onClick={() => handlePromptChipClick("How are you?")}
                  >
                    🌿 How are you?
                  </button>
                  <button 
                    className={styles.promptChip}
                    onClick={() => handlePromptChipClick("Do you need water?")}
                  >
                    💧 Do you need water?
                  </button>
                  <button 
                    className={styles.promptChip}
                    onClick={() => handlePromptChipClick("How is your health?")}
                  >
                    💚 How is your health?
                  </button>
                  <button 
                    className={styles.promptChip}
                    onClick={() => handlePromptChipClick("What changed today?")}
                  >
                    ⚡ What changed today?
                  </button>
                  <button 
                    className={styles.promptChip}
                    onClick={() => handlePromptChipClick("Have you grown?")}
                  >
                    🌱 Have you grown?
                  </button>
                  <button 
                    className={styles.promptChip}
                    onClick={() => handlePromptChipClick("Why do your leaves look different?")}
                  >
                    🔍 Why do your leaves look different?
                  </button>
                  <button 
                    className={styles.promptChip}
                    onClick={() => handlePromptChipClick("How are you compared with last week?")}
                  >
                    📈 How are you compared with last week?
                  </button>
                </div>
              </div>

              {/* Message Thread */}
              <div className={styles.chatMessagesThread}>
                {aiMessages.map((msg) => (
                  <div 
                    key={msg.id}
                    className={msg.sender === 'user' ? styles.chatBubbleUser : styles.chatBubblePlant}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: msg.sender === 'user' ? '#00E5FF' : '#B7FF3C' }}>
                        {msg.sender === 'user' ? 'You' : `${cropIdentity.commonName} (AI Plant)`}
                      </span>
                      <span style={{ fontSize: '10px', color: '#5A738E' }}>
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <div>{msg.text}</div>

                    {/* Epistemic Badges */}
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
                            {badge === 'measured_fact' && '✓ Measured Fact'}
                            {badge === 'visual_observation' && '👁 Visual Observation'}
                            {badge === 'mathematical_projection' && '📈 Time-Series Projection'}
                            {badge === 'grower_advisory' && '💡 Grower Advisory'}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}

                {isAILoading && (
                  <div className={styles.chatBubblePlant} style={{ fontStyle: 'italic', color: '#8FA3B8' }}>
                    Analyzing camera vision & real-time telemetry context...
                  </div>
                )}
              </div>

              {/* Input Form Bar */}
              <form onSubmit={handleSendMessage} className={styles.chatInputBar}>
                <input
                  type="text"
                  className={styles.chatInputField}
                  placeholder="Ask your plant a question..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  disabled={isAILoading}
                />
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={!chatInput.trim() || isAILoading}
                >
                  <Send size={15} /> Send
                </button>
              </form>

              <div style={{ fontSize: '11px', color: '#5A738E', textAlign: 'center', lineHeight: 1.4 }}>
                <em>System Representation Note:</em> The plant persona is a conversational representation of system telemetry. Responses are strictly grounded in measured data and visual diagnostics.
              </div>

            </div>
          )}
        </div>

      </div>

    </div>
  );
}
