import { Navigate, Route, Routes } from 'react-router-dom';
import { EnginePage } from './pages/EnginePage';
import { GraphPage } from './pages/GraphPage';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<EnginePage />} />
      <Route path="/graph" element={<GraphPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
