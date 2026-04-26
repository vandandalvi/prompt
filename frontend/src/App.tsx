import { Navigate, Route, Routes } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { EnginePage } from './pages/EnginePage';
import { GraphPage } from './pages/GraphPage';
import { API_BASE, checkServerHealth } from './lib/api';

export type ServerStatus = 'checking' | 'online' | 'waking' | 'offline';

const WAKE_ESTIMATE_SECONDS = 90;

export default function App() {
  const [serverStatus, setServerStatus] = useState<ServerStatus>('checking');
  const [secondsRemaining, setSecondsRemaining] = useState(WAKE_ESTIMATE_SECONDS);

  useEffect(() => {
    let active = true;

    async function probeServer() {
      const isHealthy = await checkServerHealth();
      if (!active) return;

      if (isHealthy) {
        setServerStatus('online');
        setSecondsRemaining(WAKE_ESTIMATE_SECONDS);
      } else {
        setServerStatus((current) => (current === 'waking' ? 'waking' : 'waking'));
        setSecondsRemaining((current) => (current > 0 && current < WAKE_ESTIMATE_SECONDS ? current : WAKE_ESTIMATE_SECONDS));
      }
    }

    probeServer();
    const interval = window.setInterval(
      probeServer,
      serverStatus === 'online' ? 30000 : 5000,
    );

    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [serverStatus]);

  useEffect(() => {
    if (serverStatus !== 'waking') return;

    const timer = window.setInterval(() => {
      setSecondsRemaining((current) => {
        if (current <= 1) {
          setServerStatus('offline');
          return 0;
        }
        return current - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [serverStatus]);

  useEffect(() => {
    if (serverStatus !== 'offline') return;

    const retry = window.setTimeout(async () => {
      const isHealthy = await checkServerHealth();
      if (isHealthy) {
        setServerStatus('online');
        setSecondsRemaining(WAKE_ESTIMATE_SECONDS);
      } else {
        setServerStatus('waking');
        setSecondsRemaining(WAKE_ESTIMATE_SECONDS);
      }
    }, 5000);

    return () => window.clearTimeout(retry);
  }, [serverStatus]);

  return (
    <Routes>
      <Route
        path="/"
        element={(
          <EnginePage
            serverStatus={serverStatus}
            secondsRemaining={secondsRemaining}
            wakeUrl={`${API_BASE}/health`}
          />
        )}
      />
      <Route
        path="/graph"
        element={(
          <GraphPage
            serverStatus={serverStatus}
            secondsRemaining={secondsRemaining}
            wakeUrl={`${API_BASE}/health`}
          />
        )}
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
