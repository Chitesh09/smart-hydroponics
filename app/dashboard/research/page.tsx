'use client';

import { usePlantIntelligence } from '@/lib/intelligence/PlantIntelligenceContext';
import { ShieldAlert, BookOpen, BrainCircuit, Activity, LineChart, FileTerminal } from 'lucide-react';
import styles from './page.module.css';

export default function ResearchEvaluationPage() {
  const { userMode } = usePlantIntelligence();

  if (userMode !== 'technical') {
    return (
      <div className={styles.container} style={{ alignItems: 'center', justifyContent: 'center', height: '60vh', textAlign: 'center' }}>
        <ShieldAlert size={48} style={{ color: 'var(--color-red)', marginBottom: '16px' }} />
        <h2 style={{ fontSize: '24px', fontWeight: 700, margin: '0 0 8px 0' }}>Restricted Access</h2>
        <p style={{ color: 'var(--text-secondary)', maxWidth: '400px', lineHeight: 1.5 }}>
          The ML Evaluation & Research Validation dashboard is only available in Technical Mode. Please switch your user mode to view transparent model metrics and research claims.
        </p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.headerRow}>
        <div className={styles.titleBlock}>
          <span className="section-label">Research & Validation Layer</span>
          <h1 className="display-title">ML Evaluation & Benchmarks</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0, maxWidth: '800px', lineHeight: 1.5 }}>
            This dashboard explicitly categorizes the underlying algorithms used in HydroSmart. We rigorously separate actual Machine Learning (ML) from Deterministic Computer Vision (CV), Statistical Models, and Rule-Based heuristics.
          </p>
        </div>
      </div>

      <div className={styles.alertBox}>
        <ShieldAlert size={20} style={{ color: 'var(--color-red)', flexShrink: 0, marginTop: '2px' }} />
        <div>
          <p>
            <strong>Research Data Notice:</strong> In accordance with strict evaluation requirements, we do <em>not</em> invent precision, recall, or F1 scores. 
            Because a validated held-out test dataset (e.g., thousands of labeled unseen images) is not bundled in this repository, formal ML evaluation metrics are marked as <strong>Not Available</strong>.
          </p>
        </div>
      </div>

      <h2 className={styles.sectionTitle}><BrainCircuit size={20} /> Botanical Species Identification</h2>
      <div className={styles.modelCard}>
        <div className={styles.modelHeader}>
          <div className={styles.modelTitle}>In-Browser TFJS CNN Model</div>
          <div className={`${styles.modelTypeBadge} ${styles.typeML}`}>REAL ML MODEL</div>
        </div>
        
        <div className={styles.modelMetadata}>
          <div className={styles.metaItem}>
            <span className={styles.metaLabel}>Model Architecture</span>
            <span className={styles.metaValue}>Depthwise Separable CNN (TensorFlow.js)</span>
          </div>
          <div className={styles.metaItem}>
            <span className={styles.metaLabel}>Execution</span>
            <span className={styles.metaValue}>Client-side Browser (WebGl/WASM)</span>
          </div>
          <div className={styles.metaItem}>
            <span className={styles.metaLabel}>Input Dimensions</span>
            <span className={styles.metaValue}>160x160x3 (RGB)</span>
          </div>
          <div className={styles.metaItem}>
            <span className={styles.metaLabel}>Output</span>
            <span className={styles.metaValue}>6 Classes + Unknown Rejection</span>
          </div>
        </div>

        <div className={styles.metricGrid}>
          <div className={styles.metricBox}>
            <span className={styles.metricBoxValue}>N/A</span>
            <span className={styles.metricBoxLabel}>Test Set Accuracy</span>
          </div>
          <div className={styles.metricBox}>
            <span className={styles.metricBoxValue}>N/A</span>
            <span className={styles.metricBoxLabel}>Precision / Recall</span>
          </div>
          <div className={styles.metricBox}>
            <span className={styles.metricBoxValue}>N/A</span>
            <span className={styles.metricBoxLabel}>F1-Score</span>
          </div>
          <div className={styles.metricBox}>
            <span className={styles.metricBoxValue}>~45ms</span>
            <span className={styles.metricBoxLabel}>Avg Inference Latency</span>
          </div>
        </div>

        <div>
          <span className="section-label">Limitations & Documentation</span>
          <ul className={styles.limitationsList}>
            <li>Evaluation unavailable because a valid held-out test set is not available in the repository.</li>
            <li>Dataset Source: Synthetic/Proprietary (Metrics not bundled).</li>
            <li>Small dataset limits robust Out-Of-Distribution (OOD) rejection for visually similar non-supported species.</li>
          </ul>
        </div>
      </div>

      <h2 className={styles.sectionTitle}><Activity size={20} /> Plant Presence Detection</h2>
      <div className={styles.modelCard}>
        <div className={styles.modelHeader}>
          <div className={styles.modelTitle}>Heuristic Foreground Extractor</div>
          <div className={`${styles.modelTypeBadge} ${styles.typeCV}`}>DETERMINISTIC CV</div>
        </div>
        
        <div className={styles.modelMetadata}>
          <div className={styles.metaItem}>
            <span className={styles.metaLabel}>Algorithm</span>
            <span className={styles.metaValue}>HSV Segmentation + ExG Index</span>
          </div>
          <div className={styles.metaItem}>
            <span className={styles.metaLabel}>Features Extracted</span>
            <span className={styles.metaValue}>Connected Components, Solidity, Aspect Ratio</span>
          </div>
          <div className={styles.metaItem}>
            <span className={styles.metaLabel}>Input</span>
            <span className={styles.metaValue}>Raw Canvas Image Data</span>
          </div>
          <div className={styles.metaItem}>
            <span className={styles.metaLabel}>Output</span>
            <span className={styles.metaValue}>Bounding Box & Confidence Score</span>
          </div>
        </div>

        <div>
          <span className="section-label">Limitations & Documentation</span>
          <ul className={styles.limitationsList}>
            <li>This is a deterministic computer-vision pipeline, not deep learning.</li>
            <li>Subject to false positives from artificial green objects or clothing (neon green).</li>
            <li>Requires good lighting; performance degrades rapidly in low-light or blurry conditions.</li>
            <li>No statistical evaluation available as it requires manual pixel-level ground-truth masks.</li>
          </ul>
        </div>
      </div>

      <h2 className={styles.sectionTitle}><Activity size={20} /> Visual Health Analysis</h2>
      <div className={styles.modelCard}>
        <div className={styles.modelHeader}>
          <div className={styles.modelTitle}>Temporal Visual Baseline Engine</div>
          <div className={`${styles.modelTypeBadge} ${styles.typeRule}`}>RULE-BASED CV</div>
        </div>
        
        <div className={styles.modelMetadata}>
          <div className={styles.metaItem}>
            <span className={styles.metaLabel}>Algorithm</span>
            <span className={styles.metaValue}>Rolling Baseline Deltas + Thresholds</span>
          </div>
          <div className={styles.metaItem}>
            <span className={styles.metaLabel}>Features Tracked</span>
            <span className={styles.metaValue}>Chlorosis %, Necrosis %, Canopy Drop</span>
          </div>
          <div className={styles.metaItem}>
            <span className={styles.metaLabel}>Temporal Smoothing</span>
            <span className={styles.metaValue}>Exponential Weighted Moving Average (alpha=0.25)</span>
          </div>
        </div>

        <div>
          <span className="section-label">Limitations & Documentation</span>
          <ul className={styles.limitationsList}>
            <li>Performs purely optical feature tracking, explicitly NOT biological disease diagnosis.</li>
            <li>Cannot identify root rot, microscopic pests, or viral infections invisible to RGB cameras.</li>
            <li>Relies on static thresholds which may not generalize perfectly across all species variants.</li>
          </ul>
        </div>
      </div>

      <h2 className={styles.sectionTitle}><LineChart size={20} /> Predictive Analytics & Anomalies</h2>
      <div className={styles.modelCard}>
        <div className={styles.modelHeader}>
          <div className={styles.modelTitle}>Time-Series Telemetry Forecaster</div>
          <div className={`${styles.modelTypeBadge} ${styles.typeStats}`}>STATISTICAL MODEL</div>
        </div>
        
        <div className={styles.modelMetadata}>
          <div className={styles.metaItem}>
            <span className={styles.metaLabel}>Forecasting Method</span>
            <span className={styles.metaValue}>Linear Time-Series Regression</span>
          </div>
          <div className={styles.metaItem}>
            <span className={styles.metaLabel}>Anomaly Detection</span>
            <span className={styles.metaValue}>Z-Score (≥ 2.0σ warning, ≥ 3.0σ critical)</span>
          </div>
          <div className={styles.metaItem}>
            <span className={styles.metaLabel}>Input Variables</span>
            <span className={styles.metaValue}>pH, TDS, Water Level timestamps</span>
          </div>
        </div>

        <div>
          <span className="section-label">Limitations & Documentation</span>
          <ul className={styles.limitationsList}>
            <li>Assumes linear drift; real biological nutrient uptake is often non-linear.</li>
            <li>Requires at least 3 historical data points to compute standard deviation.</li>
            <li>Does not account for sudden external interventions (e.g., manual water top-off) without resetting the baseline.</li>
          </ul>
        </div>
      </div>

      <h2 className={styles.sectionTitle}><FileTerminal size={20} /> Grounded AI Companion</h2>
      <div className={styles.modelCard}>
        <div className={styles.modelHeader}>
          <div className={styles.modelTitle}>Context-Aware Plant Engine</div>
          <div className={`${styles.modelTypeBadge} ${styles.typeRule}`}>RULE-BASED NLP</div>
        </div>
        
        <div className={styles.modelMetadata}>
          <div className={styles.metaItem}>
            <span className={styles.metaLabel}>Algorithm</span>
            <span className={styles.metaValue}>Regex / Keyword Trigger Mapping</span>
          </div>
          <div className={styles.metaItem}>
            <span className={styles.metaLabel}>Context Grounding</span>
            <span className={styles.metaValue}>Strict injection of real telemetry variables</span>
          </div>
        </div>

        <div>
          <span className="section-label">Limitations & Documentation</span>
          <ul className={styles.limitationsList}>
            <li>This is a deterministic logic tree parsing textual input, NOT a Large Language Model (LLM).</li>
            <li>Responses are pre-canned templates populated with variables.</li>
            <li>Cannot handle conversational context bridging or unprogrammed queries.</li>
          </ul>
        </div>
      </div>

    </div>
  );
}
