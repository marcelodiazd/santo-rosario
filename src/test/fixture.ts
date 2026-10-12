import type { MysterySet, Prayer, RosaryData, Step } from '../data/types';

/** Dates with known weekdays (October 2026). Months are 0-based in Date. */
export const SUNDAY = new Date(2026, 9, 11, 12);
export const MONDAY = new Date(2026, 9, 12, 12);
export const THURSDAY = new Date(2026, 9, 15, 12);

const prayer = (id: string, title: string, body: string): [string, Prayer] => [id, { id, title, body }];

/** A small RosaryData shaped like the real seed: same steps and positions, short prayer texts. */
export function makeFixture(): RosaryData {
  const prayers = Object.fromEntries([
    prayer('senal', 'Señal de la Cruz', 'Por la señal de la Santa Cruz.'),
    prayer('contricion', 'Acto de contrición', 'Señor mío Jesucristo, Dios y hombre verdadero.'),
    prayer('invocaciones', 'Invocaciones iniciales', 'Señor, ábreme los labios.\nR/ Y mi boca proclamará tu alabanza.'),
    prayer('credo', 'Credo', 'Creo en Dios, Padre todopoderoso.'),
    prayer('padrenuestro', 'Padrenuestro', 'Padre nuestro, que estás en el cielo.'),
    prayer('avemaria', 'Avemaría', 'Dios te salve, María, llena eres de gracia.'),
    prayer('gloria', 'Gloria', 'Gloria al Padre, y al Hijo, y al Espíritu Santo.'),
    prayer('maria_madre', 'María, Madre de gracia', 'María, Madre de gracia, Madre de misericordia.'),
    prayer('oh_jesus', 'Oh, Jesús mío', 'Oh Jesús mío, perdónanos.'),
    prayer('letanias', 'Letanías de la Santísima Virgen', 'Señor, ten piedad. | Señor, ten piedad.\n\nSanta María, | ruega por nosotros.'),
    prayer('cordero', 'Cordero de Dios', 'Cordero de Dios. | Perdónanos, Señor.'),
    prayer('oracion', 'Oración', 'Te pedimos, Señor.'),
    prayer('salve', 'Salve', 'Dios te salve, Reina y Madre.'),
    prayer('jaculatoria', 'Jaculatoria final', 'Ave María Purísima.\nR/ Sin pecado concebida.'),
  ]);

  const set = (id: string, name: string, weekdays: number[], adjective: string): MysterySet => ({
    id,
    name,
    weekdays,
    mysteries: [1, 2, 3, 4, 5].map((n) => `Misterio ${adjective} número ${n}`),
  });
  const mysterySets = [
    set('gozosos', 'Misterios gozosos', [1, 6], 'gozoso'),
    set('dolorosos', 'Misterios dolorosos', [2, 5], 'doloroso'),
    set('gloriosos', 'Misterios gloriosos', [0, 3], 'glorioso'),
    set('luminosos', 'Misterios luminosos', [4], 'luminoso'),
  ];

  const step = (seq: number, position: string, title: string, prayerIds: string, extra: Partial<Step> = {}): Step => ({
    seq,
    position,
    title,
    prayerIds: prayerIds.split(','),
    decade: null,
    aveNumber: null,
    optional: false,
    note: null,
    ...extra,
  });

  const ordinals = ['Primer', 'Segundo', 'Tercer', 'Cuarto', 'Quinto'];
  const steps: Step[] = [
    step(10, 'cross', 'Señal de la Cruz', 'senal'),
    step(20, 'cross', 'Acto de contrición', 'contricion'),
    step(30, 'cross', 'Invocaciones iniciales', 'invocaciones'),
    step(40, 'cross', 'Credo', 'credo', { optional: true }),
    step(41, 'pl1', 'Padrenuestro', 'padrenuestro', { optional: true }),
    step(42, 'ps1', 'Avemaría', 'avemaria', { optional: true, note: 'Por la virtud de la fe' }),
    step(43, 'ps2', 'Avemaría', 'avemaria', { optional: true, note: 'Por la virtud de la esperanza' }),
    step(44, 'ps3', 'Avemaría', 'avemaria', { optional: true, note: 'Por la virtud de la caridad' }),
    step(45, 'pchain', 'Gloria', 'gloria', { optional: true }),
  ];
  for (let n = 1; n <= 5; n++) {
    steps.push(step(n * 100, n === 1 ? 'pl2' : `L${n}`, `${ordinals[n - 1]} misterio`, 'padrenuestro', { decade: n }));
    for (let i = 1; i <= 10; i++) {
      steps.push(step(n * 100 + i, `d${n}b${i}`, `${i}.ª Avemaría`, 'avemaria', { decade: n, aveNumber: i }));
    }
    steps.push(step(n * 100 + 11, `d${n}c`, 'Gloria y jaculatorias', 'gloria,maria_madre,oh_jesus', { decade: n }));
  }
  steps.push(
    step(600, 'medal', 'Letanías lauretanas', 'letanias'),
    step(610, 'medal', 'Cordero de Dios', 'cordero'),
    step(620, 'medal', 'Oración', 'oracion'),
    step(630, 'medal', 'Por las intenciones del Santo Padre', 'padrenuestro,avemaria,gloria', {
      note: 'Un Padrenuestro, un Avemaría y un Gloria por el Papa',
    }),
    step(640, 'medal', 'Salve', 'salve'),
    step(650, 'medal', 'Jaculatoria final', 'jaculatoria'),
  );

  return { prayers, mysterySets, steps };
}

/** An in-memory Storage for tests. */
export class MemoryStorage implements Storage {
  private items = new Map<string, string>();
  get length() {
    return this.items.size;
  }
  clear() {
    this.items.clear();
  }
  getItem(key: string) {
    return this.items.get(key) ?? null;
  }
  key(index: number) {
    return [...this.items.keys()][index] ?? null;
  }
  removeItem(key: string) {
    this.items.delete(key);
  }
  setItem(key: string, value: string) {
    this.items.set(key, String(value));
  }
}
