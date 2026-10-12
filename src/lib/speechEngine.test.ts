import { describe, expect, it, vi } from 'vitest';
import { browserSpeech } from './speechEngine';

class FakeUtterance {
  voice: unknown = null;
  lang = '';
  rate = 1;
  volume = 1;
  onend: (() => void) | null = null;
  onerror: (() => void) | null = null;
  constructor(public text: string) {}
}

function fakeWindow() {
  const voices = [
    { voiceURI: 'es', name: 'Mónica', lang: 'es-ES', localService: true },
    { voiceURI: 'mx', name: 'Paulina', lang: 'es-MX', localService: false },
  ];
  const synth = {
    spoken: [] as FakeUtterance[],
    getVoices: () => voices,
    speak(u: FakeUtterance) {
      this.spoken.push(u);
    },
    cancel: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  };
  const win = { speechSynthesis: synth, SpeechSynthesisUtterance: FakeUtterance } as never;
  return { win, synth, voices };
}

describe('browserSpeech', () => {
  it('is null where the browser has no speech engine', () => {
    expect(browserSpeech({})).toBeNull();
    expect(browserSpeech()).toBeNull(); // jsdom has none
  });

  it('lists the device voices', () => {
    const engine = browserSpeech(fakeWindow().win)!;
    expect(engine.getVoices()).toEqual([
      { uri: 'es', name: 'Mónica', lang: 'es-ES', local: true },
      { uri: 'mx', name: 'Paulina', lang: 'es-MX', local: false },
    ]);
  });

  it('speaks with the chosen voice and rate, and reports the end once', () => {
    const { win, synth, voices } = fakeWindow();
    const engine = browserSpeech(win)!;
    const onEnd = vi.fn();
    engine.speak('Dios te salve', { voiceURI: 'mx', lang: 'es-ES', rate: 0.85 }, onEnd);
    const [u] = synth.spoken;
    expect(u).toMatchObject({ text: 'Dios te salve', voice: voices[1], lang: 'es-MX', rate: 0.85 });
    u.onend!();
    u.onerror!();
    expect(onEnd).toHaveBeenCalledTimes(1);
  });

  it('falls back to the language when no voice is chosen', () => {
    const { win, synth } = fakeWindow();
    browserSpeech(win)!.speak('Amén', { voiceURI: null, lang: 'es-ES', rate: 1 }, vi.fn());
    expect(synth.spoken[0]).toMatchObject({ voice: null, lang: 'es-ES' });
  });

  it('primes with a silent utterance, cancels, and follows voice changes', () => {
    const { win, synth } = fakeWindow();
    const engine = browserSpeech(win)!;
    engine.prime();
    expect(synth.spoken[0]).toMatchObject({ text: ' ', volume: 0 });
    engine.cancel();
    expect(synth.cancel).toHaveBeenCalled();
    const callback = vi.fn();
    const unsubscribe = engine.onVoicesChanged(callback);
    expect(synth.addEventListener).toHaveBeenCalledWith('voiceschanged', callback);
    unsubscribe();
    expect(synth.removeEventListener).toHaveBeenCalledWith('voiceschanged', callback);
  });
});
