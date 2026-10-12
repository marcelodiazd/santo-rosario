/** One prayer, as stored in the `prayers` table. */
export interface Prayer {
  id: string;
  title: string;
  /** Body in the format described in README: blank line = paragraph, `R/ ` = response, `|` = litany. */
  body: string;
}

/** A set of five mysteries (gozosos, dolorosos, gloriosos, luminosos). */
export interface MysterySet {
  id: string;
  name: string;
  /** Days this set is prayed, using Date.getDay(): 0 = domingo ... 6 = sábado. */
  weekdays: number[];
  /** Exactly five mystery titles, in order. */
  mysteries: string[];
}

/** One step of the rosary, as stored in the `steps` table. */
export interface Step {
  seq: number;
  /** Position id in the rosary drawing (see src/lib/geometry.ts). */
  position: string;
  title: string;
  prayerIds: string[];
  /** 1..5 on decade steps, else null. */
  decade: number | null;
  /** 1..10 on decade Avemarías, else null. */
  aveNumber: number | null;
  /** True for the traditional opening (Credo and three Avemarías). */
  optional: boolean;
  note: string | null;
}

/** Everything the UI needs, read once from the database. */
export interface RosaryData {
  prayers: Record<string, Prayer>;
  mysterySets: MysterySet[];
  steps: Step[];
}
