import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { makeFixture } from './test/fixture';

const { loadDb, readRosaryData } = vi.hoisted(() => ({ loadDb: vi.fn(), readRosaryData: vi.fn() }));
vi.mock('./data/loadDb', () => ({ loadDb }));
vi.mock('./data/repository', () => ({ readRosaryData }));

import App from './App';

describe('App', () => {
  it('shows the loading message, then the rosary', async () => {
    const close = vi.fn();
    loadDb.mockResolvedValueOnce({ close });
    readRosaryData.mockReturnValueOnce(makeFixture());
    render(<App />);
    expect(screen.getByText('Cargando el Rosario…')).toBeInTheDocument();
    expect(await screen.findByText(/^Paso 1 de/)).toBeInTheDocument();
    expect(close).toHaveBeenCalled();
  });

  it('shows an error with a retry button when loading fails', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    loadDb.mockRejectedValueOnce(new Error('offline'));
    render(<App />);
    expect(
      await screen.findByText('No se pudo cargar el Rosario. Revisa tu conexión y recarga la página.'),
    ).toBeInTheDocument();

    loadDb.mockResolvedValueOnce({ close: vi.fn() });
    readRosaryData.mockReturnValueOnce(makeFixture());
    fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }));
    expect(await screen.findByText(/^Paso 1 de/)).toBeInTheDocument();
  });
});
