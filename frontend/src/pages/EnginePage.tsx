import { useEffect, useState } from 'react';
import { processInput, saveMemory } from '../lib/api';
import type { MemoryEntry, OptimizationMode, PipelineResponse } from '../types';
import { Header } from '../components/Header';
import { VoicePanel } from '../components/VoicePanel';
import { AnalysisPanel } from '../components/AnalysisPanel';
import { ResultPanel } from '../components/ResultPanel';
import { TokenStats } from '../components/TokenStats';
import { WhatChangedPanel } from '../components/WhatChangedPanel';
import { DecisionLogs } from '../components/DecisionLogs';
import { MemoryPanel } from '../components/MemoryPanel';
import type { ServerStatus } from '../App';

const MEMORY_KEY = 'prompt_engine_memory_v1';

interface EnginePageProps {
  serverStatus: ServerStatus;
  secondsRemaining: number;
  wakeUrl: string;
}

function loadMemory(): MemoryEntry[] {
  try {
    const raw = localStorage.getItem(MEMORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as MemoryEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function persistMemory(entries: MemoryEntry[]) {
  localStorage.setItem(MEMORY_KEY, JSON.stringify(entries.slice(0, 5)));
}

function formatWakeTime(secondsRemaining: number): string {
  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export function EnginePage({ serverStatus, secondsRemaining, wakeUrl }: EnginePageProps) {
  const [mode, setMode] = useState<OptimizationMode>('balanced');
  const [inputText, setInputText] = useState('');
  const [transcript, setTranscript] = useState('');
  const [confidence, setConfidence] = useState(1);
  const [sttSource, setSttSource] = useState<'browser' | 'sarvam' | 'text'>('text');
  const [highAccuracy, setHighAccuracy] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PipelineResponse | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [memory, setMemory] = useState<MemoryEntry[]>([]);
  const [sessionLogs, setSessionLogs] = useState<string[]>([]);
  const [memorySaved, setMemorySaved] = useState(false);
  const [memorySkipped, setMemorySkipped] = useState(false);

  const serverReady = serverStatus === 'online';
  const wakeInProgress = serverStatus === 'waking' || serverStatus === 'offline';

  useEffect(() => {
    setMemory(loadMemory());
  }, []);

  async function optimizePrompt() {
    if (!serverReady) {
      setError('Server is waking up. Please wait for the countdown to finish and the status to switch on.');
      return;
    }

    setError(null);
    setProcessing(true);
    setConfirmed(false);
    setMemorySaved(false);
    setMemorySkipped(false);

    try {
      const response = await processInput({
        raw_input: inputText,
        mode,
        confidence,
        stt_source: sttSource,
        force_high_accuracy: highAccuracy,
      });
      setResult(response);
      setSessionLogs(response.decision_logs);

      if (response.confidence < 0.65) {
        setSessionLogs((prev) => [
          ...prev,
          'Low confidence detected. Consider using Sarvam translation for better accuracy.',
        ]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Processing failed');
      setResult(null);
    } finally {
      setProcessing(false);
    }
  }

  async function handleSaveMemory() {
    if (!result) return;

    const entry: MemoryEntry = {
      id: crypto.randomUUID(),
      task: result.intent.task,
      domain: result.intent.domain,
      format: result.intent.output_format,
      timestamp: new Date().toISOString(),
    };

    const updated = [entry, ...memory].slice(0, 5);
    setMemory(updated);
    persistMemory(updated);
    setMemorySaved(true);

    try {
      await saveMemory(entry.task, entry.domain, entry.format);
      setSessionLogs((prev) => [...prev, 'Memory saved (localStorage + backend).']);
    } catch {
      setSessionLogs((prev) => [...prev, 'Memory saved locally, backend persistence failed.']);
    }
  }

  function handleSkipMemory() {
    setMemorySkipped(true);
    setSessionLogs((prev) => [...prev, 'User skipped memory save. Decision logged.']);
  }

  function handleRework() {
    setConfirmed(false);
    setResult(null);
    setMemorySaved(false);
    setMemorySkipped(false);
    setSessionLogs((prev) => [...prev, 'User chose to rework. Edit input and re-run.']);
  }

  function addLog(msg: string) {
    setSessionLogs((prev) => [...prev, msg]);
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header
        mode={mode}
        onModeChange={setMode}
        serverStatus={serverStatus}
        secondsRemaining={secondsRemaining}
      />

      <main className="relative flex-1 max-w-[1920px] mx-auto w-full">
        {wakeInProgress && (
          <div className="server-overlay">
            <div className="server-overlay-card">
              <div className="badge badge-amber">Render Free Tier Wake-Up</div>
              <h2 className="mt-4 text-2xl font-semibold text-slate-900">Server is waking up</h2>
              <p className="mt-2 text-sm text-slate-600">
                The backend is asleep on Render free tier. We are pinging it now, and the app will unlock automatically when the server responds.
              </p>
              <div className="server-countdown mt-5">{formatWakeTime(secondsRemaining)}</div>
              <p className="mt-2 text-xs uppercase tracking-[0.18em] text-slate-500">
                Estimated time until access returns
              </p>
              <a className="btn-primary mt-6" href={wakeUrl} target="_blank" rel="noreferrer">
                Wake Server Link
              </a>
            </div>
          </div>
        )}

        <div className={`grid grid-cols-1 gap-5 p-5 xl:grid-cols-3 ${wakeInProgress ? 'app-shell-muted' : ''}`}>
          <section className="space-y-5">
            <VoicePanel
              inputText={inputText}
              onInputChange={setInputText}
              transcript={transcript}
              onTranscriptChange={setTranscript}
              confidence={confidence}
              onConfidenceChange={setConfidence}
              sttSource={sttSource}
              onSttSourceChange={setSttSource}
              onError={setError}
              onLog={addLog}
            />

            <div className="hidden xl:block">
              <MemoryPanel
                result={result}
                memory={memory}
                onSave={handleSaveMemory}
                onSkip={handleSkipMemory}
                saved={memorySaved}
                skipped={memorySkipped}
              />
            </div>
          </section>

          <section className="space-y-5">
            <AnalysisPanel
              result={result}
              confidence={confidence}
              sttSource={sttSource}
              mode={mode}
              inputText={inputText}
              processing={processing}
              error={error}
              confirmed={confirmed}
              highAccuracy={highAccuracy}
              onHighAccuracyChange={setHighAccuracy}
              onRunPipeline={optimizePrompt}
              onConfirm={() => setConfirmed(true)}
              onRework={handleRework}
            />
          </section>

          <section className="space-y-5">
            <div className="glass-card animate-slide-up" style={{ animationDelay: '0.15s' }}>
              <div className="panel-title">Output &amp; Diagnostics</div>

              <ResultPanel result={result} confirmed={confirmed} />

              <div className="divider" />
              <TokenStats result={result} />

              {result && (
                <>
                  <div className="divider" />
                  <WhatChangedPanel result={result} />

                  <div className="divider" />
                  <DecisionLogs logs={sessionLogs} />
                </>
              )}
            </div>

            <div className="xl:hidden">
              <MemoryPanel
                result={result}
                memory={memory}
                onSave={handleSaveMemory}
                onSkip={handleSkipMemory}
                saved={memorySaved}
                skipped={memorySkipped}
              />
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
