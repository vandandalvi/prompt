import { Navigate, Route, Routes } from 'react-router-dom';
import { EnginePage } from './pages/EnginePage';
import { GraphPage } from './pages/GraphPage';
import { ServerOverlay } from './components/ServerOverlay';
import { useServerStatus } from './hooks/useServerStatus';

function AppShell() {
  const { overlayVisible } = useServerStatus();

  return (
    <div className="relative min-h-screen">
      <div className={overlayVisible ? 'app-shell-muted min-h-screen' : 'min-h-screen'}>
        <Routes>
          <Route path="/" element={<EnginePage />} />
          <Route path="/graph" element={<GraphPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>

      <ServerOverlay />
    </div>
  );
}

export default function App() {
  return <AppShell />;
}
