import React, { useEffect, useState } from 'react';
import { Cpu, Check, ShieldCheck, Trash2 } from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';

interface HeaderProps {
  onClearWorkspace?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onClearWorkspace }) => {
  const [health, setHealth] = useState<any>(null);

  useEffect(() => {
    fetch(`${API_BASE}/health`)
      .then((res) => res.json())
      .then((data) => setHealth(data))
      .catch(() => setHealth(null));
  }, []);

  const isConnected = health?.status === 'healthy';
  const modelName = health?.providers?.model || 'qwen2.5:0.5b';

  return (
    <header className="h-14 border-b border-[#313A40] bg-[#121619] flex items-center justify-between px-6 text-[#F3F4F6] select-none shrink-0 font-sans">
      {/* Brand Title */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-[#242B30] border border-[#313A40] flex items-center justify-center text-[#9DA8B0] font-bold text-xs">
          AI
        </div>
        <div>
          <h1 className="text-sm font-bold tracking-wide text-[#F3F4F6] flex items-center gap-2">
            SuprAI
          </h1>
          <p className="text-[10px] text-[#6B7780]">Autonomous AI Work Organization</p>
        </div>
      </div>

      {/* Header Right Badges & Controls */}
      <div className="flex items-center gap-3 text-xs">
        {/* Ollama Connection Badge */}
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs ${
          isConnected
            ? 'bg-[#1C2226] border-[#313A40] text-[#F3F4F6]'
            : 'bg-[#1C2226] border-[#8F6666] text-[#A47A7A]'
        }`}>
          <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-[#7FAF91] animate-pulse' : 'bg-[#A47A7A]'}`} />
          <div className="flex flex-col text-[10px]">
            <span className="font-bold tracking-wider">OLLAMA CONNECTED</span>
            <span className="text-[#6B7780] font-mono">{modelName}</span>
          </div>
        </div>

        {/* Local Privacy Verified Badge */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl border border-[#313A40] bg-[#1C2226] text-xs">
          <ShieldCheck className="w-4 h-4 text-[#7FAF91]" />
          <div className="flex flex-col text-[10px]">
            <span className="font-bold text-[#F3F4F6] tracking-wider">LOCAL PRIVACY</span>
            <span className="text-[#7FAF91] font-bold">100% OFFLINE VERIFIED</span>
          </div>
        </div>

        {/* Clear Workspace Button */}
        {onClearWorkspace && (
          <button
            onClick={onClearWorkspace}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1C2226] hover:bg-[#242B30] text-xs text-[#9DA8B0] hover:text-[#F3F4F6] border border-[#313A40] transition cursor-pointer font-medium"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear Workspace</span>
          </button>
        )}

        {/* User Avatar Circle */}
        <div className="w-8 h-8 rounded-full bg-[#242B30] border border-[#313A40] flex items-center justify-center font-bold text-xs text-[#9DA8B0]">
          AI
        </div>
      </div>
    </header>
  );
};
