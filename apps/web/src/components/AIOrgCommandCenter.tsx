import React from 'react';
import { Cpu, ShieldCheck, Sparkles, FileText, CheckCircle2, AlertCircle, ArrowDown, Search, Activity, Layers, BookOpen } from 'lucide-react';
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
  // Derive Manager State from SSE stream
  const latestEvent = events.length > 0 ? events[events.length - 1] : null;
  const isFailed = events.some((e) => e.event_type === 'execution_failed' || e.event_type === 'agent_failed');
  const isCompleted = events.some((e) => e.event_type === 'execution_completed');

  let managerStatus = 'IDLE';
  if (isFailed) managerStatus = 'FAILED';
  else if (isCompleted) managerStatus = 'COMPLETED';
  else if (isProcessing) {
    if (events.some((e) => e.event_type === 'manager_synthesizing')) managerStatus = 'SYNTHESIZING';
    else if (events.some((e) => e.event_type === 'manager_reviewing')) managerStatus = 'REVIEWING';
    else if (events.some((e) => e.event_type === 'task_created')) managerStatus = 'DECOMPOSING';
    else if (events.some((e) => e.event_type === 'manager_planning')) managerStatus = 'PLANNING';
    else managerStatus = 'RECEIVED TASK';
  }

  // Active reading snippet event
  const lastDocEvent = [...events].reverse().find((e) => e.event_type === 'document_reading');
  const docSnippet = lastDocEvent?.payload?.snippet || '';
  const docPage = lastDocEvent?.payload?.page || 1;
  const docFile = lastDocEvent?.payload?.filename || activeDocumentName || 'attached_document.pdf';

  // Organization Roles
  const roles = [
    { id: 'consultant', name: 'Consultant', title: 'Strategy & Domain Reasoning' },
    { id: 'analyst', name: 'Analyst', title: 'Document & Metric Analysis' },
    { id: 'researcher', name: 'Researcher', title: 'Evidence & Context Fact-Checking' },
    { id: 'intern', name: 'Intern', title: 'Data Organization & Extraction' },
  ];

  const getWorkerStatus = (roleId: string) => {
    if (isFailed) return { state: 'FAILED', color: 'border-rose-500/40 bg-rose-500/10 text-rose-400' };
    const task = tasks.find((t) => (t.worker || '').toLowerCase().includes(roleId) || (t.objective || '').toLowerCase().includes(roleId));

    if (!isProcessing && tasks.length === 0) {
      return { state: 'IDLE', color: 'border-[#2D3945] bg-[#1B242C] text-[#5A6A78]' };
    }

    if (task) {
      if (task.status === 'COMPLETED') return { state: 'COMPLETED', color: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400' };
      if (task.status === 'RUNNING') {
        if (lastDocEvent?.payload?.agent_name?.toLowerCase().includes(roleId)) {
          return { state: 'READING DOCUMENT', color: 'border-indigo-500/50 bg-indigo-500/10 text-indigo-300' };
        }
        return { state: 'WORKING', color: 'border-indigo-500/50 bg-indigo-500/10 text-indigo-400' };
      }
      return { state: 'ASSIGNED', color: 'border-amber-500/40 bg-amber-500/10 text-amber-300' };
    }

    if (isProcessing && tasks.length > 0) {
      return { state: 'WORKING', color: 'border-indigo-500/40 bg-indigo-500/10 text-indigo-300' };
    }

    return { state: isCompleted ? 'COMPLETED' : 'IDLE', color: isCompleted ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400' : 'border-[#2D3945] bg-[#1B242C] text-[#5A6A78]' };
  };

  return (
    <div className="w-full bg-[#11161B] border-b border-[#2D3945] p-5 select-none text-white space-y-5">
      {/* Local Privacy & Architecture Verification Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 rounded-lg bg-[#1B242C] border border-[#2D3945] text-xs">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span className="font-semibold text-[#F1F5F9]">LOCAL INFERENCE VERIFIED</span>
          <span className="text-[#2D3945]">|</span>
          <span className="text-[#A3ACB3]">Engine: <strong className="text-emerald-400 font-mono">Ollama (qwen2.5:0.5b)</strong></span>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-[#A3ACB3] font-mono">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            External API: NONE ($0.00)
          </span>
          <span className="text-[#2D3945]">|</span>
          <span>Data leaves device: NO</span>
        </div>
      </div>

      {/* AI Organization Visualizer Header */}
      <div className="flex items-center justify-between border-b border-[#2D3945]/60 pb-2">
        <div className="flex items-center gap-2">
          <Cpu className="w-4 h-4 text-[#6366F1]" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#F1F5F9]">
            Autonomous AI Organization Command Center
          </h3>
        </div>
        <span className="text-[10px] font-mono text-[#5A6A78] uppercase">HTTP 202 + Redis SSE Stream</span>
      </div>

      {/* Manager AI Central Coordinator Hub */}
      <div className="flex flex-col items-center justify-center">
        <div className={`relative w-full max-w-md p-4 rounded-xl border transition-all duration-300 shadow-xl ${
          managerStatus === 'FAILED'
            ? 'bg-rose-500/10 border-rose-500/40 text-rose-300'
            : managerStatus === 'COMPLETED'
            ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
            : isProcessing
            ? 'bg-[#1B242C] border-[#6366F1] text-white shadow-[#6366F1]/10'
            : 'bg-[#1B242C] border-[#2D3945] text-[#A3ACB3]'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#6366F1]/20 border border-[#6366F1]/40 flex items-center justify-center text-[#6366F1]">
                <Cpu className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-[#F1F5F9]">Lead Manager AI</h4>
                <p className="text-[10px] text-[#A3ACB3]">Coordinator & Strategic Synthesizer</p>
              </div>
            </div>
            <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${
              managerStatus === 'COMPLETED'
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                : managerStatus === 'FAILED'
                ? 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                : isProcessing
                ? 'bg-[#6366F1]/20 text-[#6366F1] border-[#6366F1]/40 animate-pulse'
                : 'bg-[#2D3945]/40 text-[#5A6A78] border-[#2D3945]'
            }`}>
              {managerStatus}
            </span>
          </div>

          {/* Manager Action Context */}
          {isProcessing && (
            <div className="mt-2 pt-2 border-t border-[#2D3945] text-[11px] text-[#A3ACB3] flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-[#6366F1] animate-spin" />
              <span>
                {managerStatus === 'PLANNING' && 'Analyzing user prompt & attached document content...'}
                {managerStatus === 'DECOMPOSING' && 'Decomposing task into parallel agent assignments...'}
                {managerStatus === 'REVIEWING' && 'Reviewing worker findings & evidence quotes...'}
                {managerStatus === 'SYNTHESIZING' && 'Synthesizing final evidence-backed deliverable...'}
                {managerStatus === 'RECEIVED TASK' && 'Receiving user objective...'}
              </span>
            </div>
          )}
        </div>

        {/* Dynamic Connector SVG Flow */}
        <div className="h-6 w-full flex justify-center items-center text-[#2D3945]">
          <ArrowDown className={`w-4 h-4 ${isProcessing ? 'text-[#6366F1] animate-bounce' : 'text-[#2D3945]'}`} />
        </div>
      </div>

      {/* Parallel Workers Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {roles.map((r) => {
          const status = getWorkerStatus(r.id);
          const activeTask = tasks.find((t) => (t.worker || '').toLowerCase().includes(r.id) || (t.objective || '').toLowerCase().includes(r.id));

          return (
            <div
              key={r.id}
              className={`p-3.5 rounded-xl border transition-all duration-300 flex flex-col justify-between ${status.color}`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-[#F1F5F9]">{r.name}</span>
                  <span className="text-[9px] font-mono px-2 py-0.5 rounded border uppercase tracking-wider font-semibold">
                    {status.state}
                  </span>
                </div>
                <p className="text-[10px] text-[#A3ACB3] mb-3">{r.title}</p>

                {activeTask && (
                  <div className="p-2 rounded bg-[#11161B]/80 border border-[#2D3945] text-[10px] text-[#A3ACB3] space-y-1 mb-2">
                    <div className="font-semibold text-[#F1F5F9] truncate">{activeTask.objective}</div>
                  </div>
                )}

                {status.state === 'READING DOCUMENT' && docSnippet && (
                  <div className="p-2 rounded bg-indigo-950/40 border border-indigo-500/30 text-[10px] text-indigo-200 space-y-1">
                    <div className="flex items-center justify-between text-[9px] font-mono text-indigo-300">
                      <span className="truncate max-w-[100px]">{docFile}</span>
                      <span>Page {docPage}</span>
                    </div>
                    <p className="line-clamp-2 text-[9.5px] italic text-indigo-100/80">
                      &quot;{docSnippet}&quot;
                    </p>
                  </div>
                )}
              </div>

              {/* Status Indicator Bar */}
              <div className="pt-2 border-t border-[#2D3945]/40 flex items-center justify-between text-[10px] text-[#5A6A78]">
                <span>Status:</span>
                <span className="font-semibold font-mono text-[#F1F5F9]">{status.state}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Real Document Evidence Cards Stream */}
      {evidenceList.length > 0 && (
        <div className="pt-3 border-t border-[#2D3945]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-semibold text-[#A3ACB3] uppercase tracking-wider flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-emerald-400" />
              Collected Document Evidence ({evidenceList.length})
            </span>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
            {evidenceList.map((ev, idx) => (
              <div
                key={ev.id || idx}
                onClick={() => onSelectEvidence && onSelectEvidence(ev)}
                className="shrink-0 max-w-xs p-2.5 rounded-lg bg-[#1B2433] border border-[#2D3945] hover:border-emerald-500/50 cursor-pointer transition text-xs space-y-1"
              >
                <div className="flex items-center justify-between text-[10px] font-mono text-emerald-400">
                  <span className="truncate max-w-[120px] font-semibold">{ev.document_name || 'Document'}</span>
                  <span>Page {ev.page_number || 1}</span>
                </div>
                <p className="text-[10.5px] text-[#A3ACB3] line-clamp-2 italic">
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
