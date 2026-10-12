/**
 * Prayer body format:
 * - Paragraphs are separated by a blank line; lines inside a paragraph by a newline.
 * - A line starting with "R/" is the people's response.
 * - A line containing "|" is a litany line: invocation | response.
 */

export type PrayerLine =
  | { kind: 'text'; text: string }
  | { kind: 'response'; text: string }
  | { kind: 'litany'; invocation: string; response: string };

export type Paragraph = PrayerLine[];

const RESPONSE_PREFIX = /^R\/\s*/;

export function parseLine(line: string): PrayerLine {
  const trimmed = line.trim();
  const response = RESPONSE_PREFIX.exec(trimmed);
  if (response) return { kind: 'response', text: trimmed.slice(response[0].length) };
  const bar = trimmed.indexOf('|');
  if (bar >= 0) {
    return {
      kind: 'litany',
      invocation: trimmed.slice(0, bar).trim(),
      response: trimmed.slice(bar + 1).trim(),
    };
  }
  return { kind: 'text', text: trimmed };
}

export function parsePrayer(body: string): Paragraph[] {
  return body
    .replace(/\r\n?/g, '\n')
    .trim()
    .split(/\n[ \t]*\n/)
    .map((paragraph) =>
      paragraph
        .split('\n')
        .filter((line) => line.trim().length > 0)
        .map(parseLine),
    )
    .filter((paragraph) => paragraph.length > 0);
}
