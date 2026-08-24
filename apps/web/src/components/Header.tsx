import React, { useEffect, useState } from 'react';
import { Cpu, CheckCircle, XCircle } from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';

interface HealthData {
  status: string;
  engine: string;
  providers: {
    ollama: string;
    model: string;
  };
  role_routing: {
    manager: string;
    consultant: string;
    analyst: string;
    researcher: string;
  };
}

export const Header: React.FC = () => {
  const [health, setHealth] = useState<HealthData | null>(null);

  useEffect(() => {
    fetch(`${API_BASE}/health`)
      .then((res) => res.json())
      .then((data) => setHealth(data))
      .catch(() => setHealth(null));
  }, []);

  const isConnected = health?.status === 'healthy';
  const modelName = health?.providers?.model || 'qwen2.5:0.5b';

  return (
    <header className="h-14 border-b border-[#263347] bg-[#0E131F] flex items-center justify-between px-6 text-white select-none">
      {/* Brand Title */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-[#6366F1]/10 border border-[#6366F1]/30 flex items-center justify-center">
          <Cpu className="w-4 h-4 text-[#6366F1]" />
        </div>
        <div>
          <h1 className="text-sm font-semibold tracking-wide text-white flex items-center gap-2">
            SuprAI <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#1B2433] text-[#94A3B8] border border-[#263347]">Ollama Engine</span>
          </h1>
          <p className="text-[10px] text-[#94A3B8]">Autonomous AI Work Organization</p>
        </div>
      </div>

      {/* Ollama Runtime Diagnostic Status */}
      <div className="flex items-center gap-3 text-xs font-medium">
        <div className={`flex items-center gap-2 px-3 py-1 rounded-md border text-xs ${
          isConnected
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
            : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
        }`}>
          {isConnected ? (
            <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
          ) : (
            <XCircle className="w-3.5 h-3.5 text-rose-400" />
          )}
          <span>{isConnected ? `● Ollama Connected (${modelName})` : '● Ollama Offline'}</span>
        </div>

        <div className="hidden md:flex items-center gap-2 text-[11px] text-[#94A3B8] bg-[#161F2E] px-3 py-1 rounded-md border border-[#263347]">
          <span>Manager: <strong className="text-emerald-400">Ready</strong></span>
          <span className="text-slate-600">•</span>
          <span>Consultant: <strong className="text-emerald-400">Ready</strong></span>
          <span className="text-slate-600">•</span>
          <span>Analyst: <strong className="text-emerald-400">Ready</strong></span>
          <span className="text-slate-600">•</span>
          <span>Researcher: <strong className="text-emerald-400">Ready</strong></span>
        </div>
      </div>
    </header>
  );
};
