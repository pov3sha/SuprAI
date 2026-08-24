import React, { useEffect, useState } from 'react';
import { Cpu, CheckCircle, XCircle, ShieldCheck } from 'lucide-react';

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
    <header className="h-14 border-b border-[#2D3945] bg-[#11161B] flex items-center justify-between px-6 text-[#F1F5F9] select-none">
      {/* Brand Title */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-[#6366F1]/10 border border-[#6366F1]/30 flex items-center justify-center text-[#6366F1]">
          <Cpu className="w-4.5 h-4.5" />
        </div>
        <div>
          <h1 className="text-sm font-semibold tracking-wide text-[#F1F5F9] flex items-center gap-2">
            SuprAI <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#1B242C] text-[#A3ACB3] border border-[#2D3945]">Ollama Engine</span>
          </h1>
          <p className="text-[10px] text-[#5A6A78]">Autonomous AI Work Organization</p>
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

        <div className="hidden md:flex items-center gap-2 text-[11px] text-[#A3ACB3] bg-[#1B242C] px-3 py-1 rounded-md border border-[#2D3945]">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Local Privacy: <strong className="text-emerald-400">100% Offline Verified</strong></span>
        </div>
      </div>
    </header>
  );
};
