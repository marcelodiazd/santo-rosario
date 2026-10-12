import type { SpeechEngine, VoiceInfo } from './speech';

interface SpeechWindow {
  speechSynthesis?: SpeechSynthesis;
  SpeechSynthesisUtterance?: typeof SpeechSynthesisUtterance;
}

/**
 * The browser's built-in speech engine (Web Speech API), or null where the
 * browser has none. Voices come from the device, so there is nothing to download.
 */
export function browserSpeech(win: SpeechWindow = window as SpeechWindow): SpeechEngine | null {
  const synth = win.speechSynthesis;
  const Utterance = win.SpeechSynthesisUtterance;
  if (!synth || !Utterance) return null;

  const toInfo = (v: SpeechSynthesisVoice): VoiceInfo => ({
    uri: v.voiceURI,
    name: v.name,
    lang: v.lang,
    local: v.localService,
  });

  return {
    getVoices: () => synth.getVoices().map(toInfo),

    onVoicesChanged(callback) {
      synth.addEventListener('voiceschanged', callback);
      return () => synth.removeEventListener('voiceschanged', callback);
    },

    speak(text, { voiceURI, lang, rate }, onEnd) {
      const utterance = new Utterance(text);
      const voice = voiceURI ? synth.getVoices().find((v) => v.voiceURI === voiceURI) : undefined;
      if (voice) utterance.voice = voice;
      utterance.lang = voice?.lang ?? lang;
      utterance.rate = rate;
      let ended = false;
      const end = () => {
        if (ended) return;
        ended = true;
        onEnd();
      };
      utterance.onend = end;
      utterance.onerror = end;
      synth.speak(utterance);
    },

    cancel: () => synth.cancel(),

    prime() {
      const utterance = new Utterance(' ');
      utterance.volume = 0;
      synth.speak(utterance);
    },
  };
}
