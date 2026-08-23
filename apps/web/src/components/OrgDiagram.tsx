import React, { useEffect, useState } from 'react';
import { Brain, Sparkles, Database, Search } from 'lucide-react';
import { Task } from '../lib/types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';

interface OrgDiagramProps {
  tasks: Task[];
  isProcessing: boolean;
}

export const OrgDiagram: React.FC<OrgDiagramProps> = ({ tasks, isProcessing }) => {
  const [roleRouting, setRoleRouting] = useState<Record<string, string>>({
    manager: 'openai (gpt-4o-mini)',
    consultant: 'gemini (gemini-1.5-flash)',
    analyst: 'openai (gpt-4o-mini)',
    researcher: 'gemini (gemini-1.5-flash)'
  });

  useEffect(() => {
    fetch(`${API_BASE}/health`)
      .then((res) => res.json())
      .then((data) => {
        if (data.role_routing) {
          setRoleRouting(data.role_routing);
        }
      })
      .catch(() => {});
  }, []);

  const getRoleStatus = (roleName: string) => {
    const roleTasks = tasks.filter((t) => (t.worker || '').toLowerCase().includes(roleName.toLowerCase()));
    if (roleTasks.some((t) => t.status === 'RUNNING')) return { status: 'Active', bg: 'bg-amber-500/10 border-amber-500/40 text-amber-400' };
    if (roleTasks.some((t) => t.status === 'COMPLETED')) return { status: 'Completed', bg: 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400' };
    if (roleTasks.some((t) => t.status === 'FAILED')) return { status: 'Failed', bg: 'bg-rose-500/10 border-rose-500/40 text-rose-400' };
    return { status: 'Ready', bg: 'bg-[#1B2433] border-[#263347] text-[#94A3B8]' };
  };

  const managerStatus = isProcessing
    ? { status: 'Active', bg: 'bg-[#6366F1]/10 border-[#6366F1]/40 text-[#6366F1]' }
    : tasks.length > 0
    ? { status: 'Completed', bg: 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400' }
    : { status: 'Ready', bg: 'bg-[#1B2433] border-[#263347] text-[#94A3B8]' };

  const consultantStatus = getRoleStatus('consultant');
  const analystStatus = getRoleStatus('analyst');
  const researcherStatus = getRoleStatus('researcher');

  return (
    <div className="p-4 border-b border-[#263347] bg-[#141A26]">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] font-semibold text-[#94A3B8] uppercase tracking-wider">AI Organization Structure</span>
        <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Multi-Provider Hierarchy
        </span>
      </div>

      {/* Hierarchy Diagram */}
      <div className="space-y-3">
        {/* Manager Node */}
        <div className={`p-2.5 rounded-lg border flex items-center justify-between transition ${managerStatus.bg}`}>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-[#6366F1]/20 text-[#6366F1]">
              <Brain className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-semibold text-white">Manager AI</div>
              <div className="text-[10px] text-[#94A3B8] font-mono">{roleRouting.manager}</div>
            </div>
          </div>
          <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded border border-current">{managerStatus.status}</span>
        </div>

        {/* Connector line */}
        <div className="flex justify-center">
          <div className="w-[1px] h-3 bg-[#263347]" />
        </div>

        {/* Worker Roles Grid */}
        <div className="grid grid-cols-3 gap-2">
          {/* Consultant */}
          <div className={`p-2 rounded-md border flex flex-col items-center text-center transition ${consultantStatus.bg}`}>
            <Sparkles className="w-3.5 h-3.5 mb-1" />
            <div className="text-[11px] font-semibold text-slate-200">Consultant</div>
            <div className="text-[9px] text-[#94A3B8] font-mono truncate max-w-full">{roleRouting.consultant}</div>
            <span className="text-[9px] font-mono mt-1 px-1.5 py-0.2 rounded border border-current">{consultantStatus.status}</span>
          </div>

          {/* Analyst */}
          <div className={`p-2 rounded-md border flex flex-col items-center text-center transition ${analystStatus.bg}`}>
            <Database className="w-3.5 h-3.5 mb-1" />
            <div className="text-[11px] font-semibold text-slate-200">Analyst</div>
            <div className="text-[9px] text-[#94A3B8] font-mono truncate max-w-full">{roleRouting.analyst}</div>
            <span className="text-[9px] font-mono mt-1 px-1.5 py-0.2 rounded border border-current">{analystStatus.status}</span>
          </div>

          {/* Researcher */}
          <div className={`p-2 rounded-md border flex flex-col items-center text-center transition ${researcherStatus.bg}`}>
            <Search className="w-3.5 h-3.5 mb-1" />
            <div className="text-[11px] font-semibold text-slate-200">Researcher</div>
            <div className="text-[9px] text-[#94A3B8] font-mono truncate max-w-full">{roleRouting.researcher}</div>
            <span className="text-[9px] font-mono mt-1 px-1.5 py-0.2 rounded border border-current">{researcherStatus.status}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
