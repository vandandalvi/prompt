import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { API_BASE, checkServerHealth } from '../lib/api';

export type ServerPhase = 'checking' | 'waking' | 'online';

interface ServerStatusContextValue {
  status: ServerPhase;
  isReady: boolean;
  overlayVisible: boolean;
  message: string;
  detail: string;
  secondsRemaining: number;
  estimatedSeconds: number;
  progressPercent: number;
  retryIntervalMs: number;
  wakeUrl: string;
  slowNetwork: boolean;
  lastCheckDurationMs: number | null;
  retryNow: () => Promise<void>;
}

const ServerStatusContext = createContext<ServerStatusContextValue | null>(null);

const WAKE_TIME_KEY = 'prompt_engine_wake_average_ms';
const DEFAULT_ESTIMATE_SECONDS = 90;
const MIN_ESTIMATE_SECONDS = 60;
const MAX_ESTIMATE_SECONDS = 120;
const HEALTH_TIMEOUT_MS = 8000;
const ONLINE_POLL_MS = 30000;
const WAKE_POLL_MS = 7000;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function readEstimatedSeconds(): number {
  try {
    const raw = window.localStorage.getItem(WAKE_TIME_KEY);
    if (!raw) return DEFAULT_ESTIMATE_SECONDS;
    const averageMs = Number(raw);
    if (!Number.isFinite(averageMs) || averageMs <= 0) return DEFAULT_ESTIMATE_SECONDS;
    return clamp(Math.round(averageMs / 1000), MIN_ESTIMATE_SECONDS, MAX_ESTIMATE_SECONDS);
  } catch {
    return DEFAULT_ESTIMATE_SECONDS;
  }
}

function writeEstimatedSeconds(actualMs: number) {
  try {
    const currentRaw = window.localStorage.getItem(WAKE_TIME_KEY);
    const currentMs = currentRaw ? Number(currentRaw) : DEFAULT_ESTIMATE_SECONDS * 1000;
    const baseMs = Number.isFinite(currentMs) && currentMs > 0
      ? currentMs
      : DEFAULT_ESTIMATE_SECONDS * 1000;
    const blendedMs = Math.round(baseMs * 0.65 + actualMs * 0.35);
    window.localStorage.setItem(WAKE_TIME_KEY, String(blendedMs));
  } catch {
    // Ignore storage failures and keep the default estimate.
  }
}

async function probeHealth(): Promise<{ ok: boolean; durationMs: number }> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), HEALTH_TIMEOUT_MS);
  const start = performance.now();

  try {
    const ok = await checkServerHealth(controller.signal);
    return { ok, durationMs: Math.round(performance.now() - start) };
  } finally {
    window.clearTimeout(timeout);
  }
}

export function ServerStatusProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<ServerPhase>('checking');
  const [estimatedSeconds, setEstimatedSeconds] = useState(DEFAULT_ESTIMATE_SECONDS);
  const [secondsRemaining, setSecondsRemaining] = useState(DEFAULT_ESTIMATE_SECONDS);
  const [lastCheckDurationMs, setLastCheckDurationMs] = useState<number | null>(null);
  const [slowNetwork, setSlowNetwork] = useState(false);

  const wakingSinceRef = useRef<number | null>(null);
  const pollingRef = useRef<number | null>(null);
  const countdownRef = useRef<number | null>(null);
  const activeProbeRef = useRef(false);

  useEffect(() => {
    const initialEstimate = readEstimatedSeconds();
    setEstimatedSeconds(initialEstimate);
    setSecondsRemaining(initialEstimate);
  }, []);

  const clearTimers = () => {
    if (pollingRef.current) {
      window.clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
    if (countdownRef.current) {
      window.clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
  };

  const startCountdown = (startingSeconds: number) => {
    if (countdownRef.current) return;

    countdownRef.current = window.setInterval(() => {
      setSecondsRemaining((current) => (current > 0 ? current - 1 : 0));
    }, 1000);

    setSecondsRemaining(startingSeconds);
  };

  const enterWakingState = () => {
    setStatus('waking');
    if (wakingSinceRef.current == null) {
      wakingSinceRef.current = Date.now();
      const nextEstimate = readEstimatedSeconds();
      setEstimatedSeconds(nextEstimate);
      startCountdown(nextEstimate);
    }
  };

  const enterOnlineState = (durationMs: number) => {
    setStatus('online');
    setLastCheckDurationMs(durationMs);
    setSlowNetwork(durationMs > 2500);

    if (wakingSinceRef.current != null) {
      const wakeDurationMs = Date.now() - wakingSinceRef.current;
      writeEstimatedSeconds(wakeDurationMs);
      const nextEstimate = readEstimatedSeconds();
      setEstimatedSeconds(nextEstimate);
      setSecondsRemaining(nextEstimate);
    }

    wakingSinceRef.current = null;

    if (countdownRef.current) {
      window.clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
  };

  const runProbe = async () => {
    if (activeProbeRef.current) return;
    activeProbeRef.current = true;

    try {
      const result = await probeHealth();
      setLastCheckDurationMs(result.durationMs);

      if (result.ok) {
        enterOnlineState(result.durationMs);
      } else {
        setSlowNetwork(result.durationMs > 2500);
        enterWakingState();
      }
    } catch {
      enterWakingState();
    } finally {
      activeProbeRef.current = false;
    }
  };

  useEffect(() => {
    clearTimers();
    runProbe();

    pollingRef.current = window.setInterval(
      runProbe,
      status === 'online' ? ONLINE_POLL_MS : WAKE_POLL_MS,
    );

    if (status === 'waking') {
      startCountdown(secondsRemaining > 0 ? secondsRemaining : estimatedSeconds);
    }

    return clearTimers;
  }, [status]);

  const contextValue = useMemo<ServerStatusContextValue>(() => {
    const overlayVisible = status !== 'online';
    const progressPercent = estimatedSeconds > 0
      ? Math.min(100, ((estimatedSeconds - secondsRemaining) / estimatedSeconds) * 100)
      : 100;
    const countdownFinished = secondsRemaining <= 0;

    let message = 'Waking up server... please wait';
    let detail = 'We are pinging the Render backend and will unlock the app automatically when it responds.';

    if (status === 'checking') {
      message = 'Checking server status...';
      detail = 'Hold tight while we contact the backend for the first time.';
    } else if (countdownFinished) {
      message = 'Still starting... almost there';
      detail = 'The server is taking a little longer than usual, but the app is still retrying in the background.';
    } else if (slowNetwork) {
      detail = 'The connection is responding slowly, so startup may feel a bit longer than usual.';
    }

    return {
      status,
      isReady: status === 'online',
      overlayVisible,
      message,
      detail,
      secondsRemaining,
      estimatedSeconds,
      progressPercent,
      retryIntervalMs: status === 'online' ? ONLINE_POLL_MS : WAKE_POLL_MS,
      wakeUrl: `${API_BASE}/health`,
      slowNetwork,
      lastCheckDurationMs,
      retryNow: runProbe,
    };
  }, [estimatedSeconds, lastCheckDurationMs, secondsRemaining, slowNetwork, status]);

  return (
    <ServerStatusContext.Provider value={contextValue}>
      {children}
    </ServerStatusContext.Provider>
  );
}

export function useServerStatusContext() {
  const context = useContext(ServerStatusContext);
  if (!context) {
    throw new Error('useServerStatus must be used within a ServerStatusProvider.');
  }
  return context;
}
