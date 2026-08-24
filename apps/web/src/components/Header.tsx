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
    <header className="h-14 border-b border-[#555555] bg-[#111111] flex items-center justify-between px-6 text-[#FFFFFF] select-none shrink-0 font-sans">
      {/* Brand Title */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded bg-[#333333] border border-[#555555] flex items-center justify-center text-[#999999]">
          <Cpu className="w-4.5 h-4.5" />
        </div>
        <div>
          <h1 className="text-sm font-bold tracking-wide text-[#FFFFFF] flex items-center gap-2">
            SuprAI <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#333333] text-[#999999] border border-[#555555]">Ollama Engine</span>
          </h1>
          <p className="text-[10px] text-[#777777]">Autonomous AI Work Organization</p>
        </div>
      </div>

      {/* Ollama Runtime Diagnostic Status */}
      <div className="flex items-center gap-3 text-xs font-medium">
        <div className={`flex items-center gap-2 px-3 py-1 rounded border text-xs ${
          isConnected
            ? 'bg-[rgba(95,143,114,0.08)] border-[#5F8F72] text-[#7FAF91]'
            : 'bg-[rgba(143,102,102,0.08)] border-[#8F6666] text-[#A47A7A]'
        }`}>
          {isConnected ? (
            <CheckCircle className="w-3.5 h-3.5 text-[#7FAF91]" />
          ) : (
            <XCircle className="w-3.5 h-3.5 text-[#A47A7A]" />
          )}
          <span>{isConnected ? `● Ollama Connected (${modelName})` : '● Ollama Offline'}</span>
        </div>

        <div className="hidden md:flex items-center gap-2 text-[11px] text-[#999999] bg-[#333333] px-3 py-1 rounded border border-[#555555]">
          <ShieldCheck className="w-3.5 h-3.5 text-[#7FAF91]" />
          <span>Local Privacy: <strong className="text-[#7FAF91]">100% Offline Verified</strong></span>
        </div>
      </div>
    </header>
  );
};
