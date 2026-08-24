import React from 'react';
import { Cpu, ShieldCheck, FileText, ArrowRight, Check, AlertTriangle, ExternalLink } from 'lucide-react';
import { Task, Evidence, SSEEvent } from '../lib/types';

interface PipelineGraphProps {
  tasks: Task[];
  isProcessing: boolean;
  events: SSEEvent[];
  evidenceList: Evidence[];
  activeDocumentName?: string;
  onSelectEvidence?: (ev: Evidence) => void;
}

export const PipelineGraph: React.FC<PipelineGraphProps> = ({
  tasks,
  isProcessing,
  events,
  evidenceList,
  activeDocumentName,
  onSelectEvidence,
}) => {
  // Scoped active execution status
  const currentExecEvents = events.slice(-25);
  const activeFailedEvent = currentExecEvents.find((e) => e.event_type === 'execution_failed');
  const activeCompletedEvent = currentExecEvents.find((e) => e.event_type === 'execution_completed');

  let managerStatus = 'Planning';
  if (activeFailedEvent) managerStatus = 'Failed';
  else if (activeCompletedEvent && !isProcessing) managerStatus = 'Completed';
  else if (isProcessing) {
    if (events.some((e) => e.event_type === 'manager_synthesizing')) managerStatus = 'Synthesizing';
    else if (events.some((e) => e.event_type === 'manager_reviewing')) managerStatus = 'Reviewing';
    else if (events.some((e) => e.event_type === 'task_created')) managerStatus = 'Decomposing';
    else if (events.some((e) => e.event_type === 'manager_planning')) managerStatus = 'Planning';
    else managerStatus = 'Received';
  }

  // Organization Roles
  const roles = [
    { id: 'consultant', name: 'Consultant' },
    { id: 'analyst', name: 'Analyst' },
    { id: 'researcher', name: 'Researcher' },
    { id: 'intern', name: 'Intern' },
  ];

  const getRoleStatus = (roleId: string) => {
    const roleTask = tasks.find((t) => (t.worker || '').toLowerCase().includes(roleId) || (t.objective || '').toLowerCase().includes(roleId));
    if (activeFailedEvent && roleTask?.status !== 'COMPLETED') return 'Failed';
    if (roleTask?.status === 'COMPLETED') return 'Completed';
    if (roleTask?.status === 'RUNNING' || isProcessing) return 'Working';
    return 'Ready';
  };

  return (
    <div className="w-full bg-[#1C2226] border border-[#313A40] rounded-2xl p-4 select-none text-[#F3F4F6] space-y-4 font-sans shadow-xl shrink-0">
      {/* Header & Status Legend */}
      <div className="flex items-center justify-between border-b border-[#313A40] pb-3">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#F3F4F6] flex items-center gap-2">
            <Cpu className="w-4 h-4 text-[#9DA8B0]" />
            AI ORGANIZATION PIPELINE
          </h3>
          <p className="text-[10px] text-[#6B7780]">Real-time execution graph</p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-[10px] text-[#6B7780] font-mono">
          <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full border border-[#6B7780]" /> Pending</span>
          <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-[#9DA8B0]" /> Active</span>
          <span className="flex items-center gap-1 text-[#7FAF91]"><Check className="w-3 h-3 text-[#7FAF91]" /> Completed</span>
          <span className="flex items-center gap-1 text-[#A47A7A]">✕ Failed</span>
        </div>
      </div>

      {/* Pipeline Lifecycle Graph Nodes */}
      <div className="flex items-center justify-between gap-1.5 overflow-x-auto py-2 scrollbar-thin text-xs">
        {/* Node 1: User Task */}
        <div className="flex flex-col items-center p-2.5 rounded-xl border border-[#313A40] bg-[#242B30] shrink-0 text-center min-w-[70px]">
          <span className="text-[14px] text-[#9DA8B0] mb-0.5">👤</span>
          <span className="text-[11px] font-bold text-[#F3F4F6]">USER TASK</span>
          <span className="text-[9px] text-[#6B7780] font-mono">Received</span>
        </div>

        <ArrowRight className="w-3.5 h-3.5 text-[#313A40] shrink-0" />

        {/* Node 2: Manager */}
        <div className="flex flex-col items-center p-2.5 rounded-xl border border-[#313A40] bg-[#242B30] shrink-0 text-center min-w-[75px]">
          <span className="text-[14px] text-[#9DA8B0] mb-0.5">🎓</span>
          <span className="text-[11px] font-bold text-[#F3F4F6]">MANAGER</span>
          <span className="text-[9px] text-[#6B7780] font-mono">{managerStatus}</span>
        </div>

        <ArrowRight className="w-3.5 h-3.5 text-[#313A40] shrink-0" />

        {/* Node 3: Decompose */}
        <div className="flex flex-col items-center p-2.5 rounded-xl border border-[#313A40] bg-[#242B30] shrink-0 text-center min-w-[75px]">
          <span className="text-[14px] text-[#9DA8B0] mb-0.5">🔀</span>
          <span className="text-[11px] font-bold text-[#F3F4F6]">DECOMPOSE</span>
          <span className="text-[9px] text-[#6B7780] font-mono">4 Tasks</span>
        </div>

        <ArrowRight className="w-3.5 h-3.5 text-[#313A40] shrink-0" />

        {/* Node 4: WORKER EXECUTION Container */}
        <div className="p-2 rounded-2xl border border-[#313A40] bg-[#121619] flex flex-col items-center shrink-0">
          <span className="text-[8.5px] font-bold uppercase tracking-wider text-[#6B7780] mb-1.5">WORKER EXECUTION</span>
          <div className="flex items-center gap-1.5">
            {roles.map((r) => {
              const st = getRoleStatus(r.id);
              return (
                <div
                  key={r.id}
                  className={`p-2 rounded-xl border text-center flex flex-col items-center min-w-[68px] ${
                    st === 'Completed'
                      ? 'border-[#5F8F72] text-[#7FAF91] bg-[rgba(95,143,114,0.08)]'
                      : st === 'Failed'
                      ? 'border-[#8F6666] text-[#A47A7A] bg-[rgba(143,102,102,0.08)]'
                      : st === 'Working'
                      ? 'border-[#313A40] text-[#F3F4F6] bg-[#242B30]'
                      : 'border-[#313A40] text-[#6B7780] bg-[#1C2226]'
                  }`}
                >
                  <span className="text-[12px] text-[#9DA8B0] mb-0.5">👤</span>
                  <span className="font-bold text-[10.5px] text-[#F3F4F6]">{r.name}</span>
                  <span className={`text-[8.5px] font-mono uppercase font-semibold ${st === 'Completed' ? 'text-[#7FAF91]' : 'text-[#6B7780]'}`}>
                    {st}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <ArrowRight className="w-3.5 h-3.5 text-[#313A40] shrink-0" />

        {/* Node 5: Clarifications */}
        <div className="flex flex-col items-center p-2.5 rounded-xl border border-[#313A40] bg-[#242B30] shrink-0 text-center min-w-[85px]">
          <span className="text-[14px] text-[#9DA8B0] mb-0.5">💬</span>
          <span className="text-[10px] font-bold text-[#F3F4F6]">CLARIFICATIONS</span>
          <span className="text-[9px] text-[#6B7780] font-mono">Active</span>
        </div>

        <ArrowRight className="w-3.5 h-3.5 text-[#313A40] shrink-0" />

        {/* Node 6: Manager Review */}
        <div className="flex flex-col items-center p-2.5 rounded-xl border border-[#313A40] bg-[#242B30] shrink-0 text-center min-w-[85px]">
          <span className="text-[14px] text-[#9DA8B0] mb-0.5">📑</span>
          <span className="text-[10px] font-bold text-[#F3F4F6]">MANAGER REVIEW</span>
          <span className="text-[9px] text-[#6B7780] font-mono">Reviewing</span>
        </div>

        <ArrowRight className="w-3.5 h-3.5 text-[#313A40] shrink-0" />

        {/* Node 7: Synthesis */}
        <div className="flex flex-col items-center p-2.5 rounded-xl border border-[#313A40] bg-[#242B30] shrink-0 text-center min-w-[75px]">
          <span className="text-[14px] text-[#9DA8B0] mb-0.5">✨</span>
          <span className="text-[10px] font-bold text-[#F3F4F6]">SYNTHESIS</span>
          <span className="text-[9px] text-[#6B7780] font-mono">In Progress</span>
        </div>

        <ArrowRight className="w-3.5 h-3.5 text-[#313A40] shrink-0" />

        {/* Node 8: Final Report */}
        <div className="flex flex-col items-center p-2.5 rounded-xl border border-[#313A40] bg-[#242B30] shrink-0 text-center min-w-[75px]">
          <span className="text-[14px] text-[#9DA8B0] mb-0.5">📄</span>
          <span className="text-[10px] font-bold text-[#F3F4F6]">FINAL REPORT</span>
          <span className="text-[9px] text-[#6B7780] font-mono">Pending</span>
        </div>
      </div>

      {/* Evidence Badges */}
      {evidenceList.length > 0 && (
        <div className="pt-2 border-t border-[#313A40] space-y-2">
          <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-[#6B7780]">
            <span>EVIDENCE COLLECTED ({evidenceList.length})</span>
            <span className="flex items-center gap-1 text-[#9DA8B0] hover:text-[#F3F4F6] cursor-pointer font-normal">
              View All <ExternalLink className="w-3 h-3" />
            </span>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto scrollbar-thin">
            {evidenceList.slice(0, 7).map((ev, idx) => (
              <div
                key={ev.id || idx}
                onClick={() => onSelectEvidence && onSelectEvidence(ev)}
                className="shrink-0 px-3 py-1.5 rounded-xl bg-[#242B30] border border-[#313A40] hover:border-[#5F8F72] cursor-pointer transition text-[11px] font-mono flex items-center gap-1.5 text-[#9DA8B0]"
              >
                <span className="font-semibold text-[#F3F4F6]">{ev.document_name || activeDocumentName || 'M1-AWS.pdf'}</span>
                <Check className="w-3 h-3 text-[#7FAF91]" />
                <span className="text-[#6B7780]">Page {ev.page_number || idx + 1}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
