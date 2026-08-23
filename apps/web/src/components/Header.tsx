import React, { useEffect, useState } from 'react';
import { Cpu, CheckCircle, MinusCircle } from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';

interface ProviderHealth {
  gemini: string;
}

export const Header: React.FC = () => {
  const [geminiStatus, setGeminiStatus] = useState<string>('checking');

  useEffect(() => {
    fetch(`${API_BASE}/health`)
      .then((res) => res.json())
      .then((data) => {
        if (data.providers && data.providers.gemini) {
          setGeminiStatus(data.providers.gemini);
        }
      })
      .catch(() => {
        setGeminiStatus('missing');
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
            SuprAI <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#1B2433] text-[#94A3B8] border border-[#263347]">Gemini Engine</span>
          </h1>
          <p className="text-[10px] text-[#94A3B8]">Autonomous AI Work Organization (Google Gemini 1.5 Flash)</p>
        </div>
      </div>

      {/* Gemini Status Indicator */}
      <div className="flex items-center gap-3 text-xs font-medium">
        <div className={`flex items-center gap-1.5 px-3 py-1 rounded-md border text-xs ${
          geminiStatus === 'configured'
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
            : 'bg-slate-800/40 border-slate-700/50 text-slate-400'
        }`}>
          {geminiStatus === 'configured' ? (
            <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
          ) : (
            <MinusCircle className="w-3.5 h-3.5 text-slate-500" />
          )}
          <span>Gemini 1.5 Flash {geminiStatus === 'configured' ? 'Connected' : 'Not Configured'}</span>
        </div>
      </div>
    </header>
  );
};
