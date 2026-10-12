import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { buildSequence, positionStatus } from '../lib/sequence';
import { makeFixture } from '../test/fixture';
import { RosaryView } from './RosaryView';

const sequence = buildSequence(makeFixture().steps, false);
const labels = { d1b3: '3.ª Avemaría, primer misterio', cross: 'Señal de la Cruz' };

function renderView(index = 0) {
  const onSelect = vi.fn();
  const { container } = render(
    <RosaryView statuses={positionStatus(sequence, index)} labels={labels} onSelect={onSelect} />,
  );
  const node = (id: string) => container.querySelector(`[data-position="${id}"]`)!;
  return { onSelect, node };
}

describe('RosaryView', () => {
  it('calls onSelect with the position id when a bead is clicked', () => {
    const { onSelect } = renderView();
    fireEvent.click(screen.getByRole('button', { name: '3.ª Avemaría, primer misterio' }));
    expect(onSelect).toHaveBeenCalledWith('d1b3');
  });

  it('selects a focused bead with Enter and Space', () => {
    const { onSelect, node } = renderView();
    fireEvent.keyDown(node('d2b1'), { key: 'Enter' });
    fireEvent.keyDown(node('L3'), { key: ' ' });
    fireEvent.keyDown(node('L3'), { key: 'a' });
    expect(onSelect.mock.calls).toEqual([['d2b1'], ['L3']]);
  });

  it('does not make unused beads focusable or clickable', () => {
    const { onSelect, node } = renderView();
    for (const id of ['pl1', 'ps1', 'ps2', 'ps3', 'pchain']) {
      expect(node(id)).not.toHaveAttribute('tabindex');
      expect(node(id)).not.toHaveAttribute('role');
      expect(node(id)).toHaveClass('is-unused');
    }
    fireEvent.click(node('pl1'));
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('marks the current bead with aria-current="step" and a halo', () => {
    const { node } = renderView(4); // seq 101, d1b1
    expect(node('d1b1')).toHaveAttribute('aria-current', 'step');
    expect(node('d1b1').querySelector('.halo')).not.toBeNull();
    expect(node('pl2')).not.toHaveAttribute('aria-current');
    expect(node('pl2')).toHaveClass('is-done');
    expect(node('d1b2')).toHaveClass('is-upcoming');
  });

  it('draws only the outline while loading', () => {
    const { container } = render(<RosaryView />);
    expect(screen.queryAllByRole('button')).toHaveLength(0);
    expect(container.querySelectorAll('.is-loading')).toHaveLength(67);
  });
});
