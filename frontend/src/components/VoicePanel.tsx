import { useEffect, useMemo, useRef, useState } from 'react';
import { sarvamTranslate } from '../lib/api';

interface VoicePanelProps {
  inputText: string;
  onInputChange: (text: string) => void;
  transcript: string;
  onTranscriptChange: (text: string) => void;
  confidence: number;
  onConfidenceChange: (val: number) => void;
  sttSource: 'browser' | 'sarvam' | 'text';
  onSttSourceChange: (source: 'browser' | 'sarvam' | 'text') => void;
  onError: (msg: string | null) => void;
  onLog: (msg: string) => void;
}

export function VoicePanel({
  inputText,
  onInputChange,
  transcript,
  onTranscriptChange,
  confidence,
  onConfidenceChange,
  sttSource,
  onSttSourceChange,
  onError,
  onLog,
}: VoicePanelProps) {
  const [recording, setRecording] = useState(false);
  const [sarvamLoading, setSarvamLoading] = useState(false);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const canUseSpeech = useMemo(
    () => Boolean(window.SpeechRecognition || window.webkitSpeechRecognition),
    []
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  function startSpeech() {
    onError(null);

    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      onError('Browser STT (SpeechRecognition) is not supported in this browser.');
      return;
    }

    try {
      const recognition = new SR();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-IN';

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let text = '';
        let conf = 0;
        let chunks = 0;
        for (let i = event.resultIndex; i < event.results.length; i += 1) {
          text += `${event.results[i][0].transcript} `;
          conf += event.results[i][0].confidence ?? 0.7;
          chunks += 1;
        }
        const avgConf = chunks > 0 ? conf / chunks : 0.7;
        onTranscriptChange(text.trim());
        onInputChange(text.trim());
        onConfidenceChange(Number(avgConf.toFixed(2)));
        onSttSourceChange('browser');
      };

      recognition.onerror = (e: any) => {
        onLog(`Browser STT error: ${e.error}`);
        setRecording(false);
      };

      recognition.onend = () => {
        setRecording(false);
      };

      recognition.start();
      recognitionRef.current = recognition;
      setRecording(true);
      onLog('Recording started — speak now');
    } catch (err) {
      onError('Microphone permission denied or STT failed to start.');
    }
  }

  async function stopSpeech() {
    // Stop browser STT
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setRecording(false);
    onLog('Recording stopped');
  }

  async function runSarvamSTT() {
    // Disabled as requested
    onLog('Sarvam STT is disabled. Using browser STT only.');
  }

  const handleManualTranslate = () => {
    // if(!sarvamLoading) runSarvamSTT();
  };

  return (
    <div className="glass-card space-y-4">
      <div className="panel-title">
        {recording && <span className="recording-dot" />}
        Voice Input
      </div>

      {/* Buttons */}
      <div className="flex flex-wrap gap-2">
        <button
          id="btn-speak"
          onClick={startSpeech}
          disabled={recording}
          className={recording ? 'btn-ghost opacity-40' : 'btn-success'}
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-14 0m7 7v4m-4 0h8m-4-12a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
          {recording ? 'Listening…' : 'Speak'}
        </button>

        <button
          id="btn-stop"
          onClick={stopSpeech}
          disabled={!recording}
          className={!recording ? 'btn-ghost opacity-40' : 'btn-danger'}
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
          </svg>
          Stop
        </button>

        {sarvamLoading && (
          <span className="badge-cyan badge animate-pulse text-xs">
            <svg className="h-3 w-3 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Sarvam Translating…
          </span>
        )}
      </div>

      {/* Textarea */}
      <textarea
        id="input-textarea"
        className="input-glass mt-4 h-36 resize-none"
        placeholder="Speak or type your prompt here… (Hindi, Hinglish, or English)"
        value={inputText}
        onChange={(e) => {
          onInputChange(e.target.value);
          onSttSourceChange('text');
          onConfidenceChange(1);
        }}
      />

      {/* Transcript Info */}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className={`badge ${sttSource === 'sarvam' ? 'badge-cyan' : sttSource === 'browser' ? 'badge-violet' : 'badge-emerald'}`}>
          {sttSource === 'sarvam' ? '🎯 Sarvam AI' : sttSource === 'browser' ? '🌐 Browser STT' : '⌨️ Text Input'}
        </span>
        <span className={`badge ${confidence >= 0.8 ? 'badge-emerald' : confidence >= 0.6 ? 'badge-amber' : 'badge-rose'}`}>
          Confidence: {(confidence * 100).toFixed(0)}%
        </span>
      </div>

      {transcript && (
        <div className="mt-3 animate-fade-in">
          <p className="text-[10px] tracking-wider text-slate-500 uppercase mb-1">Live Transcript</p>
          <p className="text-xs text-slate-600 italic">"{transcript}"</p>
        </div>
      )}

      {!canUseSpeech && (
        <p className="mt-3 text-xs text-amber-700">
          ⚠ Browser Speech API unavailable. Sarvam AI will be used for voice input.
        </p>
      )}
    </div>
  );
}
