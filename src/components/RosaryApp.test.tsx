import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MemoryStorage, SUNDAY, THURSDAY, makeFixture } from '../test/fixture';
import { RosaryApp } from './RosaryApp';

const data = makeFixture();

function renderApp(options: { today?: Date; storage?: Storage | null } = {}) {
  const storage = options.storage === undefined ? new MemoryStorage() : options.storage;
  const result = render(<RosaryApp data={data} today={options.today ?? SUNDAY} storage={storage} />);
  return { ...result, storage };
}

const stepTitle = () => screen.getByRole('heading', { level: 2 }).textContent;
const counter = () => screen.getByText(/^Paso \d+ de \d+$/).textContent;

afterEach(() => vi.useRealTimers());

describe('RosaryApp', () => {
  it('reads "Paso 1 de 69" on first load', () => {
    renderApp();
    expect(counter()).toBe('Paso 1 de 69');
    expect(stepTitle()).toBe('Señal de la Cruz');
  });

  it('opens on gloriosos on a Sunday and luminosos on a Thursday', () => {
    const sunday = renderApp();
    expect(screen.getByRole('radio', { name: /^Gloriosos/ })).toHaveAttribute('aria-checked', 'true');
    sunday.unmount();
    renderApp({ today: THURSDAY });
    expect(screen.getByRole('radio', { name: /^Luminosos/ })).toHaveAttribute('aria-checked', 'true');
  });

  it('shows the next step\'s prayer on "Siguiente"', () => {
    renderApp();
    fireEvent.click(screen.getByRole('button', { name: 'Siguiente' }));
    expect(stepTitle()).toBe('Acto de contrición');
    expect(screen.getByText('Señor mío Jesucristo, Dios y hombre verdadero.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Anterior' }));
    expect(stepTitle()).toBe('Señal de la Cruz');
  });

  it('advances with the Right arrow and goes back with the Left arrow', () => {
    renderApp();
    fireEvent.keyDown(document.body, { key: 'ArrowRight' });
    fireEvent.keyDown(document.body, { key: ' ' });
    expect(counter()).toBe('Paso 3 de 69');
    fireEvent.keyDown(document.body, { key: 'ArrowLeft' });
    expect(counter()).toBe('Paso 2 de 69');
  });

  it('ignores arrow keys while a form control has focus', () => {
    renderApp();
    fireEvent.keyDown(screen.getByRole('combobox'), { key: 'ArrowRight' });
    expect(counter()).toBe('Paso 1 de 69');
  });

  it('reaches the Jaculatoria in exactly 69 steps', () => {
    renderApp();
    const next = screen.getByRole('button', { name: 'Siguiente' });
    for (let i = 1; i < 69; i++) fireEvent.click(next);
    expect(stepTitle()).toBe('Jaculatoria final');
    expect(next).toBeDisabled();
  });

  it('updates the mystery line when a different set is chosen', () => {
    renderApp();
    fireEvent.click(screen.getByRole('button', { name: '3.ª Avemaría, tercer misterio' }));
    expect(screen.getByText('Tercer misterio glorioso: Misterio glorioso número 3')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('radio', { name: /^Dolorosos/ }));
    expect(screen.getByText('Tercer misterio doloroso: Misterio doloroso número 3')).toBeInTheDocument();
  });

  it('changes the set with arrow keys inside the mystery picker', () => {
    renderApp();
    fireEvent.keyDown(screen.getByRole('radio', { name: /^Gloriosos/ }), { key: 'ArrowRight' });
    expect(screen.getByRole('radio', { name: /^Luminosos/ })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByRole('radio', { name: /^Luminosos/ })).toHaveFocus();
  });

  it('jumps to a bead\'s step when it is tapped, and walks the medal\'s steps', () => {
    renderApp();
    fireEvent.click(screen.getByRole('button', { name: '1.ª Avemaría, primer misterio' }));
    expect(counter()).toBe('Paso 5 de 69');
    const medal = screen.getByRole('button', { name: 'Letanías lauretanas' });
    fireEvent.click(medal);
    expect(stepTitle()).toBe('Letanías lauretanas');
    fireEvent.click(medal);
    expect(stepTitle()).toBe('Cordero de Dios');
  });

  it('jumps with the "Ir a…" list', () => {
    renderApp();
    fireEvent.change(screen.getByRole('combobox'), { target: { value: '15' } });
    expect(counter()).toBe('Paso 16 de 69');
  });

  it('adds the traditional opening when the setting is turned on', () => {
    renderApp();
    fireEvent.click(screen.getByRole('checkbox', { name: 'Comenzar con Credo y tres Avemarías' }));
    expect(counter()).toBe('Paso 1 de 75');
    expect(screen.getByRole('button', { name: 'Padrenuestro' })).toBeInTheDocument();
  });

  it('auto-advances after the step\'s duration and pauses on a tap', () => {
    vi.useFakeTimers();
    renderApp();
    fireEvent.click(screen.getByRole('button', { name: 'Avance automático' }));
    // "Por la señal de la Santa Cruz." is 6 words: under the 4-second floor.
    act(() => vi.advanceTimersByTime(3900));
    expect(counter()).toBe('Paso 1 de 69');
    act(() => vi.advanceTimersByTime(200));
    expect(counter()).toBe('Paso 2 de 69');

    fireEvent.click(screen.getByRole('button', { name: 'Pausar' }));
    act(() => vi.advanceTimersByTime(60_000));
    expect(counter()).toBe('Paso 2 de 69');

    fireEvent.click(screen.getByRole('button', { name: 'Avance automático' }));
    fireEvent.click(screen.getByRole('button', { name: '1.ª Avemaría, primer misterio' }));
    expect(screen.getByRole('button', { name: 'Avance automático' })).toHaveAttribute('aria-pressed', 'false');
    act(() => vi.advanceTimersByTime(60_000));
    expect(counter()).toBe('Paso 5 de 69');
  });

  it('runs a whole decade on its own and stops on the last step', () => {
    vi.useFakeTimers();
    renderApp();
    fireEvent.click(screen.getByRole('button', { name: 'Primer misterio' }));
    fireEvent.click(screen.getByRole('button', { name: 'Avance automático' }));
    // Padrenuestro, ten Avemarías, Gloria y jaculatorias: 12 steps, each under 15 s here.
    for (let i = 0; i < 12; i++) act(() => vi.advanceTimersByTime(15_000));
    expect(stepTitle()).toBe('Segundo misterio');
    expect(screen.getByRole('button', { name: 'Pausar' })).toBeInTheDocument();

    fireEvent.change(screen.getByRole('combobox'), { target: { value: '67' } });
    expect(stepTitle()).toBe('Salve');
    fireEvent.click(screen.getByRole('button', { name: 'Avance automático' }));
    act(() => vi.advanceTimersByTime(10_000));
    expect(stepTitle()).toBe('Jaculatoria final');
    expect(screen.getByRole('button', { name: 'Avance automático' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('returns to the same step when reopened on the same day', () => {
    const first = renderApp();
    fireEvent.click(screen.getByRole('button', { name: '1.ª Avemaría, tercer misterio' }));
    fireEvent.click(screen.getByRole('radio', { name: /^Gozosos/ }));
    first.unmount();

    renderApp({ storage: first.storage });
    expect(stepTitle()).toBe('1.ª Avemaría');
    expect(counter()).toBe('Paso 29 de 69');
    expect(screen.getByRole('radio', { name: /^Gozosos/ })).toHaveAttribute('aria-checked', 'true');
  });

  it('works without storage', () => {
    renderApp({ storage: null });
    fireEvent.click(screen.getByRole('button', { name: 'Siguiente' }));
    expect(counter()).toBe('Paso 2 de 69');
  });
});
