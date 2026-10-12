import { useId, type KeyboardEvent } from 'react';
import type { MysterySet, Prayer, Step } from '../data/types';
import { mysteryLine, weekdayNames } from '../lib/mysteries';
import { WPM_MAX, WPM_MIN } from '../lib/pacing';
import { parsePrayer } from '../lib/prayerText';

interface Props {
  sets: readonly MysterySet[];
  activeSet: MysterySet;
  todaySetId: string;
  onSelectSet: (setId: string) => void;

  sequence: readonly Step[];
  index: number;
  prayers: Record<string, Prayer>;
  onGoTo: (index: number) => void;
  onPrevious: () => void;
  onNext: () => void;

  playing: boolean;
  onTogglePlay: () => void;
  wpm: number;
  onWpmChange: (wpm: number) => void;
  /** Duration of the current step while playing, in seconds. */
  stepSeconds: number;

  traditional: boolean;
  onTraditionalChange: (on: boolean) => void;
}

/** "Misterios gozosos" gives "Gozosos". */
function shortSetName(set: MysterySet): string {
  const name = set.name.replace(/^Misterios\s+/i, '');
  return name.charAt(0).toUpperCase() + name.slice(1);
}

export function PrayerBody({ prayer }: { prayer: Prayer }) {
  return (
    <>
      {parsePrayer(prayer.body).map((paragraph, p) => (
        <p className="prayer-paragraph" key={p}>
          {paragraph.map((line, l) => {
            if (line.kind === 'response') {
              return (
                <span className="line response" key={l}>
                  {line.text}
                </span>
              );
            }
            if (line.kind === 'litany') {
              return (
                <span className="line litany" key={l}>
                  <span className="invocation">{line.invocation}</span>{' '}
                  <span className="response">{line.response}</span>
                </span>
              );
            }
            return (
              <span className="line" key={l}>
                {line.text}
              </span>
            );
          })}
        </p>
      ))}
    </>
  );
}

export function PrayerPanel(props: Props) {
  const { sets, activeSet, todaySetId, onSelectSet, sequence, index, prayers } = props;
  const step = sequence[index];
  const total = sequence.length;
  const line = mysteryLine(step, activeSet);
  const stepPrayers = step.prayerIds.map((id) => prayers[id]);
  const jumpId = useId();
  const speedId = useId();
  const openingId = useId();

  const handleRadioKeys = (event: KeyboardEvent<HTMLDivElement>) => {
    const keys: Record<string, number> = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };
    const delta = keys[event.key];
    if (delta === undefined) return;
    event.preventDefault();
    const current = sets.findIndex((s) => s.id === activeSet.id);
    const next = sets[(current + delta + sets.length) % sets.length];
    onSelectSet(next.id);
    event.currentTarget.querySelector<HTMLButtonElement>(`[data-set="${next.id}"]`)?.focus();
  };

  return (
    <div className="panel">
      <header className="panel-header">
        <h1 className="app-title">Santo Rosario</h1>
        <div className="mystery-picker" role="radiogroup" aria-label="Misterios" onKeyDown={handleRadioKeys}>
          {sets.map((set) => {
            const checked = set.id === activeSet.id;
            return (
              <button
                key={set.id}
                type="button"
                role="radio"
                data-set={set.id}
                aria-checked={checked}
                tabIndex={checked ? 0 : -1}
                className="mystery-option"
                onClick={() => onSelectSet(set.id)}
              >
                <span className="mystery-name">
                  {shortSetName(set)}
                  {set.id === todaySetId && <span className="today-tag">hoy</span>}
                </span>
                <span className="mystery-days">{weekdayNames(set)}</span>
              </button>
            );
          })}
        </div>
      </header>

      <div className="progress">
        <div className="progress-row">
          <span className="progress-count">
            Paso {index + 1} de {total}
          </span>
          <label className="jump" htmlFor={jumpId}>
            <span>Ir a…</span>
            <select id={jumpId} value={index} onChange={(e) => props.onGoTo(Number(e.target.value))}>
              {sequence.map((s, i) => (
                <option key={s.seq} value={i}>
                  {i + 1}. {s.title}
                  {s.aveNumber != null && s.decade != null ? ` (misterio ${s.decade})` : ''}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="progress-bar" aria-hidden="true">
          <div className="progress-fill" style={{ width: `${((index + 1) / total) * 100}%` }} />
        </div>
      </div>

      <section className="prayer" aria-live="polite" aria-atomic="true">
        <h2 className="step-title">{step.title}</h2>
        {line && <p className="mystery-line">{line}</p>}
        {step.note && <p className="step-note">{step.note}</p>}
        {stepPrayers.map((prayer, i) => (
          <div className="prayer-block" key={`${prayer.id}-${i}`}>
            {stepPrayers.length > 1 && <h3 className="prayer-subtitle">{prayer.title}</h3>}
            <PrayerBody prayer={prayer} />
          </div>
        ))}
      </section>

      <div className="controls">
        <div className="nav-buttons">
          <button type="button" className="button" onClick={props.onPrevious} disabled={index === 0}>
            Anterior
          </button>
          <button type="button" className="button button--primary" onClick={props.onNext} disabled={index === total - 1}>
            Siguiente
          </button>
        </div>

        <div className="pacing">
          <button
            type="button"
            className="button button--ghost"
            aria-pressed={props.playing}
            onClick={props.onTogglePlay}
            disabled={!props.playing && index === total - 1}
          >
            {props.playing ? 'Pausar' : 'Avance automático'}
          </button>
          <label className="speed" htmlFor={speedId}>
            <span>Velocidad: {props.wpm} palabras por minuto</span>
            <input
              id={speedId}
              type="range"
              min={WPM_MIN}
              max={WPM_MAX}
              step={5}
              value={props.wpm}
              onChange={(e) => props.onWpmChange(Number(e.target.value))}
            />
          </label>
        </div>
        {props.playing && (
          <div className="pace-bar" aria-hidden="true">
            <div
              key={`${step.seq}-${props.wpm}`}
              className="pace-fill"
              style={{ animationDuration: `${props.stepSeconds}s` }}
            />
          </div>
        )}
      </div>

      <div className="settings">
        <input
          id={openingId}
          type="checkbox"
          checked={props.traditional}
          onChange={(e) => props.onTraditionalChange(e.target.checked)}
        />
        <label htmlFor={openingId}>Comenzar con Credo y tres Avemarías</label>
      </div>

      <footer className="credit">
        Oraciones según{' '}
        <a href="https://www.elsantorosario.es/como-rezar-el-rosario/" target="_blank" rel="noopener noreferrer">
          elsantorosario.es
        </a>{' '}
        (Radio María España).
      </footer>
    </div>
  );
}
