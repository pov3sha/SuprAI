import React from 'react';
import { Cpu, ShieldCheck, Sparkles, FileText, ArrowDown, Layers, CheckCircle2, AlertCircle, FileCheck, Info } from 'lucide-react';
import { Task, Evidence, SSEEvent } from '../lib/types';

interface AIOrgCommandCenterProps {
  tasks: Task[];
  isProcessing: boolean;
  events: SSEEvent[];
  evidenceList: Evidence[];
  activeDocumentName?: string;
  onSelectEvidence?: (ev: Evidence) => void;
}

export const AIOrgCommandCenter: React.FC<AIOrgCommandCenterProps> = ({
  tasks,
  isProcessing,
  events,
  evidenceList,
  activeDocumentName,
  onSelectEvidence,
}) => {
  // Scoped active execution status (prevents stale failure flags)
  const currentExecEvents = events.slice(-15);
  const activeFailedEvent = currentExecEvents.find((e) => e.event_type === 'execution_failed');
  const activeCompletedEvent = currentExecEvents.find((e) => e.event_type === 'execution_completed');

  let managerStatus = 'IDLE';
  if (activeFailedEvent) managerStatus = 'FAILED';
  else if (activeCompletedEvent && !isProcessing) managerStatus = 'COMPLETED';
  else if (isProcessing) {
    if (events.some((e) => e.event_type === 'manager_synthesizing')) managerStatus = 'SYNTHESIZING';
    else if (events.some((e) => e.event_type === 'manager_reviewing')) managerStatus = 'REVIEWING';
    else if (events.some((e) => e.event_type === 'task_created')) managerStatus = 'DECOMPOSING';
    else if (events.some((e) => e.event_type === 'manager_planning')) managerStatus = 'PLANNING';
    else managerStatus = 'RECEIVING TASK';
  }

  // Active reading snippet event
  const lastDocEvent = [...events].reverse().find((e) => e.event_type === 'document_reading');
  const docSnippet = lastDocEvent?.payload?.snippet || '';
  const docPage = lastDocEvent?.payload?.page || 1;
  const docFile = lastDocEvent?.payload?.filename || activeDocumentName || 'document.pdf';

  // Organization Roles
  const roles = [
    { id: 'consultant', name: 'Consultant', title: 'Strategy & Domain Reasoning' },
    { id: 'analyst', name: 'Analyst', title: 'Document & Metric Analysis' },
    { id: 'researcher', name: 'Researcher', title: 'Evidence & Context Verification' },
    { id: 'intern', name: 'Intern', title: 'Data Extraction & Organization' },
  ];

  const getWorkerStatus = (roleId: string) => {
    const roleTask = tasks.find((t) => (t.worker || '').toLowerCase().includes(roleId) || (t.objective || '').toLowerCase().includes(roleId));

    if (activeFailedEvent && roleTask?.status !== 'COMPLETED') {
      return { state: 'FAILED', color: 'border-rose-500/40 bg-rose-500/10 text-rose-300' };
    }

    if (!isProcessing && tasks.length === 0) {
      return { state: 'IDLE', color: 'border-[#5E666D] bg-[#2D3439] text-[#848589]' };
    }

    if (roleTask) {
      if (roleTask.status === 'COMPLETED') return { state: 'COMPLETED', color: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400' };
      if (roleTask.status === 'RUNNING' || isProcessing) {
        if (lastDocEvent?.payload?.agent_name?.toLowerCase().includes(roleId)) {
          return { state: 'READING PAPER', color: 'border-[#6366F1] bg-[#6366F1]/10 text-indigo-300' };
        }
        return { state: 'WORKING', color: 'border-[#6366F1] bg-[#6366F1]/10 text-indigo-300' };
      }
      return { state: 'ASSIGNED', color: 'border-amber-500/40 bg-amber-500/10 text-amber-300' };
    }

    if (isProcessing) {
      return { state: 'WORKING', color: 'border-[#6366F1] bg-[#6366F1]/10 text-indigo-300' };
    }

    return { state: 'READY', color: 'border-[#5E666D] bg-[#2D3439] text-[#A9A8AD]' };
  };

  return (
    <div className="w-full bg-[#202629] border-b border-[#5E666D] p-4 select-none text-[#F3F4F6] space-y-4">
      {/* Verification & System Achievements Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 rounded-lg bg-[#2D3439] border border-[#5E666D] text-xs">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span className="font-bold text-[#F3F4F6]">100% LOCAL PRIVACY VERIFIED</span>
          <span className="text-[#5E666D]">|</span>
          <span className="text-[#A9A8AD]">Engine: <strong className="text-emerald-400 font-mono">Ollama (qwen2.5:0.5b)</strong></span>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-[#A9A8AD] font-mono">
          <span className="text-emerald-400 font-semibold">● External API: NONE ($0.00)</span>
          <span className="text-[#5E666D]">|</span>
          <span>Data leaves device: NO</span>
        </div>
      </div>

      {/* Engineering Achievements Highlights */}
      <div className="p-3 rounded-lg bg-[#2D3439]/60 border border-[#5E666D] text-[11px] text-[#A9A8AD] space-y-1">
        <div className="flex items-center gap-1.5 font-bold text-[#F3F4F6] text-xs mb-1">
          <Info className="w-3.5 h-3.5 text-[#6366F1]" />
          <span>System Architecture & Verification Standards</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-[10.5px]">
          <div className="flex items-start gap-1.5">
            <span className="text-[#6366F1] font-bold">▪</span>
            <span>Async HTTP 202 + Redis SSE architecture for non-blocking execution.</span>
          </div>
          <div className="flex items-start gap-1.5">
            <span className="text-[#6366F1] font-bold">▪</span>
            <span>Parallelized agent tasks via decoupled TaskExecutor / ThreadPool.</span>
          </div>
          <div className="flex items-start gap-1.5">
            <span className="text-[#6366F1] font-bold">▪</span>
            <span>100% local privacy via Ollama model verification ($0.00 cost).</span>
          </div>
        </div>
      </div>

      {/* Manager Officer Hub (Command Center Coordinator) */}
      <div className="flex flex-col items-center justify-center">
        <div className={`relative w-full max-w-lg p-3.5 rounded-xl border transition-all duration-300 shadow-xl ${
          managerStatus === 'FAILED'
            ? 'bg-rose-500/10 border-rose-500/40 text-rose-300'
            : managerStatus === 'COMPLETED'
            ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
            : isProcessing
            ? 'bg-[#2D3439] border-[#6366F1] text-white shadow-[#6366F1]/10'
            : 'bg-[#2D3439] border-[#5E666D] text-[#A9A8AD]'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#6366F1]/20 border border-[#6366F1]/40 flex items-center justify-center text-[#6366F1]">
                <Cpu className="w-4.5 h-4.5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-[#F3F4F6]">Lead Manager Officer</h4>
                <p className="text-[10px] text-[#A9A8AD]">Analyzing Prompt & Delegating Document Work</p>
              </div>
            </div>
            <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${
              managerStatus === 'COMPLETED'
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                : managerStatus === 'FAILED'
                ? 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                : isProcessing
                ? 'bg-[#6366F1]/20 text-[#6366F1] border-[#6366F1]/40 animate-pulse'
                : 'bg-[#2D3439] text-[#848589] border-[#5E666D]'
            }`}>
              {managerStatus}
            </span>
          </div>

          {/* Action Context Banner */}
          {isProcessing && (
            <div className="mt-2 pt-2 border-t border-[#5E666D] text-[11px] text-[#A9A8AD] flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-[#6366F1] animate-spin" />
              <span>
                {managerStatus === 'PLANNING' && 'Manager examining objective and document context...'}
                {managerStatus === 'DECOMPOSING' && 'Manager dispatching subtask papers to Consultants & Analysts...'}
                {managerStatus === 'REVIEWING' && 'Manager reviewing collected evidence & worker outputs...'}
                {managerStatus === 'SYNTHESIZING' && 'Manager synthesizing final deliverable report...'}
                {managerStatus === 'RECEIVING TASK' && 'Receiving user task prompt...'}
              </span>
            </div>
          )}
        </div>

        {/* Paper Handoff Animation Indicator */}
        <div className="h-5 w-full flex justify-center items-center text-[#5E666D]">
          <ArrowDown className={`w-4 h-4 ${isProcessing ? 'text-[#6366F1] animate-bounce' : 'text-[#5E666D]'}`} />
        </div>
      </div>

      {/* Parallel Agents Working Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {roles.map((r) => {
          const status = getWorkerStatus(r.id);
          const roleTask = tasks.find((t) => (t.worker || '').toLowerCase().includes(r.id) || (t.objective || '').toLowerCase().includes(r.id));

          return (
            <div
              key={r.id}
              className={`p-3 rounded-xl border transition-all duration-300 flex flex-col justify-between ${status.color}`}
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-[#F3F4F6]">{r.name}</span>
                  <span className="text-[9px] font-mono px-2 py-0.5 rounded border uppercase tracking-wider font-semibold">
                    {status.state}
                  </span>
                </div>
                <p className="text-[10px] text-[#A9A8AD] mb-2">{r.title}</p>

                {roleTask && (
                  <div className="p-2 rounded bg-[#202629] border border-[#5E666D] text-[10px] text-[#A9A8AD] mb-2">
                    <div className="font-semibold text-[#F3F4F6] truncate">{roleTask.objective}</div>
                  </div>
                )}

                {/* Animated Paper Card */}
                {status.state === 'READING PAPER' && (
                  <div className="p-2 rounded bg-[#6366F1]/10 border border-[#6366F1]/40 text-[10px] text-indigo-200 animate-float-paper space-y-1">
                    <div className="flex items-center justify-between text-[9px] font-mono text-indigo-300">
                      <span className="flex items-center gap-1 font-semibold">
                        <FileText className="w-3 h-3 text-[#6366F1]" />
                        {docFile}
                      </span>
                      <span>Pg {docPage}</span>
                    </div>
                    <p className="line-clamp-2 text-[9.5px] italic text-[#A9A8AD]">
                      &quot;{docSnippet}&quot;
                    </p>
                  </div>
                )}
              </div>

              <div className="pt-2 border-t border-[#5E666D]/40 flex items-center justify-between text-[10px] text-[#848589]">
                <span>Status:</span>
                <span className="font-semibold font-mono text-[#F3F4F6]">{status.state}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Real Document Evidence Stream */}
      {evidenceList.length > 0 && (
        <div className="pt-2 border-t border-[#5E666D]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-semibold text-[#A9A8AD] uppercase tracking-wider flex items-center gap-1.5">
              <FileCheck className="w-3.5 h-3.5 text-emerald-400" />
              Verified Document Evidence Quotes ({evidenceList.length})
            </span>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
            {evidenceList.map((ev, idx) => (
              <div
                key={ev.id || idx}
                onClick={() => onSelectEvidence && onSelectEvidence(ev)}
                className="shrink-0 max-w-xs p-2.5 rounded-lg bg-[#2D3439] border border-[#5E666D] hover:border-emerald-400/50 cursor-pointer transition text-xs space-y-1"
              >
                <div className="flex items-center justify-between text-[10px] font-mono text-emerald-400">
                  <span className="truncate max-w-[120px] font-semibold">{ev.document_name || 'Document'}</span>
                  <span>Page {ev.page_number || 1}</span>
                </div>
                <p className="text-[10.5px] text-[#A9A8AD] line-clamp-2 italic">
                  &quot;{ev.excerpt}&quot;
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
