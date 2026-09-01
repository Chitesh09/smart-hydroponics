// ============================================================
// HydroSmart — Centralized Text Plant Assistant Configuration
// Strictly English (en) and Kannada (kn) with Farmer & Technical Modes
// ============================================================

export type SupportedLanguageCode = 'en' | 'kn';
export type AssistantMode = 'farmer' | 'technical';

export interface LanguageOption {
  code: SupportedLanguageCode;
  name: string;
  englishName: string;
  nativeScript: string;
  flagEmoji: string;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  {
    code: 'en',
    name: 'English',
    englishName: 'English',
    nativeScript: 'English',
    flagEmoji: '🌐',
  },
  {
    code: 'kn',
    name: 'ಕನ್ನಡ',
    englishName: 'Kannada',
    nativeScript: 'ಕನ್ನಡ',
    flagEmoji: '🟡🔴',
  },
];

export const DEFAULT_LANGUAGE: SupportedLanguageCode = 'en';
export const ASSISTANT_LANGUAGE_STORAGE_KEY = 'hydrosmart_assistant_language';
export const ASSISTANT_MODE_STORAGE_KEY = 'hydrosmart_assistant_mode';

export interface SuggestedPrompt {
  id: string;
  labelEn: string;
  labelKn: string;
  promptEn: string;
  promptKn: string;
  icon: string;
}

export const SUGGESTED_PROMPTS: SuggestedPrompt[] = [
  {
    id: 'how_are_you',
    labelEn: '🌿 How are you feeling?',
    labelKn: '🌿 ನೀವು ಹೇಗಿದ್ದೀರಿ?',
    promptEn: 'How are you feeling today?',
    promptKn: 'ನನ್ನ ಗಿಡ ಹೇಗಿದೆ? ಆರೋಗ್ಯ ಹೇಗಿದೆ?',
    icon: '🌿',
  },
  {
    id: 'water_need',
    labelEn: '💧 Do you need water?',
    labelKn: '💧 ನೀರು ಬೇಕಾ?',
    promptEn: 'Do you need water?',
    promptKn: 'ತೊಟ್ಟಿಯಲ್ಲಿ ನೀರು ಸಾಕಾಗಿದೆಯಾ? ನೀರು ಬೇಕಾ?',
    icon: '💧',
  },
  {
    id: 'health_status',
    labelEn: '💚 How is your health?',
    labelKn: '💚 ಆರೋಗ್ಯ ಸ್ಥಿತಿ ಹೇಗಿದೆ?',
    promptEn: 'How is your overall health score?',
    promptKn: 'ಗಿಡದ ಒಟ್ಟಾರೆ ಆರೋಗ್ಯ ಹೇಗಿದೆ?',
    icon: '💚',
  },
  {
    id: 'leaves_check',
    labelEn: '🔍 Check leaf condition',
    labelKn: '🔍 ಎಲೆಗಳ ಸ್ಥಿತಿ ಪರಿಶೀಲಿಸಿ',
    promptEn: 'Are there any visual anomalies on your leaves?',
    promptKn: 'ಎಲೆಗಳಲ್ಲಿ ಹಳದಿ ಅಥವಾ ಕಂದು ಕಲೆಗಳು ಕಾಣಿಸುತ್ತಿವೆಯೇ?',
    icon: '🔍',
  },
  {
    id: 'nutrient_level',
    labelEn: '⚡ Check nutrient levels',
    labelKn: '⚡ ರಸಗೊಬ್ಬರ / TDS ಮಟ್ಟ',
    promptEn: 'Are the pH and TDS nutrient levels in target range?',
    promptKn: 'pH ಮತ್ತು ರಸಗೊಬ್ಬರದ ಪ್ರಮಾಣ ಸರಿಯಾಗಿದೆಯಾ?',
    icon: '⚡',
  },
  {
    id: 'daily_advisory',
    labelEn: '📋 What should I do today?',
    labelKn: '📋 ಇವತ್ತು ನಾನು ಏನು ಮಾಡಬೇಕು?',
    promptEn: 'What recommendations do you have for me today?',
    promptKn: 'ಇವತ್ತು ಗಿಡದ ನಿರ್ವಹಣೆಗೆ ಏನು ಮಾಡಬೇಕು?',
    icon: '📋',
  },
];
