import { afterEach, describe, expect, it, vi } from 'vitest';
import { FakeSpeech, makeFixture } from '../test/fixture';
import {
  buildSegments,
  pauseSeconds,
  pickVoice,
  rateForWpm,
  runSegments,
  spanishVoices,
  splitForSpeech,
  type Segment,
} from './speech';

const data = makeFixture();
const gloriosos = data.mysterySets.find((s) => s.id === 'gloriosos')!;
const stepAt = (seq: number) => data.steps.find((s) => s.seq === seq)!;
const segmentsFor = (seq: number) => {
  const step = stepAt(seq);
  return buildSegments(step, step.prayerIds.map((id) => data.prayers[id]), gloriosos);
};
const summary = (segments: Segment[]) => segments.map((s) => `${s.kind}: ${s.text}`);

afterEach(() => vi.useRealTimers());

describe('buildSegments', () => {
  it('reads the first half of the Avemaría and pauses for the second', () => {
    expect(summary(segmentsFor(305))).toEqual([
      'speak: Dios te salve, María, llena eres de gracia.',
      'pause: Santa María, Madre de Dios.',
    ]);
  });

  it('announces the mystery at the start of a decade', () => {
    expect(summary(segmentsFor(300))).toEqual([
      'speak: Tercer misterio glorioso: Misterio glorioso número 3.',
      'speak: Padre nuestro, que estás en el cielo.',
      'pause: Danos hoy nuestro pan.',
    ]);
  });

  it('pauses on R/ lines', () => {
    expect(summary(segmentsFor(30))).toEqual([
      'speak: Señor, ábreme los labios.',
      'pause: Y mi boca proclamará tu alabanza.',
    ]);
  });

  it('reads litany invocations and pauses for each response', () => {
    expect(summary(segmentsFor(600))).toEqual([
      'speak: Señor, ten piedad.',
      'pause: Señor, ten piedad.',
      'speak: Santa María,',
      'pause: ruega por nosotros.',
    ]);
  });

  it('reads prayers said together in full, and reads the step note', () => {
    expect(summary(segmentsFor(10))).toEqual(['speak: Por la señal de la Santa Cruz.']);
    expect(summary(segmentsFor(42))).toEqual([
      'speak: Por la virtud de la fe.',
      'speak: Dios te salve, María, llena eres de gracia.',
      'pause: Santa María, Madre de Dios.',
    ]);
  });

  it('points each segment at its prayer, paragraph and line', () => {
    const segments = segmentsFor(311); // Gloria, María Madre de gracia, Oh Jesús mío
    expect(segments.map((s) => s.ref)).toEqual([
      { prayer: 0, paragraph: 0, line: 0 },
      { prayer: 0, paragraph: 0, line: 1 },
      { prayer: 1, paragraph: 0, line: 0 },
      { prayer: 2, paragraph: 0, line: 0 },
    ]);
    expect(segmentsFor(300)[0].ref).toBeNull();
  });
});

describe('splitForSpeech', () => {
  it('keeps short text whole and drops empty text', () => {
    expect(splitForSpeech('  Amén.  ')).toEqual(['Amén.']);
    expect(splitForSpeech('   ')).toEqual([]);
  });

  it('splits long text at sentence breaks within the limit', () => {
    const text = 'Uno dos tres. Cuatro cinco seis. Siete ocho nueve.';
    const chunks = splitForSpeech(text, 20);
    expect(chunks).toEqual(['Uno dos tres.', 'Cuatro cinco seis.', 'Siete ocho nueve.']);
  });

  it('splits an over-long sentence at commas', () => {
    const chunks = splitForSpeech('alfa beta, gamma delta, épsilon zeta, eta theta.', 22);
    expect(chunks.every((c) => c.length <= 22)).toBe(true);
    expect(chunks.join(' ')).toBe('alfa beta, gamma delta, épsilon zeta, eta theta.');
  });
});

