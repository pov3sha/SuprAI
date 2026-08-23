import React, { useEffect, useState } from 'react';
import { Cpu, CheckCircle, AlertCircle, ShieldAlert } from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';

export const Header: React.FC = () => {
  const [modelDiagnostics, setModelDiagnostics] = useState<{
    status: string;
    role_models?: Record<string, string>;
    error?: string;
  }>({ status: 'checking' });

  useEffect(() => {
    fetch(`${API_BASE}/health`)
      .then((res) => res.json())
      .then((data) => {
        if (data.ollama_diagnostics) {
          setModelDiagnostics(data.ollama_diagnostics);
        } else {
          setModelDiagnostics({ status: 'connected', role_models: { manager: 'qwen2.5:0.5b' } });
        }
      })
      .catch((err) => {
        setModelDiagnostics({ status: 'error', error: 'Ollama Unreachable' });
      });
  }, []);

  return (
    <header className="h-14 border-b border-[#263347] bg-[#0E131F] flex items-center justify-between px-6 text-white select-none">
      {/* Brand Title */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-[#6366F1]/10 border border-[#6366F1]/30 flex items-center justify-center">
          <Cpu className="w-4 h-4 text-[#6366F1]" />
        </div>
        <div>
          <h1 className="text-sm font-semibold tracking-wide text-white flex items-center gap-2">
            SuprAI <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#1B2433] text-[#94A3B8] border border-[#263347]">v0.1 Local</span>
          </h1>
          <p className="text-[10px] text-[#94A3B8]">Autonomous AI Work Organization</p>
        </div>
      </div>

      {/* Diagnostics Bar */}
      <div className="flex items-center gap-4 text-xs">
        {modelDiagnostics.status === 'verified' || modelDiagnostics.status === 'connected' ? (
          <div className="flex items-center gap-3 bg-[#141A26] px-3 py-1.5 rounded-md border border-[#263347]">
            <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
              <CheckCircle className="w-3.5 h-3.5" />
              <span>Ollama Ready</span>
            </div>
            <div className="h-3 w-[1px] bg-[#263347]" />
            <div className="flex items-center gap-2 text-[11px] text-[#94A3B8] font-mono">
              <span>Manager: <strong className="text-slate-200">{modelDiagnostics.role_models?.manager || 'qwen2.5:0.5b'}</strong></span>
              <span>•</span>
              <span>Workers: <strong className="text-slate-200">{modelDiagnostics.role_models?.consultant || 'qwen2.5:0.5b'}</strong></span>
            </div>
          </div>
        ) : modelDiagnostics.status === 'error' ? (
          <div className="flex items-center gap-2 bg-rose-500/10 text-rose-400 px-3 py-1.5 rounded-md border border-rose-500/20 text-xs">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>{modelDiagnostics.error || 'Model Unavailable'}</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-[#94A3B8] text-xs">
            <AlertCircle className="w-3.5 h-3.5 animate-spin text-[#6366F1]" />
            <span>Verifying Ollama Models...</span>
          </div>
        )}
      </div>
    </header>
  );
};
