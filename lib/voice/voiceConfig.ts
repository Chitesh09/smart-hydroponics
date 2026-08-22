// ============================================================
// HydroSmart — Centralized Multilingual Voice Configuration
// ============================================================

export type SupportedLanguageCode = 'kn-IN' | 'en-IN' | 'hi-IN' | 'te-IN' | 'ta-IN';

export interface LanguageOption {
  code: SupportedLanguageCode;
  name: string;
  englishName: string;
  nativeScript: string;
  flagEmoji: string;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  {
    code: 'kn-IN',
    name: 'ಕನ್ನಡ',
    englishName: 'Kannada',
    nativeScript: 'ಕನ್ನಡ',
    flagEmoji: '🟡🔴',
  },
  {
    code: 'en-IN',
    name: 'English',
    englishName: 'English (Indian)',
    nativeScript: 'English',
    flagEmoji: '🌐',
  },
  {
    code: 'hi-IN',
    name: 'हिन्दी',
    englishName: 'Hindi',
    nativeScript: 'हिन्दी',
    flagEmoji: '🇮🇳',
  },
  {
    code: 'te-IN',
    name: 'తెలుగు',
    englishName: 'Telugu',
    nativeScript: 'తెలుగు',
    flagEmoji: '🇮🇳',
  },
  {
    code: 'ta-IN',
    name: 'தமிழ்',
    englishName: 'Tamil',
    nativeScript: 'தமிழ்',
    flagEmoji: '🇮🇳',
  },
];

export const DEFAULT_LANGUAGE: SupportedLanguageCode = 'kn-IN';
export const VOICE_LANGUAGE_STORAGE_KEY = 'hydrosmart_voice_language';
export const VOICE_MODE_STORAGE_KEY = 'hydrosmart_voice_mode';

export type VoiceState = 'idle' | 'listening' | 'transcribing' | 'thinking' | 'speaking' | 'error';
export type AssistantMode = 'farmer' | 'technical';

export interface VoiceStateInfo {
  state: VoiceState;
  label: string;
  sublabel: string;
  icon: string;
  color: string;
}

export const VOICE_STATE_MAP: Record<VoiceState, Record<SupportedLanguageCode, { label: string; sublabel: string }>> = {
  idle: {
    'kn-IN': { label: 'ಮಾತನಾಡಲು ಒತ್ತಿ', sublabel: 'ನಿಮ್ಮ ಗಿಡಕ್ಕೆ ಏನಾದರೂ ಕೇಳಿ' },
    'en-IN': { label: 'Tap to Speak', sublabel: 'Ask your plant anything' },
    'hi-IN': { label: 'बोलने के लिए दबाएं', sublabel: 'अपने पौधे से कुछ भी पूछें' },
    'te-IN': { label: 'మాట్లాడటానికి నొక్కండి', sublabel: 'మీ మొక్కను ఏదైనా అడగండి' },
    'ta-IN': { label: 'பேச தட்டவும்', sublabel: 'உங்கள் செடியிடம் எதையும் கேளுங்கள்' },
  },
  listening: {
    'kn-IN': { label: 'ಕೇಳಿಸಿಕೊಳ್ಳುತ್ತಿದ್ದೇನೆ...', sublabel: 'ಧ್ವನಿ ರೆಕಾರ್ಡ್ ಆಗುತ್ತಿದೆ' },
    'en-IN': { label: 'Listening...', sublabel: 'Capturing your voice' },
    'hi-IN': { label: 'सुन रहा हूँ...', sublabel: 'आवाज़ रिकॉर्ड हो रही है' },
    'te-IN': { label: 'వింటున్నాను...', sublabel: 'వాయిస్ రికార్డ్ అవుతోంది' },
    'ta-IN': { label: 'கேட்கிறது...', sublabel: 'குரல் பதிவு செய்யப்படுகிறது' },
  },
  transcribing: {
    'kn-IN': { label: 'ಧ್ವನಿ ಪ್ರಕ್ರಿಯೆ...', sublabel: 'ಮಾತುಗಳನ್ನು ಪರಿವರ್ತಿಸಲಾಗುತ್ತಿದೆ' },
    'en-IN': { label: 'Transcribing...', sublabel: 'Converting speech to text' },
    'hi-IN': { label: 'ट्रांसक्राइब हो रहा है...', sublabel: 'आवाज़ को टेक्स्ट में बदला जा रहा है' },
    'te-IN': { label: 'ట్రాన్స్‌క్రైబింగ్...', sublabel: 'మాటలను టెక్స్ట్‌గా మారుస్తోంది' },
    'ta-IN': { label: 'எழுத்துருவாக்கம்...', sublabel: 'பேச்சை உரையாக மாற்றுகிறது' },
  },
  thinking: {
    'kn-IN': { label: 'ವಿಶ್ಲೇಷಿಸಲಾಗುತ್ತಿದೆ...', sublabel: 'ಸೆನ್ಸರ್ ಡೇಟಾ ಪರಿಶೀಲನೆ' },
    'en-IN': { label: 'Thinking...', sublabel: 'Evaluating plant sensors & vision' },
    'hi-IN': { label: 'विश्लेषण हो रहा है...', sublabel: 'सेंसर डेटा जांचा जा रहा है' },
    'te-IN': { label: 'ఆలోచిస్తోంది...', sublabel: 'సెన్సార్ డేటా పరిశీలన' },
    'ta-IN': { label: 'சிந்திக்கிறது...', sublabel: 'சென்சார் தரவு சரிபார்ப்பு' },
  },
  speaking: {
    'kn-IN': { label: 'ಉತ್ತರಿಸುತ್ತಿದ್ದೇನೆ...', sublabel: 'ನಿಲ್ಲಿಸಲು Stop ಒತ್ತಿ' },
    'en-IN': { label: 'Speaking...', sublabel: 'Tap Stop to interrupt' },
    'hi-IN': { label: 'बोल रहा हूँ...', sublabel: 'रोकने के लिए Stop दबाएं' },
    'te-IN': { label: 'మాట్లాడుతోంది...', sublabel: 'ఆపడానికి Stop నొక్కండి' },
    'ta-IN': { label: 'பேசுகிறது...', sublabel: 'நிறுத்த Stop தட்டவும்' },
  },
  error: {
    'kn-IN': { label: 'ಕ್ಷಮಿಸಿ, ಅರ್ಥವಾಗಲಿಲ್ಲ', sublabel: 'ದಯವಿಟ್ಟು ಮತ್ತೊಮ್ಮೆ ಪ್ರಯತ್ನಿಸಿ' },
    'en-IN': { label: 'Could not hear clearly', sublabel: 'Please try speaking again' },
    'hi-IN': { label: 'माफ़ कीजिए, समझ नहीं आया', sublabel: 'कृपया फिर से प्रयास करें' },
    'te-IN': { label: 'క్షమించండి, అర్థం కాలేదు', sublabel: 'దయచేసి మళ్లీ ప్రయత్నించండి' },
    'ta-IN': { label: 'மன்னிக்கவும், புரியவில்லை', sublabel: 'தயவுசெய்து மீண்டும் முயற்சிக்கவும்' },
  },
};