describe('voices and timing', () => {
  const voices = [
    { uri: 'en', name: 'Samantha', lang: 'en-US', local: true },
    { uri: 'mx', name: 'Paulina', lang: 'es-MX', local: true },
    { uri: 'es-net', name: 'Google español', lang: 'es-ES', local: false },
    { uri: 'es', name: 'Mónica', lang: 'es-ES', local: true },
  ];

  it('lists only Spanish voices, Spain first', () => {
    expect(spanishVoices(voices).map((v) => v.name)).toEqual(['Google español', 'Mónica', 'Paulina']);
  });

  it('uses the chosen voice, or the best on-device Spanish voice', () => {
    expect(pickVoice(voices, 'mx')?.name).toBe('Paulina');
    expect(pickVoice(voices, null)?.name).toBe('Mónica');
    expect(pickVoice(voices, 'gone')?.name).toBe('Mónica');
    expect(pickVoice(voices, 'en')?.name).toBe('Mónica'); // not Spanish
    expect(pickVoice([voices[2]], null)?.name).toBe('Google español');
    expect(pickVoice([voices[0]], null)).toBeNull();
  });

  it('maps the speed slider to a calm speech rate', () => {
    expect(rateForWpm(110)).toBe(0.85);
    expect(rateForWpm(40)).toBe(0.6);
    expect(rateForWpm(400)).toBe(1.25);
  });

  it('leaves a pause long enough to say the response', () => {
    expect(pauseSeconds('ruega por nosotros.', 110)).toBeCloseTo(1.64, 1);
    expect(pauseSeconds('Amén.', 160)).toBe(1.2);
  });
});

describe('runSegments', () => {
  const options = { voiceURI: 'es', lang: 'es-ES', rate: 0.85, wpm: 120 };
  const segments: Segment[] = [
    { kind: 'speak', text: 'Uno dos.', ref: null },
    { kind: 'pause', text: 'tres cuatro', ref: { prayer: 0, paragraph: 0, line: 1 } },
    { kind: 'speak', text: 'Cinco.', ref: null },
  ];

  it('speaks, pauses for the response, then finishes', () => {
    vi.useFakeTimers();
    const engine = new FakeSpeech();
    const onSegment = vi.fn();
    const onDone = vi.fn();
    runSegments(engine, segments, options, { onSegment, onDone });

    expect(engine.spoken).toEqual([{ text: 'Uno dos.', voiceURI: 'es', lang: 'es-ES', rate: 0.85 }]);
    engine.finish();
    expect(onSegment).toHaveBeenLastCalledWith(1);
    vi.advanceTimersByTime(1100);
    expect(engine.spoken).toHaveLength(1); // still pausing (1.2 s minimum)
    vi.advanceTimersByTime(200);
    expect(engine.spoken.map((s) => s.text)).toEqual(['Uno dos.', 'Cinco.']);
    engine.finish();
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it('stops when cancelled', () => {
    vi.useFakeTimers();
    const engine = new FakeSpeech();
    const onDone = vi.fn();
    const stop = runSegments(engine, segments, options, { onSegment: vi.fn(), onDone });
    stop();
    engine.finish();
    vi.advanceTimersByTime(60_000);
    expect(engine.cancels).toBe(1);
    expect(engine.spoken).toHaveLength(1);
    expect(onDone).not.toHaveBeenCalled();
  });

  it('moves on if the engine never reports the end of an utterance', () => {
    vi.useFakeTimers();
    const engine = new FakeSpeech();
    runSegments(engine, segments, options, { onSegment: vi.fn(), onDone: vi.fn() });
    vi.advanceTimersByTime(5000);
    expect(engine.spoken).toHaveLength(1);
    vi.advanceTimersByTime(2000);
    expect(engine.spoken).toHaveLength(1); // now in the pause
    vi.advanceTimersByTime(1500);
    expect(engine.spoken).toHaveLength(2);
  });

  it('finishes at once when there is nothing to read', () => {
    const onDone = vi.fn();
    runSegments(new FakeSpeech(), [], options, { onSegment: vi.fn(), onDone });
    expect(onDone).toHaveBeenCalled();
  });
});
