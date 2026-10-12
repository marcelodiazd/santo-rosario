import type { MysterySet, Step } from '../data/types';

/** The mystery set prayed on a weekday (Date.getDay(): 0 = domingo). */
export function setForWeekday(sets: readonly MysterySet[], day: number): MysterySet {
  const set = sets.find((s) => s.weekdays.includes(day));
  if (!set) throw new Error(`No mystery set for weekday ${day}.`);
  return set;
}

const DAY_NAMES = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

/**
 * The days a set is prayed, Monday first as on a Spanish calendar:
 * "lunes y sábado", "miércoles y domingo", "jueves".
 */
export function weekdayNames(set: MysterySet): string {
  const names = [...set.weekdays]
    .sort((a, b) => ((a + 6) % 7) - ((b + 6) % 7))
    .map((day) => DAY_NAMES[day]);
  if (names.length <= 1) return names.join('');
  return `${names.slice(0, -1).join(', ')} y ${names[names.length - 1]}`;
}

const ORDINALS = ['Primer', 'Segundo', 'Tercer', 'Cuarto', 'Quinto'];

/** "Primer", "Segundo", ... for decades 1-5. */
export function decadeOrdinal(decade: number): string {
  return ORDINALS[decade - 1] ?? `${decade}.º`;
}

/** Singular adjective from the set name: "Misterios gloriosos" gives "glorioso". */
export function mysteryAdjective(set: MysterySet): string {
  const last = set.name.trim().split(/\s+/).pop() ?? '';
  return last.toLowerCase().replace(/s$/, '');
}

/**
 * The mystery line shown on decade steps, for example
 * "Tercer misterio glorioso: La Venida del Espíritu Santo sobre los Apóstoles".
 */
export function mysteryLine(step: Step, set: MysterySet): string | null {
  if (step.decade == null) return null;
  const title = set.mysteries[step.decade - 1];
  return `${decadeOrdinal(step.decade)} misterio ${mysteryAdjective(set)}: ${title}`;
}
