import { useCallback, useEffect, useState } from 'react';
import { loadDb } from './data/loadDb';
import { readRosaryData } from './data/repository';
import type { RosaryData } from './data/types';
import { RosaryApp } from './components/RosaryApp';
import { RosaryView } from './components/RosaryView';

type LoadState = { status: 'loading' } | { status: 'error' } | { status: 'ready'; data: RosaryData };

export default function App() {
  const [state, setState] = useState<LoadState>({ status: 'loading' });

  const load = useCallback(async () => {
    setState({ status: 'loading' });
    try {
      const db = await loadDb();
      try {
        setState({ status: 'ready', data: readRosaryData(db) });
      } finally {
        db.close();
      }
    } catch (error) {
      console.error(error);
      setState({ status: 'error' });
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (state.status === 'ready') return <RosaryApp data={state.data} />;

  return (
    <div className="app">
      <aside className="rosary-column">
        <RosaryView />
      </aside>
      <main className="panel-column">
        <div className="panel">
          <h1 className="app-title">Santo Rosario</h1>
          {state.status === 'loading' ? (
            <p className="status-message" role="status">
              Cargando el Rosario…
            </p>
          ) : (
            <div className="status-message" role="alert">
              <p>No se pudo cargar el Rosario. Revisa tu conexión y recarga la página.</p>
              <button type="button" className="button button--primary" onClick={() => void load()}>
                Reintentar
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
