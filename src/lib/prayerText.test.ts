import { describe, expect, it } from 'vitest';
import { parseLine, parsePrayer } from './prayerText';

describe('parsePrayer', () => {
  it('splits paragraphs on blank lines and lines on newlines', () => {
    const paragraphs = parsePrayer('Uno.\nDos.\n\nTres.');
    expect(paragraphs).toHaveLength(2);
    expect(paragraphs[0]).toEqual([
      { kind: 'text', text: 'Uno.' },
      { kind: 'text', text: 'Dos.' },
    ]);
    expect(paragraphs[1]).toEqual([{ kind: 'text', text: 'Tres.' }]);
  });

  it('treats blank lines with spaces and Windows line endings as paragraph breaks', () => {
    expect(parsePrayer('Uno.\r\n  \r\nDos.')).toHaveLength(2);
  });

  it('turns R/ lines into responses without the prefix', () => {
    const [paragraph] = parsePrayer('Señor, ábreme los labios.\nR/ Y mi boca proclamará tu alabanza.');
    expect(paragraph[1]).toEqual({ kind: 'response', text: 'Y mi boca proclamará tu alabanza.' });
  });

  it('splits | lines into invocation and response', () => {
    expect(parseLine('Santa María, | ruega por nosotros.')).toEqual({
      kind: 'litany',
      invocation: 'Santa María,',
      response: 'ruega por nosotros.',
    });
  });

  it('passes plain text through unchanged', () => {
    const text = 'Oh Jesús mío, perdónanos, líbranos del fuego del infierno.';
    expect(parsePrayer(text)).toEqual([[{ kind: 'text', text }]]);
  });
});
