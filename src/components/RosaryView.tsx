import type { KeyboardEvent } from 'react';
import { CROSS, LOOP, MEDAL, POSITION_IDS, ROSARY_LAYOUT, VIEWBOX, type Node, type PositionId } from '../lib/geometry';
import type { PositionStatus } from '../lib/sequence';

interface Props {
  /** Status per position. Omit while loading to draw the outline only. */
  statuses?: Record<PositionId, PositionStatus>;
  /** Accessible name per position (its first step's title). */
  labels?: Record<PositionId, string>;
  onSelect?: (position: PositionId) => void;
}

const HIT_RADIUS: Partial<Record<Node['kind'], number>> = { cross: 20 };

function crossPath({ x, y }: Node): string {
  const halfW = CROSS.width / 2;
  const halfH = CROSS.height / 2;
  const bar = 3; // half the beam thickness
  const top = y - halfH;
  const beam = top + 10; // crossbar centre
  return [
    `M${x - bar},${top}`,
    `H${x + bar}`,
    `V${beam - bar}`,
    `H${x + halfW}`,
    `V${beam + bar}`,
    `H${x + bar}`,
    `V${y + halfH}`,
    `H${x - bar}`,
    `V${beam + bar}`,
    `H${x - halfW}`,
    `V${beam - bar}`,
    `H${x - bar}`,
    'Z',
  ].join(' ');
}

function Shape({ node, className }: { node: Node; className: string }) {
  const { x, y, r } = node;
  switch (node.kind) {
    case 'chain':
      return <polygon className={className} points={`${x},${y - r} ${x + r},${y} ${x},${y + r} ${x - r},${y}`} />;
    case 'medal':
      return (
        <>
          <ellipse className={className} cx={x} cy={y} rx={MEDAL.rx} ry={MEDAL.ry} />
          <text className="monogram" x={x} y={y} textAnchor="middle" dominantBaseline="central">
            M
          </text>
        </>
      );
    case 'cross':
      return <path className={className} d={crossPath(node)} />;
    default:
      return <circle className={className} cx={x} cy={y} r={r} />;
  }
}

function Halo({ node }: { node: Node }) {
  if (node.kind === 'medal') {
    return <ellipse className="halo" cx={node.x} cy={node.y} rx={MEDAL.rx + 4} ry={MEDAL.ry + 4} />;
  }
  const r = node.kind === 'cross' ? 20 : node.r + 4;
  return <circle className="halo" cx={node.x} cy={node.y} r={r} />;
}

export function RosaryView({ statuses, labels = {}, onSelect }: Props) {
  const handleKey = (event: KeyboardEvent, id: PositionId) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onSelect?.(id);
    }
  };

  return (
    <svg
      className="rosary"
      viewBox={`0 0 ${VIEWBOX.width} ${VIEWBOX.height}`}
      role="group"
      aria-label="Rosario"
      preserveAspectRatio="xMidYMid meet"
    >
      <g className="cord" aria-hidden="true">
        <ellipse cx={LOOP.cx} cy={LOOP.cy} rx={LOOP.rx} ry={LOOP.ry} />
        <line x1={LOOP.cx} y1={LOOP.cy + LOOP.ry} x2={LOOP.cx} y2={ROSARY_LAYOUT.cross.y - CROSS.height / 2} />
      </g>
      {POSITION_IDS.map((id) => {
        const node = ROSARY_LAYOUT[id];
        const status = statuses?.[id];
        const interactive = status !== undefined && status !== 'unused' && onSelect !== undefined;
        const className = `node node--${node.kind} ${status ? `is-${status}` : 'is-loading'}`;
        return (
          <g
            key={id}
            className={className}
            data-position={id}
            {...(interactive
              ? {
                  role: 'button',
                  tabIndex: 0,
                  'aria-label': labels[id] ?? id,
                  'aria-current': status === 'current' ? ('step' as const) : undefined,
                  onClick: () => onSelect?.(id),
                  onKeyDown: (event: KeyboardEvent) => handleKey(event, id),
                }
              : { 'aria-hidden': true })}
          >
            {status === 'current' && <Halo node={node} />}
            <Shape node={node} className="shape" />
            <circle className="hit" cx={node.x} cy={node.y} r={HIT_RADIUS[node.kind] ?? node.r + 4} />
          </g>
        );
      })}
    </svg>
  );
}
