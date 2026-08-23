import React, { useEffect, useState } from 'react';
import { Brain, Sparkles, Database, Search, ShieldCheck } from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';

export const OrganizationView: React.FC = () => {
  const [roleRouting, setRoleRouting] = useState<Record<string, string>>({
    manager: 'openai (gpt-4o-mini)',
    consultant: 'gemini (gemini-1.5-flash)',
    analyst: 'openai (gpt-4o-mini)',
    researcher: 'gemini (gemini-1.5-flash)'
  });

  const [providers, setProviders] = useState<{ openai: string; gemini: string; ollama: string }>({
    openai: 'configured',
    gemini: 'configured',
    ollama: 'optional'
  });

  useEffect(() => {
    fetch(`${API_BASE}/health`)
      .then((res) => res.json())
      .then((data) => {
        if (data.role_routing) setRoleRouting(data.role_routing);
        if (data.providers) setProviders(data.providers);
      })
      .catch(() => {});
  }, []);

  const roles = [
    {
      name: 'Manager AI',
      roleKey: 'manager',
      icon: Brain,
      color: 'border-[#6366F1] bg-[#6366F1]/10 text-[#6366F1]',
      description: 'Primary reasoning, objective decomposition, task graph generation, and deliverable synthesis.',
      capabilities: ['Objective Interpretation', 'Dynamic Task Graphing', 'Worker Allocation', 'Synthesis & Citations']
    },
    {
      name: 'Consultant AI',
      roleKey: 'consultant',
      icon: Sparkles,
      color: 'border-amber-500 bg-amber-500/10 text-amber-400',
      description: 'Strategic analysis, domain reasoning, architecture recommendations, and risk prioritization.',
      capabilities: ['Strategic Recommendations', 'Business Architecture', 'Risk Mitigation Plan', 'Implementation Roadmap']
    },
    {
      name: 'Analyst AI',
      roleKey: 'analyst',
      icon: Database,
      color: 'border-cyan-500 bg-cyan-500/10 text-cyan-400',
      description: 'Quantitative analytical processing, dataset profiling (Pandas), and numerical statistical trend extraction.',
      capabilities: ['Document Analytics', 'Pandas Profile Summaries', 'Financial & Metric Trends', 'Tabular Insights']
    },
    {
      name: 'Researcher AI',
      roleKey: 'researcher',
      icon: Search,
      color: 'border-emerald-500 bg-emerald-500/10 text-emerald-400',
      description: 'Cross-document evidence extraction, source page verification, and contradiction detection.',
      capabilities: ['Source Citation Extraction', 'Cross-Document Comparison', 'Evidence Verification', 'Page Excerpt Mapping']
    }
  ];

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-3.5rem)] bg-[#0B0F17] overflow-y-auto p-8 text-white select-none">
      <div className="flex items-center justify-between border-b border-[#263347] pb-6 mb-6">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            AI Work Organization Structure
          </h2>
          <p className="text-xs text-[#94A3B8] mt-1">
            Real multi-model autonomous agent hierarchy with dynamic provider model assignment.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="px-3 py-1.5 rounded-md bg-[#141A26] border border-[#263347] text-emerald-400 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            Active Provider Routing Matrix
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {roles.map((r) => {
          const Icon = r.icon;
          const boundModel = roleRouting[r.roleKey] || 'openai (gpt-4o-mini)';
          return (
            <div key={r.roleKey} className="p-6 rounded-xl border border-[#263347] bg-[#141A26] space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-lg border ${r.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">{r.name}</h3>
                    <span className="text-[11px] font-mono text-slate-300">{boundModel}</span>
                  </div>
                </div>

                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                  Ready
                </span>
              </div>

              <p className="text-xs text-[#94A3B8] leading-relaxed">
                {r.description}
              </p>

              <div className="pt-3 border-t border-[#263347]">
                <div className="text-[10px] font-semibold text-[#94A3B8] uppercase tracking-wider mb-2">Capabilities</div>
                <div className="flex flex-wrap gap-1.5">
                  {r.capabilities.map((cap) => (
                    <span key={cap} className="text-[10px] px-2 py-1 rounded bg-[#0B0F17] border border-[#263347] text-slate-300 font-mono">
                      {cap}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
