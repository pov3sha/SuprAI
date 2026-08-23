import React, { useEffect, useState } from 'react';
import { Cpu, CheckCircle, XCircle, MinusCircle } from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';

interface ProviderHealth {
  openai: string;
  gemini: string;
  ollama: string;
}

export const Header: React.FC = () => {
  const [providers, setProviders] = useState<ProviderHealth>({
    openai: 'checking',
    gemini: 'checking',
    ollama: 'checking'
  });

  useEffect(() => {
    fetch(`${API_BASE}/health`)
      .then((res) => res.json())
      .then((data) => {
        if (data.providers) {
          setProviders(data.providers);
        }
      })
      .catch(() => {
        setProviders({ openai: 'missing', gemini: 'missing', ollama: 'unavailable' });
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
            SuprAI <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#1B2433] text-[#94A3B8] border border-[#263347]">Multi-Model Engine</span>
          </h1>
          <p className="text-[10px] text-[#94A3B8]">Autonomous AI Work Organization</p>
        </div>
      </div>

      {/* Provider Status Indicators */}
      <div className="flex items-center gap-3 text-xs font-medium">
        {/* OpenAI Status */}
        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-[11px] ${
          providers.openai === 'configured'
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
            : 'bg-slate-800/40 border-slate-700/50 text-slate-400'
        }`}>
          {providers.openai === 'configured' ? (
            <CheckCircle className="w-3 h-3 text-emerald-400" />
          ) : (
            <MinusCircle className="w-3 h-3 text-slate-500" />
          )}
          <span>OpenAI {providers.openai === 'configured' ? 'Connected' : 'Not Configured'}</span>
        </div>

        {/* Gemini Status */}
        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-[11px] ${
          providers.gemini === 'configured'
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
            : 'bg-slate-800/40 border-slate-700/50 text-slate-400'
        }`}>
          {providers.gemini === 'configured' ? (
            <CheckCircle className="w-3 h-3 text-emerald-400" />
          ) : (
            <MinusCircle className="w-3 h-3 text-slate-500" />
          )}
          <span>Gemini {providers.gemini === 'configured' ? 'Connected' : 'Not Configured'}</span>
        </div>

        {/* Ollama Status */}
        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-[11px] ${
          providers.ollama === 'verified'
            ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400'
            : 'bg-slate-800/40 border-slate-700/50 text-slate-400'
        }`}>
          {providers.ollama === 'verified' ? (
            <CheckCircle className="w-3 h-3 text-indigo-400" />
          ) : (
            <MinusCircle className="w-3 h-3 text-slate-500" />
          )}
          <span>Ollama {providers.ollama === 'verified' ? 'Ready' : 'Optional'}</span>
        </div>
      </div>
    </header>
  );
};
