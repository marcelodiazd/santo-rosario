import { render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { buildSequence } from '../lib/sequence';
import { makeFixture } from '../test/fixture';
import { PrayerPanel } from './PrayerPanel';

const data = makeFixture();
const sequence = buildSequence(data.steps, false);
const gloriosos = data.mysterySets.find((s) => s.id === 'gloriosos')!;

function renderPanel(seq: number, todaySetId = 'gloriosos') {
  const props = {
    sets: data.mysterySets,
    activeSet: gloriosos,
    todaySetId,
    onSelectSet: vi.fn(),
    sequence,
    index: sequence.findIndex((s) => s.seq === seq),
    prayers: data.prayers,
    onGoTo: vi.fn(),
    onPrevious: vi.fn(),
    onNext: vi.fn(),
    playing: false,
    onTogglePlay: vi.fn(),
    wpm: 110,
    onWpmChange: vi.fn(),
    stepSeconds: 10,
    traditional: false,
    onTraditionalChange: vi.fn(),
  };
  return { ...render(<PrayerPanel {...props} />), props };
}

describe('PrayerPanel', () => {
  it('renders a subheading for each prayer in a multi-prayer step', () => {
    renderPanel(311);
    expect(screen.getByRole('heading', { level: 3, name: 'Gloria' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 3, name: 'María, Madre de gracia' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 3, name: 'Oh, Jesús mío' })).toBeInTheDocument();
  });

  it('does not add a subheading to a single-prayer step', () => {
    renderPanel(10);
    expect(screen.queryAllByRole('heading', { level: 3 })).toHaveLength(0);
  });

  it('renders responses in the response style, without the R/ prefix', () => {
    renderPanel(30);
    const response = screen.getByText('Y mi boca proclamará tu alabanza.');
    expect(response).toHaveClass('response');
    expect(screen.queryByText(/R\//)).toBeNull();
  });

  it('renders litany lines as invocation and response', () => {
    renderPanel(600);
    const invocation = screen.getByText('Santa María,');
    expect(invocation).toHaveClass('invocation');
    expect(invocation.nextElementSibling).toHaveTextContent('ruega por nosotros.');
    expect(invocation.nextElementSibling).toHaveClass('response');
  });

  it('puts the "hoy" tag on today\'s set only', () => {
    renderPanel(10, 'luminosos');
    const today = screen.getByRole('radio', { name: /Luminosos/ });
    expect(within(today).getByText('hoy')).toBeInTheDocument();
    expect(screen.getAllByText('hoy')).toHaveLength(1);
    expect(screen.getByRole('radio', { name: 'Gloriosos' })).toHaveAttribute('aria-checked', 'true');
  });

  it('shows the mystery line and note on decade and closing steps', () => {
    renderPanel(305);
    expect(screen.getByText('Tercer misterio glorioso: Misterio glorioso número 3')).toBeInTheDocument();
    renderPanel(630);
    expect(screen.getByText('Un Padrenuestro, un Avemaría y un Gloria por el Papa')).toBeInTheDocument();
  });

  it('disables Anterior on the first step and Siguiente on the last', () => {
    const first = renderPanel(10);
    expect(screen.getByRole('button', { name: 'Anterior' })).toBeDisabled();
    first.unmount();
    renderPanel(650);
    expect(screen.getByRole('button', { name: 'Siguiente' })).toBeDisabled();
  });
});
